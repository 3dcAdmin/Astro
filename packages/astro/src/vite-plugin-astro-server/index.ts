import type * as vite from 'vite';
import type http from 'http';
import type { AstroConfig, ManifestData } from '../@types/astro';
import { info, warn, error, LogOptions } from '../core/logger.js';
import { getParamsAndProps } from '../core/render/core.js';
import { createRouteManifest, matchRoute } from '../core/routing/index.js';
import stripAnsi from 'strip-ansi';
import { createSafeError } from '../core/util.js';
import { ssr, preload } from '../core/render/dev/index.js';
import * as msg from '../core/messages.js';

import notFoundTemplate, { subpathNotUsedTemplate } from '../template/4xx.js';
import serverErrorTemplate from '../template/5xx.js';
import { RouteCache } from '../core/render/route-cache.js';

interface AstroPluginOptions {
	config: AstroConfig;
	logging: LogOptions;
}

const BAD_VITE_MIDDLEWARE = ['viteIndexHtmlMiddleware', 'vite404Middleware', 'viteSpaFallbackMiddleware'];
function removeViteHttpMiddleware(server: vite.Connect.Server) {
	for (let i = server.stack.length - 1; i > 0; i--) {
		// @ts-expect-error using internals until https://github.com/vitejs/vite/pull/4640 is merged
		if (BAD_VITE_MIDDLEWARE.includes(server.stack[i].handle.name)) {
			server.stack.splice(i, 1);
		}
	}
}

function writeHtmlResponse(res: http.ServerResponse, statusCode: number, html: string) {
	res.writeHead(statusCode, {
		'Content-Type': 'text/html; charset=utf-8',
		'Content-Length': Buffer.byteLength(html, 'utf-8'),
	});
	res.write(html);
	res.end();
}

async function handle404Response(origin: string, config: AstroConfig, req: http.IncomingMessage, res: http.ServerResponse) {
	const site = config.buildOptions.site ? new URL(config.buildOptions.site) : undefined;
	const devRoot = site ? site.pathname : '/';
	const pathname = decodeURI(new URL(origin + req.url).pathname);
	let html = '';
	if (pathname === '/' && !pathname.startsWith(devRoot)) {
		html = subpathNotUsedTemplate(devRoot, pathname);
	} else {
		html = notFoundTemplate({ statusCode: 404, title: 'Not found', tabTitle: '404: Not Found', pathname });
	}
	writeHtmlResponse(res, 404, html);
}

async function handle500Response(viteServer: vite.ViteDevServer, origin: string, req: http.IncomingMessage, res: http.ServerResponse, err: any) {
	const pathname = decodeURI(new URL(origin + req.url).pathname);
	const html = serverErrorTemplate({
		statusCode: 500,
		title: 'Internal Error',
		tabTitle: '500: Error',
		message: stripAnsi(err.message),
		url: err.url || undefined,
		stack: stripAnsi(err.stack),
	});
	const transformedHtml = await viteServer.transformIndexHtml(pathname, html, pathname);
	writeHtmlResponse(res, 500, transformedHtml);
}

function getCustom404Route(config: AstroConfig, manifest: ManifestData) {
	const relPages = config.pages.href.replace(config.projectRoot.href, '');
	return manifest.routes.find((r) => r.component === relPages + '404.astro');
}

function log404(logging: LogOptions, pathname: string) {
	info(logging, 'astro', msg.req({ url: pathname, statusCode: 404 }));
}

/** The main logic to route dev server requests to pages in Astro. */
async function handleRequest(
	routeCache: RouteCache,
	viteServer: vite.ViteDevServer,
	logging: LogOptions,
	manifest: ManifestData,
	config: AstroConfig,
	req: http.IncomingMessage,
	res: http.ServerResponse
) {
	const reqStart = performance.now();
	const site = config.buildOptions.site ? new URL(config.buildOptions.site) : undefined;
	const devRoot = site ? site.pathname : '/';
	const origin = `${viteServer.config.server.https ? 'https' : 'http'}://${req.headers.host}`;
	const pathname = decodeURI(new URL(origin + req.url).pathname);
	const rootRelativeUrl = pathname.substring(devRoot.length - 1);

	try {
		if (!pathname.startsWith(devRoot)) {
			log404(logging, pathname);
			return handle404Response(origin, config, req, res);
		}
		// Attempt to match the URL to a valid page route.
		// If that fails, switch the response to a 404 response.
		let route = matchRoute(rootRelativeUrl, manifest);
		const statusCode = route ? 200 : 404;

		if (!route) {
			log404(logging, pathname);
			const custom404 = getCustom404Route(config, manifest);
			if (custom404) {
				route = custom404;
			} else {
				return handle404Response(origin, config, req, res);
			}
		}

		// Note: may re-assign filePath to custom 404 on error
		let filePath = new URL(`./${route.component}`, config.projectRoot);
		// Note: may re-assign preloaded component to custom 404 on error
		let preloadedComponent = await preload({ astroConfig: config, filePath, viteServer });
		try {
			const [, mod] = preloadedComponent;
			// attempt to get static paths
			// if this fails, we have a bad URL match!
			await getParamsAndProps({
				mod,
				route,
				routeCache,
				pathname: rootRelativeUrl,
				logging,
			});
		} catch (_err: any) {
			if (_err instanceof Error) {
				warn(logging, 'getStaticPaths', _err.message);
				log404(logging, pathname);
				const custom404 = getCustom404Route(config, manifest);
				if (custom404) {
					route = custom404;
					filePath = new URL(`./${route.component}`, config.projectRoot);
					preloadedComponent = await preload({ astroConfig: config, filePath, viteServer });
				} else {
					return handle404Response(origin, config, req, res);
				}
			}
		}

		const html = await ssr(preloadedComponent, {
			astroConfig: config,
			filePath,
			logging,
			mode: 'development',
			origin,
			pathname: rootRelativeUrl,
			route,
			routeCache,
			viteServer,
		});
		writeHtmlResponse(res, statusCode, html);
	} catch (_err: any) {
		info(logging, 'serve', msg.req({ url: pathname, statusCode: 500 }));
		const err = createSafeError(_err);
		error(logging, 'error', msg.err(err));
		handle500Response(viteServer, origin, req, res, err);
	}
}

export default function createPlugin({ config, logging }: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:server',
		configureServer(viteServer) {
			let routeCache = new RouteCache(logging);
			let manifest: ManifestData = createRouteManifest({ config: config }, logging);
			/** rebuild the route cache + manifest, as needed. */
			function rebuildManifest(needsManifestRebuild: boolean, file: string) {
				routeCache.clearAll();
				if (needsManifestRebuild) {
					manifest = createRouteManifest({ config: config }, logging);
				}
			}
			// Rebuild route manifest on file change, if needed.
			viteServer.watcher.on('add', rebuildManifest.bind(null, true));
			viteServer.watcher.on('unlink', rebuildManifest.bind(null, true));
			viteServer.watcher.on('change', rebuildManifest.bind(null, false));
			return () => {
				removeViteHttpMiddleware(viteServer.middlewares);
				viteServer.middlewares.use(async (req, res) => {
					if (!req.url || !req.method) {
						throw new Error('Incomplete request');
					}
					handleRequest(routeCache, viteServer, logging, manifest, config, req, res);
				});
			};
		},
	};
}
