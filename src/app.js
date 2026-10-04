import {cases, filterCases} from './data.js';
import {screenshotById} from './screenshots.js';
const $ = selector => document.querySelector(selector);
const STORAGE = 'shapefolio.favorites.v1';
const PAGE_SIZE = 12;
const caseById = new Map(cases.map(c => [c.id, c]));
const galleryCases = cases.filter(c => Boolean(screenshotById[c.id]?.src));
let saved = [];
try {
  const value = JSON.parse(localStorage.getItem(STORAGE) || '[]');
  if (Array.isArray(value)) saved = [...new Set(value.filter(id => caseById.has(id)))];
} catch { /* A blocked or corrupted store must not prevent browsing. */ }
const state = {category: '全部', query: '', savedOnly: false, sort: 'curated', limit: PAGE_SIZE};
let toastTimer;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const availableCategories = [...new Set(galleryCases.map(c => c.category))];
const categories = ['全部', ...availableCategories.filter(c => c === 'Oil UI'), ...availableCategories.filter(c => c !== 'Oil UI')];
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
    button.setAttribute('aria-label', `${active ? '取消收藏' : '收藏'} ${caseById.get(button.dataset.save).name}`);
    button.textContent = button.classList.contains('save-button') ? (active ? '♥' : '♡') : (active ? '♥ 已收藏' : '♡ 收藏作品');
  });
  $('#saved-count').textContent = saved.length;
}
function card(c) {
  const domain = new URL(c.url).hostname.replace(/^www\./, '');
  return `<article class="card"><a class="screenshot-link" href="${c.url}" target="_blank" rel="noopener noreferrer" aria-label="访问 ${escape(c.name)} ${c.isConcept ? "案例" : "官网"}（新窗口）">${screenshot(c)}<span class="visit-hint">${c.isConcept ? "查看案例" : "访问网站"} ↗</span></a><div class="card-meta"><div class="card-name"><h2><a href="${c.url}" target="_blank" rel="noopener noreferrer">${escape(c.name)}</a></h2><div class="card-domain">${escape(domain)}</div></div><div class="card-actions"><button data-detail="${c.id}" aria-label="查看 ${escape(c.name)} 的设计笔记">ⓘ</button><button class="save-button" data-save="${c.id}"></button></div></div></article>`;
}
function render() {
  const visible = filterCases(galleryCases, {...state, saved});
  const shown = visible.slice(0, state.limit);
  $('#cards').innerHTML = shown.map(card).join('');
  $('#empty').hidden = visible.length > 0;
  $('#empty-text').textContent = !galleryCases.length ? '网站截图正在准备中，请稍后再来。' : state.savedOnly && !saved.length ? '收藏喜欢的作品，它们就会留在这里。' : '换一个关键词，或看看全部作品。';
  $('#result-count').textContent = `${visible.length} 个网站`;
  $('#saved-filter').setAttribute('aria-pressed', String(state.savedOnly));
  $('#nav-saved').setAttribute('aria-pressed', String(state.savedOnly));
  $('#load-more').hidden = shown.length >= visible.length;
  $('#load-more').textContent = `加载更多 · ${visible.length - shown.length}`;
  $('#page-progress').textContent = visible.length ? `${shown.length} / ${visible.length}` : '';
  document.querySelectorAll('[data-category]').forEach(button => {
    const active = button.dataset.category === state.category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  syncSaves();
}
function refresh() { state.limit = PAGE_SIZE; render(); }
function toggleSave(id) {
  saved = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
  let persisted = true;
  try { localStorage.setItem(STORAGE, JSON.stringify(saved)); } catch { persisted = false; }
  if (state.savedOnly) {
    const wasCard = document.activeElement?.closest('.card');
    render();
    if (wasCard) ($('#cards button') || $('#reset')).focus();
  } else syncSaves();
  notify(persisted ? (saved.includes(id) ? '已收进你的灵感收藏' : '已取消收藏') : '浏览器无法保存数据；收藏仅在本次页面有效');
}
function showDetail(id) {
  const c = caseById.get(id);
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
$('#saved-filter').addEventListener('click', () => { state.savedOnly = !state.savedOnly; refresh(); });
$('#load-more').addEventListener('click', () => {
  const previous = state.limit;
  state.limit += PAGE_SIZE;
  render();
  document.querySelectorAll('[data-detail]')[previous]?.focus({preventScroll: true});
});
$('#nav-saved').addEventListener('click', () => {
  Object.assign(state, {savedOnly: !state.savedOnly, category: '全部', query: ''});
  $('#search').value = '';
  refresh();
  $('#gallery').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
});
$('#reset').addEventListener('click', () => {
  Object.assign(state, {category: '全部', query: '', savedOnly: false, sort: 'curated'});
  $('#search').value = '';
  $('#sort').value = 'curated';
  refresh();
  $('.filter').focus();
});
$('#about-button').addEventListener('click', () => $('#about').showModal());
$('#back-top').addEventListener('click', () => window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
document.addEventListener('error', event => {
  if (event.target instanceof HTMLImageElement && event.target.matches('[data-capture]')) {
    event.target.outerHTML = placeholder();
  }
}, true);
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!document.activeElement || document.activeElement === document.body) $('#saved-filter').focus({preventScroll: true});
  });
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    event.preventDefault(); $('#search').focus();
  }
});
render();
