import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cases} from '../src/data.js';
import {screenshotById} from '../src/screenshots.js';
const evidence = JSON.parse(await readFile(new URL('../research/expansion-discovery.json', import.meta.url), 'utf8'));
const additions = cases.filter(item => item.id.startsWith('add-'));
const lookup = new Map(evidence.candidates.map(item => [item.id, item]));

test('new batch adds at least 30 distinct verified sources with Chinese majority', () => {
  assert.ok(additions.length >= 30);
  assert.equal(additions.length, evidence.approvedCount);
  assert.deepEqual(new Set(additions.map(c => c.id)), new Set(evidence.approvedIds));
  assert.equal(additions.filter(c => /^zh-/.test(c.language)).length, evidence.approvedChineseCount);
  assert.ok(evidence.approvedChineseCount > additions.length / 2);
  assert.ok(new Set(additions.map(c => c.category)).size >= 6);
  const existingCategories = new Set(cases.filter(c => !c.id.startsWith('add-')).map(c => c.category));
  for (const item of additions) {
    assert.ok(existingCategories.has(item.category));
    assert.equal(item.isConcept, false);
    assert.ok(['zh-CN', 'zh-TW', 'en'].includes(item.language));
    assert.equal(item.tags.length, 3);
    assert.ok(item.note.length >= 40);
    const proof = lookup.get(item.id);
    assert.equal(proof.status, 'included');
    assert.equal(item.sourceName, proof.sourceName);
    assert.equal(item.sourceUrl, proof.sourceUrl);
    assert.equal(item.url, proof.url);
    for (const key of ['linkCheck','sourceCheck']) {
      assert.equal(proof[key].status, 200, `${item.id} ${key}`);
      assert.equal(new URL(proof[key].finalUrl).protocol, 'https:');
      assert.ok(proof[key].verifiedAt.startsWith(evidence.checkedAt));
    }
    assert.equal(proof.linkCheck.url, item.url);
    assert.equal(proof.sourceCheck.url, item.sourceUrl);
  }
});

test('new screenshots match individually reviewed local bytes and source metadata', async () => {
  const hashes = new Set();
  for (const item of additions) {
    const shot = lookup.get(item.id).screenshot;
    assert.equal(shot.review, 'approved');
    assert.ok(shot.observation.length >= 40);
    assert.equal(shot.sourceUrl, item.url);
    assert.ok(shot.width >= 500 && shot.height >= 300);
    assert.ok(!Object.hasOwn(shot, 'capturedAt'));
    assert.deepEqual(screenshotById[item.id], Object.fromEntries(['src','retrievedAt','sourceUrl','captureProvider'].map(key => [key,shot[key]])));
    const bytes = await readFile(new URL(`../${shot.src}`, import.meta.url));
    assert.equal(bytes.length, shot.bytes);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), shot.sha256);
    assert.ok(!hashes.has(shot.sha256), 'No duplicate image padding');
    hashes.add(shot.sha256);
  }
});

test('rejected candidates remain excluded with explicit evidence', () => {
  assert.equal(evidence.candidateCount, evidence.candidates.length);
  for (const item of evidence.candidates.filter(c => c.status === 'excluded')) {
    assert.ok(item.exclusionReason);
    assert.ok(!cases.some(c => c.id === item.id));
    assert.ok(!screenshotById[item.id]);
  }
});
