interface Stat {
	elapsedTime: number;
	heapUsedChange: number;
	heapUsedTotal: number;
}

interface OngoingStat {
	startTime: number;
	startHeap: number;
}

/**
 * Timer to track certain operations' performance. Used by Astro's scripts only.
 * Set `process.env.ENABLE_ASTRO_TIMER` truthy to enable.
 */
export class AstroTimer {
	private enabled: boolean;
	private ongoingTimers: Map<string, OngoingStat> = new Map();
	private stats: Record<string, Stat> = {};

	constructor() {
		this.enabled = !!process.env.ENABLE_ASTRO_TIMER;
	}

	/**
	 * Start a timer for a scope with a given name.
	 */
	start(name: string) {
		if (!this.enabled) return;
		this.ongoingTimers.set(name, {
			startTime: performance.now(),
			startHeap: process.memoryUsage().heapUsed,
		});
	}

	/**
	 * End a timer for a scope with a given name.
	 */
	end(name: string) {
		if (!this.enabled) return;
		const stat = this.ongoingTimers.get(name);
		if (!stat) return;
		const endHeap = process.memoryUsage().heapUsed;
		this.stats[name] = {
			elapsedTime: performance.now() - stat.startTime,
			heapUsedChange: endHeap - stat.startHeap,
			heapUsedTotal: endHeap,
		};
		this.ongoingTimers.delete(name);
	}

	/**
	 * Write stats to `process.env.ENABLE_ASTRO_TIMER`
	 */
	finish() {
		if (!this.enabled) return;
		// @ts-expect-error
		process.env.ASTRO_BENCH_STATS = this.stats;
	}
}
