import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cases} from '../src/data.js';
import {screenshotById} from '../src/screenshots.js';
import {filterByLanguage} from '../src/library-state.js';

const evidence = JSON.parse(await readFile(new URL('../research/chinese-discovery.json', import.meta.url), 'utf8'));
const chinese = cases.filter(item => item.id.startsWith('zh-'));
const lookup = new Map(evidence.candidates.map(item => [item.id, item]));

test('Chinese additions have explicit language, original notes and discovery provenance', () => {
  assert.ok(chinese.length >= 20);
  assert.equal(chinese.length, evidence.approvedChineseCount);
  assert.deepEqual(new Set(chinese.map(item => item.id)), new Set(evidence.approvedIds));
  assert.ok(filterByLanguage(cases, 'zh').length >= chinese.length);
  assert.ok(chinese.some(item => item.language === 'zh-CN'));
  assert.ok(chinese.some(item => item.language === 'zh-TW'));
  assert.ok(new Set(chinese.map(item => item.category)).size >= 5);
  for (const item of chinese) {
    assert.ok(['zh-CN', 'zh-TW'].includes(item.language), item.id);
    assert.equal(item.tags.length, 3);
    assert.ok(item.note.length >= 40);
    assert.ok(item.subtitle.length < 60);
    assert.ok(item.sourceName);
    assert.equal(new URL(item.sourceUrl).protocol, 'https:');
    assert.equal(new URL(item.url).protocol, 'https:');
    assert.equal(item.isConcept, false);
    assert.equal(lookup.get(item.id).sourceName, item.sourceName);
    assert.equal(lookup.get(item.id).sourceUrl, item.sourceUrl);
    assert.equal(lookup.get(item.id).status, 'included');
  }
});

test('all previous IDs retain their relative order while Chinese cases are interleaved two to one', () => {
  assert.deepEqual(cases.filter(item => evidence.originalCaseIds.includes(item.id)).map(item => item.id), evidence.originalCaseIds);
  const expected = [];
  let offset = 0;
  for (const id of evidence.originalCaseIds) {
    expected.push(...evidence.approvedIds.slice(offset, offset + 2));
    offset += 2;
    expected.push(id);
  }
  expected.push(...evidence.approvedIds.slice(offset));
  assert.deepEqual(cases.filter(item => expected.includes(item.id)).map(item => item.id), expected);
});

test('every included Chinese site has a successful public link check and approved image provenance', () => {
  assert.equal(evidence.candidates.filter(item => item.status === 'included').length, chinese.length);
  for (const item of chinese) {
    const proof = lookup.get(item.id);
    assert.equal(proof.linkCheck.status, 200, item.id);
    assert.equal(proof.linkCheck.url, item.url);
    assert.equal(new URL(proof.linkCheck.finalUrl).protocol, 'https:');
    assert.equal(proof.linkCheck.verifiedAt, evidence.checkedAt);
    assert.equal(proof.screenshot.review, 'approved');
    assert.ok(proof.screenshot.observation.length >= 40);
    assert.equal(proof.screenshot.sourceUrl, item.url);
    assert.ok(['Thum.io', 'Automattic mShots'].includes(proof.screenshot.captureProvider));
    assert.deepEqual(screenshotById[item.id], {
      src: proof.screenshot.src,
      retrievedAt: proof.screenshot.retrievedAt,
      sourceUrl: proof.screenshot.sourceUrl,
      captureProvider: proof.screenshot.captureProvider,
    });
    assert.ok(!Object.hasOwn(proof.screenshot, 'capturedAt'));
  }
});

test('Chinese captures are real local WebP files matching the reviewed bytes', async () => {
  for (const item of chinese) {
    const proof = lookup.get(item.id).screenshot;
    assert.equal(proof.src, `./assets/screenshots/${item.id}.webp`);
    const bytes = await readFile(new URL(`../${proof.src}`, import.meta.url));
    assert.ok(bytes.length > 1024, item.id);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.equal(bytes.length, proof.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), proof.sha256);
  }
});

test('excluded sites remain out of the gallery and unsupported X attribution is absent', () => {
  for (const item of evidence.candidates.filter(item => item.status === 'excluded')) {
    assert.ok(item.exclusionReason);
    assert.ok(!cases.some(record => record.id === item.id));
    assert.ok(!screenshotById[item.id]);
  }
  assert.deepEqual(evidence.xSearch.verifiedPosts, []);
  for (const item of chinese) assert.ok(!/^(?:www\.)?(?:x|twitter)\.com$/.test(new URL(item.sourceUrl).hostname));
  assert.ok(evidence.totalCases <= cases.length);
  assert.ok(evidence.displayableCases <= Object.keys(screenshotById).length);
});
