// Реклама внутри видеоплееров. Почти все плееры получают рекламу в формате VAST/VMAP
// (XML-описание рекламного ролика). Скрипт подменяет такие ответы на «рекламы нет»,
// с какого бы сервера они ни пришли, и плеер сразу запускает основное видео.
// Работает в контексте страницы во всех фреймах, включая чужие плееры.
(() => {
  'use strict';
  const ext = globalThis.browser || globalThis.chrome;
  if (ext && ext.runtime && ext.runtime.id) return;
  const root = document.documentElement;
  if (!root || root.hasAttribute('data-sab-vast')) return;
  root.setAttribute('data-sab-vast', '');

  const off = () => document.documentElement && document.documentElement.hasAttribute('data-sab-off');
  const EMPTY_VAST = '<?xml version="1.0" encoding="UTF-8"?><VAST version="3.0"></VAST>';
  const EMPTY_VMAP = '<?xml version="1.0" encoding="UTF-8"?><vmap:VMAP xmlns:vmap="http://www.iab.net/videosuite/vmap" version="1.0"></vmap:VMAP>';

  const isAdXml = (text) => {
    if (typeof text !== 'string' || text.length < 20) return null;
    const head = text.slice(0, 2000);
    if (/<VAST[\s>]/i.test(head) && /<Ad[\s>]/i.test(text)) return EMPTY_VAST;
    if (/<vmap:VMAP[\s>]/i.test(head) && /<vmap:AdBreak[\s>]/i.test(text)) return EMPTY_VMAP;
    return null;
  };
  const log = (url) => console.info('[Блокировщик рекламы] Убрана реклама в плеере:', String(url).slice(0, 120));

  // --- XMLHttpRequest ---
  const XHR = XMLHttpRequest.prototype;
  const desc = (name) => Object.getOwnPropertyDescriptor(XHR, name);
  const dText = desc('responseText');
  const dResp = desc('response');
  const dXml = desc('responseXML');
  const nativeOpen = XHR.open;
  XHR.open = function (method, url, ...rest) {
    this.__sabUrl = url;
    return nativeOpen.call(this, method, url, ...rest);
  };
  const filtered = (xhr) => {
    if (off() || xhr.readyState !== 4) return null;
    if (xhr.__sabRepl !== undefined) return xhr.__sabRepl;
    let text = null;
    try {
      const type = xhr.responseType;
      if (type === '' || type === 'text') text = dText.get.call(xhr);
      else if (type === 'document') {
        const doc = dResp.get.call(xhr);
        text = doc && doc.documentElement ? doc.documentElement.outerHTML : null;
      }
    } catch (e) { /* ответ недоступен */ }
    const repl = isAdXml(text);
    xhr.__sabRepl = repl;
    if (repl) log(xhr.__sabUrl);
    return repl;
  };
  const parse = (xml) => new DOMParser().parseFromString(xml, 'text/xml');
  Object.defineProperty(XHR, 'responseText', {
    configurable: true, enumerable: true,
    get() { const r = filtered(this); return r !== null ? r : dText.get.call(this); },
  });
  Object.defineProperty(XHR, 'response', {
    configurable: true, enumerable: true,
    get() {
      const r = filtered(this);
      if (r === null) return dResp.get.call(this);
      return this.responseType === 'document' ? parse(r) : r;
    },
  });
  if (dXml) {
    Object.defineProperty(XHR, 'responseXML', {
      configurable: true, enumerable: true,
      get() { const r = filtered(this); return r !== null ? parse(r) : dXml.get.call(this); },
    });
  }

  // --- fetch ---
  const nativeFetch = window.fetch;
  if (nativeFetch) {
    window.fetch = function (...args) {
      return nativeFetch.apply(this, args).then((res) => {
        if (off()) return res;
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        const url = res.url || '';
        if (!ct.includes('xml') && !/vast|vmap|vpaid|adserv|\/ads?\//i.test(url) && !ct.includes('text/plain')) return res;
        return res.clone().text().then((text) => {
          const repl = isAdXml(text);
          if (!repl) return res;
          log(url);
          return new Response(repl, { status: 200, statusText: 'OK', headers: { 'content-type': 'text/xml' } });
        }).catch(() => res);
      });
    };
  }
})();
