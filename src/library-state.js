// Keep the original key so existing collections survive site updates.
export const FAVORITES_STORAGE_KEY = 'shapefolio.favorites.v1';

export function parseFavorites(raw) {
  if (raw === null) return {ids: [], status: 'ready'};
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || !id.trim())) {
      return {ids: [], status: 'corrupt'};
    }
    // Unknown IDs may return in a later collection update. Do not discard them.
    return {ids: [...new Set(value)], status: 'ready'};
  } catch {
    return {ids: [], status: 'corrupt'};
  }
}

export function createFavoritesStore(getStorage = () => globalThis.localStorage) {
  let snapshot = {ids: [], status: 'ready'};
  function read() {
    try {
      snapshot = parseFavorites(getStorage().getItem(FAVORITES_STORAGE_KEY));
    } catch {
      snapshot = {...snapshot, status: 'unavailable'};
    }
    return current();
  }
  function current() { return {...snapshot, ids: [...snapshot.ids]}; }
  function toggle(id) {
    if (typeof id !== 'string' || !id.trim()) return current();
    const ids = snapshot.ids.includes(id) ? snapshot.ids.filter(saved => saved !== id) : [...snapshot.ids, id];
    let status = 'ready';
    try { getStorage().setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids)); }
    catch { status = 'unavailable'; }
    snapshot = {ids, status};
    return current();
  }
  read();
  return {current, read, toggle};
}

export function routeFromHash(hash) {
  return /^#\/favorites\/?$/.test(hash) ? 'favorites' : 'gallery';
}

export function filterByLanguage(items, language = 'all') {
  return language === 'zh' ? items.filter(item => /^zh(?:-|$)/i.test(item.language || '')) : items;
}
