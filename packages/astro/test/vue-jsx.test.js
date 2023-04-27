import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Vue JSX', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/vue-jsx/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can load Vue JSX', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const allPreValues = $('pre')
				.toArray()
				.map((el) => $(el).text());

			expect(allPreValues).to.deep.equal(['2345', '0', '1', '1', '1', '10', '100', '1000']);
		});
	});
});
