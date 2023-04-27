import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Errors information in build', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	it('includes the file where the error happened', async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/error-build-location/', import.meta.url),
		});

		let errorContent;
		try {
			await fixture.build();
		} catch (e) {
			errorContent = e;
		}

		expect(errorContent.id).to.equal('src/pages/index.astro');
	});
});
