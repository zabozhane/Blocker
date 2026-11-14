const api = globalThis.browser || globalThis.chrome;
const $ = (id) => document.getElementById(id);

// Отрезаем «www.», чтобы исключение действовало на весь сайт
const siteOf = (url) => {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.hostname.replace(/^www\./, '');
  } catch (e) { return null; }
};

async function main() {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  const site = tab && siteOf(tab.url);
  const toggle = $('toggle');

  if (!site) {
    $('site').textContent = 'Эта страница';
    toggle.disabled = true;
    $('hint').textContent = 'На служебных страницах блокировщик не работает.';
    return;
  }
  $('site').textContent = site;

  const { disabledSites = [] } = await api.storage.local.get('disabledSites');
  const render = (enabled) => {
    toggle.checked = enabled;
    $('state-text').textContent = enabled ? 'Блокировка включена' : 'Блокировка выключена';
    $('hint').textContent = enabled
      ? 'Реклама, всплывающие окна и реклама в видео блокируются.'
      : 'На этом сайте реклама не блокируется. Включите, если сайт работает нормально.';
  };
  render(!disabledSites.includes(site));

  toggle.addEventListener('change', async () => {
    const r = await api.storage.local.get('disabledSites');
    let list = Array.isArray(r.disabledSites) ? r.disabledSites : [];
    list = toggle.checked ? list.filter((d) => d !== site) : [...new Set([...list, site])];
    await api.storage.local.set({ disabledSites: list });
    render(toggle.checked);
    $('reload').hidden = false;
  });

  $('reload').addEventListener('click', () => {
    api.tabs.reload(tab.id);
    window.close();
  });
}

main();
