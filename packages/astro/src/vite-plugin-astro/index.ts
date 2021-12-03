import type { TransformResult } from '@astrojs/compiler';
import type { SourceMapInput } from 'rollup';
import type vite from '../core/vite';
import type { AstroConfig } from '../@types/astro';

import esbuild from 'esbuild';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { transform } from '@astrojs/compiler';
import { AstroDevServer } from '../core/dev/index.js';
import { getViteTransform, TransformHook, transformWithVite } from './styles.js';

interface AstroPluginOptions {
  config: AstroConfig;
  devServer?: AstroDevServer;
}

// https://github.com/vitejs/vite/discussions/5109#discussioncomment-1450726
function isSSR(options: undefined | boolean | { ssr: boolean }): boolean {
  if (options === undefined) {
    return false;
  }
  if (typeof options === 'boolean') {
    return options;
  }
  if (typeof options == 'object') {
    return !!options.ssr;
  }
  return false;
}

/** Transform .astro files for Vite */
export default function astro({ config, devServer }: AstroPluginOptions): vite.Plugin {
  let viteTransform: TransformHook;
  return {
    name: '@astrojs/vite-plugin-astro',
    enforce: 'pre', // run transforms before other plugins can
    configResolved(resolvedConfig) {
      viteTransform = getViteTransform(resolvedConfig);
    },
    // note: don’t claim .astro files with resolveId() — it prevents Vite from transpiling the final JS (import.meta.globEager, etc.)
    async load(id, opts) {
      if (!id.endsWith('.astro')) {
        return null;
      }
      // pages and layouts should be transformed as full documents (implicit <head> <body> etc)
      // everything else is treated as a fragment
      const normalizedID = fileURLToPath(new URL(`file://${id}`));
      const isPage = normalizedID.startsWith(fileURLToPath(config.pages)) || normalizedID.startsWith(fileURLToPath(config.layouts));
      let source = await fs.promises.readFile(id, 'utf8');
      let tsResult: TransformResult | undefined;
      let cssTransformError: Error | undefined;

      // Precheck: verify that the frontmatter is valid TS before sending to our compiler.
      // The compiler doesn't currently validate the frontmatter, so invalid JS/TS can cause issues
      // in the final output. This prevents bad JS from becoming a compiler panic or otherwise
      // breaking the final output.
      const scannedFrontmatter = (/^\-\-\-(.*)^\-\-\-/ms).exec(source);
      if (scannedFrontmatter) {
        await esbuild.transform(scannedFrontmatter[1], { loader: 'ts', sourcemap: false, sourcefile: id });
      }

      try {
        // Transform from `.astro` to valid `.ts`
        // use `sourcemap: "both"` so that sourcemap is included in the code
        // result passed to esbuild, but also available in the catch handler.
        tsResult = await transform(source, {
          as: isPage ? 'document' : 'fragment',
          projectRoot: config.projectRoot.toString(),
          site: config.buildOptions.site,
          sourcefile: id,
          sourcemap: 'both',
          internalURL: 'astro/internal',
          preprocessStyle: async (value: string, attrs: Record<string, string>) => {
            const lang = `.${attrs?.lang || 'css'}`.toLowerCase();
            try {
              const result = await transformWithVite({ value, lang, id, transformHook: viteTransform, ssr: isSSR(opts) });
              let map: SourceMapInput | undefined;
              if (!result) return null as any; // TODO: add type in compiler to fix "any"
              if (result.map) {
                if (typeof result.map === 'string') {
                  map = result.map;
                } else if (result.map.mappings) {
                  map = result.map.toString();
                }
              }
              return { code: result.code, map };
            } catch (err) {
              // save error to throw in plugin context
              cssTransformError = err as any;
              return null;
            }
          },
        });

        // throw CSS transform errors here if encountered
        if (cssTransformError) throw cssTransformError;

        // Compile `.ts` to `.js`
        console.log(tsResult.code);
        const { code, map } = await esbuild.transform(tsResult.code, { loader: 'ts', sourcemap: 'external', sourcefile: id });

        return {
          code,
          map,
        };
      } catch (err: any) {
        // improve compiler errors
        if (err.stack.includes('wasm-function')) {
          const search = new URLSearchParams({
            labels: 'compiler',
            title: '🐛 BUG: `@astrojs/compiler` panic',
            body: `### Describe the Bug

\`@astrojs/compiler\` encountered an unrecoverable error when compiling the following file.

**${id.replace(fileURLToPath(config.projectRoot), '')}**
\`\`\`astro
${source}
\`\`\`
`,
          });
          err.url = `https://github.com/withastro/astro/issues/new?${search.toString()}`;
          err.message = `Error: Uh oh, the Astro compiler encountered an unrecoverable error!

Please open
a GitHub issue using the link below:
${err.url}`;
          // TODO: remove stack replacement when compiler throws better errors
          err.stack = `    at ${id}`;
        }

        throw err;
      }
    },
    // async handleHotUpdate(context) {
    //   if (devServer) {
    //     return devServer.handleHotUpdate(context);
    //   }
    // },
  };
}
