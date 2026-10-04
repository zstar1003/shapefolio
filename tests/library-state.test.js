import test from 'node:test';
import assert from 'node:assert/strict';
import {FAVORITES_STORAGE_KEY, parseFavorites, createFavoritesStore, routeFromHash, filterByLanguage} from '../src/library-state.js';

function memoryStorage(raw = null) {
  let value = raw;
  return {
    getItem(key) { assert.equal(key, 'shapefolio.favorites.v1'); return value; },
    setItem(key, next) { assert.equal(key, FAVORITES_STORAGE_KEY); value = next; },
    value: () => value,
  };
}

test('legacy favorites retain the same key, deduplicate and preserve unknown IDs', () => {
  const storage = memoryStorage('["linear","future-entry","linear"]');
  const store = createFavoritesStore(() => storage);
  assert.deepEqual(store.current(), {ids: ['linear', 'future-entry'], status: 'ready'});
  store.toggle('linear');
  assert.deepEqual(JSON.parse(storage.value()), ['future-entry']);
  store.toggle('astro');
  assert.deepEqual(createFavoritesStore(() => storage).current().ids, ['future-entry', 'astro']);
});

test('missing storage is empty and invalid storage is explicitly marked corrupt', () => {
  assert.deepEqual(parseFavorites(null), {ids: [], status: 'ready'});
  for (const raw of ['', '{broken', '{}', 'null', '[1]', '["linear",null]', '[""]']) {
    assert.deepEqual(parseFavorites(raw), {ids: [], status: 'corrupt'});
  }
  const storage = memoryStorage('not-json');
  const store = createFavoritesStore(() => storage);
  assert.equal(storage.value(), 'not-json', 'Reading must not overwrite corrupt data');
  assert.equal(store.toggle('linear').status, 'ready');
  assert.deepEqual(JSON.parse(storage.value()), ['linear']);
});

test('blocked storage access permits favorites for this page session', () => {
  const store = createFavoritesStore(() => { throw new Error('SecurityError'); });
  assert.deepEqual(store.current(), {ids: [], status: 'unavailable'});
  assert.deepEqual(store.toggle('linear'), {ids: ['linear'], status: 'unavailable'});
  assert.deepEqual(store.read(), {ids: ['linear'], status: 'unavailable'});
  assert.deepEqual(store.toggle('linear').ids, []);
});

test('quota errors preserve existing and newly saved items in memory', () => {
  const storage = memoryStorage('["linear"]');
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  const store = createFavoritesStore(() => storage);
  assert.deepEqual(store.toggle('astro'), {ids: ['linear', 'astro'], status: 'unavailable'});
  assert.deepEqual(JSON.parse(storage.value()), ['linear']);
  const exposed = store.current();
  exposed.ids.push('external-mutation');
  assert.deepEqual(store.current().ids, ['linear', 'astro']);
});

test('reloading storage reflects changes made in another tab', () => {
  const storage = memoryStorage('["linear"]');
  const store = createFavoritesStore(() => storage);
  storage.setItem(FAVORITES_STORAGE_KEY, '["astro"]');
  assert.deepEqual(store.read(), {ids: ['astro'], status: 'ready'});
  storage.setItem(FAVORITES_STORAGE_KEY, null);
  assert.deepEqual(store.read().ids, []);
});

test('favorites use a project-Pages-safe hash route including direct reload', () => {
  for (const hash of ['#/favorites', '#/favorites/']) assert.equal(routeFromHash(hash), 'favorites');
  for (const hash of ['', '#/', '#gallery', '#/other', '#/favorites-else']) assert.equal(routeFromHash(hash), 'gallery');
});

test('Chinese filter uses explicit language metadata rather than translated notes', () => {
  const items = [
    {id: 'simplified', language: 'zh-CN'}, {id: 'traditional', language: 'zh-TW'},
    {id: 'english', language: 'en', note: '中文笔记'}, {id: 'unknown'},
  ];
  assert.deepEqual(filterByLanguage(items, 'zh').map(item => item.id), ['simplified', 'traditional']);
  assert.equal(filterByLanguage(items), items);
  assert.equal(items.length, 4);
});
