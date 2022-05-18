import npath from 'path-browserify';
import type { ModuleNode, ViteDevServer } from 'vite';
import type { Metadata } from '../../runtime/server/metadata.js';
import { MARKDOWN_IMPORT_FLAG } from '../../vite-plugin-markdown/index.js';

/** Normalize URL to its canonical form */
export function createCanonicalURL(url: string, base?: string): URL {
	let pathname = url.replace(/\/index.html$/, ''); // index.html is not canonical
	pathname = pathname.replace(/\/1\/?$/, ''); // neither is a trailing /1/ (impl. detail of collections)
	if (!npath.extname(pathname)) pathname = pathname.replace(/(\/+)?$/, '/'); // add trailing slash if there’s no extension
	pathname = pathname.replace(/\/+/g, '/'); // remove duplicate slashes (URL() won’t)
	return new URL(pathname, base);
}

/** Check if a URL is already valid */
export function isValidURL(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch (e) {}
	return false;
}

// https://vitejs.dev/guide/features.html#css-pre-processors
export const STYLE_EXTENSIONS = new Set([
	'.css',
	'.pcss',
	'.postcss',
	'.scss',
	'.sass',
	'.styl',
	'.stylus',
	'.less',
]);

const cssRe = new RegExp(
	`\\.(${Array.from(STYLE_EXTENSIONS)
		.map((s) => s.slice(1))
		.join('|')})($|\\?)`
);
export const isCSSRequest = (request: string): boolean => cssRe.test(request);

// During prod builds, some modules have dependencies we should preload by hand
// Ex. markdown files imported asynchronously or via Astro.glob(...)
// This calls each md file's $$loadMetadata to discover those dependencies
// and writes all results to the input `metadata` object
export async function collectMdMetadata(
	metadata: Metadata,
	modGraph: ModuleNode,
	viteServer: ViteDevServer
) {
	const importedModules = [...(modGraph?.importedModules ?? [])];
	await Promise.all(
		importedModules.map(async (importedModule) => {
			const importedModGraph = importedModule.id
				? viteServer.moduleGraph.getModuleById(importedModule.id)
				: null;
			// if the imported module has a graph entry, recursively collect metadata
			if (importedModGraph) await collectMdMetadata(metadata, importedModGraph, viteServer);

			if (!importedModule?.id?.endsWith(MARKDOWN_IMPORT_FLAG)) return;

			const mdSSRMod = await viteServer.ssrLoadModule(importedModule.id);
			const mdMetadata = (await mdSSRMod.$$loadMetadata?.()) as Metadata;
			if (!mdMetadata) return;

			for (let mdMod of mdMetadata.modules) {
				mdMod.specifier = mdMetadata.resolvePath(mdMod.specifier);
				metadata.modules.push(mdMod);
			}
			for (let mdHoisted of mdMetadata.hoisted) {
				metadata.hoisted.push(mdHoisted);
			}
			for (let mdHydrated of mdMetadata.hydratedComponents) {
				metadata.hydratedComponents.push(mdHydrated);
			}
			for (let mdClientOnly of mdMetadata.clientOnlyComponents) {
				metadata.clientOnlyComponents.push(mdClientOnly);
			}
			for (let mdHydrationDirective of mdMetadata.hydrationDirectives) {
				metadata.hydrationDirectives.add(mdHydrationDirective);
			}
		})
	);
}
