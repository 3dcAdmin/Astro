import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setup, setupBuild } from './helpers.js';

const Public = suite('Public');

setup(Public, './fixtures/astro-public');
setupBuild(Public, './fixtures/astro-public');

Public('css and js files do not get bundled', async ({ build, readFile }) => {
  await build().catch((err) => {
    assert.ok(!err, 'Error during the build');
  });

  let indexHtml = await readFile('/index.html');
  assert.ok(indexHtml.includes('<script src="/example.js"></script>'));
  assert.ok(indexHtml.includes('<link href="/example.css" ref="stylesheet">'));
  assert.ok(indexHtml.includes('<img src="/images/twitter.png">'));
});

Public('dotfiles get copied over', async ({ build, exists }) => {
  await build().catch((err) => {
    assert.ok(!err, 'Error during the build');
  });

  assert.ok(await exists('/.htaccess'), '.htaccess did not get copied over');
  assert.ok(await exists('/.nojekyll'), '.nojekyll did not get copied over');
  assert.ok(await exists('/.anotherdotfilewithcontent'), '.anotherdotfilewithcontent did not get copied over');
  assert.ok(await exists('/.yetanotherdotfile'), '.yetanotherdotfile did not get copied over');
  assert.ok(await exists('/.well-known/hello.txt'), '.well-known/hello.txt did not get copied over');
});

Public.run();
