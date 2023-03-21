import { expect } from 'chai';

import {
	createComponent,
	render,
	renderComponent,
	renderSlot,
} from '../../../dist/runtime/server/index.js';
import { jsx } from '../../../dist/jsx-runtime/index.js';
import {
	createBasicEnvironment,
	createRenderContext,
	renderPage,
	loadRenderer,
} from '../../../dist/core/render/index.js';
import { createAstroJSXComponent, renderer as jsxRenderer } from '../../../dist/jsx/index.js';
import { defaultLogging as logging } from '../../test-utils.js';
import { orderRoot, renderQueue } from './jsx.proto.js';

const createAstroModule = (AstroComponent) => ({ default: AstroComponent });
const loadJSXRenderer = () => loadRenderer(jsxRenderer, (s) => import(s));

describe('core/render', () => {
	describe('Astro JSX components', () => {
		let env;
		before(async () => {
			env = createBasicEnvironment({
				logging,
				renderers: [await loadJSXRenderer()],
			});
		});

		it('new rendering order', async () => {
			const Page = createAstroJSXComponent(() => {
				return jsx('main', {
					children: [
						jsx('p', {
							className: 'n',
							children: [
								jsx('span', {
									children: 'label 1',
								}),
								' ',
								jsx('span', {
									children: 'label 2',
								}),
							],
						}),
					],
				});
			});

			const ctx = createRenderContext({ request: new Request('http://example.com/') });
			const response = await renderPage(createAstroModule(Page), ctx, env);

			expect(response.status).to.equal(200);

			const html = await response.text();
			console.log(html);
			expect(html).to.include('<div><p class="n">works</p></div>');
		});

		it('Can render slots', async () => {
			const Wrapper = createComponent((result, _props, slots = {}) => {
				return render`<div>${renderSlot(result, slots['myslot'])}</div>`;
			});

			const Page = createAstroJSXComponent(() => {
				return jsx(Wrapper, {
					children: [
						jsx('p', {
							slot: 'myslot',
							className: 'n',
							children: 'works',
						}),
					],
				});
			});

			const ctx = createRenderContext({ request: new Request('http://example.com/') });
			const response = await renderPage(createAstroModule(Page), ctx, env);

			expect(response.status).to.equal(200);

			const html = await response.text();
			expect(html).to.include('<div><p class="n">works</p></div>');
		});

		it('Can render slots with a dash in the name', async () => {
			const Wrapper = createComponent((result, _props, slots = {}) => {
				return render`<div>${renderSlot(result, slots['my-slot'])}</div>`;
			});

			const Page = createAstroJSXComponent(() => {
				return jsx('main', {
					children: [
						jsx(Wrapper, {
							// Children as an array
							children: [
								jsx('p', {
									slot: 'my-slot',
									className: 'n',
									children: 'works',
								}),
							],
						}),
						jsx(Wrapper, {
							// Children as a VNode
							children: jsx('p', {
								slot: 'my-slot',
								className: 'p',
								children: 'works',
							}),
						}),
					],
				});
			});

			const ctx = createRenderContext({ request: new Request('http://example.com/') });
			const response = await renderPage(createAstroModule(Page), ctx, env);

			expect(response.status).to.equal(200);

			const html = await response.text();
			expect(html).to.include(
				'<main><div><p class="n">works</p></div><div><p class="p">works</p></div></main>'
			);
		});

		it('Errors in JSX components are raised', async () => {
			const Component = createAstroJSXComponent(() => {
				throw new Error('uh oh');
			});

			const Page = createComponent((result, _props) => {
				return render`<div>${renderComponent(result, 'Component', Component, {})}</div>`;
			});

			const ctx = createRenderContext({ request: new Request('http://example.com/') });
			const response = await renderPage(createAstroModule(Page), ctx, env);

			try {
				await response.text();
				expect(false).to.equal(true, 'should not have been successful');
			} catch (err) {
				expect(err.message).to.equal('uh oh');
			}
		});
	});
});

describe('new engine', () => {
	it('orderRoot', () => {
		const root = {
			node: 'p',
			children: [
				{ node: 'span', children: [{ node: 'a', children: 'I am a link' }] },
				{
					node: 'span',
					children: [
						{ children: 'I am a text' },
						{ node: 'strong', children: 'I am strong' },
						{ node: 'em', children: 'I am em' },
						{ node: 'u', children: 'I am underline' },
					],
				},
			],
		};
		const expected = [
			{ node: 'a', content: 'I am a link', parent: 'span' },
			{ node: 'span', parent: 'span' },
			{ content: 'I am a text', parent: 'span' },
			{ node: 'strong', content: 'I am strong', parent: 'span' },
			{ node: 'em', content: 'I am em', parent: 'span' },
			{ node: 'u', content: 'I am underline', parent: 'span' },
			{ node: 'span', parent: 'p' },
			{ node: 'p' },
		];

		const expectedString = `<p><span><a>I am a link</a></span><span>I am a text<strong>I am strong</strong><em>I am em</em><u>I am underline</u></span></p>`;
		let result = orderRoot(root);

		expect(result).to.deep.equal(expected);

		let rendered = renderQueue(result);

		expect(rendered).to.deep.equal(expectedString);
	});
});
