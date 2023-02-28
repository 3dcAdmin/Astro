import { expect, assert } from 'chai';
import { loadFixture } from './test-utils.js';
import * as cheerio from 'cheerio';
import { Writable } from 'node:stream';
import testAdapter from './test-adapter.js';

describe('astro:image', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('dev', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		/** @type {Array<{ type: any, level: 'error', message: string; }>} */
		let logs = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image/',
				experimental: {
					images: true,
				}
			});
	
			devServer = await fixture.startDevServer({
				logging: {
					level: 'error',
					dest: new Writable({
						objectMode: true,
						write(event, _, callback) {
							logs.push(event);
							callback();
						}
					})
				}
			});
		});
	
		after(async () => {
			await devServer.stop();
		});

		describe('basics', () => {
			let $;
			before(async() => {
				let res = await fixture.fetch('/');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('Adds the <img> tag', () => {
				let $img = $('#local img');
				expect($img).to.have.a.lengthOf(1);
				expect($img.attr('src').startsWith('/_image')).to.equal(true);
			});

			it('includes loading and decoding attributes', () => {
				let $img = $('#local img');
				expect(!!$img.attr('loading')).to.equal(true);
				expect(!!$img.attr('decoding')).to.equal(true);
			});

			it('includes the provided alt', () => {
				let $img = $('#local img');
				expect($img.attr('alt')).to.equal('a penguin');
			});
		});

		describe('remote', () => {
			describe('working', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/');
					let html = await res.text();
					$ = cheerio.load(html);
				});

				it('includes the provided alt', async () => {
					let $img = $('#remote img');
					expect($img.attr('alt')).to.equal('fred');
				});

				it('includes loading and decoding attributes', () => {
					let $img = $('#remote img');
					expect(!!$img.attr('loading')).to.equal(true);
					expect(!!$img.attr('decoding')).to.equal(true);
				});
			});

			it('error if no width and height', async () => {
				logs.length = 0;
				let res = await fixture.fetch('/remote-error-no-dimensions');
				await res.text();

				expect(logs).to.have.a.lengthOf(1);
				expect(logs[0].message).to.contain('For remote images, width and height are required.');
			});

			it('error if no height', async () => {
				logs.length = 0;
				let res = await fixture.fetch('/remote-error-no-height');
				await res.text();

				expect(logs).to.have.a.lengthOf(1);
				expect(logs[0].message).to.contain('For remote images, height is required.');
			});
		});

		describe('markdown', () => {
			let $;
			before(async() => {
				let res = await fixture.fetch('/post');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('Adds the <img> tag', () => {
				let $img = $('img');
				expect($img).to.have.a.lengthOf(1);
				expect($img.attr('src').startsWith('/_image')).to.equal(true);
			});
		});
	});

	describe('build ssg', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-ssg/',
				experimental: {
					images: true,
				}
			});
			await fixture.build();
		});

		it('writes out images to dist folder', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			const src = $('#local img').attr('src');
			expect(src.length).to.be.greaterThan(0);
			const data = await fixture.readFile(src, null);
			expect(data).to.be.an.instanceOf(Buffer);
		});
	});

	describe('prod ssr', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-ssr/',
				output: 'server',
				adapter: testAdapter(),
				experimental: {
					images: true,
				}
			});
			await fixture.build();
		});

		// TODO
		// This is not working because the image service does a fetch() on the underlying
		// image and we do not have an HTTP server in these tests. We either need
		// to start one, or find another way to tell the image service how to load these files.
		it.skip('dynamic route images are built at response time', async () => {
			const app = await fixture.loadTestAdapterApp();
			let request = new Request('http://example.com/');
			let response = await app.render(request);
			expect(response.status).to.equal(200);
			const html = await response.text();
			const $ = cheerio.load(html);
			const src = $('#local img').attr('src');
			request = new Request('http://example.com' + src);
			response = await app.render(request);
			expect(response.status).to.equal(200);
		});

		it('prerendered routes images are built', async () => {
			const html = await fixture.readFile('/client/prerender/index.html');
			const $ = cheerio.load(html);
			const src = $('img').attr('src');
			const imgData = await fixture.readFile('/client' + src, null);
			expect(imgData).to.be.an.instanceOf(Buffer);
		});
	});
});
