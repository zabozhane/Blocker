// Пустышка Google IMA SDK (реклама в видеоплеерах). Плеер получает «ошибку рекламы»
// и сразу запускает основное видео.
(function () {
  'use strict';
  if (window.google && window.google.ima && window.google.ima.__sab) return;
  const noop = function () {};
  class EventTarget_ {
    constructor() { this.l = {}; }
    addEventListener(t, fn) { (Array.isArray(t) ? t : [t]).forEach((x) => (this.l[x] = this.l[x] || []).push(fn)); }
    removeEventListener(t, fn) { (Array.isArray(t) ? t : [t]).forEach((x) => { this.l[x] = (this.l[x] || []).filter((f) => f !== fn); }); }
    fire(t, ev) { (this.l[t] || []).slice().forEach((fn) => { try { fn(ev); } catch (e) {} }); }
  }
  const AdError = function (msg) { this.msg = msg; };
  AdError.prototype = {
    getErrorCode: () => 1009, getVastErrorCode: () => 303, getInnerError: () => null,
    getMessage() { return this.msg; }, getType: () => 'adLoadError', toString() { return 'AdError 1009: ' + this.msg; },
  };
  AdError.ErrorCode = { VAST_EMPTY_RESPONSE: 1009 };
  AdError.Type = { AD_LOAD: 'adLoadError', AD_PLAY: 'adPlayError' };
  const AdErrorEvent = function (err) { this.err = err; this.type = 'adError'; };
  AdErrorEvent.prototype = { getError() { return this.err; }, getUserRequestContext: () => ({}) };
  AdErrorEvent.Type = { AD_ERROR: 'adError' };

  class AdsManager extends EventTarget_ {
    collapse() {} configureAdsManager() {} destroy() {} discardAdBreak() {} expand() {} focus() {}
    getAdSkippableState() { return false; } getCuePoints() { return []; } getCurrentAd() { return null; }
    getRemainingTime() { return 0; } getVolume() { return 1; } init() {} isCustomClickTrackingUsed() { return false; }
    isCustomPlaybackUsed() { return false; } pause() {} requestNextAdBreak() {} resize() {} resume() {}
    setVolume() {} skip() {} stop() {} updateAdsRenderingSettings() {}
    start() { setTimeout(() => this.fire('allAdsCompleted', { type: 'allAdsCompleted' }), 0); }
  }
  class AdsLoader extends EventTarget_ {
    constructor() { super(); this.settings = new ImaSdkSettings(); }
    contentComplete() {} destroy() {} getSettings() { return this.settings; } getVersion() { return '3.0'; }
    requestAds(req, ctx) {
      setTimeout(() => {
        const ev = new AdErrorEvent(new AdError('No ads (blocked)'));
        ev.getUserRequestContext = () => ctx || {};
        this.fire('adError', ev);
      }, 0);
    }
  }
  class AdDisplayContainer { constructor() {} destroy() {} initialize() {} }
  class ImaSdkSettings {
    getCompanionBackfill() { return ''; } getDisableCustomPlaybackForIOS10Plus() { return false; }
    getLocale() { return ''; } getNumRedirects() { return 0; } getPlayerType() { return ''; }
    getPlayerVersion() { return ''; } getPpid() { return ''; }
    setAutoPlayAdBreaks() {} setCompanionBackfill() {} setCookiesEnabled() {}
    setDisableCustomPlaybackForIOS10Plus() {} setLocale() {} setNumRedirects() {} setPlayerType() {}
    setPlayerVersion() {} setPpid() {} setSessionId() {} setVpaidAllowed() {} setVpaidMode() {} setFeatureFlags() {}
  }
  ImaSdkSettings.VpaidMode = { DISABLED: 0, ENABLED: 1, INSECURE: 2 };
  ImaSdkSettings.CompanionBackfillMode = { ALWAYS: 'always', ON_MASTER_AD: 'on_master_ad' };
  const AdsManagerLoadedEvent = function () {};
  AdsManagerLoadedEvent.prototype.getAdsManager = () => new AdsManager();
  AdsManagerLoadedEvent.prototype.getUserRequestContext = () => ({});
  AdsManagerLoadedEvent.Type = { ADS_MANAGER_LOADED: 'adsManagerLoaded' };
  const AdEvent = function () {};
  AdEvent.Type = {
    AD_BREAK_READY: 'adBreakReady', AD_BUFFERING: 'adBuffering', AD_CAN_PLAY: 'adCanPlay',
    AD_METADATA: 'adMetadata', AD_PROGRESS: 'adProgress', ALL_ADS_COMPLETED: 'allAdsCompleted',
    CLICK: 'click', COMPLETE: 'complete', CONTENT_PAUSE_REQUESTED: 'contentPauseRequested',
    CONTENT_RESUME_REQUESTED: 'contentResumeRequested', DURATION_CHANGE: 'durationChange',
    FIRST_QUARTILE: 'firstQuartile', IMPRESSION: 'impression', INTERACTION: 'interaction',
    LINEAR_CHANGED: 'linearChanged', LOADED: 'loaded', LOG: 'log', MIDPOINT: 'midpoint',
    PAUSED: 'pause', RESUMED: 'resume', SKIPPABLE_STATE_CHANGED: 'skippableStateChanged',
    SKIPPED: 'skip', STARTED: 'start', THIRD_QUARTILE: 'thirdQuartile', USER_CLOSE: 'userClose',
    VIDEO_CLICKED: 'videoClicked', VIDEO_ICON_CLICKED: 'videoIconClicked', VOLUME_CHANGED: 'volumeChange',
    VOLUME_MUTED: 'mute',
  };
  const AdsRequest = function () {};
  AdsRequest.prototype = { setAdWillAutoPlay: noop, setAdWillPlayMuted: noop, setContinuousPlayback: noop };
  const AdsRenderingSettings = function () {};
  const ima = {
    __sab: true, AdDisplayContainer, AdError, AdErrorEvent, AdEvent, AdsLoader, AdsManager,
    AdsManagerLoadedEvent, AdsRenderingSettings, AdsRequest, ImaSdkSettings,
    CompanionAdSelectionSettings: function () {}, UiElements: { AD_ATTRIBUTION: 'adAttribution', COUNTDOWN: 'countdown' },
    ViewMode: { FULLSCREEN: 'fullscreen', NORMAL: 'normal' },
    OmidAccessMode: { DOMAIN: 'domain', FULL: 'full', LIMITED: 'limited' },
    settings: new ImaSdkSettings(), VERSION: '3.0',
  };
  window.google = window.google || {};
  window.google.ima = ima;
})();
