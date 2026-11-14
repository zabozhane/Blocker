// Пустышка детекторов FuckAdBlock / BlockAdBlock / SniffAdBlock: всегда «блокировщика нет».
(function () {
  'use strict';
  const Detector = function () {};
  Detector.prototype = {
    check() { this._notDetected(); return true; },
    clearEvent() {}, emitEvent() { this._notDetected(); return this; },
    on(detected, fn) { if (!detected) setTimeout(fn, 1); return this; },
    onDetected() { return this; },
    onNotDetected(fn) { setTimeout(fn, 1); return this; },
    setOption() { return this; },
    _notDetected() {},
  };
  const inst = new Detector();
  for (const name of ['fuckAdBlock', 'blockAdBlock', 'sniffAdBlock']) {
    window[name] = inst;
  }
  window.FuckAdBlock = window.BlockAdBlock = window.SniffAdBlock = Detector;
})();
