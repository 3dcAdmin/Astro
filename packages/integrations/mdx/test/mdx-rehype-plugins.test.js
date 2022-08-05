import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';

import { rehypeReadingTime } from './test-utils.js';
import { loadFixture } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/mdx-rehype-plugins/', import.meta.url);

describe('MDX rehype plugins', () => {
	describe('without "extends"', () => {
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: FIXTURE_ROOT,
				integrations: [
					mdx({
						rehypePlugins: [rehypeReadingTime],
					}),
				],
			});
			await fixture.build();
		});

		it('removes default getHeadings', async () => {
			const html = await fixture.readFile('/space-ipsum/index.html');
			const { document } = parseHTML(html);

			const headings = [...document.querySelectorAll('h1, h2')];
			expect(headings.length).to.be.greaterThan(0);
			for (const heading of headings) {
				expect(heading.id).to.be.empty;
			}
		});

		it('supports custom rehype plugins - reading time', async () => {
			const { readingTime } = JSON.parse(await fixture.readFile('/reading-time.json'));

			expect(readingTime).to.not.be.null;
			expect(readingTime.text).to.match(/^\d+ min read/);
		});

		it('supports custom vfile data with "astro.frontmatter" - reading time', async () => {
			const { frontmatter = {} } = JSON.parse(await fixture.readFile('/reading-time.json'));
	
			expect(frontmatter.injectedReadingTime).to.not.be.null;
			expect(frontmatter.injectedReadingTime.text).to.match(/^\d+ min read/);
		});
	});

	describe('with "extends"', () => {
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: FIXTURE_ROOT,
				integrations: [
					mdx({
						rehypePlugins: { extends: [rehypeReadingTime] },
					}),
				],
			});
			await fixture.build();
		});

		it('preserves default getHeadings', async () => {
			const html = await fixture.readFile('/space-ipsum/index.html');
			const { document } = parseHTML(html);

			const headings = [...document.querySelectorAll('h1, h2')];
			expect(headings.length).to.be.greaterThan(0);
			for (const heading of headings) {
				expect(heading.id).to.not.be.empty;
			}
		});
	});
});
