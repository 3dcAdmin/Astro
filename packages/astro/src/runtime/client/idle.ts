import type { ClientDirective } from '../../types/public/integrations.js';

const idleDirective: ClientDirective = (load) => {
	const cb = async () => {
		const hydrate = await load();
		await hydrate();
	};
	if ('requestIdleCallback' in window) {
		(window as any).requestIdleCallback(cb);
	} else {
		setTimeout(cb, 200);
	}
};

export default idleDirective;
