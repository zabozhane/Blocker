// Пустышка Google Publisher Tag (gpt.js): сайт думает, что реклама загрузилась.
(function () {
  'use strict';
  const noop = function () {};
  const self = function () { return this; };
  const slot = {
    addService: self, clearCategoryExclusions: self, clearTargeting: self,
    defineSizeMapping: self, get: () => null, getAdUnitPath: () => '',
    getAttributeKeys: () => [], getCategoryExclusions: () => [],
    getDomId: () => '', getResponseInformation: () => null, getSlotElementId: () => '',
    getSlotId: function () { return { getAdUnitPath: () => '', getDomId: () => '', getId: () => '' }; },
    getTargeting: () => [], getTargetingKeys: () => [], set: self,
    setCategoryExclusion: self, setClickUrl: self, setCollapseEmptyDiv: self,
    setConfig: self, setForceSafeFrame: self, setSafeFrameConfig: self, setTargeting: self,
    updateTargetingFromMap: self,
  };
  const listeners = {};
  const pubads = {
    addEventListener: function (name, fn) { (listeners[name] = listeners[name] || []).push(fn); return this; },
    removeEventListener: self, clear: () => true, clearCategoryExclusions: self,
    clearTagForChildDirectedTreatment: self, clearTargeting: self, collapseEmptyDivs: self,
    defineOutOfPagePassback: () => slot, definePassback: () => slot, disableInitialLoad: noop,
    display: noop, enableAsyncRendering: noop, enableLazyLoad: noop, enableSingleRequest: () => true,
    enableSyncRendering: noop, enableVideoAds: noop, get: () => null, getAttributeKeys: () => [],
    getTargeting: () => [], getTargetingKeys: () => [], getSlots: () => [], isInitialLoadDisabled: () => false,
    refresh: noop, set: self, setCategoryExclusion: self, setCentering: noop, setCookieOptions: self,
    setForceSafeFrame: self, setLocation: self, setPrivacySettings: self, setPublisherProvidedId: self,
    setRequestNonPersonalizedAds: self, setSafeFrameConfig: self, setTagForChildDirectedTreatment: self,
    setTargeting: self, setVideoContent: self, updateCorrelator: noop,
  };
  const companion = { addEventListener: self, enableSyncLoading: noop, setRefreshUnfilledSlots: noop };
  const content = { addEventListener: self, setContent: noop };
  const gt = window.googletag || {};
  const cmd = gt.cmd || [];
  Object.assign(gt, {
    apiReady: true, pubadsReady: true, _loaded_: true,
    companionAds: () => companion, content: () => content, defineOutOfPageSlot: () => slot,
    defineSlot: () => slot, destroySlots: noop, disablePublisherConsole: noop, display: noop,
    enableServices: noop, getVersion: () => '', pubads: () => pubads, setAdIframeTitle: noop,
    setConfig: noop, sizeMapping: function () { return { addSize: function () { return this; }, build: () => [] }; },
    openConsole: noop, getConfig: () => ({}),
  });
  gt.cmd = { push: (fn) => { try { fn(); } catch (e) {} return 1; } };
  window.googletag = gt;
  cmd.forEach((fn) => { try { fn(); } catch (e) {} });
})();
