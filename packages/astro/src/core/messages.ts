/**
 * Dev server messages (organized here to prevent clutter)
 */

import type { AddressInfo } from 'net';
import stripAnsi from 'strip-ansi';
import { bold, dim, red, green, underline, yellow, cyan, bgGreen, black } from 'kleur/colors';
import { pad, emoji } from './dev/util.js';

const PREFIX_PADDING = 6;

/** Display  */
export function req({ url, statusCode, reqTime }: { url: string; statusCode: number; reqTime?: number }): string {
	let color = dim;
	if (statusCode >= 500) color = red;
	else if (statusCode >= 400) color = yellow;
	else if (statusCode >= 300) color = dim;
	else if (statusCode >= 200) color = green;
	return `${bold(color(pad(`${statusCode}`, PREFIX_PADDING)))} ${pad(url, 40)} ${reqTime ? dim(Math.round(reqTime) + 'ms') : ''}`.trim();
}

export function reload({ file }: { file: string }): string {
	return `${green(pad('reload', PREFIX_PADDING))} ${file}`;
}

export function hmr({ file }: { file: string }): string {
	return `${green(pad('update', PREFIX_PADDING))} ${file}`;
}

/** Display dev server host and startup time */
export function devStart({
	startupTime,
	port,
	localAddress,
	networkAddress,
	https,
	site,
	latestVersion,
}: {
	startupTime: number;
	port: number;
	localAddress: string;
	networkAddress: string;
	https: boolean;
	site: URL | undefined;
	latestVersion?: string;
}): string {
	// PACAKGE_VERSION is injected at build-time
	const version = process.env.PACKAGE_VERSION ?? '0.0.0';
	const isPrerelease = version.includes('-');
	const rootPath = site ? site.pathname : '/';
	const toDisplayUrl = (hostname: string) => `${https ? 'https' : 'http'}://${hostname}:${port}${rootPath}`;

	const messages = [
		`${emoji('🚀 ', '')}${bgGreen(black(` astro `))} ${green(`v${version}`)} ${dim(`started in ${Math.round(startupTime)}ms`)}`,
		'',
		`${dim('┃')} Local    ${bold(cyan(toDisplayUrl(localAddress)))}`,
		`${dim('┃')} Network  ${bold(cyan(toDisplayUrl(networkAddress)))}`,
		'',
	];
	if (isPrerelease) {
		messages.push(yellow('▶ This is a prerelease build.'), yellow('  Undocumented changes may happen at any time!'), '');
	} else if (latestVersion && version !== latestVersion) {
		messages.push(`${yellow('▶ Update available!')} ${dim(pad(version, 12, 'left'))} → ${green(latestVersion)}`, `  See ${underline(`https://astro.build/releases/${latestVersion}`)}`, '');
	}
	return messages.map((msg) => `  ${msg}`).join('\n');
}

/** Display port in use */
export function portInUse({ port }: { port: number }): string {
	return `Port ${port} in use. Trying a new one…`;
}

/** Pretty-print errors */
export function err(error: Error): string {
	if (!error.stack) return stripAnsi(error.message);
	let message = stripAnsi(error.message);
	let stack = stripAnsi(error.stack);
	const split = stack.indexOf(message) + message.length;
	message = stack.slice(0, split);
	stack = stack.slice(split).replace(/^\n+/, '');
	return `${message}\n${dim(stack)}`;
}
