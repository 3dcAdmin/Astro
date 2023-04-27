import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Vue with multi-renderer', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/vue-with-multi-renderer/', import.meta.url),
		});
	});

	it('builds with another renderer present', async () => {
		try {
			await fixture.build();
		} catch (e) {
			expect(e).to.equal(undefined, `Should not throw`);
		}
	});
});
