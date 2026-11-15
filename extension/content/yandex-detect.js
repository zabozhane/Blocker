// Проверка блокировщика Яндекса (Кинопоиск и другие сайты Яндекса).
// Сайт скачивает через fetch скрипт-детектор static-mon.yandex.net/static/main.js
// и запускает его. Детектор замечает, что рекламные серверы Яндекса заблокированы,
// и сайт показывает плашку «Кажется, вы используете блокировщик рекламы».
// Здесь вместо детектора сайт получает пустышку, которая сразу отвечает «блокировщика нет».
// Работает в контексте страницы.
(() => {
  'use strict';
  const ext = globalThis.browser || globalThis.chrome;
  if (ext && ext.runtime && ext.runtime.id) return;
  const root = document.documentElement;
  if (!root || root.hasAttribute('data-sab-ydetect')) return;
  root.setAttribute('data-sab-ydetect', '');

  const off = () => document.documentElement && document.documentElement.hasAttribute('data-sab-off');
  const DETECT = /^https?:\/\/static-mon\.yandex\.(net|ru)\/static\/main\.js/i;

  // Детектор проверяет, что скрипт не короче 32 000 символов и что его длина
  // совпадает с заголовком «content-lenght» (с опечаткой, как у Яндекса).
  const CODE = 'var t=(typeof exports==="object"&&exports)||this||{};' +
    't.init=function(w,d,o){try{o&&typeof o.callback==="function"&&' +
    'o.callback({blocked:false,blocker:"NOT_BLOCKED"})}catch(e){}};' +
    'try{module.exports.init=t.init}catch(e){}\n';
  const BODY = CODE + '/*' + ' '.repeat(33000) + '*/\n';

  const fakeResponse = () => new Response(BODY, {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/javascript',
      'content-lenght': String(BODY.length),
      'content-length': String(BODY.length),
    },
  });

  const urlOf = (input) => {
    try {
      if (typeof input === 'string') return input;
      if (input instanceof URL) return input.href;
      if (input && typeof input.url === 'string') return input.url;
    } catch (e) { /* не URL */ }
    return '';
  };

  const nativeFetch = window.fetch;
  if (!nativeFetch) return;
  window.fetch = function (input, init) {
    if (!off() && DETECT.test(urlOf(input))) {
      console.info('[Блокировщик рекламы] Подменена проверка блокировщика Яндекса');
      return Promise.resolve(fakeResponse());
    }
    return nativeFetch.apply(this, arguments);
  };
})();
