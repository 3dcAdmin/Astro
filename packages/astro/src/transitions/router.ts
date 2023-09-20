export type Fallback = 'none' | 'animate' | 'swap';
export type Direction = 'forward' | 'back';
type State = {
	index: number;
	scrollX: number;
	scrollY: number;
};
type Events = 'astro:page-load' | 'astro:after-swap';

export const supportsViewTransitions = !!document.startViewTransition;
export const transitionEnabledOnThisPage = () =>
	!!document.querySelector('[name="astro-view-transitions-enabled"]');

// only update history entries that are managed by us
// leave other entries alone and do not accidently add state.
const persistState = (state: State) => history.state && history.replaceState(state, '');
const triggerEvent = (name: Events) => document.dispatchEvent(new Event(name));
const onPageLoad = () => triggerEvent('astro:page-load');
const PERSIST_ATTR = 'data-astro-transition-persist';

// The History API does not tell you if navigation is forward or back, so
// you can figure it using an index. On pushState the index is incremented so you
// can use that to determine popstate if going forward or back.
let currentHistoryIndex = 0;
if (history.state) {
	// we reloaded a page with history state
	// (e.g. history navigation from non-transition page or browser reload)
	currentHistoryIndex = history.state.index;
	scrollTo({ left: history.state.scrollX, top: history.state.scrollY });
} else if (transitionEnabledOnThisPage()) {
	history.replaceState({ index: currentHistoryIndex, scrollX, scrollY }, '');
}
const throttle = (cb: (...args: any[]) => any, delay: number) => {
	let wait = false;
	// During the waiting time additional events are lost.
	// So repeat the callback at the end if we have swallowed events.
	let onceMore = false;
	return (...args: any[]) => {
		if (wait) {
			onceMore = true;
			return;
		}
		cb(...args);
		wait = true;
		setTimeout(() => {
			if (onceMore) {
				onceMore = false;
				cb(...args);
			}
			wait = false;
		}, delay);
	};
};

async function getHTML(href: string) {
	try {
		const res = await fetch(href);
		const html = await res.text();
		return {
			ok: res.ok,
			html,
			redirected: res.redirected ? res.url : undefined,
			// drop potential charset (+ other name/value pairs) as parser needs the mediaType
			mediaType: res.headers.get('content-type')?.replace(/;.*/, ''),
		};
	} catch (err) {
		return { ok: false };
	}
}

function getFallback(): Fallback {
	const el = document.querySelector('[name="astro-view-transitions-fallback"]');
	if (el) {
		return el.getAttribute('content') as Fallback;
	}
	return 'animate';
}

function markScriptsExec() {
	for (const script of document.scripts) {
		script.dataset.astroExec = '';
	}
}

function runScripts() {
	let wait = Promise.resolve();
	for (const script of Array.from(document.scripts)) {
		if (script.dataset.astroExec === '') continue;
		const s = document.createElement('script');
		s.innerHTML = script.innerHTML;
		for (const attr of script.attributes) {
			if (attr.name === 'src') {
				const p = new Promise((r) => {
					s.onload = r;
				});
				wait = wait.then(() => p as any);
			}
			s.setAttribute(attr.name, attr.value);
		}
		s.dataset.astroExec = '';
		script.replaceWith(s);
	}
	return wait;
}

function isInfinite(animation: Animation) {
	const effect = animation.effect;
	if (!effect || !(effect instanceof KeyframeEffect) || !effect.target) return false;
	const style = window.getComputedStyle(effect.target, effect.pseudoElement);
	return style.animationIterationCount === 'infinite';
}

const parser = new DOMParser();

// A noop element used to prevent styles from being removed
let noopEl: HTMLDivElement;
if (import.meta.env.DEV) {
	noopEl = document.createElement('div');
}

async function updateDOM(doc: Document, loc: URL, state?: State, fallback?: Fallback) {
	// Check for a head element that should persist, either because it has the data
	// attribute or is a link el.
	const persistedHeadElement = (el: HTMLElement): Element | null => {
		const id = el.getAttribute(PERSIST_ATTR);
		const newEl = id && doc.head.querySelector(`[${PERSIST_ATTR}="${id}"]`);
		if (newEl) {
			return newEl;
		}
		if (el.matches('link[rel=stylesheet]')) {
			const href = el.getAttribute('href');
			return doc.head.querySelector(`link[rel=stylesheet][href="${href}"]`);
		}
		if (el.tagName === 'SCRIPT') {
			let s1 = el as HTMLScriptElement;
			for (const s2 of doc.scripts) {
				if (
					// Inline
					(s1.textContent && s1.textContent === s2.textContent) ||
					// External
					(s1.type === s2.type && s1.src === s2.src)
				) {
					return s2;
				}
			}
		}
		// Only run this in dev. This will get stripped from production builds and is not needed.
		if (import.meta.env.DEV) {
			if (el.tagName === 'STYLE' && el.dataset.viteDevId) {
				const devId = el.dataset.viteDevId;
				// If this same style tag exists, remove it from the new page
				return (
					doc.querySelector(`style[data-astro-dev-id="${devId}"]`) ||
					// Otherwise, keep it anyways. This is client:only styles.
					noopEl
				);
			}
		}
		return null;
	};

	const swap = () => {
		// noscript tags inside head element are not honored on swap (#7969).
		// Remove them before swapping.
		doc.querySelectorAll('head noscript').forEach((el) => el.remove());

		// swap attributes of the html element
		// - delete all attributes from the current document
		// - insert all attributes from doc
		// - reinsert all original attributes that are named 'data-astro-*'
		const html = document.documentElement;
		const astro = [...html.attributes].filter(
			({ name }) => (html.removeAttribute(name), name.startsWith('data-astro-'))
		);
		[...doc.documentElement.attributes, ...astro].forEach(({ name, value }) =>
			html.setAttribute(name, value)
		);

		// Swap head
		for (const el of Array.from(document.head.children)) {
			const newEl = persistedHeadElement(el as HTMLElement);
			// If the element exists in the document already, remove it
			// from the new document and leave the current node alone
			if (newEl) {
				newEl.remove();
			} else {
				// Otherwise remove the element in the head. It doesn't exist in the new page.
				el.remove();
			}
		}
		// Everything left in the new head is new, append it all.
		document.head.append(...doc.head.children);

		// Persist elements in the existing body
		const oldBody = document.body;
		document.body.replaceWith(doc.body);
		for (const el of oldBody.querySelectorAll(`[${PERSIST_ATTR}]`)) {
			const id = el.getAttribute(PERSIST_ATTR);
			const newEl = document.querySelector(`[${PERSIST_ATTR}="${id}"]`);
			if (newEl) {
				// The element exists in the new page, replace it with the element
				// from the old page so that state is preserved.
				newEl.replaceWith(el);
			}
		}

		// Simulate scroll behavior of Safari and
		// Chromium based browsers (Chrome, Edge, Opera, ...)
		scrollTo({ left: 0, top: 0, behavior: 'instant' });

		let initialScrollX = 0;
		let initialScrollY = 0;
		if (!state && loc.hash) {
			const id = decodeURIComponent(loc.hash.slice(1));
			const elem = document.getElementById(id);
			// prefer scrollIntoView() over scrollTo() because it takes scroll-padding into account
			if (elem) {
				elem.scrollIntoView();
				initialScrollX = Math.max(
					0,
					elem.offsetLeft + elem.offsetWidth - document.documentElement.clientWidth
				);
				initialScrollY = elem.offsetTop;
			}
		} else if (state) {
			scrollTo(state.scrollX, state.scrollY); // usings default scrollBehavior
		}
		!state &&
			history.pushState(
				{ index: ++currentHistoryIndex, scrollX: initialScrollX, scrollY: initialScrollY },
				'',
				loc.href
			);
		triggerEvent('astro:after-swap');
	};

	// Wait on links to finish, to prevent FOUC
	const links: Promise<any>[] = [];
	for (const el of doc.querySelectorAll('head link[rel=stylesheet]')) {
		// Do not preload links that are already on the page.
		if (
			!document.querySelector(
				`[${PERSIST_ATTR}="${el.getAttribute(PERSIST_ATTR)}"], link[rel=stylesheet]`
			)
		) {
			const c = document.createElement('link');
			c.setAttribute('rel', 'preload');
			c.setAttribute('as', 'style');
			c.setAttribute('href', el.getAttribute('href')!);
			links.push(
				new Promise<any>((resolve) => {
					['load', 'error'].forEach((evName) => c.addEventListener(evName, resolve));
					document.head.append(c);
				})
			);
		}
	}
	links.length && (await Promise.all(links));

	if (fallback === 'animate') {
		// Trigger the animations
		const currentAnimations = document.getAnimations();
		document.documentElement.dataset.astroTransitionFallback = 'old';
		const newAnimations = document
			.getAnimations()
			.filter((a) => !currentAnimations.includes(a) && !isInfinite(a));
		const finished = Promise.all(newAnimations.map((a) => a.finished));
		const fallbackSwap = () => {
			swap();
			document.documentElement.dataset.astroTransitionFallback = 'new';
		};
		await finished;
		fallbackSwap();
	} else {
		swap();
	}
}

async function transition(dir: Direction, loc: URL, state?: State) {
	let finished: Promise<void>;
	const href = loc.href;
	const { html, ok, mediaType, redirected } = await getHTML(href);
	// if there was a redirection, show the final URL in the browser's address bar
	redirected && (loc = new URL(redirected));
	// If there is a problem fetching the new page, just do an MPA navigation to it.
	if (!ok || !(mediaType === 'text/html' || mediaType === 'application/xhtml+xml')) {
		location.href = href;
		return;
	}

	const doc = parser.parseFromString(html, mediaType);
	if (!doc.querySelector('[name="astro-view-transitions-enabled"]')) {
		location.href = href;
		return;
	}

	// Now we are sure that we will push state, and it is time to create a state if it is still missing.
	!state && history.replaceState({ index: currentHistoryIndex, scrollX, scrollY }, '');

	document.documentElement.dataset.astroTransition = dir;
	if (supportsViewTransitions) {
		finished = document.startViewTransition(() => updateDOM(doc, loc, state)).finished;
	} else {
		finished = updateDOM(doc, loc, state, getFallback());
	}
	try {
		await finished;
	} finally {
		// skip this for the moment as it tends to stop fallback animations
		// document.documentElement.removeAttribute('data-astro-transition');
		await runScripts();
		markScriptsExec();
		onPageLoad();
	}
}

export function navigate(href: string) {
	const link = new URL(href, location.href);
	// We do not need to handle same page links because there are no page transitions
	// Same page means same path and same query params (but different hash)
	if (location.pathname === link.pathname && location.search === link.search) {
		if (link.hash) {
			location.href = link.href;
		} else {
			// Special case: self link without hash
			// If handed to the browser it will reload the page
			// But we want to handle it like any other same page navigation
			// So we scroll to the top of the page but do not start page transitions
			// push state on the first navigation but not if we were here already
			if (location.hash) {
				history.replaceState({ index: currentHistoryIndex, scrollX, scrollY: -(scrollY + 1) }, '');
				const newState: State = { index: ++currentHistoryIndex, scrollX: 0, scrollY: 0 };
				history.pushState(newState, '', link.href);
			}
			scrollTo({ left: 0, top: 0, behavior: 'instant' });
		}
		return;
	}
	// these are the cases we will handle: same origin, different page
	transition('forward', link);
}

addEventListener('popstate', (ev) => {
	if (!transitionEnabledOnThisPage() && ev.state) {
		// The current page doesn't have View Transitions enabled
		// but the page we navigate to does (because it set the state).
		// Do a full page refresh to reload the client-side router from the new page.
		// Scroll restauration will then happen during the reload when the router's code is re-executed
		history.scrollRestoration && (history.scrollRestoration = 'manual');
		location.reload();
		return;
	}

	// History entries without state are created by the browser (e.g. for hash links)
	// Our view transition entries always have state.
	// Just ignore stateless entries.
	// The browser will handle navigation fine without our help
	if (ev.state === null) {
		if (history.scrollRestoration) {
			history.scrollRestoration = 'auto';
		}
		return;
	}

	// With the default "auto", the browser will jump to the old scroll position
	// before the ViewTransition is complete.
	if (history.scrollRestoration) {
		history.scrollRestoration = 'manual';
	}

	const state: State = history.state;
	const nextIndex = state.index;
	const direction: Direction = nextIndex > currentHistoryIndex ? 'forward' : 'back';
	currentHistoryIndex = nextIndex;
	if (state.scrollY < 0) {
		scrollTo(state.scrollX, -(state.scrollY + 1));
	} else {
		transition(direction, new URL(location.href), state);
	}
});

addEventListener('load', onPageLoad);
// There's not a good way to record scroll position before a back button.
// So the way we do it is by listening to scrollend if supported, and if not continuously record the scroll position.
const updateState = () => {
	persistState({ ...history.state, scrollX, scrollY });
};

if ('onscrollend' in window) addEventListener('scrollend', updateState);
else addEventListener('scroll', throttle(updateState, 300));

if (supportsViewTransitions || getFallback() !== 'none') {
	markScriptsExec();
}
