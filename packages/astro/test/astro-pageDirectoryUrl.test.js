import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('build format', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/astro-page-directory-url/', import.meta.url),
			build: {
				format: 'file',
			},
		});
		await fixture.build();
	});

	it('outputs', async () => {
		expect(await fixture.readFile('/client.html')).to.be.ok;
		expect(await fixture.readFile('/nested-md.html')).to.be.ok;
		expect(await fixture.readFile('/nested-astro.html')).to.be.ok;
	});
});
