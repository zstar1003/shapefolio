import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cases} from '../src/data.js';
import {screenshotById} from '../src/screenshots.js';

test('approved screenshots correspond to curated sources and local image bytes', async () => {
  const lookup = new Map(cases.map(c => [c.id, c]));
  assert.ok(Object.keys(screenshotById).length > 0, 'At least one approved genuine screenshot is required to publish');
  for (const [id, image] of Object.entries(screenshotById)) {
    assert.ok(lookup.has(id), `Unknown screenshot id: ${id}`);
    assert.equal(image.sourceUrl, lookup.get(id).url, `Source URL mismatch: ${id}`);
    assert.match(image.src, /^\.\/assets\/screenshots\/[a-z0-9_-]+\.(png|jpg|jpeg|webp)$/i);
    assert.ok(!image.src.includes('..'), 'Images must remain in screenshot directory');
    const bytes = await readFile(image.src);
    assert.ok(bytes.length > 1024, `Empty or implausibly small screenshot: ${id}`);
    const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    assert.ok(png || jpeg || webp, `Unrecognized image signature: ${id}`);
    if (png) {
      assert.ok(bytes.readUInt32BE(16) >= 300 && bytes.readUInt32BE(20) >= 150, `Invalid screenshot dimensions: ${id}`);
    }
    if (image.retrievedAt) assert.match(image.retrievedAt, /^\d{4}-\d{2}-\d{2}/);
  }
});
test('screenshot-first UI never falls back to illustrated covers', async () => {
  const script = await readFile('src/app.js', 'utf8');
  const css = await readFile('src/styles.css', 'utf8');
  assert.ok(script.includes('cases.filter(c => Boolean(screenshotById[c.id]?.src))'));
  assert.ok(script.includes('const pool = isFavorites ? cases.filter(c => saved.includes(c.id)) : galleryCases'));
  assert.ok(script.includes('filterByTaxonomy(filtered, state.category)'));
  assert.ok(script.includes('loading="${detail'));
  assert.ok(script.includes('rel="noopener noreferrer"'));
  assert.ok(!script.includes('poster-title'));
  assert.ok(!css.includes('poster-shape'));
});
