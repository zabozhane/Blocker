// Пустышка AdSense (adsbygoogle.js)
(function () {
  'use strict';
  const old = window.adsbygoogle;
  const fake = { loaded: true, push: function () { return 1; } };
  try {
    Object.defineProperty(window, 'adsbygoogle', { get: () => fake, set: () => {}, configurable: true });
  } catch (e) { window.adsbygoogle = fake; }
  if (Array.isArray(old)) old.length = 0;
  // Слоты AdSense помечаем «заполненными» — их проверяют детекторы
  const mark = () => document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])')
    .forEach((el) => { el.setAttribute('data-adsbygoogle-status', 'done'); el.setAttribute('data-ad-status', 'filled'); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mark);
  else mark();
})();
