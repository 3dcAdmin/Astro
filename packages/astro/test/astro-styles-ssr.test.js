/**
 * UNCOMMENT: fix frontmatter import hoisting

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

/** Basic CSS minification; removes some flakiness in testing CSS *\/
function cssMinify(css) {
  return css
    .trim() // remove whitespace
    .replace(/\r?\n\s*\/g, '') // collapse lines
    .replace(/\s*\{/g, '{') // collapse selectors
    .replace(/:\s*\/g, ':') // collapse attributes
    .replace(/;}/g, '}'); // collapse block
}

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-styles-ssr/' });
  await fixture.build();
});


describe('Styles SSR', () => {
  test('Has <link> tags', async () => {
    const MUST_HAVE_LINK_TAGS = [
      '/src/components/ReactCSS.css',
      '/src/components/ReactModules.module.css',
      '/src/components/SvelteScoped.css',
      '/src/components/VueCSS.css',
      '/src/components/VueModules.css',
      '/src/components/VueScoped.css',
    ];

    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    for (const href of MUST_HAVE_LINK_TAGS) {
      const el = $(`link[href="${href}"]`);
      expect(el).toHaveLength(1);
    }
  });

  test('Has correct CSS classes', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    const MUST_HAVE_CLASSES = {
      '#react-css': 'react-title',
      '#react-modules': 'title', // ⚠️  this should be transformed
      '#vue-css': 'vue-title',
      '#vue-modules': 'title', // ⚠️  this should also be transformed
      '#vue-scoped': 'vue-title', // also has data-v-* property
      '#svelte-scoped': 'svelte-title', // also has additional class
    };

    for (const [selector, className] of Object.entries(MUST_HAVE_CLASSES)) {
      const el = $(selector);
      if (selector === '#react-modules' || selector === '#vue-modules') {
        // this will generate differently on Unix vs Windows. Here we simply test that it has transformed
        expect(el.attr('class')).toEqual(expect.stringMatching(new RegExp(`^_${className}_[A-Za-z0-9-_]+`))); // className should be transformed, surrounded by underscores and other stuff
      } else {
        // if this is not a CSS module, it should remain as expected
        expect(el.attr('class')).toEqual(expect.stringContaining(className));
      }

      // add’l test: Vue Scoped styles should have data-v-* attribute
      if (selector === '#vue-scoped') {
        const { attribs } = el.get(0);
        const scopeId = Object.keys(attribs).find((k) => k.startsWith('data-v-'));
        expect(scopeId).toBeTruthy();
      }

      // add’l test: Svelte should have another class
      if (selector === '#svelte-title') {
        expect(el.attr('class')).not.toBe(className);
      }
    }
  });

  test('CSS Module support in .astro', async () => {
    const html = await fixture.readFile('/');
    const $ = cheerio.load(html);

    let scopedClass;

    // test 1: <style> tag in <head> is transformed
    const css = cssMinify(
      $('style')
        .html()
        .replace(/\.astro-[A-Za-z0-9-]+/, (match) => {
          scopedClass = match; // get class hash from result
          return match;
        })
    );

    expect(css).toBe(`.wrapper${scopedClass}{margin-left:auto;margin-right:auto;max-width:1200px}`);

    // test 2: element received .astro-XXXXXX class (this selector will succeed if transformed correctly)
    const wrapper = $(`.wrapper${scopedClass}`);
    expect(wrapper).toHaveLength(1);
  });

  test('Astro scoped styles', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    const el1 = $('#dynamic-class');
    const el2 = $('#dynamic-vis');

    let scopedClass;

    $('#class')
      .attr('class')
      .replace(/astro-[A-Za-z0-9-]+/, (match) => {
        scopedClass = match;
        return match;
      });

    // test 1: Astro component missing scoped class
    expect(scopedClass).toBe(``);

    // test 2–3: children get scoped class
    expect(el1.attr('class')).toBe(`blue ${scopedClass}`);
    expect(el2.attr('class')).toBe(`visible ${scopedClass}`);

    const { contents: css } = await fixture.fetch('/src/components/Astro.astro.css').then((res) => res.text());

    // test 4: CSS generates as expected
    expect(cssMinify(css.toString())).toBe(`.blue.${scopedClass}{color:powderblue}.color\\:blue.${scopedClass}{color:powderblue}.visible.${scopedClass}{display:block}`);
  });

  test('Astro scoped styles skipped without <style>', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: Astro component without <style> should not include scoped class
    expect($('#no-scope').attr('class')).toBe(undefined);
  });

  test('Astro scoped styles can be passed to child components', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    let scopedClass;
    $('style')
      .html()
      .replace(/outer\.(astro-[A-Za-z0-9-]+)/, (match, p1) => {
        scopedClass = p1;
        return match;
      });

    expect($('#passed-in').attr('class')).toBe(`outer ${scopedClass}`);
  });
});

*/

test.skip('is skipped', () => {});
