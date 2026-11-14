// Убирает окна «Отключите блокировщик рекламы» и возвращает прокрутку страницы.
(() => {
  'use strict';
  const off = () => document.documentElement.hasAttribute('data-sab-off');

  const TEXT = /(блокировщик\S*\s+рекламы|блокировк\S*\s+рекламы|блокировщик|adblock|ad[\s-]?blocker|ad\s+block|ads?\s+blocking|отключите\s+(ваш\s+|свой\s+)?(блок|adblock)|whitelist|белый\s+список)/i;
  const CANDIDATES = 'body > *, [role="dialog"], [aria-modal="true"], dialog, [class*="modal"], [id*="modal"],' +
    '[class*="overlay"], [id*="overlay"], [class*="popup"], [id*="popup"], [class*="adblock"], [id*="adblock"]';

  const isCover = (el, cs) => {
    if (cs.position !== 'fixed' && cs.position !== 'absolute' && cs.position !== 'sticky') return false;
    const r = el.getBoundingClientRect();
    return r.width > 150 && r.height > 80 && cs.display !== 'none' && cs.visibility !== 'hidden';
  };

  const isBackdrop = (el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed') return false;
    const r = el.getBoundingClientRect();
    return r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9 && !el.textContent.trim();
  };

  let removed = false;
  const unlockScroll = () => {
    for (const el of [document.documentElement, document.body]) {
      if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.overflow === 'hidden' || cs.overflowY === 'hidden') {
        el.style.setProperty('overflow', 'auto', 'important');
        el.style.setProperty('overflow-y', 'auto', 'important');
      }
      if (el === document.body && cs.position === 'fixed') el.style.setProperty('position', 'static', 'important');
    }
    // Размытие контента под окном
    document.querySelectorAll('body > *').forEach((el) => {
      if (getComputedStyle(el).filter.includes('blur')) el.style.setProperty('filter', 'none', 'important');
    });
  };

  const scan = () => {
    if (off() || !document.body) return;
    for (const el of document.querySelectorAll(CANDIDATES)) {
      if (!el.isConnected || el.id === 'sab-cosmetic') continue;
      const text = el.textContent || '';
      if (text.length > 3000 || !TEXT.test(text)) continue;
      const cs = getComputedStyle(el);
      if (!isCover(el, cs)) continue;
      if (parseInt(cs.zIndex, 10) < 10 && cs.position !== 'fixed') continue;
      el.remove();
      removed = true;
      console.info('[Блокировщик рекламы] Убрано окно «отключите блокировщик»');
    }
    if (removed) {
      document.querySelectorAll('body > div, body > section').forEach((el) => { if (isBackdrop(el)) el.remove(); });
      unlockScroll();
      // Сайт может заблокировать прокрутку повторно — проверяем ещё пару раз
      setTimeout(unlockScroll, 500);
      setTimeout(unlockScroll, 1500);
      removed = false;
    }
  };

  let timer = null;
  const schedule = () => { if (!timer) timer = setTimeout(() => { timer = null; scan(); }, 300); };
  const start = () => {
    scan();
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    // Многие сайты показывают окно через несколько секунд после загрузки
    [1000, 3000, 6000, 10000].forEach((t) => setTimeout(scan, t));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
