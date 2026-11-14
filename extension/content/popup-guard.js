// Защита от всплывающих окон (pop-up / pop-under). Работает в контексте страницы.
(() => {
  'use strict';
  // Если Safari не поддерживает world: "MAIN", скрипт попадёт в изолированный мир расширения.
  // Там он бесполезен: выходим, и cosmetic.js/youtube.js подключат его в страницу сами.
  const ext = globalThis.browser || globalThis.chrome;
  if (ext && ext.runtime && ext.runtime.id) return;
  const root = document.documentElement;
  if (!root || root.hasAttribute('data-sab-guard')) return;
  root.setAttribute('data-sab-guard', '');

  const off = () => document.documentElement.hasAttribute('data-sab-off');
  const nativeOpen = window.open;
  let lastClick = null;

  // Запоминаем, по чему кликнул пользователь.
  window.addEventListener('pointerdown', (e) => { lastClick = { target: e.target, t: Date.now() }; }, true);

  const isRealControl = (el) => {
    if (!(el instanceof Element)) return false;
    return !!el.closest('a[href], button, input, select, label, [role="button"], [role="link"], [role="menuitem"], [onclick]');
  };

  // Прозрачный слой поверх видео или всей страницы — типичная ловушка для pop-under.
  const isOverlay = (el) => {
    if (!(el instanceof Element)) return false;
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if ((cs.position === 'fixed' || cs.position === 'absolute') &&
          parseFloat(cs.opacity) < 0.1 &&
          node.offsetWidth * node.offsetHeight > window.innerWidth * window.innerHeight * 0.25) {
        return true;
      }
    }
    return false;
  };

  const sameSite = (url) => {
    try {
      const u = new URL(url, location.href);
      const a = u.hostname.split('.').slice(-2).join('.');
      const b = location.hostname.split('.').slice(-2).join('.');
      return u.protocol === 'about:' || a === b;
    } catch (e) { return true; }
  };

  const fakeWindow = () => {
    const w = { closed: true, close() {}, focus() {}, blur() {}, postMessage() {},
                document: { write() {}, close() {}, open() {} },
                location: { href: '', replace() {}, assign() {} } };
    return w;
  };

  const guardedOpen = function (url, ...rest) {
    if (off()) return nativeOpen.call(this, url, ...rest);
    const recent = lastClick && Date.now() - lastClick.t < 1500;
    const target = recent ? lastClick.target : null;
    const suspicious =
      !sameSite(url || '') &&
      (!recent ||                         // открытие окна без клика пользователя
       isOverlay(target) ||               // клик по невидимому слою
       (target && target.closest && target.closest('video')) || // клик по самому видео
       !isRealControl(target));           // клик не по ссылке/кнопке
    if (suspicious) {
      console.info('[Блокировщик рекламы] Заблокировано всплывающее окно:', url);
      return fakeWindow();
    }
    return nativeOpen.call(this, url, ...rest);
  };
  try {
    Object.defineProperty(window, 'open', { value: guardedOpen, writable: true, configurable: true });
  } catch (e) { window.open = guardedOpen; }

  // Pop-under через клик по невидимой ссылке target=_blank поверх страницы
  document.addEventListener('click', (e) => {
    if (off() || !e.isTrusted) return;
    const a = e.target instanceof Element && e.target.closest('a[target="_blank"]');
    if (a && a.href && !sameSite(a.href) && isOverlay(a)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      a.remove();
      console.info('[Блокировщик рекламы] Убран невидимый рекламный слой:', a.href);
    }
  }, true);
})();
