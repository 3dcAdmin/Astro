import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Astro Global', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-global/',
			site: 'https://mysite.dev/subsite/',
			base: '/blog',
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Astro.request.url', async () => {
			const res = await await fixture.fetch('/blog/?foo=42');
			assert.equal(res.status, 200);

			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#pathname').text(), '/blog/');
			assert.equal($('#searchparams').text(), '{}');
			assert.equal($('#child-pathname').text(), '/blog/');
			assert.equal($('#nested-child-pathname').text(), '/blog/');
		});

		it('Astro.glob() returned `url` metadata of each markdown file extensions DOES NOT include the extension', async () => {
			const html = await fixture.fetch('/blog/omit-markdown-extensions/').then((res) => res.text());
			const $ = cheerio.load(html);
			assert.equal(
				$('[data-any-url-contains-extension]').data('any-url-contains-extension'),
				false,
			);
		});
		
		it("Astro.route has the right value in pages and components", async () => {
			let html = await fixture.fetch('/blog').then((res) => res.text());
			let $ = cheerio.load(html);
			assert.match($("#route").text(),  /Astro route: src\/pages\/index.astro/);
			html = await fixture.fetch('/blog/omit-markdown-extensions/').then((res) => res.text());
			$ = cheerio.load(html);
			assert.match($("#route").text(),  /Astro route: src\/pages\/omit-markdown-extensions.astro/);
		})
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Astro.request.url', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#pathname').text(), '/blog');
			assert.equal($('#searchparams').text(), '{}');
			assert.equal($('#child-pathname').text(), '/blog');
			assert.equal($('#nested-child-pathname').text(), '/blog');
		});

		it('Astro.site', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#site').attr('href'), 'https://mysite.dev/subsite/');
		});

		it('Astro.glob() correctly returns an array of all posts', async () => {
			const html = await fixture.readFile('/posts/1/index.html');
			const $ = cheerio.load(html);
			assert.equal($('.post-url').attr('href'), '/blog/post/post-2');
		});

		it('Astro.glob() correctly returns meta info for MD and Astro files', async () => {
			const html = await fixture.readFile('/glob/index.html');
			const $ = cheerio.load(html);
			assert.equal($('[data-file]').length, 8);
			assert.equal($('.post-url[href]').length, 8);
		});

		it("Astro.route has the right value in pages and components", async () => {
			let html = await fixture.readFile('/index.html');
			let $ = cheerio.load(html);
			assert.match($("#route").text(),  /Astro route: src\/pages\/index.astro/);
			html =await fixture.readFile('/omit-markdown-extensions/index.html');
			$ = cheerio.load(html);
			assert.match($("#route").text(),  /Astro route: src\/pages\/omit-markdown-extensions.astro/);
		})
	});

	describe('app', () => {
		/** @type {import('../dist/core/app/index.js').App} */
		let app;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-global/',
				site: 'https://mysite.dev/subsite/',
				base: '/new',
				output: 'server',
				adapter: testAdapter(),
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('Astro.site', async () => {
			const response = await app.render(new Request('https://example.com/'));
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('#site').attr('href'), 'https://mysite.dev/subsite/');
		});

		it("Astro.route has the right value in pages and components", async () => {
			let response = await app.render(new Request('https://example.com/'));
			let html = await response.text();
			let $ = cheerio.load(html);
			assert.match($("#route").text(),  /Astro route: src\/pages\/index.astro/);
			response = await app.render(new Request('https://example.com/omit-markdown-extensions'));
			html = await response.text();
			$ = cheerio.load(html);
			assert.match($("#route").text(),  /Astro route: src\/pages\/omit-markdown-extensions.astro/);
		})
	});
});

describe('Astro Global Defaults', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-global/',
		});
	});

	describe('dev', () => {
		let devServer;
		let $;

		before(async () => {
			devServer = await fixture.startDevServer();
			const html = await fixture.fetch('/blog/?foo=42').then((res) => res.text());
			$ = cheerio.load(html);
		});

		after(async () => {
			await devServer.stop();
		});

		it('Astro.request.url', async () => {
			assert.equal($('#pathname').text(), '');
			assert.equal($('#searchparams').text(), '');
			assert.equal($('#child-pathname').text(), '');
			assert.equal($('#nested-child-pathname').text(), '');
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Astro.request.url', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#pathname').text(), '/');
			assert.equal($('#searchparams').text(), '{}');
			assert.equal($('#child-pathname').text(), '/');
			assert.equal($('#nested-child-pathname').text(), '/');
		});

		it('Astro.site', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#site').attr('href'), undefined);
		});
	});
});
