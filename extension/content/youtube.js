// YouTube: прячет рекламные блоки и мгновенно пропускает рекламу, если она всё же запустилась.
(() => {
  'use strict';
  const api = globalThis.browser || globalThis.chrome;
  const off = () => document.documentElement.hasAttribute('data-sab-off');

  const css = `
ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-banner-promo-renderer,
ytd-statement-banner-renderer, ytd-promoted-sparkles-web-renderer,
ytd-promoted-sparkles-text-search-renderer, ytd-promoted-video-renderer,
ytd-display-ad-renderer, ytd-compact-promoted-video-renderer, ytd-action-companion-ad-renderer,
ytd-player-legacy-desktop-watch-ads-renderer, ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],
ytd-rich-item-renderer:has(> #content > ytd-ad-slot-renderer),
ytd-merch-shelf-renderer, ytd-brand-video-singleton-renderer, ytd-brand-video-shelf-renderer,
#masthead-ad, #player-ads, #panels > ytd-engagement-panel-section-list-renderer[target-id*="ads"],
.ytp-ad-overlay-container, .ytp-ad-overlay-slot, .ytp-ad-image-overlay, .ytp-ad-text-overlay,
.ytp-suggested-action-badge, .ytd-companion-slot-renderer, ad-slot-renderer,
ytm-promoted-sparkles-web-renderer, ytm-companion-ad-renderer, ytm-ad-slot-renderer,
ytd-enforcement-message-view-model, tp-yt-paper-dialog:has(ytd-enforcement-message-view-model),
tp-yt-iron-overlay-backdrop:has(~ tp-yt-paper-dialog ytd-enforcement-message-view-model)
{ display: none !important; }`;

  const style = document.createElement('style');
  style.id = 'sab-youtube';
  style.textContent = css;
  const attach = () => {
    if (off()) { style.remove(); return; }
    const r = document.head || document.documentElement;
    if (r && !style.isConnected) r.appendChild(style);
  };
  attach();
  document.addEventListener('DOMContentLoaded', attach, { once: true });

  // Резерв: если world: "MAIN" не сработал, подключаем скрипт обычным способом
  const injectMain = () => {
    if (document.documentElement.hasAttribute('data-sab-main')) return;
    const s = document.createElement('script');
    s.charset = 'utf-8';
    s.src = api.runtime.getURL('content/youtube-main.js');
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  };
  queueMicrotask(injectMain);

  // Если реклама всё-таки запустилась — заглушаем и проматываем её до конца
  const SKIP_BUTTONS = '.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-slot button, .ytp-ad-overlay-close-button';
  let mutedByUs = false;

  // Окно YouTube «Блокировщики рекламы нарушают правила»: закрываем и продолжаем видео
  const dismissEnforcement = (video) => {
    const msg = document.querySelector('ytd-enforcement-message-view-model');
    if (!msg) return;
    const dialog = msg.closest('tp-yt-paper-dialog, ytd-popup-container > *') || msg;
    const close = dialog.querySelector('#dismiss-button button, button[aria-label*="Close"], button[aria-label*="Закрыть"]');
    if (close) close.click();
    dialog.remove();
    document.querySelectorAll('tp-yt-iron-overlay-backdrop').forEach((b) => b.remove());
    document.body && document.body.style.removeProperty('overflow');
    if (video && video.paused && !video.ended) video.play().catch(() => {});
  };

  const tick = () => {
    if (off()) return;
    attach();
    const player = document.querySelector('.html5-video-player');
    if (!player) return;
    const video = player.querySelector('video');
    const adShowing = player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting');

    document.querySelectorAll(SKIP_BUTTONS).forEach((b) => b.click());
    dismissEnforcement(video);

    if (adShowing && video) {
      if (!video.muted) { video.muted = true; mutedByUs = true; }
      if (Number.isFinite(video.duration) && video.duration > 0) {
        try { video.currentTime = video.duration; } catch (e) { /* ещё не загрузилось */ }
      }
      try { video.playbackRate = 16; } catch (e) { /* не поддерживается */ }
    } else if (video && mutedByUs) {
      video.muted = false;
      mutedByUs = false;
      if (video.playbackRate > 2) video.playbackRate = 1;
    }
  };

  const start = () => {
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; tick(); });
    };
    new MutationObserver(schedule).observe(document.documentElement, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['class'],
    });
    setInterval(tick, 500);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
