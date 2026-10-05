import test from 'node:test';
import assert from 'node:assert/strict';
import {cases, filterCases} from '../src/data.js';
import {createFavoritesStore, FAVORITES_STORAGE_KEY} from '../src/library-state.js';

// Keep source identity separate from the subject users browse by. These are the
// original 46 Oil UI IDs, also used by screenshots and already-saved favorites.
const originalConceptsByCategory = {
  '产品设计': ['voice', 'home', 'lingo', 'freight', 'ride', 'pulse', 'weather', 'trail', 'brew', 'letter', 'upload', 'club'],
  '创意设计': ['reel', 'components', 'muse', 'diary', 'editor', 'camera'],
  '品牌商业': ['stay', 'knot', 'keeb', 'silver', 'checkout', 'watch', 'roast', 'sneaker', 'scent', 'studio', 'device'],
  '文化艺术': ['anime'],
  '效率工具': ['tracker', 'cards', 'contract', 'ledger', 'lims', 'calendar', 'canvas', 'mail'],
  '内容媒体': ['recipe', 'reader', 'vinyl', 'podcast', 'wrapped'],
  '个人网站': ['folio', 'maker'],
  '开发工具': ['copilot'],
};
const originalIds = Object.values(originalConceptsByCategory).flat().map(id => `oil-${id}`);
const byId = new Map(cases.map(item => [item.id, item]));

test('all 46 original Oil UI concepts use existing subject categories and retain provenance', () => {
  assert.equal(originalIds.length, 46);
  const existingCategories = new Set(cases.filter(item => !item.isConcept).map(item => item.category));
  assert.ok(!cases.some(item => item.category === 'Oil UI'));
  for (const [category, sourceIds] of Object.entries(originalConceptsByCategory)) {
    assert.ok(existingCategories.has(category), `${category} is an existing content category`);
    for (const sourceId of sourceIds) {
      const id = `oil-${sourceId}`;
      const item = byId.get(id);
      assert.ok(item, `${id} retains its stable ID`);
      assert.equal(item.category, category, id);
      assert.equal(item.sourceCaseId, sourceId, id);
      assert.equal(item.sourceName, 'Oil UI', id);
      assert.equal(item.sourceUrl, 'https://ui.oiloil.org/', id);
      assert.equal(item.url, `https://ui.oiloil.org/works/${sourceId}/`, id);
      assert.equal(item.isConcept, true, id);
      assert.equal(item.editorialType, '独立学习笔记', id);
      assert.ok(item.model, `${id} retains model attribution`);
    }
  }
});

test('全部 remains the inclusive default while each reclassified case appears in its subject filter', () => {
  assert.deepEqual(filterCases(cases, {category: '全部'}), cases);
  assert.deepEqual(filterCases(cases), cases);
  assert.deepEqual(filterCases(cases, {category: 'Oil UI'}), []);
  for (const [category, sourceIds] of Object.entries(originalConceptsByCategory)) {
    const resultIds = new Set(filterCases(cases, {category}).map(item => item.id));
    for (const sourceId of sourceIds) assert.ok(resultIds.has(`oil-${sourceId}`));
  }
});

test('legacy Oil UI favorites survive reclassification and intersect the new content categories', () => {
  const raw = JSON.stringify(originalIds);
  const store = createFavoritesStore(() => ({
    getItem(key) { assert.equal(key, FAVORITES_STORAGE_KEY); return raw; },
    setItem() { assert.fail('Reclassification must not rewrite saved IDs'); },
  }));
  const {ids: saved, status} = store.current();
  assert.equal(FAVORITES_STORAGE_KEY, 'shapefolio.favorites.v1');
  assert.equal(status, 'ready');
  assert.deepEqual(saved, originalIds);
  assert.deepEqual(filterCases(cases, {savedOnly: true, saved}).map(item => item.id).sort(), [...originalIds].sort());
  for (const [category, sourceIds] of Object.entries(originalConceptsByCategory)) {
    assert.deepEqual(
      filterCases(cases, {category, savedOnly: true, saved}).map(item => item.id).sort(),
      sourceIds.map(id => `oil-${id}`).sort(),
    );
  }
});


test('Oil UI remains searchable as provenance after its category is removed', () => {
  assert.deepEqual(
    filterCases(cases, {query: '  Oil UI  '}).map(item => item.id).sort(),
    [...originalIds].sort(),
  );
});
