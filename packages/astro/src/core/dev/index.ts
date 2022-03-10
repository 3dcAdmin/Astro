import { polyfill } from '@astrojs/webapi';
import type { AddressInfo } from 'net';
import { performance } from 'perf_hooks';
import type { AstroConfig } from '../../@types/astro';
import { createVite } from '../create-vite.js';
import { defaultLogOptions, info, warn, LogOptions } from '../logger.js';
import * as vite from 'vite';
import * as msg from '../messages.js';
import { getLocalAddress, getLatestVersion } from './util.js';

export interface DevOptions {
	logging: LogOptions;
}

export interface DevServer {
	address: AddressInfo;
	stop(): Promise<void>;
}

/** `astro dev` */
export default async function dev(config: AstroConfig, options: DevOptions = { logging: defaultLogOptions }): Promise<DevServer> {
	const devStart = performance.now();
	// polyfill WebAPIs for Node.js runtime
	polyfill(globalThis, {
		exclude: 'window document',
	});
	// start the server
	const viteUserConfig = vite.mergeConfig(
		{
			mode: 'development',
			server: {
				host: config.devOptions.hostname,
			},
		},
		config.vite || {}
	);
	const viteConfig = await createVite(viteUserConfig, { astroConfig: config, logging: options.logging, mode: 'dev' });
	const viteServer = await vite.createServer(viteConfig);
	await viteServer.listen(config.devOptions.port);

	const address = viteServer.httpServer!.address() as AddressInfo;
	const localAddress = getLocalAddress(address.address, config.devOptions.hostname);
	// Log to console
	const site = config.buildOptions.site ? new URL(config.buildOptions.site) : undefined;
	info(
		options.logging,
		null,
		msg.devStart({ startupTime: performance.now() - devStart, port: address.port, localAddress, networkAddress: address.address, site, https: !!viteUserConfig.server?.https })
	);

	const currentVersion = process.env.PACKAGE_VERSION ?? '0.0.0';
	if (currentVersion.includes('-')) {
		warn(
			options.logging,
			null,
			msg.prerelease({ currentVersion })
		);
	} else {
		const latestVersion = await getLatestVersion();
		if (latestVersion && currentVersion !== latestVersion) {
			warn(
				options.logging,
				null,
				msg.outdated({ currentVersion, latestVersion })
			);
		}
	}
	
	return {
		address,
		stop: () => viteServer.close(),
	};
}
