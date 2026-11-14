// YouTube: вырезает рекламные вставки из ответов плеера до того, как плеер их увидит.
// Работает в контексте страницы (world: MAIN).
(() => {
  'use strict';
  // Если Safari не поддерживает world: "MAIN", скрипт попадёт в изолированный мир расширения.
  // Там он бесполезен: выходим, и cosmetic.js/youtube.js подключат его в страницу сами.
  const ext = globalThis.browser || globalThis.chrome;
  if (ext && ext.runtime && ext.runtime.id) return;
  const root = document.documentElement;
  if (!root || root.hasAttribute('data-sab-main')) return;
  root.setAttribute('data-sab-main', '');

  const off = () => document.documentElement.hasAttribute('data-sab-off');
  const AD_KEYS = ['adPlacements', 'adSlots', 'playerAds', 'adBreakHeartbeatParams'];

  const pruneOne = (o) => {
    if (!o || typeof o !== 'object') return false;
    let changed = false;
    for (const k of AD_KEYS) {
      if (k in o) { delete o[k]; changed = true; }
    }
    return changed;
  };

  const prune = (data) => {
    if (off() || !data || typeof data !== 'object') return data;
    try {
      pruneOne(data);
      if (data.playerResponse) pruneOne(data.playerResponse);
      if (Array.isArray(data)) data.forEach((d) => d && pruneOne(d.playerResponse));
      // Рекламные карточки в ленте и поиске
      const isAd = (it) => it && (it.adSlotRenderer ||
        (it.richItemRenderer && it.richItemRenderer.content && it.richItemRenderer.content.adSlotRenderer));
      const strip = (arr) => {
        if (!Array.isArray(arr)) return;
        for (let i = arr.length - 1; i >= 0; i--) if (isAd(arr[i])) arr.splice(i, 1);
      };
      const contents = data.contents && data.contents.twoColumnBrowseResultsRenderer;
      if (contents && contents.tabs) {
        contents.tabs.forEach((t) => {
          const c = t.tabRenderer && t.tabRenderer.content && t.tabRenderer.content.richGridRenderer;
          if (c) strip(c.contents);
        });
      }
    } catch (e) { /* структура ответа поменялась — ничего страшного */ }
    return data;
  };

  // 1. JSON.parse — через него проходят почти все ответы YouTube
  const nativeParse = JSON.parse;
  JSON.parse = function (...args) {
    return prune(nativeParse.apply(this, args));
  };

  // 2. fetch(...).json()
  const nativeJson = Response.prototype.json;
  Response.prototype.json = function (...args) {
    return nativeJson.apply(this, args).then(prune);
  };

  // 3. Данные, встроенные прямо в HTML страницы
  for (const name of ['ytInitialPlayerResponse', 'ytInitialData']) {
    let value = window[name];
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        get: () => value,
        set: (v) => { value = prune(v); },
      });
      if (value) value = prune(value);
    } catch (e) { /* свойство уже заблокировано страницей */ }
  }
})();
