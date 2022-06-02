import { visit } from 'unist-util-visit';
import { toHtml } from 'hast-util-to-html';
import Slugger from 'github-slugger';

import type { MarkdownHeader, RehypePlugin } from './types.js';

export default function createCollectHeaders() {
	const headers: MarkdownHeader[] = [];
	const slugger = new Slugger();

	function rehypeCollectHeaders(): ReturnType<RehypePlugin> {
		return function (tree) {
			visit(tree, (node) => {
				if (node.type !== 'element') return;
				const { tagName } = node;
				if (tagName[0] !== 'h') return;
				const [_, level] = tagName.match(/h([0-6])/) ?? [];
				if (!level) return;
				const depth = Number.parseInt(level);

				let text = '';
				let isJSX = false;
				visit(node, (child, _, parent) => {
					if (child.type === 'element' || ['code', 'pre'].some((tag) => parent?.tagName === tag)) {
						return;
					}
					if (child.type === 'raw') {
						if (child.value.startsWith('\n<') || child.value.endsWith('>\n')) {
							return;
						}
					}
					if (child.type === 'text' || child.type === 'raw') {
						text += child.value;
						isJSX = isJSX || child.value.includes('{');
					}
				});

				node.properties = node.properties || {};
				if (typeof node.properties.id !== 'string') {
					if (isJSX) {
						// HACK: serialized JSX from internal plugins, ignore these for slug
						const raw = toHtml(node.children, { allowDangerousHtml: true })
							.replace(/\n(<)/g, '<')
							.replace(/(>)\n/g, '>');
						// HACK: for ids that have JSX content, use $$slug helper to generate slug at runtime
						node.properties.id = `$$slug(\`${text.replace(/\{/g, '${')}\`)`;
						(node as any).type = 'raw';
						(
							node as any
						).value = `<${node.tagName} id={${node.properties.id}}>${raw}</${node.tagName}>`;
					} else {
						node.properties.id = slugger.slug(text);
					}
				}

				headers.push({ depth, slug: node.properties.id, text });
			});
		};
	}

	return {
		headers,
		rehypeCollectHeaders,
	};
}
