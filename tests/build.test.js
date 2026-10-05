import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {cases} from '../src/data.js';
import {screenshotById} from '../src/screenshots.js';

test('production HTML, module imports and image URLs share deterministic cache version', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs']);
  const info = JSON.parse(await readFile('dist/build-info.json', 'utf8'));
  assert.match(info.version, /^[0-9a-f]{16}$/);
  assert.equal(info.records, cases.length);
  assert.equal(info.screenshots, Object.keys(screenshotById).length);
  const html = await readFile('dist/index.html', 'utf8');
  const app = await readFile('dist/src/app.js', 'utf8');
  const images = await readFile('dist/src/screenshots.js', 'utf8');
  assert.ok(html.includes(`./src/styles.css?v=${info.version}`));
  assert.ok(html.includes(`./src/app.js?v=${info.version}`));
  assert.ok(app.includes(`'./data.js?v=${info.version}'`));
  assert.ok(app.includes(`'./screenshots.js?v=${info.version}'`));
  assert.ok(app.includes(`'./library-state.js?v=${info.version}'`));
  assert.ok(app.includes(`'./taxonomy.js?v=${info.version}'`));
  assert.ok(!app.includes("from './data.js'"));
  assert.ok(!app.includes("from './screenshots.js'"));
  for (const image of Object.values(screenshotById)) assert.ok(images.includes(`${image.src}?v=${info.version}`));
  execFileSync(process.execPath, ['scripts/build.mjs']);
  assert.equal(JSON.parse(await readFile('dist/build-info.json', 'utf8')).version, info.version);
  assert.ok(!(await readFile('src/app.js', 'utf8')).includes('?v='), 'Development source remains unversioned');
});
