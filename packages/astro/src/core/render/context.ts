import type {
	AstroCookies,
	ComponentInstance,
	Params,
	Props,
	RouteData,
	SSRElement,
	SSRResult,
} from '../../@types/astro';
import { AstroError, AstroErrorData } from '../errors/index.js';
import type { Environment } from './environment';
import { getParamsAndProps } from './params-and-props.js';

const clientLocalsSymbol = Symbol.for('astro.locals');

/**
 * The RenderContext represents the parts of rendering that are specific to one request.
 */
export interface RenderContext {
	request: Request;
	pathname: string;
	url: URL;
	scripts?: Set<SSRElement>;
	links?: Set<SSRElement>;
	styles?: Set<SSRElement>;
	componentMetadata?: SSRResult['componentMetadata'];
	route?: RouteData;
	status?: number;
	cookies?: AstroCookies;
	params: Params;
	props: Props;
	locals?: object;
}

export type CreateRenderContextArgs = Partial<RenderContext> & {
	request: RenderContext['request'];
	mod: ComponentInstance;
	env: Environment;
};

export async function createRenderContext(
	options: CreateRenderContextArgs
): Promise<RenderContext> {
	const request = options.request;
	const url = new URL(request.url);
	const pathname = options.pathname ?? url.pathname;
	const [params, props] = await getParamsAndProps({
		mod: options.mod as any,
		route: options.route,
		routeCache: options.env.routeCache,
		pathname: pathname,
		logging: options.env.logging,
		ssr: options.env.ssr,
	});

	let context: RenderContext = {
		...options,
		pathname,
		url,
		params,
		props,
	};

	// We define a custom property, so we can check the value passed to locals
	Object.defineProperty(context, 'locals', {
		enumerable: true,
		get() {
			return Reflect.get(request, clientLocalsSymbol);
		},
		set(val) {
			if (typeof val !== 'object') {
				throw new AstroError(AstroErrorData.LocalsNotAnObject);
			} else {
				Reflect.set(request, clientLocalsSymbol, val);
			}
		},
	});

	return context;
}
