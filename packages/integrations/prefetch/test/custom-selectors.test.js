import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';
import prefetch from '../dist/index.js';

const customSelector = 'a[href="/contact"]';
const customIntentSelector = 'a[href][rel~="custom-intent"]';

const test = testFactory({
	root: './fixtures/basic-prefetch/',
	integrations: [
		prefetch({
			selector: customSelector,
			intentSelector: customIntentSelector,
		}),
	],
});

test.describe('Custom prefetch selectors', () => {
	test.describe('dev', () => {
		let devServer;

		test.beforeEach(async ({ astro }) => {
			devServer = await astro.startDevServer();
		});

		test.afterEach(async () => {
			await devServer.stop();
		});

		test.describe('prefetches links by custom selector', () => {
			test('only prefetches /contact', async ({ page, astro }) => {
				const requests = [];

				page.on('request', (request) => requests.push(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				expect(requests.includes(astro.resolveUrl('/about')), '/about was skipped').toBeFalsy();
				expect(
					requests.includes(astro.resolveUrl('/contact')),
					'/contact was prefetched'
				).toBeTruthy();
				expect(requests.includes(astro.resolveUrl('/admin')), '/admin was skipped').toBeFalsy();
				expect(
					requests.filter((r) => r === astro.resolveUrl('/')).length === 1,
					'/ was skipped by prefetch and only queried once'
				).toBeTruthy();
			});
		});
	});

	test.describe('build', () => {
		let previewServer;

		test.beforeEach(async ({ astro }) => {
			await astro.build();
			previewServer = await astro.preview();
		});

		// important: close preview server (free up port and connection)
		test.afterEach(async () => {
			await previewServer.stop();
		});

		test.describe('prefetches links by custom selector', () => {
			test('only prefetches /contact', async ({ page, astro }) => {
				const requests = [];

				page.on('request', (request) => requests.push(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				expect(requests.includes(astro.resolveUrl('/about')), '/about was skipped').toBeFalsy();
				expect(
					requests.includes(astro.resolveUrl('/contact')),
					'/contact was prefetched'
				).toBeTruthy();
				expect(requests.includes(astro.resolveUrl('/admin')), '/admin was skipped').toBeFalsy();
				expect(
					requests.filter((r) => r === astro.resolveUrl('/')).length === 1,
					'/ was skipped by prefetch and only queried once'
				).toBeTruthy();
			});
		});
	});
});

test.describe('Custom prefetch intent selectors', () => {
	test.describe('dev', () => {
		let devServer;

		test.beforeEach(async ({ astro }) => {
			devServer = await astro.startDevServer();
		});

		test.afterEach(async () => {
			await devServer.stop();
		});

		test('prefetches custom intent links only on hover', async ({ page, astro }) => {
			const requests = [];

			page.on('request', (request) => requests.push(request.url()));

			await page.goto(astro.resolveUrl('/'));

			await page.waitForLoadState('networkidle');

			expect(
				requests.includes(astro.resolveUrl('/terms')),
				'/terms was not prefetched initially'
			).toBeFalsy();

			await page.hover(customIntentSelector);

			await page.waitForResponse(astro.resolveUrl('/terms'));

			expect(
				requests.includes(astro.resolveUrl('/terms')),
				'/terms was prefetched on hover'
			).toBeTruthy();
		});
	});

	test.describe('build', () => {
		let previewServer;

		test.beforeEach(async ({ astro }) => {
			await astro.build();
			previewServer = await astro.preview();
		});

		// important: close preview server (free up port and connection)
		test.afterEach(async () => {
			await previewServer.stop();
		});

		test('prefetches custom intent links only on hover', async ({ page, astro }) => {
			const requests = [];

			page.on('request', (request) => requests.push(request.url()));

			await page.goto(astro.resolveUrl('/'));

			await page.waitForLoadState('networkidle');

			expect(
				requests.includes(astro.resolveUrl('/terms')),
				'/terms was not prefetched initially'
			).toBeFalsy();

			await page.hover(customIntentSelector);

			await page.waitForResponse(astro.resolveUrl('/terms'));

			expect(
				requests.includes(astro.resolveUrl('/terms')),
				'/terms was prefetched on hover'
			).toBeTruthy();
		});
	});
});
