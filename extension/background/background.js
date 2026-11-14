// Фоновый скрипт: ведёт список сайтов-исключений и превращает его в разрешающие правила.
const api = globalThis.browser || globalThis.chrome;
const ALLOW_BASE_ID = 100000;

async function getDisabledSites() {
  const r = await api.storage.local.get('disabledSites');
  return Array.isArray(r.disabledSites) ? r.disabledSites : [];
}

async function syncAllowRules() {
  const sites = await getDisabledSites();
  const existing = await api.declarativeNetRequest.getDynamicRules();
  const addRules = sites.map((domain, i) => ({
    id: ALLOW_BASE_ID + i,
    priority: 100,
    action: { type: 'allowAllRequests' },
    condition: { urlFilter: `||${domain}^`, resourceTypes: ['main_frame', 'sub_frame'] },
  }));
  await api.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules,
  });
}

api.runtime.onInstalled.addListener(() => { syncAllowRules().catch(console.error); });
api.runtime.onStartup && api.runtime.onStartup.addListener(() => { syncAllowRules().catch(console.error); });
api.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.disabledSites) syncAllowRules().catch(console.error);
});
