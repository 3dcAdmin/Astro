import assert from 'node:assert/strict';
import { before, after, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Astro Actions', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/actions/' });
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Exposes subscribe action', async () => {
			const res = await fixture.fetch('/_actions/subscribe', {
				method: 'POST',
				body: JSON.stringify({ channel: 'bholmesdev' }),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			assert.equal(res.ok, true);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.channel, 'bholmesdev');
			assert.equal(json.subscribeButtonState, 'smashed');
		});

		it('Exposes comment action', async () => {
			const formData = new FormData();
			formData.append('channel', 'bholmesdev');
			formData.append('comment', 'Hello, World!');
			const res = await fixture.fetch('/_actions/comment', {
				method: 'POST',
				body: formData,
			});

			assert.equal(res.ok, true);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.channel, 'bholmesdev');
			assert.equal(json.comment, 'Hello, World!');
		});

		it('Raises validation error on bad form data', async () => {
			const formData = new FormData();
			formData.append('channel', 'bholmesdev');
			const res = await fixture.fetch('/_actions/comment', {
				method: 'POST',
				body: formData,
			});

			assert.equal(res.ok, false);
			assert.equal(res.status, 400);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.type, 'AstroActionInputError');
		});

		it('Exposes plain formData action', async () => {
			const formData = new FormData();
			formData.append('channel', 'bholmesdev');
			formData.append('comment', 'Hello, World!');
			const res = await fixture.fetch('/_actions/commentPlainFormData', {
				method: 'POST',
				body: formData,
			});

			assert.equal(res.ok, true);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.success, true);
			assert.equal(json.isFormData, true, 'Should receive plain FormData');
		});
	});
});
