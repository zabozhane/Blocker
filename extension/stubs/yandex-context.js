// Пустышка Рекламной сети Яндекса (context.js): сайт получает «пустую рекламу».
(function () {
  'use strict';
  const run = (fn) => { try { fn(); } catch (e) {} };
  const manager = {
    render: function (opts) { if (opts && typeof opts.onError === 'function') run(() => opts.onError({ type: 'error', code: 'noAds' })); },
    renderFeed: function () {}, renderWidget: function () {}, destroy: function () {},
  };
  window.Ya = window.Ya || {};
  window.Ya.Context = window.Ya.Context || {};
  window.Ya.Context.AdvManager = manager;
  window.Ya.adfoxCode = window.Ya.adfoxCode || { create: function () {}, createAdaptive: function () {}, createScroll: function () {}, reload: function () {}, destroy: function () {} };
  const queue = window.yaContextCb || [];
  window.yaContextCb = { push: (fn) => { run(fn); return 1; } };
  queue.forEach(run);
})();
