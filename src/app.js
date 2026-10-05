import {cases, filterCases} from './data.js';
import {screenshotById} from './screenshots.js';
import {createFavoritesStore, FAVORITES_STORAGE_KEY, filterByLanguage, routeFromHash} from './library-state.js';

const $ = selector => document.querySelector(selector);
const PAGE_SIZE = 12;
const caseById = new Map(cases.map(c => [c.id, c]));
const galleryCases = cases.filter(c => Boolean(screenshotById[c.id]?.src));
const favoritesStore = createFavoritesStore();
let {ids: saved, status: storageStatus} = favoritesStore.current();
let route = routeFromHash(location.hash);
const defaultState = () => ({category: '全部', query: '', language: 'all', sort: 'curated', limit: PAGE_SIZE});
// Each page keeps its filters when navigating Back / Forward.
const pageStates = {gallery: defaultState(), favorites: defaultState()};
let state = pageStates[route];
let toastTimer;
let detailOpener;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const availableCategories = [...new Set(cases.map(c => c.category))];
const categories = ['全部', ...availableCategories];
$('#categories').innerHTML = categories.map(category => `<button class="filter" data-category="${escape(category)}" aria-pressed="false">${escape(category)}</button>`).join('');

function placeholder() {
  return '<div class="capture-placeholder"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="5" width="26" height="22" rx="4"/><path d="M3 12h26M8 9h1m3 0h1"/></svg><span>截图待补充</span></div>';
}
function screenshot(c, detail = false) {
  const capture = screenshotById[c.id];
  if (!capture?.src) return placeholder();
  return `<img class="screenshot" src="${escape(capture.src)}" alt="${escape(c.name)} 真实网站截图" loading="${detail ? 'eager' : 'lazy'}" decoding="async" width="1280" height="800" data-capture="${c.id}">`;
}
function notify(text) {
  $('#toast').textContent = text;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2200);
}
function syncSaves() {
  document.querySelectorAll('[data-save]').forEach(button => {
    const active = saved.includes(button.dataset.save);
    button.setAttribute('aria-pressed', String(active));
    const label = `${active ? '取消收藏' : '收藏'} ${caseById.get(button.dataset.save).name}`;
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.textContent = button.classList.contains('save-button') ? (active ? '♥' : '♡') : (active ? '♥ 已收藏' : '♡ 收藏作品');
  });
  $('#saved-count').textContent = saved.filter(id => caseById.has(id)).length;
}

function syncStorageNotice() {
  const messages = [];
  if (storageStatus === 'unavailable') messages.push('浏览器本地存储不可用。你仍可收藏，但本次更改仅在当前页面有效，刷新后可能丢失。');
  if (storageStatus === 'corrupt') messages.push('无法读取原有收藏数据。网站仍可浏览；再次收藏将重新建立本地收藏记录。');
  const missing = saved.filter(id => !caseById.has(id)).length;
  if (route === 'favorites' && missing) messages.push(`${missing} 项收藏暂时无法显示，原记录仍保留在本地。`);
  $('#storage-notice').textContent = messages.join(' ');
  $('#storage-notice').hidden = messages.length === 0;
}

function card(c) {
  const domain = new URL(c.url).hostname.replace(/^www\./, '');
  return `<article class="card"><a class="screenshot-link" href="${c.url}" target="_blank" rel="noopener noreferrer" aria-label="访问 ${escape(c.name)} ${c.isConcept ? "案例" : "官网"}（新窗口）">${screenshot(c)}<span class="visit-hint">${c.isConcept ? "查看案例" : "访问网站"} ↗</span></a><div class="card-meta"><div class="card-name"><h2><a href="${c.url}" target="_blank" rel="noopener noreferrer">${escape(c.name)}</a></h2><div class="card-domain">${escape(domain)}</div></div><div class="card-actions"><button data-detail="${c.id}" aria-label="查看 ${escape(c.name)} 的设计笔记">ⓘ</button><button class="save-button" data-save="${c.id}"></button></div></div></article>`;
}
function render() {
  const isFavorites = route === 'favorites';
  const filtered = isFavorites
    ? filterCases(cases, {...state, savedOnly: true, saved})
    : filterCases(galleryCases, state);
  const visible = filterByLanguage(filtered, state.language);
  const shown = visible.slice(0, state.limit);
  const knownSaved = saved.filter(id => caseById.has(id)).length;
  $('#cards').innerHTML = shown.map(card).join('');
  $('#favorites-heading').hidden = !isFavorites;
  $('#gallery-title').hidden = isFavorites;
  $('#gallery').setAttribute('aria-label', isFavorites ? '我的收藏' : '网站图库');
  $('#search').placeholder = isFavorites ? '搜索收藏' : '搜索网站';
  $('#search').setAttribute('aria-label', isFavorites ? '搜索收藏的网站、类别或风格' : '搜索网站、类别或风格');
  $('#empty').hidden = visible.length > 0;
  const collectionEmpty = isFavorites && !knownSaved;
  $('#empty-title').textContent = collectionEmpty ? '还没有收藏' : isFavorites ? '没有找到匹配的收藏' : '没有找到匹配的网站';
  $('#empty-text').textContent = collectionEmpty ? '在图库点击 ♡，把喜欢的网站收进这里。' : !isFavorites && !galleryCases.length ? '网站截图正在准备中，请稍后再来。' : '试试其他关键词，或清除筛选条件。';
  $('#reset').hidden = collectionEmpty;
  $('#reset').textContent = isFavorites ? '查看全部收藏' : '清除筛选';
  $('#empty-browse').hidden = !collectionEmpty;
  $('#result-count').textContent = isFavorites ? `${visible.length} 个收藏` : `${visible.length} 个网站`;
  $('#collection-count').textContent = `${knownSaved} 个网站`;
  $('#saved-filter').hidden = isFavorites;
  if (isFavorites) $('#nav-saved').setAttribute('aria-current', 'page');
  else $('#nav-saved').removeAttribute('aria-current');
  $('#load-more').hidden = shown.length >= visible.length;
  $('#load-more').textContent = `加载更多 · ${visible.length - shown.length}`;
  $('#page-progress').textContent = visible.length ? `${shown.length} / ${visible.length}` : '';
  $('.load-more-wrap').hidden = !visible.length;
  document.querySelectorAll('[data-category]').forEach(button => {
    const active = button.dataset.category === state.category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.title = isFavorites ? '我的收藏 — 拾形' : '拾形 — 网站设计灵感';
  syncSaves();
  syncStorageNotice();
}
function refresh() { state.limit = PAGE_SIZE; render(); }
function applySnapshot(snapshot) {
  saved = snapshot.ids;
  storageStatus = snapshot.status;
}
function toggleSave(id) {
  const activeCard = document.activeElement?.closest('.card');
  const cardIndex = activeCard ? [...$('#cards').children].indexOf(activeCard) : -1;
  applySnapshot(favoritesStore.toggle(id));
  if (route === 'favorites') {
    render();
    // A removed card must not strand keyboard focus on the document body.
    if (cardIndex >= 0) {
      const cards = [...$('#cards').children];
      const nextCard = cards[Math.min(cardIndex, cards.length - 1)];
      (nextCard?.querySelector('[data-save]') || ($('#reset').hidden ? $('#empty-browse') : $('#reset'))).focus({preventScroll: true});
    }
  } else {
    syncSaves();
    syncStorageNotice();
  }
  notify(storageStatus === 'ready' ? (saved.includes(id) ? '已收进你的灵感收藏' : '已取消收藏') : '浏览器无法保存数据；收藏仅在本次页面有效');
}
function updateRoute() {
  const nextRoute = routeFromHash(location.hash);
  if (nextRoute === route) return;
  document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  route = nextRoute;
  state = pageStates[route];
  $('#search').value = state.query;
  $('#sort').value = state.sort;
  $('#language').value = state.language;
  render();
  window.scrollTo({top: 0, behavior: 'instant'});
  (route === 'favorites' ? $('#favorites-title') : $('#gallery')).focus({preventScroll: true});
}

function showDetail(id) {
  const c = caseById.get(id);
  if (!c) return;
  detailOpener = document.activeElement;
  $('#detail-content').innerHTML = `<div class="detail-image">${screenshot(c, true)}</div><div class="detail-body"><p class="detail-category">${escape(c.category)}${c.isConcept ? " · 概念案例" : ""}</p><h2 id="detail-title">${escape(c.name)}</h2><p>${escape(c.note)}</p><p class="lesson">${escape(c.lesson)}</p><div class="tags">${c.tags.map(t => `<span class="tag">${escape(t)}</span>`).join('')}</div><div class="detail-actions"><a href="${c.url}" target="_blank" rel="noopener noreferrer">${c.isConcept ? "查看原始案例" : "访问原站"} ↗</a><button data-save="${c.id}"></button></div><p class="source-caption">来源：${escape(new URL(c.url).hostname)} · 收录核验 2026.10.04<br>${screenshotById[c.id]?.src ? `真实网站截图${screenshotById[c.id].retrievedAt ? ` · 获取日期 ${escape(screenshotById[c.id].retrievedAt)}` : ""}` : "截图待补充"}。截图可能为缓存版本。笔记为编辑学习建议。${c.sourceName ? `<br>收录来源：<a href="${escape(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(c.sourceName)}</a>。${c.isConcept ? "该作品是原站展示的概念案例，不代表同名真实商业产品。" : ""}` : ""}${c.model ? `<br>模型信息来自原站标注，未独立核验：${escape(c.model)}。` : ""}</p></div>`;
  syncSaves();
  $('#detail').showModal();
}
$('#cards').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button?.dataset.detail) showDetail(button.dataset.detail);
  if (button?.dataset.save) toggleSave(button.dataset.save);
});
$('#detail').addEventListener('click', event => {
  const button = event.target.closest('[data-save]');
  if (button) toggleSave(button.dataset.save);
});
$('#categories').addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (button) { state.category = button.dataset.category; refresh(); }
});
$('#search').addEventListener('input', event => { state.query = event.target.value; refresh(); });
$('#sort').addEventListener('change', event => { state.sort = event.target.value; refresh(); });
$('#language').addEventListener('change', event => { state.language = event.target.value; refresh(); });
$('#load-more').addEventListener('click', () => {
  const previous = state.limit;
  state.limit += PAGE_SIZE;
  render();
  document.querySelectorAll('#cards [data-detail]')[previous]?.focus({preventScroll: true});
});
$('#reset').addEventListener('click', () => {
  Object.assign(state, defaultState());
  $('#search').value = '';
  $('#sort').value = 'curated';
  $('#language').value = 'all';
  refresh();
  $('.filter').focus();
});
window.addEventListener('hashchange', updateRoute);
window.addEventListener('storage', event => {
  if (event.key !== FAVORITES_STORAGE_KEY && event.key !== null) return;
  // Ignore other storage areas (for example sessionStorage).
  try { if (event.storageArea !== localStorage) return; } catch { return; }
  applySnapshot(favoritesStore.read());
  render();
});
$('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  $('#gallery').focus();
  $('#gallery').scrollIntoView();
});
$('#about-button').addEventListener('click', () => $('#about').showModal());
$('#back-top').addEventListener('click', () => window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
document.addEventListener('error', event => {
  if (event.target instanceof HTMLImageElement && event.target.matches('[data-capture]')) event.target.outerHTML = placeholder();
}, true);
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (dialog.id === 'detail' && detailOpener?.isConnected) detailOpener.focus({preventScroll: true});
    else if (!document.activeElement || document.activeElement === document.body) $('#nav-saved').focus({preventScroll: true});
  });
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    event.preventDefault(); $('#search').focus();
  }
});
render();
