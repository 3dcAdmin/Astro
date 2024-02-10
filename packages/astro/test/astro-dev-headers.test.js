import assert from 'node:assert/strict';
import { describe, before, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Astro dev headers', () => {
	let fixture;
	let devServer;
	const headers = {
		'x-astro': 'test',
	};

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-dev-headers/',
			server: {
				headers,
			},
		});
		await fixture.build();
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	describe('dev', () => {
		it('returns custom headers for valid URLs', async () => {
			const result = await fixture.fetch('/');
			assert.equal(result.status, 200);
			assert.equal(Object.fromEntries(result.headers).includes(headers), true);
		});

		it('does not return custom headers for invalid URLs', async () => {
			const result = await fixture.fetch('/bad-url');
			assert.equal(result.status, 404);
			assert.equal(Object.fromEntries(result.headers).includes(headers), false);
		});
	});
});
