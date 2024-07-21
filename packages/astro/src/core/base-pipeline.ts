import type {
	ComponentInstance,
	MiddlewareHandler,
	RewritePayload,
	RouteData,
	RuntimeMode,
	SSRLoadedRenderer,
	SSRManifest,
	SSRResult,
} from '../@types/astro.js';
import { setGetEnv } from '../env/runtime.js';
import { createI18nMiddleware } from '../i18n/middleware.js';
import { AstroError } from './errors/errors.js';
import { AstroErrorData } from './errors/index.js';
import type { Logger } from './logger/core.js';
import { RouteCache } from './render/route-cache.js';
import { createDefaultRoutes } from './routing/default.js';

/**
 * The `Pipeline` represents the static parts of rendering that do not change between requests.
 * These are mostly known when the server first starts up and do not change.
 *
 * Thus, a `Pipeline` is created once at process start and then used by every `RenderContext`.
 */
export abstract class Pipeline {
	readonly internalMiddleware: MiddlewareHandler[];

	constructor(
		readonly logger: Logger,
		readonly manifest: SSRManifest,
		/**
		 * "development" or "production"
		 */
		readonly mode: RuntimeMode,
		readonly renderers: SSRLoadedRenderer[],
		readonly resolve: (s: string) => Promise<string>,
		/**
		 * Based on Astro config's `output` option, `true` if "server" or "hybrid".
		 */
		readonly serverLike: boolean,
		readonly streaming: boolean,
		/**
		 * Used to provide better error messages for `Astro.clientAddress`
		 */
		readonly adapterName = manifest.adapterName,
		readonly clientDirectives = manifest.clientDirectives,
		readonly inlinedScripts = manifest.inlinedScripts,
		readonly compressHTML = manifest.compressHTML,
		readonly i18n = manifest.i18n,
		readonly middleware = manifest.middleware,
		readonly routeCache = new RouteCache(logger, mode),
		/**
		 * Used for `Astro.site`.
		 */
		readonly site = manifest.site ? new URL(manifest.site) : undefined,
		readonly callSetGetEnv = true,
		/**
		 * Array of built-in, internal, routes.
		 * Used to find the route module
		 */
		readonly defaultRoutes = createDefaultRoutes(manifest)
	) {
		this.internalMiddleware = [];
		// We do use our middleware only if the user isn't using the manual setup
		if (i18n?.strategy !== 'manual') {
			this.internalMiddleware.push(
				createI18nMiddleware(i18n, manifest.base, manifest.trailingSlash, manifest.buildFormat)
			);
		}
		// In SSR, getSecret should fail by default. Setting it here will run before the
		// adapter override.
		if (callSetGetEnv && manifest.experimentalEnvGetSecretEnabled) {
			setGetEnv(() => {
				throw new AstroError(AstroErrorData.EnvUnsupportedGetSecret);
			}, true);
		}
	}

	abstract headElements(routeData: RouteData): Promise<HeadElements> | HeadElements;

	abstract componentMetadata(routeData: RouteData): Promise<SSRResult['componentMetadata']> | void;

	/**
	 * It attempts to retrieve the `RouteData` that matches the input `url`, and the component that belongs to the `RouteData`.
	 *
	 * ## Errors
	 *
	 * - if not `RouteData` is found
	 *
	 * @param {RewritePayload} rewritePayload The payload provided by the user
	 * @param {Request} request The original request
	 * @param {RouteData} sourceRoute The original `RouteData`
	 */
	abstract tryRewrite(
		rewritePayload: RewritePayload,
		request: Request,
		sourceRoute: RouteData
	): Promise<[RouteData, ComponentInstance, URL]>;

	/**
	 * Tells the pipeline how to retrieve a component give a `RouteData`
	 * @param routeData
	 */
	abstract getComponentByRoute(routeData: RouteData): Promise<ComponentInstance>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HeadElements extends Pick<SSRResult, 'scripts' | 'styles' | 'links'> {}
