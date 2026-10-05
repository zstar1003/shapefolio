import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cases, filterCases} from '../src/data.js';
import {screenshotById} from '../src/screenshots.js';
import {taxonomy, classifyCase, filterByTaxonomy} from '../src/taxonomy.js';

const evidence = JSON.parse(await readFile(new URL('../research/threeui-curation.json', import.meta.url), 'utf8'));
const additions = cases.filter(item => item.id.startsWith('threeui-'));
const originals = cases.filter(item => !item.id.startsWith('threeui-'));
const byId = new Map(cases.map(item => [item.id, item]));
const proofById = new Map(evidence.entries.map(item => [item.id, item]));
const hash = value => createHash('sha256').update(value).digest('hex');
const digest = value => hash(JSON.stringify(value));
const normalizeUrl = value => {
  const url = new URL(value);
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}${url.search}`;
};

// Read dimensions from the real WebP container, rather than trusting metadata.
function webpDimensions(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, 'Complete RIFF container');
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    assert.ok(start + size <= bytes.length, 'Complete WebP chunk');
    if (type === 'VP8X') {
      assert.ok(size >= 10);
      return {width: bytes.readUIntLE(start + 4, 3) + 1, height: bytes.readUIntLE(start + 7, 3) + 1};
    }
    if (type === 'VP8 ') {
      assert.ok(size >= 10);
      assert.deepEqual([...bytes.subarray(start + 3, start + 6)], [0x9d, 0x01, 0x2a]);
      return {width: bytes.readUInt16LE(start + 6) & 0x3fff, height: bytes.readUInt16LE(start + 8) & 0x3fff};
    }
    if (type === 'VP8L') {
      assert.ok(size >= 5);
      assert.equal(bytes[start], 0x2f);
      const dimensions = bytes.readUInt32LE(start + 1);
      return {width: (dimensions & 0x3fff) + 1, height: ((dimensions >>> 14) & 0x3fff) + 1};
    }
    offset = start + size + (size % 2);
  }
  assert.fail('WebP must contain a supported image header');
}

test('ThreeUI curation preserves all 504 prior records and 495 screenshot metadata entries', () => {
  assert.equal(originals.length, 504);
  assert.equal(digest(originals), '071dcb6cb70520ec93cf6ec8d6cd8006953deb42c04471d281f1f4df420f1016', 'Prior content, IDs, and order stay unchanged');
  const oldScreenshots = Object.fromEntries(Object.entries(screenshotById).filter(([id]) => !id.startsWith('threeui-')));
  assert.equal(Object.keys(oldScreenshots).length, 495);
  assert.equal(digest(oldScreenshots), '4cd053fd80834493971edc06badaa31e00549e6f5a2ff46aaf8a7da49e845fbd');
  assert.equal(cases.length, 504 + additions.length);
  assert.equal(Object.keys(screenshotById).length, 495 + additions.length);
});

test('ThreeUI is a bounded, manifest-backed selection of distinct design families', () => {
  assert.ok(additions.length > 0 && additions.length <= 25);
  assert.equal(evidence.accepted.length, additions.length);
  assert.equal(new Set(evidence.accepted).size, evidence.accepted.length);
  assert.deepEqual(new Set(additions.map(item => item.id)), new Set(evidence.accepted));
  assert.equal(proofById.size, evidence.entries.length, 'Evidence IDs are unique');
  assert.equal(new Set(cases.map(item => item.id)).size, cases.length);
  const families = new Set();
  const urls = new Set(originals.map(item => normalizeUrl(item.url)));
  for (const item of additions) {
    const proof = proofById.get(item.id);
    assert.ok(proof, item.id);
    assert.equal(typeof proof.family, 'string', item.id);
    const family = proof.family.trim().toLocaleLowerCase();
    assert.ok(family, item.id);
    assert.ok(!families.has(family), `Duplicate ThreeUI family: ${family}`);
    families.add(family);
    const url = normalizeUrl(item.url);
    assert.ok(!urls.has(url), `Duplicate source page: ${item.url}`);
    urls.add(url);
  }
});

test('every ThreeUI case has exact concept provenance and original Chinese editorial notes', () => {
  const notes = new Set(originals.map(item => item.note));
  for (const item of additions) {
    assert.match(item.id, /^threeui-[a-z0-9-]+$/);
    assert.equal(item.isConcept, true, item.id);
    assert.equal(item.sourceName, 'ThreeUI · Community', item.id);
    assert.equal(item.creatorName, 'Meng To', item.id);
    assert.match(item.url, /^https:\/\/threeui\.com\/[a-z0-9-]+\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/);
    assert.equal(item.sourceUrl, item.url, item.id);
    assert.equal(proofById.get(item.id).sourceUrl, item.url, item.id);
    assert.equal(item.language, 'en', item.id);
    assert.equal(item.tags.length, 3, item.id);
    assert.equal(new Set(item.tags).size, 3, item.id);
    assert.ok(item.tags.every(tag => typeof tag === 'string' && tag.trim()), item.id);
    assert.ok(item.note.length >= 40, item.id);
    assert.ok((item.note.match(/\p{Script=Han}/gu) || []).length >= 20, `Chinese learning note: ${item.id}`);
    assert.ok(!notes.has(item.note), `Original learning note: ${item.id}`);
    notes.add(item.note);
    assert.ok(item.subtitle && item.lesson, item.id);
  }
});

test('ThreeUI source licensing is documented separately from the project code license', async () => {
  const attribution = await readFile(new URL('../ATTRIBUTION.md', import.meta.url), 'utf8');
  const license = await readFile(new URL('../research/THREEUI-LICENSE.txt', import.meta.url), 'utf8');
  assert.match(attribution, /ThreeUI/i);
  assert.match(attribution, /https:\/\/threeui\.com/);
  assert.match(attribution, /THREEUI-LICENSE\.txt/);
  assert.match(license, /MIT License/);
  assert.match(license, /Copyright/i);
  assert.match(license, /Permission is hereby granted, free of charge/);
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);
});

test('ThreeUI stays in the existing subject taxonomy and is searchable by its source', () => {
  assert.equal(digest(taxonomy), 'c06663fae4854bf72b0527c077af5695a1c19a5b34f95e1a523871b554a2d93a', 'No new source-based taxonomy');
  assert.deepEqual(filterCases(cases, {query: '  ThReEuI  '}).map(item => item.id).sort(), [...evidence.accepted].sort());
  for (const item of additions) {
    const classification = classifyCase(item);
    const group = taxonomy.find(group => group.id === classification.parent);
    assert.ok(group, item.id);
    assert.equal(item.category, group.label, item.id);
    assert.equal(item.subcategory, classification.child, item.id);
    assert.ok(group.children.some(child => child.id === item.subcategory), item.id);
    assert.ok(filterByTaxonomy(additions, item.subcategory).includes(item), item.id);
  }
});

test('ThreeUI previews are approved, individually hashed local browser screenshots', async () => {
  const hashes = new Set();
  for (const [id, screenshot] of Object.entries(screenshotById)) {
    if (!id.startsWith('threeui-')) hashes.add(hash(await readFile(new URL(`../${screenshot.src}`, import.meta.url))));
  }
  for (const item of additions) {
    const screenshot = screenshotById[item.id];
    assert.ok(screenshot, item.id);
    assert.match(screenshot.src, /^\.\/assets\/screenshots\/threeui-[a-z0-9-]+\.webp$/);
    assert.equal(screenshot.sourceUrl, item.url, item.id);
    assert.equal(screenshot.capturedUrl, proofById.get(item.id).capturedUrl, item.id);
    assert.equal(new URL(screenshot.capturedUrl).protocol, 'https:', item.id);
    assert.equal(screenshot.captureProvider, 'Chrome · cloud browser', item.id);
    assert.equal(screenshot.retrievedAt, '2026-10-05', item.id);
    assert.equal(screenshot.review, 'approved', item.id);
    assert.equal(screenshot.capturedAt, '2026-10-05', item.id); // Direct capture date is known, unlike cached screenshot services.
    const bytes = await readFile(new URL(`../${screenshot.src}`, import.meta.url));
    assert.ok(bytes.length > 1024, `Implausibly small preview: ${item.id}`);
    assert.equal(bytes.length, screenshot.bytes, item.id);
    assert.match(screenshot.sha256, /^[a-f0-9]{64}$/);
    assert.equal(hash(bytes), screenshot.sha256, item.id);
    assert.ok(!hashes.has(screenshot.sha256), `Reused screenshot: ${item.id}`);
    hashes.add(screenshot.sha256);
    const dimensions = webpDimensions(bytes);
    assert.deepEqual(dimensions, {width: screenshot.width, height: screenshot.height}, item.id);
    assert.ok(dimensions.width >= 500 && dimensions.height >= 300, item.id);
  }
});

test('rejected ThreeUI candidates remain excluded from data and screenshots with reasons', () => {
  assert.ok(Array.isArray(evidence.excluded));
  assert.ok(evidence.excluded.length > 0, 'Record rejected candidates as well as accepted ones');
  for (const item of evidence.excluded) {
    assert.ok(item.id && item.reason, 'Rejected candidates need stable IDs and reasons');
    assert.ok(!byId.has(item.id), item.id);
    assert.ok(!Object.hasOwn(screenshotById, item.id), item.id);
    assert.ok(!evidence.accepted.includes(item.id), item.id);
  }
});
