// Косметическая фильтрация: прячет рекламные блоки на всех сайтах.
(() => {
  'use strict';
  const api = globalThis.browser || globalThis.chrome;

  // 1) Узнаваемые рекламные блоки — прячем всегда.
  const SPECIFIC = [
    // Google AdSense / Ad Manager
    '[id^="google_ads_iframe"]', '[id^="google_ads_frame"]',
    '[id^="div-gpt-ad"]', '[data-google-query-id]', '.GoogleActiveViewElement',
    'iframe[src*="doubleclick.net"]', 'iframe[src*="googlesyndication.com"]',
    'iframe[id^="aswift_"]', 'amp-ad', 'amp-embed[type="taboola"]',
    // Яндекс Директ / РСЯ / AdFox
    '[id^="yandex_rtb"]', '[id^="yandex_ad"]', '[id^="adfox_"]', '[class^="adfox"]',
    '.ya-partner', '[data-ya-partner]', 'yatag', '[id^="adriver_"]', '[id^="begun_"]',
    // Нативная реклама и «рекомендации»
    '[id^="taboola-"]', '.trc_rbox_container', '.trc_related_container',
    '.OUTBRAIN', '[data-widget-id][data-src*="outbrain"]', '.ob-widget',
    '[id^="mgid_"]', '[id^="MarketGid"]', '[class*="mgbox"]', '[id^="lentainform"]',
    '.smi2-widget', '[id^="unit_"][id*="smi2"]', '.relap-default-container',
    '.relap-default-wrapper', '[id^="relap"]', '.r24smi', '[id^="adskeeper"]',
  ];

  // 2) Общие названия рекламных контейнеров. Сайты используют такие же классы
  //    для «приманок»: пустого блока, по которому проверяют наличие блокировщика.
  //    Поэтому блок с содержимым (картинка, iframe, видео) убираем полностью,
  //    а пустой только делаем невидимым — его размер не меняется, и проверка проходит.
  const GENERIC = [
    'ins.adsbygoogle',
    '.adsbox', '.ad-banner', '.ad_banner', '.adBanner', '.banner-ad', '.banner_ad',
    '.ad-container', '.ad_container', '.adContainer', '.ad-wrapper', '.ad_wrapper',
    '.ad-slot', '.ad_slot', '.adSlot', '.ad-unit', '.ad_unit', '.adunit',
    '.advertisement', '.advertising', '.sponsored-ad', '.dfp-ad', '.gpt-ad',
    '.top-ad', '.sidebar-ad', '.sticky-ad', '.ad-sticky', '.adv-banner',
    '[id^="ad-slot"]', '[id^="ad_slot"]', '[id^="ad-container"]', '[id^="adContainer"]',
    '[aria-label="Advertisement"]', '[aria-label="Реклама"]',
    '[data-ad-slot]', '[data-ad-unit]', '[data-adunit]', '[data-ad-name]',
    '[data-testid="ad"]', '[data-testid="ad-banner"]',
  ];
  const FILLED = ':has(iframe, img, video, embed, object, canvas, a[href] > *)';

  // 3) Плашки «Отключите блокировщик рекламы»
  const ANTI_ADBLOCK = [
    '.fc-ab-root', '.fc-ab-dialog', '#blockadblock', '.blockadblock', '#adblock-notice',
    '.adblock-notice', '.adblock-modal', '#adblock-modal', '.adblock-overlay', '#adblock-overlay',
    '.adblock-detected', '#adblock-detected', '.adblocker-message', '.adblock-wall', '#adb-overlay',
    '.adblock-popup', '#adblock-popup', '[class*="AdBlockWall"]', '[class*="adblockWall"]',
  ];

  const css = `${SPECIFIC.join(',\n')},
${ANTI_ADBLOCK.join(',\n')},
:is(${GENERIC.join(', ')})${FILLED} {
  display: none !important;
}
:is(${GENERIC.join(', ')}) {
  visibility: hidden !important;
  pointer-events: none !important;
}`;

  const style = document.createElement('style');
  style.id = 'sab-cosmetic';
  style.textContent = css;

  const attach = () => {
    const root = document.head || document.documentElement;
    if (root && !style.isConnected) root.appendChild(style);
  };
  attach();
  // Некоторые сайты переписывают <head> — возвращаем стиль на место.
  document.addEventListener('DOMContentLoaded', attach, { once: true });

  // Сайт в списке исключений? Тогда снимаем фильтры.
  const host = location.hostname;
  const isDisabled = (list) =>
    Array.isArray(list) && list.some((d) => host === d || host.endsWith('.' + d));

  const apply = (list) => {
    const off = isDisabled(list);
    // Сигнал для скриптов в контексте страницы (popup-guard, youtube-main)
    document.documentElement.toggleAttribute('data-sab-off', off);
    if (off) style.remove(); else attach();
  };

  try {
    if (globalThis.browser) {
      browser.storage.local.get('disabledSites').then((r) => apply(r.disabledSites));
    } else {
      chrome.storage.local.get('disabledSites', (r) => apply(r.disabledSites));
    }
    api.storage.onChanged.addListener((changes) => {
      if (changes.disabledSites) apply(changes.disabledSites.newValue);
    });
  } catch (e) { /* storage недоступен — фильтры остаются включёнными */ }

  // Резервный запуск скриптов в контексте страницы, если Safari не поддерживает world: "MAIN"
  const injectMain = (file, flag) => {
    if (document.documentElement.hasAttribute(flag)) return;
    const s = document.createElement('script');
    s.charset = 'utf-8';
    s.src = api.runtime.getURL(file);
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  };
  queueMicrotask(() => injectMain('content/popup-guard.js', 'data-sab-guard'));
})();
