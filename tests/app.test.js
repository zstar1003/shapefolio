import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {filterCases} from '../src/data.js';
import {createFavoritesStore, FAVORITES_STORAGE_KEY, filterByLanguage, routeFromHash} from '../src/library-state.js';

// Minimal DOM port for application-state regressions. Real-browser visual,
// focus and history behavior still require separate real-browser QA.
const source = (await readFile(new URL('../src/app.js', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
const fixtures = [
  {id: 'linear', name: 'Linear', category: '产品设计', tags: ['秩序感'], subtitle: '协作', url: 'https://linear.app/', note: '设计笔记', lesson: '学习'},
  {id: 'cn', name: '中文站', language: 'zh-CN', category: '产品设计', tags: ['秩序感'], subtitle: '中文产品', url: 'https://example.cn/', note: '设计笔记', lesson: '学习'},
  {id: 'tw', name: '繁體站', language: 'zh-TW', category: '文化艺术', tags: ['文化'], subtitle: '中文文化', url: 'https://example.tw/', note: '设计笔记', lesson: '学习'},
  {id: 'no-capture', name: '暂缺截图', category: '文化艺术', tags: ['档案'], subtitle: '截图待补', url: 'https://example.org/', note: '设计笔记', lesson: '学习'},
];
function app({hash = '#/', raw = null, unavailable = false} = {}) {
  const elements = new Map();
  let document;
  class Element {
    constructor() { this.listeners = {}; this.attributes = {}; this.children = []; this.classList = {add() {}, remove() {}, toggle() {}}; this.value = ''; this.hidden = false; this.innerHTML = ''; this.textContent = ''; this.tagName = 'DIV'; }
    addEventListener(type, handler) { this.listeners[type] = handler; }
    setAttribute(key, value) { this.attributes[key] = value; }
    removeAttribute(key) { delete this.attributes[key]; }
    focus() { document.activeElement = this; }
    scrollIntoView() {}
    closest() { return null; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    querySelector() { return new Element(); }
  }
  const get = selector => {
    if (!elements.has(selector)) elements.set(selector, new Element());
    return elements.get(selector);
  };
  document = {
    title: '', body: new Element(), activeElement: new Element(),
    querySelector: selector => selector === 'dialog[open]' ? null : get(selector),
    querySelectorAll: selector => selector === 'dialog' ? [get('#detail'), get('#about')] : [],
    addEventListener() {},
  };
  const localStorage = {
    getItem() { if (unavailable) throw new Error('SecurityError'); return raw; },
    setItem(key, value) { if (unavailable) throw new Error('QuotaExceededError'); raw = value; },
  };
  const window = {listeners: {}, addEventListener(type, handler) { this.listeners[type] = handler; }, scrollTo() {}};
  const location = {hash};
  const context = {
    cases: fixtures,
    screenshotById: Object.fromEntries(fixtures.filter(c => c.id !== 'no-capture').map(c => [c.id, {src: `./assets/screenshots/${c.id}.webp`}])) ,
    filterCases, filterByLanguage, routeFromHash, FAVORITES_STORAGE_KEY,
    createFavoritesStore: () => createFavoritesStore(() => localStorage),
    document, window, location, localStorage, URL,
    setTimeout: () => 1, clearTimeout() {}, matchMedia: () => ({matches: true}),
  };
  vm.runInNewContext(source, context);
  const change = (selector, value, type = 'input') => { get(selector).value = value; get(selector).listeners[type]({target: get(selector)}); };
  return {
    get, document,
    route(next) { location.hash = next; window.listeners.hashchange(); },
    save(id) { get('#cards').listeners.click({target: {closest: () => ({dataset: {save: id}})}}); },
    change,
    category(category) { get('#categories').listeners.click({target: {closest: () => ({dataset: {category}})}}); },
    reset() { get('#reset').listeners.click(); },
    external(next) { raw = next; window.listeners.storage({key: FAVORITES_STORAGE_KEY, storageArea: localStorage}); },
    raw: () => raw,
    shown: () => [...get('#cards').innerHTML.matchAll(/data-detail="([^"]+)"/g)].map(match => match[1]),
  };
}

test('direct favorites route renders legacy saved entries, including those with missing screenshots', () => {
  const page = app({hash: '#/favorites', raw: '["linear","no-capture","unknown"]'});
  assert.equal(page.document.title, '我的收藏 — 拾形');
  assert.equal(page.get('#favorites-heading').hidden, false);
  assert.equal(page.get('#nav-saved').attributes['aria-current'], 'page');
  assert.deepEqual(page.shown(), ['linear', 'no-capture']);
  assert.equal(page.get('#saved-count').textContent, 2);
  assert.match(page.get('#cards').innerHTML, /截图待补充/);
  assert.match(page.get('#storage-notice').textContent, /1 项收藏暂时无法显示/);
});

test('save, navigate, reload, remove, and repeat actions keep local-only collection consistent', () => {
  const page = app();
  page.save('linear');
  page.save('cn');
  page.route('#/favorites');
  assert.deepEqual(page.shown(), ['linear', 'cn']);
  const reloaded = app({hash: '#/favorites', raw: page.raw()});
  assert.deepEqual(reloaded.shown(), ['linear', 'cn']);
  reloaded.save('linear');
  assert.deepEqual(reloaded.shown(), ['cn']);
  reloaded.save('cn');
  assert.equal(reloaded.get('#empty-title').textContent, '还没有收藏');
  assert.equal(reloaded.get('#empty-browse').hidden, false);
  reloaded.route('#/');
  reloaded.save('linear');
  reloaded.save('linear');
  assert.equal(reloaded.raw(), '[]');
});

test('favorites search and reset remain on the favorites page', () => {
  const page = app({hash: '#/favorites', raw: '["linear","cn"]'});
  page.change('#search', '不存在');
  assert.equal(page.get('#empty-title').textContent, '没有找到匹配的收藏');
  assert.equal(page.get('#empty-browse').hidden, true);
  assert.equal(page.get('#reset').hidden, false);
  page.reset();
  assert.deepEqual(page.shown(), ['linear', 'cn']);
  assert.equal(page.document.title, '我的收藏 — 拾形');
});

test('history navigation restores independent gallery and favorites filters', () => {
  const page = app({raw: '["linear","cn","tw"]'});
  page.change('#search', 'Linear');
  page.route('#/favorites');
  assert.equal(page.get('#search').value, '');
  page.change('#search', '中文');
  page.change('#language', 'zh', 'change');
  page.route('#/');
  assert.equal(page.get('#search').value, 'Linear');
  assert.equal(page.get('#language').value, 'all');
  assert.deepEqual(page.shown(), ['linear']);
  page.route('#/favorites');
  assert.equal(page.get('#search').value, '中文');
  assert.equal(page.get('#language').value, 'zh');
  assert.deepEqual(page.shown(), ['cn', 'tw']);
});

test('Chinese language filter intersects category and favorites, including Traditional Chinese', () => {
  const page = app({raw: '["linear","tw"]'});
  page.change('#language', 'zh', 'change');
  assert.deepEqual(page.shown(), ['cn', 'tw']);
  page.category('产品设计');
  assert.deepEqual(page.shown(), ['cn']);
  page.route('#/favorites');
  page.change('#language', 'zh', 'change');
  assert.deepEqual(page.shown(), ['tw']);
});

test('storage failure and corruption show persistent warnings without blocking browsing or session saves', () => {
  const blocked = app({hash: '#/favorites', unavailable: true});
  assert.match(blocked.get('#storage-notice').textContent, /本地存储不可用/);
  blocked.save('linear');
  assert.deepEqual(blocked.shown(), ['linear']);
  blocked.route('#/');
  assert.equal(blocked.shown().length, 3);
  const corrupt = app({raw: 'broken'});
  assert.match(corrupt.get('#storage-notice').textContent, /无法读取原有收藏数据/);
  assert.equal(corrupt.raw(), 'broken');
  corrupt.save('cn');
  assert.equal(corrupt.get('#storage-notice').hidden, true);
  assert.equal(corrupt.raw(), '["cn"]');
});

test('storage updates from another tab refresh the visible collection and count', () => {
  const page = app({hash: '#/favorites', raw: '["linear"]'});
  page.external('["cn","tw"]');
  assert.deepEqual(page.shown(), ['cn', 'tw']);
  assert.equal(page.get('#saved-count').textContent, 2);
  page.external(null);
  assert.equal(page.get('#empty-title').textContent, '还没有收藏');
});

test('navigation is hash-based and language, status, and local-only notices are accessible', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="nav-saved" href="#\/favorites"/);
  assert.match(html, /class="back-link" href="#\/"/);
  assert.match(html, /id="language" aria-label="网站语言"/);
  assert.match(html, /id="storage-notice"[^>]+role="status"/);
  assert.match(html, /仅保存在当前浏览器，无需登录，不会上传服务器/);
  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|sendBeacon)\s*\(/);
});
