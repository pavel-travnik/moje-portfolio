// ===================================================
// GLOBALNI LOADER PRO VSECHNA VOLANI SLUZEB
// ===================================================
const serviceLoader = (() => {
  let activeRequests = 0, showTimer = null, hideTimer = null, overlay = null;
  function ensureOverlay() {
    if (overlay && document.body.contains(overlay)) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'service-loader';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `<div class="service-loader-card"><div class="service-loader-coin" aria-hidden="true"><span class="coin-face coin-front">P</span><span class="coin-face coin-back">K</span></div><strong class="service-loader-title">Načítám data</strong><span class="service-loader-text">Chvilku strpení, prosím…</span></div>`;
    document.body.appendChild(overlay);
    return overlay;
  }
  function messageFor(url, options = {}) {
    const method = String(options.method || 'GET').toUpperCase();
    const value = String(url || '').toLowerCase();
    if (value.includes('login_user')) return 'Ověřuji přihlašovací údaje…';
    if (value.includes('save_user')) return 'Ukládám údaje…';
    if (method !== 'GET' && method !== 'HEAD') return 'Ukládám změny…';
    return 'Načítám data…';
  }
  function start(message = 'Pracuji…') {
    activeRequests += 1; clearTimeout(hideTimer);
    const el = ensureOverlay();
    const text = el.querySelector('.service-loader-text');
    if (text) text.textContent = message;
    if (activeRequests === 1) {
      clearTimeout(showTimer);
      showTimer = setTimeout(() => { if (activeRequests > 0) { el.classList.add('is-visible'); el.setAttribute('aria-hidden', 'false'); } }, 180);
    }
  }
  function stop() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests !== 0) return;
    clearTimeout(showTimer);
    hideTimer = setTimeout(() => { if (overlay && activeRequests === 0) { overlay.classList.remove('is-visible'); overlay.setAttribute('aria-hidden', 'true'); } }, 120);
  }
  return { start, stop, messageFor };
})();
const nativeFetch = window.fetch.bind(window);

// Loader s mincí se zobrazí pouze u požadavku vyvolaného přímou akcí uživatele.
// Automatický preload, zahřívání cache a požadavky na pozadí zůstanou bez loaderu.
let lastUserTriggeredAt = 0;
const USER_TRIGGERED_FETCH_WINDOW_MS = 1500;

function markUserTriggeredRequest(event) {
  if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
  const control = event.target?.closest?.(
    'a, button, input, select, textarea, [role="button"], [data-page], .side-card, .fund-card'
  );
  if (!control) return;
  lastUserTriggeredAt = Date.now();
}

document.addEventListener('pointerdown', markUserTriggeredRequest, true);
document.addEventListener('click', markUserTriggeredRequest, true);
document.addEventListener('keydown', markUserTriggeredRequest, true);

function shouldShowServiceLoader(options = {}) {
  if (options.showLoader === true) return true;
  if (options.showLoader === false || options.background === true) return false;
  return Date.now() - lastUserTriggeredAt <= USER_TRIGGERED_FETCH_WINDOW_MS;
}

window.fetch = async function fetchWithServiceLoader(input, options = {}) {
  const showLoader = shouldShowServiceLoader(options);
  const url = typeof input === 'string' ? input : input?.url;
  if (showLoader) serviceLoader.start(serviceLoader.messageFor(url, options));
  try {
    return await nativeFetch(input, options);
  } finally {
    if (showLoader) serviceLoader.stop();
  }
};
window.serviceLoader = serviceLoader;
function showAuthMessage(text, type = 'info') {
  const el = document.querySelector('.auth-modal #auth-message');
  if (!el) return;
  el.textContent = text || '';
  el.className = `auth-message ${type}`;
  el.style.display = text ? 'block' : 'none';
}

// ===================================================
// HLAVNi KONTEJNER
// ===================================================

// ===================================================
// PAGE INTRO TEXTS – fallback pro datové podstránky
// ===================================================
function ensurePageIntro(page) {
  const main = document.getElementById('mainContent');
  if (!main || main.querySelector('.section-intro')) return;
  const intros = {
    'penze': { icon: '♧', title: 'Penze', text: 'Zde najdete přehled vybraných <a href="/info-penze" data-page="info-penze">penzijních účastnických fondů</a> a jejich základních parametrů. Kliknutím na konkrétní fond otevřete detail s historickým vývojem hodnoty, rizikovostí a posledním dostupným oceněním. <a href="/aktualizace" data-page="aktualizace">Data jsou aktualizována</a> z veřejně dostupných zdrojů a slouží pouze pro informativní přehled — neposkytujeme investiční, penzijní ani jiné finanční poradenství.' },
    'podilove-fondy': { icon: '◈', title: 'Podílové fondy', text: 'Zobrazen je přehled <a href="/info-podilove-fondy" data-page="info-podilove-fondy">podílových fondů</a> s možností otevřít detail konkrétního fondu. Detail fondu obsahuje historický vývoj kurzu, poslední dostupnou hodnotu a základní údaje pro rychlou orientaci. <a href="/aktualizace" data-page="aktualizace">Data jsou průběžně aktualizována</a> z veřejných zdrojů a slouží pouze jako informační přehled — nejde o investiční doporučení ani poradenství.' },
    'akcie': { icon: '↗', title: 'Akcie', text: 'Sekce akcie nabízí přehled vybraných <a href="/info-akcie" data-page="info-akcie">akciových titulů</a> včetně měny, vývoje ceny a základních tržních údajů. Po otevření detailu je možné sledovat historický vývoj ceny v různých časových obdobích a přejít na externí tržní detail. <a href="/aktualizace" data-page="aktualizace">Uvedené informace jsou aktualizovány</a> z veřejně dostupných dat a slouží pouze pro orientaci, nikoliv jako investiční doporučení.' },
    'etf': { icon: '◎', title: 'ETF', text: 'Přehled <a href="/info-etf" data-page="info-etf">ETF</a> zobrazuje vybrané burzovně obchodované fondy odděleně od jednotlivých akcií. V detailu ETF najdete historický vývoj ceny, poslední dostupnou hodnotu a základní údaje pro srovnání. <a href="/aktualizace" data-page="aktualizace">Data jsou aktualizována</a> z veřejných zdrojů a mají informativní charakter — neposkytujeme investiční ani jiné finanční poradenství.' },
    'crypto': { icon: '₿', title: 'Crypto', text: 'Sekce Crypto nabízí přehled vybraných <a href="/info-crypto" data-page="info-crypto">kryptoměn</a> a digitálních aktiv odděleně od akcií a ETF. V detailu kryptoměny najdete historický vývoj ceny, poslední dostupnou hodnotu a základní tržní údaje pro rychlou orientaci. <a href="/aktualizace" data-page="aktualizace">Data jsou aktualizována</a> z veřejně dostupných zdrojů a slouží pouze pro informativní přehled. Neposkytujeme investiční ani jiné finanční poradenství.' },
    'meny': { icon: '¤', title: 'Měny', text: 'Sekce měny nabízí přehled vybraných <a href="/info-meny" data-page="info-meny">měnových kurzů</a> a jejich historického vývoje vůči CZK. Kliknutím na konkrétní měnu otevřete detail s posledním dostupným kurzem, změnou za vybrané období a grafem vývoje. <a href="/aktualizace" data-page="aktualizace">Data jsou aktualizována</a> z veřejně dostupných zdrojů a slouží pouze pro informativní přehled — neposkytujeme měnové, investiční ani jiné finanční poradenství.' },
    'indexy': { icon: '▦', title: 'Indexy', text: 'Sekce indexy nabízí přehled vybraných světových akciových indexů. Kliknutím na konkrétní index otevřete detail s historickým vývojem hodnoty a posledním dostupným oceněním. <a href="/aktualizace" data-page="aktualizace">Data jsou aktualizována</a> z veřejně dostupných zdrojů a slouží pouze jako informační přehled — nejde o investiční doporučení ani poradenství.' }
  };
  const intro = intros[page];
  if (!intro) return;
  main.insertAdjacentHTML('afterbegin', `<section class="section-intro"><div class="intro-heading"><span class="icon-badge" aria-hidden="true">${intro.icon}</span><div><h2>${intro.title}</h2><p class="intro-lead">${intro.text}</p></div></div></section>`);
  if (!main.querySelector('.disclaimer')) {
    main.insertAdjacentHTML('beforeend', `<p class="disclaimer">Informace na této stránce mají pouze informativní charakter. Nejedná se o doporučení, nabídku ani poradenství. Minulá výkonnost není zárukou budoucích výsledků.</p>`);
  }
}

const apiCache = {
  dps: {},
  stocks: {},
  crypto: {},
  currencies: {},
  podiloveFondy: {}
};

apiCache.dpsFundsMeta = null;
apiCache.dpsTableMetrics = {};
apiCache.dpsFundsOverview = null;
apiCache.dpsPromises = {};
apiCache.dpsMetaPromise = null;
apiCache.stockUniverse = null;
apiCache.stockUniversePromise = null;



// ===================================================
// API URL
// ===================================================
// Krok 11: verejne datove endpointy jdou pres API Management.
// Function key neni ve frontendu. APIM vola Function App na pozadi.
// Poznamka: portfolio/login endpointy sem zamerne nepatri, ty budeme resit samostatne pres autentizaci.
const APIM_API_BASE_URL = '/api/private-api';

const DPS_API_URL = `${APIM_API_BASE_URL}/get_dps_data`;
const DPS_API = `${APIM_API_BASE_URL}/get_dps_funds`;
const DPS_FUNDS_OVERVIEW_API = `${APIM_API_BASE_URL}/get_dps_funds_overview`;
const STOCK_API_URL = `${APIM_API_BASE_URL}/get_stock_data`;
const STOCK_LIST_API = `${APIM_API_BASE_URL}/get_active_stocks`;
const CURRENCY_LIST_API = `${APIM_API_BASE_URL}/get_active_currencies`;
const CURRENCY_DATA_API = `${APIM_API_BASE_URL}/get_currency_data`;
const PODILOVE_FONDY_API = `${APIM_API_BASE_URL}/get_active_podilove_fondy`;
const PODILOVY_FOND_DATA_API = `${APIM_API_BASE_URL}/get_podilovy_fond_data`;
const PUBLIC_DATA_PROXY_API = '/api/public-data';
function publicDataProxyUrl(type, id = '') {
  const url = `${PUBLIC_DATA_PROXY_API}?type=${encodeURIComponent(type)}`;
  return id !== undefined && id !== null && String(id).trim() !== ''
    ? `${url}&id=${encodeURIComponent(id)}`
    : url;
}


// ===================================================
// AUTH / SESSION – vlastní login přes JWT
// ===================================================
// Soukromé portfolio endpointy budou volané přes APIM. Pokud vytvoříš jiné
// APIM API pro privátní část, změň pouze tuto konstantu.
const PORTFOLIO_PRIVATE_API_BASE_URL = '/api/private-api';
window.PORTFOLIO_API = PORTFOLIO_PRIVATE_API_BASE_URL;

function getPortfolioApiBaseUrl() {
  return window.PORTFOLIO_API || PORTFOLIO_PRIVATE_API_BASE_URL;
}

function getAccessToken() {
  return localStorage.getItem('access_token');
}

function getTokenExpiresAt() {
  return Number(localStorage.getItem('token_expires_at') || 0);
}

function isLoggedIn() {
  const token = getAccessToken();
  const expiresAt = getTokenExpiresAt();
  return !!token && !!expiresAt && Date.now() < expiresAt;
}

function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('token_expires_at');
  localStorage.removeItem('user_id');
  localStorage.removeItem('last_activity');
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getAccessToken();
  return {
    ...extraHeaders,
    ...(token ? { 'X-Portfolio-Authorization': `Bearer ${token}` } : {})
  };
}

async function authFetch(url, options = {}) {
  if (!isLoggedIn()) {
    clearSession();
    updateMenu();
    openLoginModal();
    throw new Error('Uživatel není přihlášený nebo relace vypršela.');
  }

  const headers = getAuthHeaders(options.headers || {});
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    clearSession();
    updateMenu();
    openLoginModal();
    throw new Error('Přihlášení vypršelo nebo není platné.');
  }

  return res;
}

window.getAccessToken = getAccessToken;
window.isLoggedIn = isLoggedIn;
window.clearSession = clearSession;
window.authFetch = authFetch;
window.getAuthHeaders = getAuthHeaders;

// ===================================================
// PUBLIC DATA CACHE – localStorage TTL cache pro veřejná GET data
// ===================================================
// APIM Consumption nemá spolehlivou interní cache, proto cachujeme veřejná data
// přímo v prohlížeči. Privátní portfolio/JWT endpointy se tímto necachují.
const PUBLIC_DATA_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minut
const PUBLIC_DATA_CACHE_PREFIX = 'public_api_cache_v1:';
window.__publicDataFetchPromises = window.__publicDataFetchPromises || {};

function publicDataCacheKey(url) {
  return PUBLIC_DATA_CACHE_PREFIX + String(url);
}

function getCachedPublicData(url) {
  if (isProxyDetailUrl(url)) return null;
  try {
    const raw = localStorage.getItem(publicDataCacheKey(url));
    if (!raw) return null;

    const item = JSON.parse(raw);
    if (!item || typeof item.expiresAt !== 'number') return null;

    if (Date.now() > item.expiresAt) {
      localStorage.removeItem(publicDataCacheKey(url));
      return null;
    }

    return item.data;
  } catch (err) {
    console.warn('Public cache read failed:', err);
    return null;
  }
}

function isProxyDetailUrl(url) {
  try {
    const parsed = new URL(String(url), window.location.origin);
    return parsed.pathname === PUBLIC_DATA_PROXY_API && parsed.searchParams.has('id');
  } catch {
    return String(url).includes('/api/public-data') && String(url).includes('&id=');
  }
}

function shouldUseLocalPublicCache(url, data) {
  // Detailní historie může být velká. Tu držíme v apiCache + server proxy cache,
  // ale neukládáme ji do localStorage, aby nevznikal QuotaExceededError.
  if (isProxyDetailUrl(url)) return false;

  // Bezpečnostní limit pro localStorage. Přehledy obvykle projdou, velké JSON odpovědi ne.
  try {
    return JSON.stringify(data).length <= 750000;
  } catch {
    return false;
  }
}

function trimPublicDataCache() {
  try {
    const items = Object.keys(localStorage)
      .filter(k => k.startsWith(PUBLIC_DATA_CACHE_PREFIX))
      .map(k => {
        try {
          const item = JSON.parse(localStorage.getItem(k) || '{}');
          return { key: k, cachedAt: Number(item.cachedAt || 0), expiresAt: Number(item.expiresAt || 0) };
        } catch {
          return { key: k, cachedAt: 0, expiresAt: 0 };
        }
      })
      .sort((a, b) => (a.expiresAt - b.expiresAt) || (a.cachedAt - b.cachedAt));

    // Smaž starší/přebytečné záznamy. Cílem je uvolnit místo, ne držet lokální archiv.
    const removeCount = Math.max(1, Math.ceil(items.length / 3));
    items.slice(0, removeCount).forEach(item => localStorage.removeItem(item.key));
  } catch (err) {
    console.warn('Public cache trim failed:', err);
  }
}

function setCachedPublicData(url, data, ttlMs = PUBLIC_DATA_CACHE_TTL_MS) {
  if (!shouldUseLocalPublicCache(url, data)) return;

  const payload = JSON.stringify({
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
    data
  });

  try {
    localStorage.setItem(publicDataCacheKey(url), payload);
  } catch (err) {
    // localStorage může být plný nebo vypnutý. Uvolníme starší záznamy a zkusíme jednou znovu.
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      trimPublicDataCache();
      try {
        localStorage.setItem(publicDataCacheKey(url), payload);
        return;
      } catch {
        // Cache je jen optimalizace. Nehlásíme uživatelskou chybu.
      }
    }
    console.warn('Public cache write skipped:', err);
  }
}

async function cachedJsonFetch(url, options = {}) {
  const ttlMs = options.ttlMs ?? PUBLIC_DATA_CACHE_TTL_MS;
  const forceRefresh = options.forceRefresh === true;
  const cacheKey = publicDataCacheKey(url);

  if (!forceRefresh) {
    const cached = getCachedPublicData(url);
    if (cached !== null) return cached;
  }

  if (!forceRefresh && window.__publicDataFetchPromises[cacheKey]) {
    return window.__publicDataFetchPromises[cacheKey];
  }

  const promise = fetch(url, { method: 'GET' })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      return res.json();
    })
    .then(data => {
      setCachedPublicData(url, data, ttlMs);
      return data;
    })
    .finally(() => {
      delete window.__publicDataFetchPromises[cacheKey];
    });

  window.__publicDataFetchPromises[cacheKey] = promise;
  return promise;
}

function clearPublicDataCache() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PUBLIC_DATA_CACHE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Public cache clear failed:', err);
  }
}

window.cachedJsonFetch = cachedJsonFetch;
window.clearPublicDataCache = clearPublicDataCache;

// ===================================================
// COOKIE CONSENT
// ===================================================
const COOKIE_CONSENT_KEY = 'mp_cookie_consent_v3';
const COOKIE_CONSENT_COOKIE = 'cookieConsent';
const COOKIE_CONSENT_VERSION = 3;
const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
const COOKIE_CONSENT_MAX_AGE_MS = COOKIE_CONSENT_MAX_AGE_SECONDS * 1000;

function setCookieConsentCookie(value) {
  try {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_CONSENT_COOKIE}=${encodeURIComponent(value)}; Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  } catch (err) {
    console.warn('Cookie consent cookie write failed:', err);
  }
}

function deleteCookieConsentCookie() {
  try {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_CONSENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
  } catch (err) {
    console.warn('Cookie consent cookie delete failed:', err);
  }
}

function getCookieConsent() {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const consent = JSON.parse(raw);
    const savedAt = Date.parse(consent?.savedAt || '');
    const valid = consent?.version === COOKIE_CONSENT_VERSION &&
      Number.isFinite(savedAt) &&
      Date.now() - savedAt <= COOKIE_CONSENT_MAX_AGE_MS &&
      ['necessary', 'analytics', 'all'].includes(consent?.choice);
    if (!valid) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      deleteCookieConsentCookie();
      return null;
    }
    return consent;
  } catch (err) {
    console.warn('Cookie consent read failed:', err);
    return null;
  }
}

function applyCookieConsent(consent) {
  const analyticsAllowed = !!consent?.analytics;
  window.dispatchEvent(new CustomEvent('portfolio:cookie-consent-changed', {
    detail: { ...consent, analytics: analyticsAllowed }
  }));
  if (analyticsAllowed) {
    if (typeof window.enableAnalyticsAfterConsent === 'function') {
      window.enableAnalyticsAfterConsent(consent);
    }
  } else if (typeof window.disableAnalyticsAfterConsent === 'function') {
    window.disableAnalyticsAfterConsent(consent);
  }
}

function saveCookieConsent(choice) {
  const safeChoice = choice === 'all' || choice === 'analytics' ? choice : 'necessary';
  const payload = {
    choice: safeChoice,
    necessary: true,
    analytics: safeChoice === 'all' || safeChoice === 'analytics',
    savedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Cookie consent localStorage write failed:', err);
  }
  setCookieConsentCookie(safeChoice);
  closeCookieBanner();
  applyCookieConsent(payload);
  return payload;
}

function closeCookieBanner() {
  document.querySelectorAll('.cookie-consent-backdrop').forEach(el => el.remove());
}

function showCookieBanner(force = false) {
  const current = getCookieConsent();
  if (!force && current) return;
  closeCookieBanner();
  const backdrop = document.createElement('div');
  backdrop.className = 'cookie-consent-backdrop';
  backdrop.innerHTML = `
    <div class="cookie-consent-box" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
      <div class="cookie-consent-icon" aria-hidden="true">ⓘ</div>
      <div class="cookie-consent-content">
        <h3 id="cookie-consent-title">Nastavení cookies</h3>
        <p>Používáme nezbytné technické ukládání pro fungování webu, přihlášení a bezpečnost relace. Analytiku spustíme pouze po vašem souhlasu.</p>
        <label class="cookie-choice-row">
          <input type="checkbox" checked disabled>
          <span><strong>Nezbytné</strong><small>Vždy aktivní, bez nich web správně nefunguje.</small></span>
        </label>
        <label class="cookie-choice-row">
          <input type="checkbox" id="cookie-analytics-choice">
          <span><strong>Analytické</strong><small>Pomáhají nám zlepšovat web. Jsou volitelné.</small></span>
        </label>
        <div class="cookie-consent-actions">
          <button type="button" class="pill-button" id="cookie-necessary">Pouze nezbytné</button>
          <button type="button" class="pill-button" id="cookie-save">Uložit výběr</button>
          <button type="button" class="pill-button cookie-primary" id="cookie-all">Přijmout vše</button>
        </div>
        <p class="cookie-consent-links">
          <a href="/cookies" data-page="cookies">Více o cookies</a>
          <span>Volbu můžete kdykoliv změnit na stránce Cookies.</span>
        </p>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  const dialog = backdrop.querySelector('.cookie-consent-box');
  const analytics = backdrop.querySelector('#cookie-analytics-choice');
  if (analytics && current?.analytics) analytics.checked = true;
  backdrop.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    if (button.id === 'cookie-necessary') saveCookieConsent('necessary');
    if (button.id === 'cookie-all') saveCookieConsent('all');
    if (button.id === 'cookie-save') saveCookieConsent(analytics?.checked ? 'analytics' : 'necessary');
  });
  backdrop.querySelector('[data-page="cookies"]')?.addEventListener('click', () => closeCookieBanner());
  dialog?.addEventListener('keydown', event => {
    if (event.key === 'Escape' && current) closeCookieBanner();
  });
  requestAnimationFrame(() => backdrop.querySelector('#cookie-necessary')?.focus());
}

function resetCookieConsent() {
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem('mp_cookie_consent_v1');
    localStorage.removeItem('mp_cookie_consent_v2');
  } catch (err) {
    console.warn('Cookie consent reset failed:', err);
  }
  deleteCookieConsentCookie();
  applyCookieConsent({ choice: null, necessary: true, analytics: false, version: COOKIE_CONSENT_VERSION });
  showCookieBanner(true);
}

function ensureCookieConsentStyle() {
  if (document.getElementById('cookie-consent-style')) return;
  const style = document.createElement('style');
  style.id = 'cookie-consent-style';
  style.textContent = `
    .cookie-consent-backdrop { position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:16px;background:linear-gradient(to top,rgba(17,17,17,.22),rgba(17,17,17,0)); }
    .cookie-consent-box { max-width:860px;margin:0 auto;display:grid;grid-template-columns:42px 1fr;gap:14px;padding:18px;border-radius:20px;border:1px solid rgba(201,166,70,.45);background:rgba(255,255,255,.98);box-shadow:0 16px 50px rgba(0,0,0,.18);color:#111; }
    .cookie-consent-icon { width:42px;height:42px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:#0f3d2e;color:#C9A646;font-weight:800;font-size:20px; }
    .cookie-consent-content h3 { margin:0 0 6px; }
    .cookie-consent-content p { margin:0 0 12px;line-height:1.45;color:#444; }
    .cookie-choice-row { display:flex;gap:10px;align-items:flex-start;margin:8px 0;padding:10px;border:1px solid rgba(201,166,70,.25);border-radius:14px;background:#fffaf0; }
    .cookie-choice-row input { width:auto;margin:3px 0 0; }
    .cookie-choice-row span { display:grid;gap:2px; }
    .cookie-choice-row small { color:#666; }
    .cookie-consent-actions { display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:12px; }
    .cookie-consent-actions .cookie-primary { background:#C9A646;border-color:#C9A646;color:#111;font-weight:800; }
    .cookie-consent-links { display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px!important;font-size:13px; }
    .cookie-consent-links a { color:#0f3d2e;font-weight:700; }
    @media(max-width:640px){.cookie-consent-box{grid-template-columns:1fr}.cookie-consent-actions{justify-content:stretch}.cookie-consent-actions .pill-button{flex:1 1 100%}}
  `;
  document.head.appendChild(style);
}

function initCookieConsent() {
  ensureCookieConsentStyle();
  window.showCookieBanner = () => showCookieBanner(true);
  window.resetCookieConsent = resetCookieConsent;
  const consent = getCookieConsent();
  if (!consent) {
    showCookieBanner(false);
    return;
  }
  setCookieConsentCookie(consent.choice);
  applyCookieConsent(consent);
}

// ===================================================
// PUBLIC DATA PRELOAD – zahřívání veřejných dat
// ===================================================
// Po načtení stránky na pozadí přednačteme jen lehké přehledové endpointy.
// Historie jednotlivých instrumentů se nenačítá hromadně.
function preloadSectionData(page) {
  if (!page) return Promise.resolve(null);
  const normalized = String(page).split('/')[0];

  if (normalized === 'penze') {
    return cachedJsonFetch(publicDataProxyUrl('dps-list')).then(data => {
      apiCache.dpsFundsOverview = Array.isArray(data) ? data : [];
      apiCache.dpsFundsMeta = apiCache.dpsFundsOverview;
      return apiCache.dpsFundsOverview;
    });
  }

  if (normalized === 'podilove-fondy') {
    return ensurePodiloveFondyList();
  }

  if (normalized === 'akcie' || normalized === 'etf' || normalized === 'crypto' || normalized === 'indexy') {
    return ensureStockUniverse();
  }

  if (normalized === 'meny') {
    return cachedJsonFetch(publicDataProxyUrl('currencies-list')).then(data => {
      apiCache.currenciesList = Array.isArray(data) ? data : [];
      return apiCache.currenciesList;
    });
  }

  return Promise.resolve(null);
}

function publicOverviewSections() {
  return ['penze', 'podilove-fondy', 'akcie', 'indexy', 'meny'];
}

function warmPublicDataCache(priorityPage = 'uvod') {
  if (window.__publicWarmupStarted) return;
  window.__publicWarmupStarted = true;
  const priority = String(priorityPage || 'uvod').split('/')[0];
  const sections = publicOverviewSections();
  const queue = sections.includes(priority)
    ? [priority, ...sections.filter(section => section !== priority)]
    : sections;

  const runNext = async () => {
    const section = queue.shift();
    if (!section) return;
    try {
      await preloadSectionData(section);
    } catch (err) {
      console.warn(`Warmup veřejných dat selhal pro ${section}:`, err);
    }
    if (!queue.length) return;
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(runNext, { timeout: 4000 });
      } else {
        runNext();
      }
    }, 1800);
  };
  runNext();
}

function schedulePublicDataWarmup(priorityPage = 'uvod') {
  const run = () => warmPublicDataCache(priorityPage);
  window.setTimeout(() => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 5000 });
    } else {
      run();
    }
  }, 2500);
}

window.preloadSectionData = preloadSectionData;
window.warmPublicDataCache = warmPublicDataCache;

function trackCurrentPage(page) {
  if (typeof window.trackSpaPageView === 'function') {
    window.trackSpaPageView(page);
  }
}



// ===================================================
// DROPDOWN - MOBILE SAFE / DIRECT BINDING
// ===================================================
function initDropdownControls() {
  if (window.__dropdownControlsReady) return;
  window.__dropdownControlsReady = true;

  const dropdown = document.querySelector('.dropdown');
  const toggle = document.querySelector('.dropdown-toggle');
  const menu = document.querySelector('.dropdown-menu');

  if (!dropdown || !toggle || !menu) return;

  let lastTouch = 0;

  function setMenu(open) {
    menu.classList.toggle('open', open);
    dropdown.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function handleToggle(e) {
    if (e.type === 'click' && Date.now() - lastTouch < 500) return;
    if (e.type === 'touchstart') lastTouch = Date.now();

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation();
    }

    setMenu(!menu.classList.contains('open'));
  }

  // touchstart is the most reliable on mobile; click keeps desktop/keyboard support.
  toggle.addEventListener('touchstart', handleToggle, { passive: false });
  toggle.addEventListener('click', handleToggle);

  menu.addEventListener('click', e => {
    if (e.target.closest('[data-page]')) {
      setMenu(false);
    }
  });

  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target)) {
      setMenu(false);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDropdownControls);
} else {
  initDropdownControls();
}

// ===================================================
// SPA NAVIGATION
// ===================================================
document.addEventListener('click', e => {
 if (e.target.closest('.dropdown-toggle')) return;
 const link = e.target.closest('[data-page]');
 if (!link) return;

 e.preventDefault();
 e.stopImmediatePropagation(); // 🔥 KRITICKÉ

 const page = link.dataset.page;

 if (!page) return;

 // ✅ VŽDY načti root (žádná relativita)
 loadPage(page);

 // ✅ zavři dropdown
 const menu = document.querySelector('.dropdown-menu');
 if (menu) menu.classList.remove('open');
});


// Přednostní načtení až při skutečném záměru uživatele.
// Pouhý přejezd myší už nespouští načítání všech přehledů.
document.addEventListener('pointerdown', e => {
  const link = e.target.closest('[data-page]');
  if (!link) return;
  preloadSectionData(link.dataset.page).catch(() => {});
}, { passive: true });

document.addEventListener('focusin', e => {
  const link = e.target.closest('[data-page]');
  if (!link) return;
  preloadSectionData(link.dataset.page).catch(() => {});
});

function navigateSmartBack() {
  if (typeof hideTooltip === 'function') hideTooltip();
  try {
    const raw = sessionStorage.getItem('portfolio_return_context');
    const context = raw ? JSON.parse(raw) : null;
    if (context?.page && context?.portfolioId) {
      sessionStorage.removeItem('portfolio_return_context');
      const state = {
        page: context.page,
        portfolioId: String(context.portfolioId),
        portfolioTab: context.portfolioTab || 'instruments'
      };
      history.replaceState(state, '', `/${context.page}`);
      loadPage(context.page, false);
      return;
    }
  } catch (error) {
    sessionStorage.removeItem('portfolio_return_context');
    console.warn('Návrat do portfolia se nepodařilo obnovit:', error);
  }
  history.back();
}
window.navigateSmartBack = navigateSmartBack;

window.addEventListener('popstate', e => {
  const page = e.state?.page || location.pathname.replace(/^\/+/, '') || 'uvod';
  loadPage(page, false);
});

document.addEventListener('click', e => {
 const card = e.target.closest('.side-card');
 if (!card) return;

 const page = card.dataset.page;
 if (!page) return;

 e.preventDefault();
 e.stopImmediatePropagation();

 loadPage(page);
});

const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
document.body.appendChild(tooltip);

let tooltipTimeout = null;

// ✅ DESKTOP (hover)
document.addEventListener('mouseover', e => {
  if (window.innerWidth < 768) return; // mobil ignoruj

  const el = e.target.closest('[data-tooltip]');
  if (!el) return;

  showTooltip(el);
});

document.addEventListener('mouseout', e => {
  if (window.innerWidth < 768) return;

  if (e.target.closest('[data-tooltip]')) {
    hideTooltip();
  }
});

// ✅ MOBILE (tap)
document.addEventListener('click', e => {
  if (window.innerWidth >= 768) return; // desktop ignoruj

  const el = e.target.closest('[data-tooltip]');
  if (!el) return;

  e.preventDefault();

  showTooltip(el);

  // auto hide
  clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => {
    hideTooltip();
  }, 2000);
});

function showTooltip(el) {
  const text = el.dataset.tooltip;
  if (!text) return;

  tooltip.textContent = text;

  const section = el.closest('.stock-risk-metric') || el.closest('.kpi') || el;
  const rect = section.getBoundingClientRect();
  const viewportPadding = 12;
  const width = Math.max(160, Math.min(rect.width, window.innerWidth - viewportPadding * 2));
  const left = Math.min(
    Math.max(rect.left + window.scrollX, viewportPadding + window.scrollX),
    window.scrollX + window.innerWidth - width - viewportPadding
  );

  tooltip.style.width = width + 'px';
  tooltip.style.maxWidth = width + 'px';
  tooltip.style.left = left + 'px';
  tooltip.style.top = rect.bottom + window.scrollY + 8 + 'px';

  tooltip.classList.add('show');
}

function hideTooltip() {
  tooltip.classList.remove('show');
}

// ===================================================
// INIT
// ===================================================


function decorateSideCards() {
  const icons = { 'penze':'♧', 'podilove-fondy':'◈', 'akcie':'↗', 'etf':'◎', 'crypto':'₿', 'meny':'¤', 'indexy':'▦', 'aktualizace':'↻', 'info-penze':'♧', 'info-podilove-fondy':'◈', 'info-akcie':'↗', 'info-etf':'◎', 'info-crypto':'₿', 'info-meny':'¤' };
  document.querySelectorAll('.side-card').forEach(card => {
    if (card.querySelector('.side-card-icon')) return;
    const icon = icons[card.dataset.page] || '›';
    card.insertAdjacentHTML('afterbegin', `<span class="side-card-icon" aria-hidden="true">${icon}</span>`);
  });
}

function ensureGoldTileIconStyle() {
  if (document.getElementById('gold-tile-icon-style')) return;
  const style = document.createElement('style');
  style.id = 'gold-tile-icon-style';
  style.textContent = `
    /* Sjednocení ikon dlaždic napříč sekcemi */
    .side-card-icon,
    .icon-badge,
    .fund-card::before,
    .fund-card::after,
    .fund-card .tile-icon,
    .fund-card .card-icon,
    .fund-card .fund-card-icon,
    .fund-card .icon,
    .fund-card svg {
      color: #C9A646 !important;
      fill: #C9A646 !important;
      stroke: #C9A646 !important;
      border-color: rgba(201, 166, 70, 0.45) !important;
    }
  `;
  document.head.appendChild(style);
}

(function init() {
 let path = location.pathname.replace(/^\/+/, '');

 // když je root nebo index → úvod
 

if (!path || path === 'index.html') {
    path = 'uvod';   // ✅ vždy úvod
}



 updateMenu();
 initCookieConsent();
 initDropdownControls();
 decoratePortfolioLabel();
 decorateSideCards();   // ✅ přidat
 ensureGoldTileIconStyle();

 loadPage(path, false);

 checkSession();
})();


// ===================================================
// ROUTER
// ===================================================

function decoratePortfolioLabel() {
  const el = document.getElementById('menu-portfolio');
  if (!el || el.querySelector('.mp-label')) return;

  el.setAttribute('aria-label', 'Moje portfolio');
  el.innerHTML = `
    <span class="mp-label" aria-hidden="true">
      <span class="mp-word-small">moje</span>
      <span class="mp-word-main">portfolio</span>
    </span>
  `;
}

function updateMenu() {
    const portfolioLink = document.getElementById("menu-portfolio");
    const btnLogin = document.getElementById("btn-login");
    const btnLogout = document.getElementById("btn-logout");

    const logged = isLoggedIn();

    if (portfolioLink) {
        portfolioLink.style.display = logged ? "inline-flex" : "none";
        decoratePortfolioLabel();
    }

    if (btnLogin) {
        btnLogin.style.display = logged ? "none" : "inline-block";
    }

    if (btnLogout) {
        btnLogout.style.display = logged ? "inline-block" : "none";
    }
}

function openLoginModal(initialView = 'login') {
    // Zabraň vícenásobnému otevření stejného modalu.
    const existing = document.querySelector('.modal-backdrop.auth-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop auth-modal';
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const state = {
        email: '',
        password: ''
    };

    function closeModal() {
        modal.remove();
        document.body.style.overflow = '';
    }

    function setMessage(text, type = 'info') {
        const el = modal.querySelector('#auth-message');
        if (!el) return;
        el.textContent = text || '';
        el.className = `auth-message ${type}`;
        el.style.display = text ? 'block' : 'none';
    }

    function setLoading(isLoading) {
        modal.querySelectorAll('button').forEach(btn => {
            btn.disabled = !!isLoading;
        });
    }

    function renderLogin() {
        modal.innerHTML = `
            <div class="tx-modal">
                <h3>Přihlášení</h3>
                <p id="auth-message" class="auth-message" style="display:none"></p>

                <label>Email</label>
                <input id="login-email" class="tx-input" placeholder="Email" autocomplete="email" value="${state.email || ''}">

                <label>Heslo</label>
                <input id="login-password" type="password" class="tx-input" placeholder="Heslo" autocomplete="current-password">

                <div class="tx-actions">
                    <button class="pill-button" id="login-cancel">Zrušit</button>
                    <button class="pill-button" id="login-submit">Přihlásit</button>
                </div>

                <div class="tx-actions">
                    <button class="pill-button" id="login-register">Nemám účet → Registrovat</button>
                </div>

                <div class="tx-actions">
                    <button class="pill-button" id="login-forgot">Zapomněl jsem heslo</button>
                </div>
            </div>
        `;

        modal.querySelector('#login-cancel').onclick = closeModal;

        modal.querySelector('#login-submit').onclick = async () => {
            setLoading(true);
            const ok = await loginUser();
            setLoading(false);
            if (ok) closeModal();
        };

        modal.querySelector('#login-register').onclick = () => {
            state.email = modal.querySelector('#login-email')?.value.trim() || '';
            renderRegisterRequest();
        };

        modal.querySelector('#login-forgot').onclick = () => {
            state.email = modal.querySelector('#login-email')?.value.trim() || '';
            renderPasswordResetRequest();
        };
    }

    function renderRegisterRequest() {
        modal.innerHTML = `
            <div class="tx-modal">
                <h3>Registrace</h3>
                <p id="auth-message" class="auth-message" style="display:none"></p>

                <label>Email</label>
                <input id="reg-email" class="tx-input" placeholder="Email" autocomplete="email" value="${state.email || ''}">

                <label>Heslo</label>
                <input id="reg-password" type="password" class="tx-input" placeholder="Minimálně 8 znaků" autocomplete="new-password">

                <div class="tx-actions">
                    <button class="pill-button" id="reg-back">Zpět</button>
                    <button class="pill-button" id="reg-send-code">Poslat ověřovací kód</button>
                </div>
            </div>
        `;

        modal.querySelector('#reg-back').onclick = renderLogin;

        modal.querySelector('#reg-send-code').onclick = async () => {
            state.email = modal.querySelector('#reg-email').value.trim();
            state.password = modal.querySelector('#reg-password').value;

            setLoading(true);
            const result = await requestRegistrationCode(state.email, state.password);
            setLoading(false);

            if (result.ok) {
                renderRegisterConfirm();
                setMessage(result.message || 'Ověřovací kód jsme poslali e-mailem. Platí 10 minut.', 'success');
            } else {
                setMessage(result.error || 'Nepodařilo se odeslat ověřovací kód.', 'error');
            }
        };
    }

    function renderRegisterConfirm() {
        modal.innerHTML = `
            <div class="tx-modal">
                <h3>Ověření e-mailu</h3>
                <p id="auth-message" class="auth-message" style="display:none"></p>
                <p class="meta">Na e-mail <strong>${state.email}</strong> jsme poslali 6místný kód. Kód platí 10 minut.</p>

                <label>Ověřovací kód</label>
                <input id="reg-code" class="tx-input" placeholder="123456" inputmode="numeric" maxlength="6" autocomplete="one-time-code">

                <div class="tx-actions">
                    <button class="pill-button" id="reg-code-back">Zpět</button>
                    <button class="pill-button" id="reg-code-confirm">Dokončit registraci</button>
                </div>

                <div class="tx-actions">
                    <button class="pill-button" id="reg-code-resend">Poslat nový kód</button>
                </div>
            </div>
        `;

        modal.querySelector('#reg-code-back').onclick = renderRegisterRequest;

        modal.querySelector('#reg-code-confirm').onclick = async () => {
            const code = modal.querySelector('#reg-code').value.trim();
            setLoading(true);
            const result = await confirmRegistrationCode(state.email, code);
            setLoading(false);

            if (result.ok) {
                storeAuthResult(result.data);
                resetInactivityTimer();
                updateMenu();
                closeModal();
                loadPage('portfolio');
            } else {
                setMessage(result.error || 'Kód není platný nebo vypršel.', 'error');
            }
        };

        modal.querySelector('#reg-code-resend').onclick = async () => {
            setLoading(true);
            const result = await requestRegistrationCode(state.email, state.password);
            setLoading(false);
            setMessage(
                result.ok ? (result.message || 'Poslali jsme nový ověřovací kód.') : (result.error || 'Nepodařilo se odeslat nový kód.'),
                result.ok ? 'success' : 'error'
            );
        };
    }

    function renderPasswordResetRequest() {
        modal.innerHTML = `
            <div class="tx-modal">
                <h3>Obnovení hesla</h3>
                <p id="auth-message" class="auth-message" style="display:none"></p>

                <label>Email</label>
                <input id="reset-email" class="tx-input" placeholder="Email" autocomplete="email" value="${state.email || ''}">

                <div class="tx-actions">
                    <button class="pill-button" id="reset-back">Zpět</button>
                    <button class="pill-button" id="reset-send-code">Poslat kód</button>
                </div>
            </div>
        `;

        modal.querySelector('#reset-back').onclick = renderLogin;

        modal.querySelector('#reset-send-code').onclick = async () => {
            state.email = modal.querySelector('#reset-email').value.trim();
            setLoading(true);
            const result = await requestPasswordResetCode(state.email);
            setLoading(false);

            if (result.ok) {
                renderPasswordResetConfirm();
                setMessage(result.message || 'Pokud účet existuje, poslali jsme ověřovací kód.', 'success');
            } else {
                setMessage(result.error || 'Nepodařilo se odeslat kód.', 'error');
            }
        };
    }

    function renderPasswordResetConfirm() {
        modal.innerHTML = `
            <div class="tx-modal">
                <h3>Nastavení nového hesla</h3>
                <p id="auth-message" class="auth-message" style="display:none"></p>
                <p class="meta">Zadejte 6místný kód z e-mailu a nové heslo.</p>

                <label>Ověřovací kód</label>
                <input id="reset-code" class="tx-input" placeholder="123456" inputmode="numeric" maxlength="6" autocomplete="one-time-code">

                <label>Nové heslo</label>
                <input id="reset-password" type="password" class="tx-input" placeholder="Minimálně 8 znaků" autocomplete="new-password">

                <div class="tx-actions">
                    <button class="pill-button" id="reset-code-back">Zpět</button>
                    <button class="pill-button" id="reset-confirm">Změnit heslo</button>
                </div>

                <div class="tx-actions">
                    <button class="pill-button" id="reset-resend">Poslat nový kód</button>
                </div>
            </div>
        `;

        modal.querySelector('#reset-code-back').onclick = renderPasswordResetRequest;

        modal.querySelector('#reset-confirm').onclick = async () => {
            const code = modal.querySelector('#reset-code').value.trim();
            const password = modal.querySelector('#reset-password').value;
            setLoading(true);
            const result = await confirmPasswordResetCode(state.email, code, password);
            setLoading(false);

            if (result.ok) {
                renderLogin();
                setMessage('Heslo bylo změněno. Teď se můžete přihlásit.', 'success');
            } else {
                setMessage(result.error || 'Kód není platný nebo vypršel.', 'error');
            }
        };

        modal.querySelector('#reset-resend').onclick = async () => {
            setLoading(true);
            const result = await requestPasswordResetCode(state.email);
            setLoading(false);
            setMessage(
                result.ok ? (result.message || 'Poslali jsme nový kód.') : (result.error || 'Nepodařilo se odeslat nový kód.'),
                result.ok ? 'success' : 'error'
            );
        };
    }

    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });

    if (initialView === 'register') {
        renderRegisterRequest();
    } else {
        renderLogin();
    }
}


// ===================================================
// SEO METADATA PRO SPA ROUTER
// ===================================================
function updateSeoForPage(page) {
  const normalizedPage = String(page || 'uvod').replace(/^\/+|\/+$/g, '') || 'uvod';
  const section = normalizedPage.split('/')[0];
  const privatePage = section === 'portfolio';
  const seoByPage = {
    uvod: ['Moje portfolio | Přehled investic, ETF, akcií a fondů', 'Přehled investic na jednom místě. Sledujte ETF, akcie, podílové fondy, penzijní spoření, indexy, kryptoměny a měnové kurzy a vytvořte si vlastní portfolio.'],
    penze: ['Penzijní fondy | Výkonnost a riziko | Moje portfolio', 'Přehled penzijních účastnických fondů, jejich výkonnosti, rizikovosti, historického vývoje a posledního dostupného ocenění.'],
    'podilove-fondy': ['Podílové fondy | Výkonnost a srovnání | Moje portfolio', 'Přehled podílových fondů, jejich historické výkonnosti, rizika, měny fondu a posledního dostupného ocenění.'],
    akcie: ['Akcie | Ceny, výkonnost a riziko | Moje portfolio', 'Přehled vybraných akcií, historického vývoje cen, výkonnosti, rizikových ukazatelů a dalších tržních údajů.'],
    etf: ['ETF | Přehled, výkonnost a riziko | Moje portfolio', 'Přehled vybraných ETF včetně historického vývoje ceny, výkonnosti, rizika a posledního dostupného ocenění.'],
    indexy: ['Akciové indexy | Historický vývoj | Moje portfolio', 'Přehled vybraných světových akciových indexů, jejich hodnoty, dlouhodobé výkonnosti a historického vývoje.'],
    crypto: ['Kryptoměny | Ceny a historický vývoj | Moje portfolio', 'Přehled vybraných kryptoměn a digitálních aktiv včetně cen, výkonnosti a historického vývoje.'],
    meny: ['Měnové kurzy | Vývoj kurzů vůči CZK | Moje portfolio', 'Přehled vybraných měnových kurzů vůči české koruně, jejich aktuálních hodnot a historického vývoje.'],
    slovnik: ['Investiční slovníček | Moje portfolio', 'Srozumitelné vysvětlení základních pojmů z oblasti investování, fondů, ETF, akcií, rizika a výkonnosti.'],
    aktualizace: ['Aktualizace dat | Moje portfolio', 'Informace o aktualizaci, dostupnosti a zdrojích investičních a tržních dat na webu Moje portfolio.'],
    upozorneni: ['Investiční upozornění | Moje portfolio', 'Důležité informace o rizicích investování a informativním charakteru údajů dostupných na webu Moje portfolio.'],
    gdpr: ['Ochrana osobních údajů | Moje portfolio', 'Informace o ochraně a zpracování osobních údajů na webu Moje portfolio.'],
    cookies: ['Nastavení cookies | Moje portfolio', 'Informace o používání nezbytných a volitelných cookies na webu Moje portfolio.']
  };
  const seo = seoByPage[section] || seoByPage.uvod;
  const canonicalUrl = section === 'uvod'
    ? 'https://www.moje-portfolio.cz/'
    : `https://www.moje-portfolio.cz/${normalizedPage}`;
  document.title = seo[0];
  const setMeta = (selector, type, name, value) => {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(type, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  };
  setMeta('meta[name="description"]', 'name', 'description', seo[1]);
  setMeta('meta[name="robots"]', 'name', 'robots', privatePage ? 'noindex,nofollow,noarchive' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  setMeta('meta[property="og:title"]', 'property', 'og:title', seo[0]);
  setMeta('meta[property="og:description"]', 'property', 'og:description', seo[1]);
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;
}

function loadPage(page, pushState = true) {

if (!page || page === "undefined") {
    page = "uvod";
}

  updateSeoForPage(page);  
 const main = document.getElementById('mainContent'); // ✅ přesun sem

 if (!main) {
  console.error('mainContent not found');
  return;
 }



 main.innerHTML = ''; // bezpečné
     if (typeof hideTooltip === 'function') hideTooltip();


    
     // 🔥 vždy reset obsah (kill nested render)
  
     window.scrollTo(0, 0);


    // 🔒 ochrana portfolio přes JWT token
    if (page.startsWith('portfolio') && !isLoggedIn()) {
        clearSession();
        updateMenu();
        openLoginModal();
        return;
    }

    // ===============================
    // OSOBNÍ PORTFOLIO (delegace)
    // ===============================
    if (page.startsWith('portfolio')) {
        if (window.loadPortfolioPage) {
            window.loadPortfolioPage(page);

            if (pushState) {
                history.pushState({ page }, '', `/${page}`);
            }
            return;
        }
    }

    // ===============================
    // DETAIL PAGES
    // ===============================
    if (page.startsWith('penze/')) {
        loadFundDetail(page.split('/')[1]);
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }

    if (page.startsWith('podilove-fondy/')) {
        loadPodilovyFondDetail(page.split('/')[1]);
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }

    if (page.startsWith('akcie/')) {
        loadStockDetail(decodeURIComponent(page.split('/')[1]));
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }

    if (page.startsWith('etf/')) {
        loadStockDetail(decodeURIComponent(page.split('/')[1]));
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }
    if (page.startsWith('crypto/')) {
        loadStockDetail(decodeURIComponent(page.split('/')[1]));
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }

    if (page.startsWith('meny/')) {
        loadCurrencyDetail(page.split('/')[1]);
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }
    if (page.startsWith('indexy/')) {
        loadStockDetail(decodeURIComponent(page.split('/')[1]));
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }

    // ===============================
    // STANDARD PAGE LOAD
    // ===============================
    fetch(`/pages/${page}.html`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.text();
        })
        .then(html => {
          
const main = document.getElementById('mainContent');
 if (!main) return;

            main.innerHTML = html;

            
            ensurePageIntro(page);

            decorateSideCards();
            ensureGoldTileIconStyle();
            if (page === 'penze') loadPensionFunds();
            if (page === 'podilove-fondy') loadPodiloveFondy();
            if (page === 'akcie') loadStocks();
            if (page === 'etf') loadEtfs();
            if (page === 'crypto') loadCrypto();
            if (page === 'meny') loadCurrencies();
            if (page === 'indexy') loadIndexes();

            trackCurrentPage(page);

            if (pushState) {
                history.pushState({ page }, '', `/${page}`);
            }
        })
        .catch(() => {
    console.warn("Page not found, redirect to uvod:", page);

    history.replaceState({ page: "uvod" }, "", "/uvod");
    loadPage("uvod", false);
      });
    }

// ===================================================
// PENZE preHLED
// ===================================================


// ===================================================
// OVERVIEW TABLE HELPERS – mobile/table view
// ===================================================
function ensureOverviewTableStyle() {
  if (document.getElementById('overview-table-style')) return;

  const style = document.createElement('style');
  style.id = 'overview-table-style';
  style.textContent = `
    .overview-view-switch {
      display: flex;
      gap: .5rem;
      justify-content: flex-end;
      margin: 0 0 1rem;
    }

    .overview-view-switch .pill-button.active {
      background: #C9A646;
      color: #111;
      border-color: #C9A646;
    }

    @media (max-width: 767px) {
      .overview-view-switch {
        justify-content: stretch;
      }

      .overview-view-switch .pill-button {
        flex: 1;
      }

      .overview-table,
      #fundTable .dps-overview-table {
        display: table !important;
        width: 100% !important;
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0;
      }

      .overview-table thead,
      #fundTable .dps-overview-table thead {
        display: table-header-group !important;
      }

      .overview-table tbody,
      #fundTable .dps-overview-table tbody {
        display: table-row-group !important;
      }

      .overview-table tr,
      #fundTable .dps-overview-table tr {
        display: table-row !important;
      }

      .overview-table th,
      .overview-table td,
      #fundTable .dps-overview-table th,
      #fundTable .dps-overview-table td {
        display: table-cell !important;
        padding: 10px 8px !important;
        font-size: 11px !important;
        vertical-align: middle;
      }

      .overview-table td::before,
      #fundTable .dps-overview-table td::before {
        content: none !important;
        display: none !important;
      }

      .overview-table th:nth-child(1),
      .overview-table td:nth-child(1),
      #fundTable .dps-overview-table th:nth-child(1),
      #fundTable .dps-overview-table td:nth-child(1) {
        width: 40%;
      }

      .overview-table th:nth-child(2),
      .overview-table td:nth-child(2),
      #fundTable .dps-overview-table th:nth-child(2),
      #fundTable .dps-overview-table td:nth-child(2) {
        width: 18%;
        text-align: right;
      }

      .overview-table th:nth-child(3),
      .overview-table td:nth-child(3),
      #fundTable .dps-overview-table th:nth-child(3),
      #fundTable .dps-overview-table td:nth-child(3) {
        width: 21%;
        text-align: right;
      }

      .overview-table th:nth-child(4),
      .overview-table td:nth-child(4),
      #fundTable .dps-overview-table th:nth-child(4),
      #fundTable .dps-overview-table td:nth-child(4) {
        width: 21%;
        text-align: right;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureOverviewViewShell(grid, prefix) {
  ensureOverviewTableStyle();

  let switchEl = document.getElementById(`${prefix}-view-switch`);
  if (!switchEl) {
    switchEl = document.createElement('div');
    switchEl.id = `${prefix}-view-switch`;
    switchEl.className = 'overview-view-switch';
    switchEl.innerHTML = `
      <button id="${prefix}-view-grid" class="pill-button">Dlaždice</button>
      <button id="${prefix}-view-table" class="pill-button">Řádky</button>
    `;
    grid.parentNode.insertBefore(switchEl, grid);
  }

  let table = document.getElementById(`${prefix}Table`);
  if (!table) {
    table = document.createElement('div');
    table.id = `${prefix}Table`;
    grid.insertAdjacentElement('afterend', table);
  }

  return {
    table,
    gridBtn: document.getElementById(`${prefix}-view-grid`),
    tableBtn: document.getElementById(`${prefix}-view-table`)
  };
}


function formatPerf(value) {
  return value != null && !isNaN(Number(value))
    ? `${Number(value).toFixed(2)} %`
    : '—';
}

function formatPerf3Y(value) {
  return formatPerf(value);
}

function formatPerf5Y(value) {
  return formatPerf(value);
}

function perfClass(value) {
  return value == null || isNaN(Number(value))
    ? ''
    : Number(value) >= 0 ? 'pos' : 'neg';
}

function formatLastValuation(item) {
  if (!item) return '';

  const date = item.lastValuationDate
    ? new Date(item.lastValuationDate).toLocaleDateString('cs-CZ')
    : '';

  const value = item.lastValue ?? item.lastValuationValue;
  const valueText = value != null && !isNaN(Number(value))
    ? Number(value).toLocaleString('cs-CZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      })
    : '';

  if (valueText && date) return `${valueText} · ${date}`;
  if (date) return date;
  if (valueText) return valueText;
  return '';
}

function getLastValue(item) {
  return item?.lastValue ?? item?.lastValuationValue ?? item?.lastRate ?? item?.lastExchangeRate ?? item?.rate ?? null;
}

function getLastValuationDate(item) {
  return item?.lastValuationDate ?? item?.lastDate ?? item?.date ?? null;
}

function formatOverviewValue(value, options = {}) {
  const { suffix = '', min = 2, max = 4 } = options;
  if (value == null || isNaN(Number(value))) return '—';
  const text = Number(value).toLocaleString('cs-CZ', {
    minimumFractionDigits: min,
    maximumFractionDigits: max
  });
  return suffix ? `${text} ${suffix}` : text;
}



function ensureStockCzkToggleStyle() { /* Styly detailu jsou centralne v styles.css. */ }

function formatStockMoney(value, currency, decimals = 2) {
  if (value == null || isNaN(Number(value))) return '—';
  const text = Number(value).toLocaleString('cs-CZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return currency ? `${text} ${currency}` : text;
}

function formatDividendPair(value, currency, valueCzk) {
  const hasValue = value != null && !isNaN(Number(value)) && Number(value) !== 0;
  const hasCzk = valueCzk != null && !isNaN(Number(valueCzk)) && Number(valueCzk) !== 0;

  if (!hasValue && !hasCzk) return '—';

  const main = hasValue
    ? Number(value).toLocaleString('cs-CZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      }) + (currency ? ` ${currency}` : '')
    : '—';

  const czk = hasCzk
    ? Number(valueCzk).toLocaleString('cs-CZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + ' CZK'
    : '—';

  return `${main}<br><small>${czk}</small>`;
}

function isPositiveNumber(value) {
  return value != null && !isNaN(Number(value)) && Number(value) > 0;
}

function isStockCzkMode() {
  return canShowStockAdvancedDetail() && !!document.getElementById('stock-show-czk')?.checked;
}

function getStockChartValue(row, useCzk) {
  if (!row) return null;
  if (useCzk) {
    // Důležité: nula znamená nepřepočteno, ne platnou cenu.
    return isPositiveNumber(row.closeCzk) ? Number(row.closeCzk) : null;
  }
  return row.close != null && !isNaN(Number(row.close)) ? Number(row.close) : null;
}

function getStockDisplayRows(data, useCzk) {
  if (!Array.isArray(data)) return [];
  if (!useCzk) return data.filter(d => d.close != null && !isNaN(Number(d.close)));
  // V CZK režimu vyhazujeme řádky bez přepočtu nebo s nulovou CZK hodnotou.
  return data.filter(d => isPositiveNumber(d.closeCzk));
}

function formatOverviewDate(value) {
  return value ? new Date(value).toLocaleDateString('cs-CZ') : '—';
}

function renderOverviewCardMetric(item) {
  const last = formatLastValuation(item);

  return `
    <div class="fund-perf ${perfClass(item?.perf3Y)}">
      3 roky: <strong>${formatPerf3Y(item?.perf3Y)}</strong>
    </div>
    <div class="fund-perf ${perfClass(item?.perf5Y)}">
      5 let: <strong>${formatPerf5Y(item?.perf5Y)}</strong>
    </div>
    ${last ? `<small>Poslední ocenění: ${last}</small>` : ''}
  `;
}

function normalizeOverviewSortValue(value) {
  if (value == null || value === '—') return '';
  return typeof value === 'string' ? value.toLowerCase() : value;
}
function renderThreeColumnOverviewTable({
  table,
  data,
  getName,
  getMetric,
  getPerf3Y = item => item?.perf3Y,
  getPerf5Y = item => item?.perf5Y,
  getId,
  onSelect,
  metricLabel = 'Měna'
}) {
  const sortKey = table.dataset.sortKey || 'name';
  const sortAsc = table.dataset.sortAsc !== 'false';

  const getters = {
    name: getName,
    metric: getMetric,
    perf3Y: getPerf3Y,
    perf5Y: getPerf5Y
  };

  const sortedData = [...data].sort((a, b) => {
    const getter = getters[sortKey] || getName;
    const A = normalizeOverviewSortValue(getter(a));
    const B = normalizeOverviewSortValue(getter(b));

    if (A < B) return sortAsc ? -1 : 1;
    if (A > B) return sortAsc ? 1 : -1;
    return 0;
  });

  table.innerHTML = `
    <table class="fund-table overview-table">
      <thead>
        <tr>
          <th data-key="name" class="${sortKey === 'name' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">Název</th>
          <th data-key="metric" class="${sortKey === 'metric' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">${metricLabel}</th>
          <th data-key="perf3Y" class="${sortKey === 'perf3Y' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">Výnos 3 roky</th>
          <th data-key="perf5Y" class="${sortKey === 'perf5Y' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">Výnos 5 let</th>
        </tr>
      </thead>
      <tbody>
        ${sortedData.map(item => {
          const p3y = getPerf3Y(item);
          const p5y = getPerf5Y(item);
          const last = formatLastValuation(item);

          return `
            <tr data-id="${getId(item)}" ${last ? `title="Poslední ocenění: ${last}"` : ''}>
              <td data-label="Název">${getName(item) || ''}</td>
              <td data-label="${metricLabel}">${getMetric(item) || ''}</td>
              <td data-label="Výnos 3 roky" class="${perfClass(p3y)}">${formatPerf3Y(p3y)}</td>
              <td data-label="Výnos 5 let" class="${perfClass(p5y)}">${formatPerf5Y(p5y)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  // řazení klikem na hlavičku – stejné chování jako v penzích
  table.querySelectorAll('th').forEach(th => {
    th.onclick = e => {
      e.stopPropagation();
      const key = th.dataset.key;
      if (!key) return;

      const currentKey = table.dataset.sortKey || 'name';
      const currentAsc = table.dataset.sortAsc !== 'false';

      table.dataset.sortKey = key;
      table.dataset.sortAsc = currentKey === key ? String(!currentAsc) : 'true';

      renderThreeColumnOverviewTable({
        table,
        data,
        getName,
        getMetric,
        getPerf3Y,
        getPerf5Y,
        getId,
        onSelect,
        metricLabel
      });
    };
  });

  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(tr => {
    tr.addEventListener('mouseenter', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
    });

    tr.addEventListener('click', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
      onSelect(tr.dataset.id);
    });
  });
}

async function ensureFundsMeta() {
  if (apiCache.dpsFundsMeta) return apiCache.dpsFundsMeta;

  // Pokud už byl načten přehled penzí, použij ho i jako metadata pro detail.
  // Tím se při otevření detailu z přehledu nevolá zbytečně znovu get_dps_funds.
  if (Array.isArray(apiCache.dpsFundsOverview)) {
    apiCache.dpsFundsMeta = apiCache.dpsFundsOverview;
    return apiCache.dpsFundsMeta;
  }

  if (!apiCache.dpsMetaPromise) {
    apiCache.dpsMetaPromise = cachedJsonFetch(publicDataProxyUrl('dps-list'))
      .then(data => {
        apiCache.dpsFundsMeta = Array.isArray(data) ? data : [];
        return apiCache.dpsFundsMeta;
      })
      .finally(() => {
        apiCache.dpsMetaPromise = null;
      });
  }

  return apiCache.dpsMetaPromise;
}

function loadPensionFunds() {
  const grid = document.getElementById('fundGrid');
  const table = document.getElementById('fundTable');
  if (!grid || !table) return;

  ensureOverviewTableStyle();

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';
  let sort = { key: 'name', asc: true };

  const selectFund = isin => {
    history.pushState({ page: `penze/${isin}` }, '', `/penze/${isin}`);
    loadFundDetail(isin);
  };

  // ---------- VIEW SWITCH ----------
  const gridBtn = document.getElementById('view-grid');
  const tableBtn = document.getElementById('view-table');

  if (gridBtn) {
    gridBtn.onclick = () => {
      viewMode = 'grid';
      updateView();
    };
  }

  if (tableBtn) {
    tableBtn.onclick = () => {
      viewMode = 'table';
      updateView();
    };
  }

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');

    if (gridBtn) gridBtn.classList.toggle('active', viewMode === 'grid');
    if (tableBtn) tableBtn.classList.toggle('active', viewMode === 'table');

    const mobileSort = document.querySelector('.mobile-sort');
    if (mobileSort) {
      mobileSort.classList.toggle('hidden', viewMode !== 'table');
    }

    if (viewMode === 'grid') renderGrid();
    else renderTable();
  }

  // ---------- GRID ----------
  function renderGrid() {
    grid.innerHTML = '';

    apiCache.dpsFundsOverview.forEach(f => {
      const card = document.createElement('div');
      card.className = 'fund-card';

      card.innerHTML = `
        <h3>${f.name}</h3>
        <small>${f.provider || ''}</small>
        ${renderOverviewCardMetric(f)}
      `;

      card.onclick = () => selectFund(f.isin);
      grid.appendChild(card);
    });
  }

  // ---------- TABLE ----------
  function renderTable() {
    const data = [...apiCache.dpsFundsOverview];

    // ---------- SORT ----------
    data.sort((a, b) => {
      let A = a[sort.key];
      let B = b[sort.key];

      if (A == null) A = '';
      if (B == null) B = '';

      if (typeof A === 'string') A = A.toLowerCase();
      if (typeof B === 'string') B = B.toLowerCase();

      if (A < B) return sort.asc ? -1 : 1;
      if (A > B) return sort.asc ? 1 : -1;
      return 0;
    });

    const mobileSortSelect = document.getElementById('mobile-sort-select');
    const mobileSortDir = document.getElementById('mobile-sort-dir');

    if (mobileSortSelect && mobileSortDir) {
      mobileSortSelect.innerHTML = `
        <option value="name">Název</option>
        <option value="riskCategory">Riziko</option>
        <option value="perf3Y">Výnos 3 roky</option>
        <option value="perf5Y">Výnos 5 let</option>
        <option value="lastValue">Poslední ocenění</option>
        <option value="lastValuationDate">Datum ocenění</option>
      `;
      mobileSortSelect.value = sort.key;

      mobileSortSelect.onchange = () => {
        sort.key = mobileSortSelect.value;
        renderTable();
      };

      mobileSortDir.onclick = () => {
        sort.asc = !sort.asc;
        mobileSortDir.textContent = sort.asc ? '↑' : '↓';
        mobileSortDir.classList.toggle('active', !sort.asc);
        renderTable();
      };
    }

    // ---------- RENDER ----------
    table.innerHTML = `
      <table class="fund-table dps-overview-table">
        <thead>
          <tr>
            <th data-key="name">Název</th>
            <th data-key="riskCategory">Riziko</th>
            <th data-key="perf3Y">Výnos 3 roky</th>
            <th data-key="perf5Y">Výnos 5 let</th>
            <th data-key="lastValue">Poslední ocenění</th>
            <th data-key="lastValuationDate">Datum ocenění</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(f => `
            <tr data-isin="${f.isin}">
              <td data-label="Název">${f.name}</td>
              <td data-label="Riziko">${f.riskCategory != null ? f.riskCategory + ' / 7' : '—'}</td>
              <td data-label="Výnos 3 roky" class="${perfClass(f.perf3Y)}">
                ${formatPerf3Y(f.perf3Y)}
              </td>
              <td data-label="Výnos 5 let" class="${perfClass(f.perf5Y)}">
                ${formatPerf5Y(f.perf5Y)}
              </td>
              <td data-label="Poslední ocenění">
                ${formatOverviewValue(getLastValue(f))}
              </td>
              <td data-label="Datum ocenění">
                ${formatOverviewDate(getLastValuationDate(f))}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // ---------- SORT HANDLERS ----------
    table.querySelectorAll('th').forEach(th => {
      th.onclick = e => {
        e.stopPropagation();
        const key = th.dataset.key;
        if (!key) return;

        sort.asc = sort.key === key ? !sort.asc : true;
        sort.key = key;
        renderTable();
      };
    });

    // ---------- ROW INTERACTION ----------
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
      tr.addEventListener('mouseenter', () => {
        rows.forEach(r => r.classList.remove('active'));
        tr.classList.add('active');
      });

      tr.addEventListener('click', () => {
        rows.forEach(r => r.classList.remove('active'));
        tr.classList.add('active');
        selectFund(tr.dataset.isin);
      });
    });
  }

  // ---------- INIT ----------
  grid.innerHTML = '<p>Načítám fondy…</p>';
  table.innerHTML = '';

  cachedJsonFetch(publicDataProxyUrl('dps-list'))
    .then(data => {
      apiCache.dpsFundsOverview = Array.isArray(data) ? data : [];
      apiCache.dpsFundsMeta = apiCache.dpsFundsOverview;
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání fondů</p>';
      table.innerHTML = '<p>Chyba načítání fondů</p>';
    });
}

function renderFundMeta(isin) {
  if (!apiCache.dpsFundsMeta) return;

  const normalizedIsin = String(isin || '').trim();
  const fund = apiCache.dpsFundsMeta.find(f => String(f.isin || '').trim() === normalizedIsin);
  if (!fund) return;

  const nameEl = document.getElementById('fund-name');
  const providerEl = document.getElementById('fund-provider');
  const riskEl = document.getElementById('kpi-risk');
  const link = document.getElementById('fund-url');
  const titleEl = document.getElementById('fund-title');

  if (nameEl) nameEl.textContent = fund.name || 'Detail fondu - web ↗';
  if (titleEl) titleEl.textContent = fund.name || 'Detail fondu - web ↗';
  if (providerEl) providerEl.textContent = fund.provider || '';
  if (riskEl) {
    riskEl.textContent = fund.riskCategory != null ? `${fund.riskCategory} / 7` : '—';
    riskEl.className = fund.riskCategory != null ? 'risk risk-' + fund.riskCategory : 'risk';
  }

  // Rychlé vyplnění poslední hodnoty z přehledového endpointu ještě před načtením historie.
  const lastEl = document.getElementById('kpi-last');
  const value = fund.lastValue ?? fund.lastValuationValue;
  if (lastEl && value != null && !isNaN(Number(value))) {
    const dateText = fund.lastValuationDate
      ? ` (${new Date(fund.lastValuationDate).toLocaleDateString('cs-CZ')})`
      : '';
    const currency = fund.currency ? ` ${fund.currency}` : '';
    lastEl.textContent = `${Number(value).toFixed(4)}${currency}${dateText}`;
  }

  if (link) {
    if (fund.url) {
      link.href = fund.url.startsWith('http') ? fund.url : `https://${fund.url}`;
      link.style.display = '';
    } else {
      link.style.display = 'none';
    }
  }
  renderInstrumentRiskMetrics('dps', fund);
}

async function getDpsTableMetrics(isin) {
  if (apiCache.dpsTableMetrics[isin]) {
    return apiCache.dpsTableMetrics[isin];
  }

  let data = await cachedJsonFetch(
    publicDataProxyUrl('dps', isin)
  );
  if (!Array.isArray(data) || data.length < 2) {
    return null;
  }

  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  const last = data.at(-1);
  const lastDate = new Date(last.date);

  // 3Y zpět
  const from = new Date(lastDate);
  from.setFullYear(from.getFullYear() - 3);

  const threeY = data.find(d => new Date(d.date) >= from) || data[0];
  const perf3Y = ((last.value - threeY.value) / threeY.value) * 100;

  const result = {
    lastDate,
    perf3Y
  };

  apiCache.dpsTableMetrics[isin] = result;
  return result;
}


function metricValueFromObject(obj, ...keys) {
  for (const key of keys) {
    if (obj && obj[key] != null && !isNaN(Number(obj[key]))) return Number(obj[key]);
  }
  return null;
}

function maybeRenderInstrumentRiskPanel(prefix) {
  if (!canShowStockAdvancedDetail()) return '';
  return `
    <section class="stock-risk-panel">
      <h4>Riziko a výnos</h4>
      <div class="stock-risk-grid">
        <div class="stock-risk-metric" data-tooltip="Volatilita vyjadřuje, jak výrazně a často kolísá cena v čase. Čím je vyšší, tím větší je nejistota budoucího vývoje ceny, a tedy i potenciál jak vyšších zisků, tak vyšších ztrát."><div class="stock-risk-label"><span>Volatilita 3Y</span><span class="stock-risk-help" data-tooltip="Volatilita vyjadřuje, jak výrazně a často kolísá cena v čase. Čím je vyšší, tím větší je nejistota budoucího vývoje ceny, a tedy i potenciál jak vyšších zisků, tak vyšších ztrát." aria-label="Vysvětlení metriky Volatilita 3Y">?</span></div><strong id="${prefix}-risk-vol-3y">—</strong></div>
        <div class="stock-risk-metric" data-tooltip="Největší pokles od průběžného maxima za poslední 3 roky. Ukazuje historicky nejhlubší propad fondu v daném období."><div class="stock-risk-label"><span>Max. propad 3Y</span><span class="stock-risk-help" data-tooltip="Největší pokles od průběžného maxima za poslední 3 roky. Ukazuje historicky nejhlubší propad fondu v daném období." aria-label="Vysvětlení metriky Max. propad 3Y">?</span></div><strong id="${prefix}-risk-dd-3y">—</strong></div>
        <div class="stock-risk-metric" hidden data-tooltip="Rozdíl mezi 3letým výnosem fondu a 3letým výnosem jeho benchmarku. Kladná hodnota znamená lepší vývoj než benchmark."><div class="stock-risk-label"><span>Výnos vs benchmark 3Y</span><span class="stock-risk-help" data-tooltip="Rozdíl mezi 3letým výnosem fondu a 3letým výnosem jeho benchmarku. Kladná hodnota znamená lepší vývoj než benchmark." aria-label="Vysvětlení metriky Výnos vs benchmark 3Y">?</span></div><strong id="${prefix}-risk-vs-bmk-3y">—</strong></div>
        <div class="stock-risk-metric" hidden data-tooltip="Rozdíl mezi 5letým výnosem fondu a 5letým výnosem jeho benchmarku. Kladná hodnota znamená lepší vývoj než benchmark."><div class="stock-risk-label"><span>Výnos vs benchmark 5Y</span><span class="stock-risk-help" data-tooltip="Rozdíl mezi 5letým výnosem fondu a 5letým výnosem jeho benchmarku. Kladná hodnota znamená lepší vývoj než benchmark." aria-label="Vysvětlení metriky Výnos vs benchmark 5Y">?</span></div><strong id="${prefix}-risk-vs-bmk-5y">—</strong></div>
      </div>
    </section>
  `;
}

function setOptionalBenchmarkMetric(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const metric = el.closest('.stock-risk-metric');
  const hasValue = value != null && !isNaN(Number(value)) && Number(value) !== 0;
  if (metric) metric.hidden = !hasValue;
  if (hasValue) setRiskMetric(id, value, 2, true);
}

function renderInstrumentRiskMetrics(prefix, item) {
  if (!canShowStockAdvancedDetail() || !item) return;
  const vol3Y = metricValueFromObject(item, 'volatility3Y', 'Volatility3Y');
  const dd3Y = metricValueFromObject(item, 'maxDrawdown3Y', 'MaxDrawdown3Y');
  const vs3Y = metricValueFromObject(item, 'perfVsBenchmark3Y', 'PerfVsBenchmark3Y');
  const vs5Y = metricValueFromObject(item, 'perfVsBenchmark5Y', 'PerfVsBenchmark5Y');
  setRiskMetric(`${prefix}-risk-vol-3y`, vol3Y);
  setRiskMetric(`${prefix}-risk-dd-3y`, dd3Y, 2, true);
  setOptionalBenchmarkMetric(`${prefix}-risk-vs-bmk-3y`, vs3Y);
  setOptionalBenchmarkMetric(`${prefix}-risk-vs-bmk-5y`, vs5Y);
}
// ===================================================
// DETAIL FONDU
// ===================================================

function loadFundDetail(isin) {
  
const main = document.getElementById('mainContent');
 if (!main) return;

  main.innerHTML = `
    <h3 id="fund-name">Detail fondu</h3>

     <p class="meta">
      <span id="fund-provider"></span>
    </p>

    <div class="kpi-row">
      <div class="kpi">
        <span>Poslední hodnota</span>
        <strong id="kpi-last"> - </strong>
      </div>

      <div class="kpi">
        <span>Změna</span>
        <strong id="kpi-change"> - </strong>
      </div>

      <div class="kpi">
        <span>Rizikovost</span>
        <strong id="kpi-risk"> - </strong>
      </div>
    </div>

    <p class="meta">
      <a id="fund-url" href="#" target="_blank" rel="noopener">
        Detail fondu
      </a>
    </p>

    ${maybeRenderInstrumentRiskPanel('dps')}

    <div class="period-row">
      <div class="period-switch">
        
      <button data-period="1M" data-tooltip="Poslední měsíc">1M</button>
      <button data-period="6M" data-tooltip="Posledních 6 měsíců">6M</button>
      <button data-period="1Y" data-tooltip="Poslední rok">1Y</button>
      <button data-period="3Y" data-tooltip="Poslední 3 roky">3Y</button>
      <button data-period="5Y" data-tooltip="Posledních 5 let">5Y</button>
      <button data-period="MAX" data-tooltip="Celá historie">MAX</button>

      </div>
      <div id="period-diff" class="period-diff">—</div>
    </div>

    <div id="chart-portfolio"></div>
    
<button class="back-btn">
  ← Zpět
</button>

  `;

  // ✅ BACK
  document.querySelector('.back-btn').onclick = navigateSmartBack;

  // ✅ PERIOD SWITCH
  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document
        .querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));

      btn.classList.add('active');
      loadDPSData(isin, btn.dataset.period);
    };
  });

  const defaultPeriodBtn = document.querySelector('.period-switch button[data-period="3Y"]');
  if (defaultPeriodBtn) defaultPeriodBtn.classList.add('active');

  const chart = document.getElementById('chart-portfolio');
  if (chart) chart.innerHTML = '<p>Načítám historická data…</p>';

  // ✅ META se vykreslí okamžitě z přehledu, pokud už existuje.
  if (Array.isArray(apiCache.dpsFundsOverview)) {
    apiCache.dpsFundsMeta = apiCache.dpsFundsOverview;
    renderFundMeta(isin);
  }

  // ✅ META fallback při přímém otevření URL detailu.
  ensureFundsMeta()
    .then(() => renderFundMeta(isin))
    .catch(err => console.error('Chyba načítání metadat fondu:', err));

  // ✅ DATA
  loadDPSData(isin, '3Y');
}

async function loadDPSData(isin, period) {
  const cacheKey = String(isin || '').trim();
  const requestKey = `${cacheKey}|${period}`;
  window.__activeDpsRequestKey = requestKey;

  try {
    // ✅ 1️⃣ fetch jen jednou, včetně sdílené promise proti duplicitním klikům.
    if (!apiCache.dps[cacheKey]) {
      if (!apiCache.dpsPromises[cacheKey]) {
        const chart = document.getElementById('chart-portfolio');
        if (chart && !chart.innerHTML.trim()) {
          chart.innerHTML = '<p>Načítám historická data…</p>';
        }

        apiCache.dpsPromises[cacheKey] = cachedJsonFetch(
          publicDataProxyUrl('dps', cacheKey)
        )
          .then(data => {
            if (!Array.isArray(data)) data = [];
            data.sort((a, b) => new Date(a.date) - new Date(b.date));
            apiCache.dps[cacheKey] = data;
            return data;
          })
          .finally(() => {
            delete apiCache.dpsPromises[cacheKey];
          });
      }

      await apiCache.dpsPromises[cacheKey];
    }

    // Pokud mezitím uživatel přepnul fond/období, starý request už nevykresluj.
    if (window.__activeDpsRequestKey !== requestKey) return;

    // ✅ 2️⃣ period = frontend filtr (stejné jako akcie)
    const filtered = filterPeriod(apiCache.dps[cacheKey], period);
    const finalData = filtered.length ? filtered : apiCache.dps[cacheKey];

    // ✅ 3️⃣ render (KPI z plných dat, graf může být zlehčený)
    renderFundKPI(finalData);
    renderPeriodDifference(
      finalData.map(d => ({ value: d.value }))
    );
    renderPortfolioChart(
      downsampleHistory(finalData.map(d => ({ date: d.date, value: d.value })), 700),
      'chart-portfolio'
    );
  } catch (err) {
    console.error('Chyba načítání DPS dat:', err);
    const chart = document.getElementById('chart-portfolio');
    if (chart) chart.innerHTML = '<p>Chyba načítání historických dat.</p>';
  }
}

function renderFundKPI(data) {
  if (!data.length) return;
  const last = data.at(-1);
  const prev = data.at(-2);
  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');

  
   document.getElementById('kpi-last').textContent =
    `${last.value.toFixed(4)} ${last.currency} (${dateStr})`;


  if (prev) {
    const diff = last.value - prev.value;
    const pct = (diff / prev.value) * 100;
    const el = document.getElementById('kpi-change');
    el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}


// ===================================================
// PODILOVE FONDY
// ===================================================
function loadPodiloveFondy() {
  const grid = document.getElementById('podilovyFondGrid');
  if (!grid) return;

  const { table, gridBtn, tableBtn } = ensureOverviewViewShell(grid, 'podiloveFondy');
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';

  const selectFund = isin => {
    history.pushState(
      { page: `podilove-fondy/${isin}` },
      '',
      `/podilove-fondy/${isin}`
    );
    loadPodilovyFondDetail(isin);
  };

  gridBtn.onclick = () => {
    viewMode = 'grid';
    updateView();
  };

  tableBtn.onclick = () => {
    viewMode = 'table';
    updateView();
  };

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');
    gridBtn.classList.toggle('active', viewMode === 'grid');
    tableBtn.classList.toggle('active', viewMode === 'table');

    if (viewMode === 'grid') renderGrid();
    else renderTable();
  }

  function renderGrid() {
    grid.innerHTML = '';

    apiCache.podiloveFondyList.forEach(f => {
      const card = document.createElement('div');
      card.className = 'fund-card';
      card.innerHTML = `
        <h3>${f.name}</h3>
        <small>${f.manager || ''} · ${f.currency || ''}</small>
        ${renderOverviewCardMetric(f)}
      `;
      card.onclick = () => selectFund(f.isin);
      grid.appendChild(card);
    });
  }

  function renderTable() {
    if (!table.dataset.sortKey) { table.dataset.sortKey = 'name'; table.dataset.sortAsc = 'true'; }
    const data = [...apiCache.podiloveFondyList]
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'));

    renderThreeColumnOverviewTable({
      table,
      data,
      getName: f => f.name,
      getMetric: f => f.currency || f.mena || f.Mena || '',
      metricLabel: 'Měna',
      getPerf3Y: f => f.perf3Y,
      getPerf5Y: f => f.perf5Y,
      getId: f => f.isin,
      onSelect: selectFund
    });
  }

  grid.innerHTML = '<p>Načítám fondy…</p>';
  table.innerHTML = '';

  cachedJsonFetch(publicDataProxyUrl('funds-list'))
    .then(funds => {
      apiCache.podiloveFondyList = Array.isArray(funds) ? funds : [];
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání fondů</p>';
      table.innerHTML = '<p>Chyba načítání fondů</p>';
    });
}

function normalizeExternalUrl(url) {
  const value = String(url || '').trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

async function ensurePodiloveFondyList() {
  if (Array.isArray(apiCache.podiloveFondyList)) return apiCache.podiloveFondyList;
  const data = await cachedJsonFetch(publicDataProxyUrl('funds-list'));
  apiCache.podiloveFondyList = Array.isArray(data) ? data : [];
  return apiCache.podiloveFondyList;
}

function renderPodilovyFondMeta(fund) {
  if (!fund) return;

  const name = fund.name || fund.Name || fund.companyName || fund.CompanyName || '';
  const manager = fund.manager || fund.Manager || fund.spravce || fund.Spravce || fund.provider || fund.Provider || '';
  const currency = fund.currency || fund.Currency || fund.mena || fund.Mena || '';
  const url = normalizeExternalUrl(
    fund.url || fund.URL || fund.web || fund.Web || fund.detailUrl || fund.detailURL || fund.fundUrl || fund.fundURL
  );

  const nameEl = document.getElementById('pf-name');
  const titleEl = document.getElementById('pf-title');
  const managerEl = document.getElementById('pf-kpi-manager');
  const currencyEl = document.getElementById('pf-kpi-currency');
  const link = document.getElementById('pf-url');

  if (nameEl && name) nameEl.textContent = name;
  if (titleEl && name) titleEl.textContent = name;
  if (managerEl) managerEl.textContent = manager || '—';
  if (currencyEl) currencyEl.textContent = currency || '—';

  if (link) {
    if (url) {
      link.href = url;
      link.style.display = '';
    } else {
      link.style.display = 'none';
    }
  }
  renderInstrumentRiskMetrics('pf', fund);
}

function loadPodilovyFondDetail(isin) {
  const main = document.getElementById('mainContent');
  if (!main) return;

  main.innerHTML = `
  <h3 id="pf-title">Detail fondu</h3>
  <div class="stock-detail-head">
    <p class="meta"><span id="pf-name"> - </span><br><small>ID: ${isin}</small></p>
    <div class="stock-detail-actions">
      <label class="stock-czk-toggle" title="Porovná vývoj fondu s benchmark indexem.">
        <input type="checkbox" id="pf-compare-index" aria-label="Porovnat s indexem">
        <span class="toggle-track" aria-hidden="true"></span><span class="toggle-text">Porovnat s indexem</span>
      </label>
      <div id="pf-benchmark-info" class="stock-benchmark-info" aria-live="polite"><span>Benchmark</span><strong id="pf-benchmark-name">—</strong></div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi">
      <span>Poslední kurz</span>
      <strong id="pf-kpi-last">-</strong>
    </div>
    <div class="kpi">
      <span>Změna</span>
      <strong id="pf-kpi-change">-</strong>
    </div>
    <div class="kpi">
      <span>Správce</span>
      <strong id="pf-kpi-manager">-</strong>
    </div>
    <div class="kpi">
      <span>Měna fondu</span>
      <strong id="pf-kpi-currency">-</strong>
    </div>
  </div>

  ${maybeRenderInstrumentRiskPanel('pf')}

  <div class="period-row">
    <div class="period-switch">
      
      <button data-period="1M" data-tooltip="Poslední měsíc">1M</button>
      <button data-period="6M" data-tooltip="Posledních 6 měsíců">6M</button>
      <button data-period="1Y" data-tooltip="Poslední rok">1Y</button>
      <button data-period="3Y" data-tooltip="Poslední 3 roky">3Y</button>
      <button data-period="5Y" data-tooltip="Posledních 5 let">5Y</button>
      <button data-period="MAX" data-tooltip="Celá historie">MAX</button>

    </div>
    <div id="period-diff" class="period-diff">—</div>
  </div>

  <p class="meta">
    <a id="pf-url" href="#" target="_blank" rel="noopener">
      Detail fondu
    </a>
  </p>

  <div id="chart-podilovy-fond"></div>

  
<button class="back-btn">
  ← Zpět
</button>

  `;

  // ✅ BACK
  document.querySelector('.back-btn').onclick = navigateSmartBack;

  // ✅ PERIOD SWITCH
  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPodilovyFondData(isin, btn.dataset.period);
    };
  });

  const defaultPfPeriodBtn = document.querySelector('.period-switch button[data-period="3Y"]');
  if (defaultPfPeriodBtn) defaultPfPeriodBtn.classList.add('active');
  const compareToggle = document.getElementById('pf-compare-index');
  if (compareToggle) compareToggle.onchange = () => {
    const activePeriod = document.querySelector('.period-switch button.active')?.dataset.period || '3Y';
    loadPodilovyFondData(isin, activePeriod);
  };

  // ✅ metadata – název, správce a odkaz na detail fondu
  const list = apiCache.podiloveFondyList;
  if (Array.isArray(list)) {
    const fund = list.find(f => String(f.isin || '').trim() === String(isin || '').trim());
    renderPodilovyFondMeta(fund);
  } else {
    ensurePodiloveFondyList()
      .then(funds => {
        const fund = funds.find(f => String(f.isin || '').trim() === String(isin || '').trim());
        renderPodilovyFondMeta(fund);
      })
      .catch(err => console.error('Chyba načítání metadat podílového fondu:', err));
  }

  // ✅ data
  loadPodilovyFondData(isin, '3Y');
}

function updatePodilovyFondBenchmarkInfo(name, ticker, visible) {
  const box = document.getElementById('pf-benchmark-info');
  const value = document.getElementById('pf-benchmark-name');
  if (!box || !value) return;
  value.textContent = formatComparisonLabel(name, ticker) || '—';
  box.classList.toggle('is-visible', !!visible);
}

async function loadPodilovyFondData(isin, period) {
  if (!apiCache.podiloveFondy[isin]) {
    let data = await cachedJsonFetch(publicDataProxyUrl('fund', isin));
    if (!Array.isArray(data)) data = [];
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    apiCache.podiloveFondy[isin] = data;
  }
  const allRows = apiCache.podiloveFondy[isin];
  const filtered = filterPeriod(allRows, period);
  const finalData = filtered.length ? filtered : allRows;
  renderPodilovyFondKPI(finalData);
  renderPeriodDifference(finalData);
  const fundSeries = finalData.map(d => ({ date: d.date, value: Number(d.value) }))
    .filter(d => d.date && Number.isFinite(d.value) && d.value > 0);
  if (document.getElementById('pf-compare-index')?.checked && fundSeries.length > 1) {
    const funds = await ensurePodiloveFondyList();
    const fund = funds.find(f => String(f.isin || '').trim() === String(isin || '').trim()) || {};
    const benchmarkTicker = getBenchmarkTickerForStock(fund);
    const benchmarkData = await ensureStockHistory(benchmarkTicker);
    const benchmarkFiltered = filterPeriod(benchmarkData, period);
    const benchmarkRows = benchmarkFiltered.length ? benchmarkFiltered : benchmarkData;
    const alignedBenchmarkRows = alignBenchmarkToStockDates(finalData, benchmarkRows, r => r.close);
    const alignedFundRows = finalData.filter(r => alignedBenchmarkRows.some(b => b.date === r.date));
    const fundNormalized = normalizeSeriesToBase100(alignedFundRows, r => r.value);
    const benchmarkNormalized = normalizeSeriesToBase100(alignedBenchmarkRows, r => r.close);
    const benchmarkName = getInstrumentDisplayName(benchmarkData[0], benchmarkTicker);
    updatePodilovyFondBenchmarkInfo(benchmarkName, benchmarkTicker, true);
    if (fundNormalized.length > 1 && benchmarkNormalized.length > 1) {
      renderStockComparisonChart(fundNormalized, benchmarkNormalized, 'chart-podilovy-fond',
        getInstrumentDisplayName(fund, isin), formatComparisonLabel(benchmarkName, benchmarkTicker));
      return;
    }
  }
  updatePodilovyFondBenchmarkInfo('', '', false);
  renderPortfolioChart(fundSeries, 'chart-podilovy-fond');
}


function renderPodilovyFondKPI(data) {
  if (!data.length) return;

  const last = data.at(-1);
  const prev = data.at(-2);
  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');

  document.getElementById('pf-kpi-last').textContent =
    `${last.value.toFixed(4)} ${last.currency} (${dateStr})`;


  if (prev) {
    const diff = last.value - prev.value;
    const pct = (diff / prev.value) * 100;
    const el = document.getElementById('pf-kpi-change');
    el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}

// ===================================================
// SPOLECNY ZDROJ PRO AKCIE / ETF / CRYPTO
// ===================================================
async function ensureStockUniverse() {
  if (Array.isArray(apiCache.stockUniverse)) return apiCache.stockUniverse;
  if (apiCache.stockUniversePromise) return apiCache.stockUniversePromise;

  apiCache.stockUniversePromise = cachedJsonFetch(publicDataProxyUrl('stocks-list'))
    .then(stocks => {
      const universe = Array.isArray(stocks) ? stocks : [];
      apiCache.stockUniverse = universe;
      apiCache.stocksList = universe.filter(s => s.sector !== 'ETF' && s.sector !== 'Cryptocurrency' && s.sector !== 'Index');
      apiCache.etfsList = universe.filter(s => s.sector === 'ETF');
      apiCache.cryptoList = universe.filter(s => s.sector === 'Cryptocurrency');
      apiCache.indexesList = universe.filter(s => s.sector === 'Index');
      return universe;
    })
    .finally(() => {
      apiCache.stockUniversePromise = null;
    });

  return apiCache.stockUniversePromise;
}

// ===================================================
// AKCIE preEHLED
// ===================================================
function loadStocks() {
  const grid = document.getElementById('stockGrid');
  if (!grid) return;

  const { table, gridBtn, tableBtn } = ensureOverviewViewShell(grid, 'stocks');
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';

  const selectStock = ticker => {
    history.pushState({ page: `akcie/${ticker}` }, '', `/akcie/${ticker}`);
    loadStockDetail(ticker);
  };

  gridBtn.onclick = () => {
    viewMode = 'grid';
    updateView();
  };

  tableBtn.onclick = () => {
    viewMode = 'table';
    updateView();
  };

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');
    gridBtn.classList.toggle('active', viewMode === 'grid');
    tableBtn.classList.toggle('active', viewMode === 'table');

    if (viewMode === 'grid') renderGrid();
    else renderTable();
  }

  function renderGrid() {
    grid.innerHTML = '';

    apiCache.stocksList.forEach(s => {
      const card = document.createElement('div');
      card.className = 'fund-card';
      card.innerHTML = `
        <h3>${s.name}</h3>
        <small>${s.ticker} · ${s.currency || s.mena || s.Mena || ''}</small>
        ${renderOverviewCardMetric(s)}
      `;
      card.onclick = () => selectStock(s.ticker);
      grid.appendChild(card);
    });
  }

  function renderTable() {
    if (!table.dataset.sortKey) { table.dataset.sortKey = 'name'; table.dataset.sortAsc = 'true'; }
    const data = [...apiCache.stocksList]
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'));

    renderThreeColumnOverviewTable({
      table,
      data,
      getName: s => s.name,
      getMetric: s => s.currency || s.mena || s.Mena || '',
      metricLabel: 'Měna',
      getPerf3Y: s => s.perf3Y,
      getPerf5Y: s => s.perf5Y,
      getId: s => s.ticker,
      onSelect: selectStock
    });
  }

  grid.innerHTML = '<p>Načítám akcie ...</p>';
  table.innerHTML = '';

  ensureStockUniverse()
    .then(() => {
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání akcií</p>';
      table.innerHTML = '<p>Chyba načítání akcií</p>';
    });
}

function loadEtfs() {
  const grid = document.getElementById('etfGrid');
  if (!grid) return;

  const { table, gridBtn, tableBtn } = ensureOverviewViewShell(grid, 'etfs');
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';

  const selectEtf = ticker => {
    history.pushState({ page: `etf/${ticker}` }, '', `/etf/${ticker}`);
    loadStockDetail(ticker);
  };

  gridBtn.onclick = () => {
    viewMode = 'grid';
    updateView();
  };

  tableBtn.onclick = () => {
    viewMode = 'table';
    updateView();
  };

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');
    gridBtn.classList.toggle('active', viewMode === 'grid');
    tableBtn.classList.toggle('active', viewMode === 'table');

    if (viewMode === 'grid') renderGrid();
    else renderTable();
  }

  function renderGrid() {
    grid.innerHTML = '';

    apiCache.etfsList.forEach(s => {
      const card = document.createElement('div');
      card.className = 'fund-card';
      card.innerHTML = `
        <h3>${s.name}</h3>
        <small>${s.ticker} · ${s.currency || s.mena || s.Mena || ''}</small>
        ${renderOverviewCardMetric(s)}
      `;
      card.onclick = () => selectEtf(s.ticker);
      grid.appendChild(card);
    });
  }

  function renderTable() {
    if (!table.dataset.sortKey) { table.dataset.sortKey = 'name'; table.dataset.sortAsc = 'true'; }
    const data = [...apiCache.etfsList]
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'));

    renderThreeColumnOverviewTable({
      table,
      data,
      getName: s => s.name,
      getMetric: s => s.currency || s.mena || s.Mena || '',
      metricLabel: 'Měna',
      getPerf3Y: s => s.perf3Y,
      getPerf5Y: s => s.perf5Y,
      getId: s => s.ticker,
      onSelect: selectEtf
    });
  }

  grid.innerHTML = '<p>Načítám ETF…</p>';
  table.innerHTML = '';

  ensureStockUniverse()
    .then(() => {
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání ETF</p>';
      table.innerHTML = '<p>Chyba načítání ETF</p>';
    });
}


function loadCrypto() {
  const grid = document.getElementById('cryptoGrid');
  if (!grid) return;

  const { table, gridBtn, tableBtn } = ensureOverviewViewShell(grid, 'crypto');
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';

  const selectCrypto = ticker => {
    history.pushState({ page: `crypto/${ticker}` }, '', `/crypto/${ticker}`);
    loadStockDetail(ticker);
  };

  gridBtn.onclick = () => {
    viewMode = 'grid';
    updateView();
  };
  tableBtn.onclick = () => {
    viewMode = 'table';
    updateView();
  };

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');
    gridBtn.classList.toggle('active', viewMode === 'grid');
    tableBtn.classList.toggle('active', viewMode === 'table');
    if (viewMode === 'grid') renderGrid();
    else renderTable();
  }

  function renderGrid() {
    grid.innerHTML = '';
    apiCache.cryptoList.forEach(s => {
      const card = document.createElement('div');
      card.className = 'fund-card';
      card.innerHTML = `
        <h3>${s.name}</h3>
        <small>${s.ticker} · ${s.currency || s.mena || s.Mena || ''}</small>
        ${renderOverviewCardMetric(s)}
      `;
      card.onclick = () => selectCrypto(s.ticker);
      grid.appendChild(card);
    });
  }

  function renderTable() {
    if (!table.dataset.sortKey) { table.dataset.sortKey = 'name'; table.dataset.sortAsc = 'true'; }
    const data = [...apiCache.cryptoList]
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'));

    renderThreeColumnOverviewTable({
      table,
      data,
      getName: s => s.name,
      getMetric: s => s.currency || s.mena || s.Mena || '',
      metricLabel: 'Měna',
      getPerf3Y: s => s.perf3Y,
      getPerf5Y: s => s.perf5Y,
      getId: s => s.ticker,
      onSelect: selectCrypto
    });
  }

  grid.innerHTML = '<p>Načítám kryptoměny…</p>';
  table.innerHTML = '';

  ensureStockUniverse()
    .then(() => {
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání kryptoměn</p>';
      table.innerHTML = '<p>Chyba načítání kryptoměn</p>';
    });
}


function loadIndexes() {
  const grid = document.getElementById('indexGrid');
  if (!grid) return;
  const { table, gridBtn, tableBtn } = ensureOverviewViewShell(grid, 'indexes');
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';

  const selectIndex = ticker => {
    history.pushState({ page: `indexy/${encodeURIComponent(ticker)}` }, '', `/indexy/${encodeURIComponent(ticker)}`);
    loadStockDetail(ticker);
  };

  gridBtn.onclick = () => { viewMode = 'grid'; updateView(); };
  tableBtn.onclick = () => { viewMode = 'table'; updateView(); };

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');
    gridBtn.classList.toggle('active', viewMode === 'grid');
    tableBtn.classList.toggle('active', viewMode === 'table');
    if (viewMode === 'grid') renderGrid();
    else renderTable();
  }

  function renderGrid() {
    grid.innerHTML = '';
    (apiCache.indexesList || []).forEach(x => {
      const card = document.createElement('div');
      card.className = 'fund-card';
      card.innerHTML = `
        <h3>${x.name}</h3>
        <small>${x.ticker} · ${x.currency || x.mena || x.Mena || ''}</small>
        ${renderOverviewCardMetric(x)}
      `;
      card.onclick = () => selectIndex(x.ticker);
      grid.appendChild(card);
    });
  }

  function renderTable() {
    if (!table.dataset.sortKey) { table.dataset.sortKey = 'name'; table.dataset.sortAsc = 'true'; }
    const data = [...(apiCache.indexesList || [])]
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'));
    renderThreeColumnOverviewTable({
      table,
      data,
      getName: x => x.name,
      getMetric: x => x.currency || x.mena || x.Mena || '',
      metricLabel: 'Měna',
      getPerf3Y: x => x.perf3Y,
      getPerf5Y: x => x.perf5Y,
      getId: x => x.ticker,
      onSelect: selectIndex
    });
  }

  grid.innerHTML = '<p>Načítám indexy…</p>';
  table.innerHTML = '';
  ensureStockUniverse()
    .then(() => updateView())
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání indexů</p>';
      table.innerHTML = '<p>Chyba načítání indexů</p>';
    });
}

function formatRiskPercent(value, decimals = 2) {
  if (value == null || isNaN(Number(value))) return '—';
  return `${Number(value).toLocaleString('cs-CZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} %`;
}
function setRiskMetric(id, value, decimals = 2, signed = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = formatRiskPercent(value, decimals);
  el.className = '';
  if (signed && value != null && !isNaN(Number(value))) el.className = Number(value) >= 0 ? 'pos' : 'neg';
}
// Riziko, výnosy, benchmark a zobrazení v CZK jsou nyní veřejné bez přihlášení.
// Až bude potřeba funkce znovu uzamknout, vrať sem podmínku isLoggedIn().
function canShowStockAdvancedDetail() {
  return true;
}
function isStockCompareMode() { return canShowStockAdvancedDetail() && !!document.getElementById('stock-compare-index')?.checked; }
function getBenchmarkTickerForStock(row) { return row?.benchmarkTicker || row?.BenchmarkTicker || '^DJI'; }
function getInstrumentDisplayName(row, fallback = '') { return row?.name || row?.Name || row?.companyName || row?.CompanyName || row?.ticker || fallback; }
function formatComparisonLabel(name, ticker) {
  const cleanName = String(name || '').trim(); const cleanTicker = String(ticker || '').trim();
  if (!cleanName) return cleanTicker;
  if (!cleanTicker || cleanName.toLowerCase() === cleanTicker.toLowerCase()) return cleanName;
  return `${cleanName} (${cleanTicker})`;
}
function updateBenchmarkInfo(name, ticker, visible) {
  const box = document.getElementById('stock-benchmark-info'); const value = document.getElementById('stock-benchmark-name');
  if (!box || !value) return;
  value.textContent = formatComparisonLabel(name, ticker) || '—'; box.classList.toggle('is-visible', !!visible);
}
function normalizeSeriesToBase100(rows, valueGetter) {
  const cleaned = (rows || []).map(r => ({ date: r.date, value: valueGetter(r) })).filter(r => r.value != null && !isNaN(Number(r.value)) && Number(r.value) > 0);
  if (cleaned.length < 2) return [];
  const base = Number(cleaned[0].value);
  return cleaned.map(r => ({ date: r.date, value: Number(r.value) / base * 100 }));
}
function alignBenchmarkToStockDates(stockRows, benchmarkRows, benchmarkGetter) {
  const benchmarkByDate = new Map((benchmarkRows || []).filter(r => benchmarkGetter(r) != null && !isNaN(Number(benchmarkGetter(r))) && Number(benchmarkGetter(r)) > 0).map(r => [r.date, r]));
  return (stockRows || []).map(r => benchmarkByDate.get(r.date)).filter(Boolean);
}
async function ensureStockHistory(ticker) {
  if (!apiCache.stocks[ticker]) {
    let data = await cachedJsonFetch(publicDataProxyUrl('stock', ticker));
    if (!Array.isArray(data)) data = [];
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    apiCache.stocks[ticker] = data;
  }
  return apiCache.stocks[ticker];
}
function renderStockComparisonChart(stockSeries, benchmarkSeries, containerId, stockLabel, benchmarkLabel) {
  lastChartData = { history: stockSeries, containerId, comparison: { stockSeries, benchmarkSeries, stockLabel, benchmarkLabel } };
  const div = document.getElementById(containerId); if (!div || stockSeries.length < 2 || benchmarkSeries.length < 2) return;
  div.innerHTML = ''; div.style.position = 'relative';
  const legend = document.createElement('div'); legend.className = 'stock-comparison-legend'; legend.setAttribute('aria-label', 'Legenda porovnání');
  legend.innerHTML = `<span class="stock-comparison-legend-item"><span class="stock-comparison-legend-line stock"></span><span>${stockLabel}</span></span><span class="stock-comparison-legend-item"><span class="stock-comparison-legend-line benchmark"></span><span>Benchmark: ${benchmarkLabel}</span></span>`;
  div.appendChild(legend);
  const width = div.clientWidth || div.parentElement?.clientWidth || 320; const chartHeight = Math.min(width * .65, 320); const legendHeight = legend.offsetHeight || 40;
  div.style.height = chartHeight + legendHeight + 4 + 'px';
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = chartHeight; div.appendChild(canvas); const ctx = canvas.getContext('2d');
  const padding = { top: 16, right: width < 520 ? 42 : 60, bottom: 34, left: 22 }; const allValues = [...stockSeries,...benchmarkSeries].map(p=>p.value); const min=Math.min(...allValues); const max=Math.max(...allValues); const range=max-min||1;
  function xy(series,i){ return { x: padding.left+(i/(series.length-1))*(width-padding.left-padding.right), y: padding.top+((max-series[i].value)/range)*(chartHeight-padding.top-padding.bottom) }; }
  ctx.strokeStyle='#e6e6e6'; ctx.fillStyle='#666'; ctx.font='12px Arial'; ctx.textAlign='right';
  for(let i=0;i<=5;i++){ const y=padding.top+(i/5)*(chartHeight-padding.top-padding.bottom); ctx.beginPath(); ctx.moveTo(padding.left,y); ctx.lineTo(width-padding.right,y); ctx.stroke(); ctx.fillText((max-(i/5)*range).toFixed(1),width-6,y+4); }
  function drawLine(series,color,lineWidth){ ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=lineWidth; series.forEach((_,i)=>{const p=xy(series,i); i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}); ctx.stroke(); }
  drawLine(benchmarkSeries,'#6c7a89',1.6); drawLine(stockSeries,'#C9A646',2.2);
  ctx.textAlign='center'; ctx.fillStyle='#666'; const maxXTicks=width<500?3:5; const step=Math.max(1,Math.floor(stockSeries.length/maxXTicks));
  for(let i=0;i<stockSeries.length;i+=step){ const p=xy(stockSeries,i); ctx.fillText(new Date(stockSeries[i].date).toLocaleDateString('cs-CZ'),p.x,chartHeight-padding.bottom+8); }
}
function loadStockDetail(ticker) {
  const main = document.getElementById('mainContent');
  if (!main) return;

  const showAdvanced = canShowStockAdvancedDetail();
  const normalizedPath = location.pathname.replace(/^\/+/, '');
  const metaItem = (apiCache.stockUniverse || []).find(item => String(item.ticker || '').trim() === String(ticker || '').trim());
  const isIndexDetail = normalizedPath.startsWith('indexy/') || metaItem?.sector === 'Index';

  main.innerHTML = `
    <h3 id="stock-title">Detail akcie</h3>
    <div class="stock-detail-head">
      <p><strong id="stock-name"> - </strong><br><small>ID: ${ticker}</small></p>
      ${showAdvanced ? `
      <div class="stock-detail-actions">
        <label class="stock-czk-toggle" title="Přepne cenu a graf na CZK, pokud je dostupný přepočet.">
          <input type="checkbox" id="stock-show-czk" aria-label="Zobrazit v CZK">
          <span class="toggle-track" aria-hidden="true"></span><span class="toggle-text">Zobrazit v CZK</span>
        </label>
        ${!isIndexDetail ? `
        <label class="stock-czk-toggle" title="Porovná vývoj instrumentu s benchmark indexem.">
          <input type="checkbox" id="stock-compare-index" aria-label="Porovnat s indexem">
          <span class="toggle-track" aria-hidden="true"></span><span class="toggle-text">Porovnat s indexem</span>
        </label>
        <div id="stock-benchmark-info" class="stock-benchmark-info" aria-live="polite"><span>Benchmark</span><strong id="stock-benchmark-name">—</strong></div>` : ''}
      </div>` : ''}
    </div>

    <div class="kpi-row">
      <div class="kpi"><span>Poslední cena</span><strong id="stock-kpi-last"> - </strong></div>
      <div class="kpi"><span>Denní změna</span><strong id="stock-kpi-change"> - </strong></div>
      <div class="kpi"><span>Objem</span><strong id="stock-kpi-volume"> - </strong></div>
      <div class="kpi"><span>Burza</span><strong id="stock-kpi-exchange"> - </strong></div>
      ${!isIndexDetail ? `
      <div class="kpi"><span>Dividendy letos</span><strong id="stock-kpi-dividend-this-year"> - </strong></div>
      <div class="kpi"><span>Dividendy loni</span><strong id="stock-kpi-dividend-last-year"> - </strong></div>` : ''}
    </div>

    <p id="stock-meta" class="meta"> - </p>

    ${showAdvanced ? `
    <section class="stock-risk-panel">
      <h4>Riziko a výnos</h4>
      <div class="stock-risk-grid">
        <div class="stock-risk-metric"><div class="stock-risk-label"><span>Volatilita 1Y</span><span class="stock-risk-help" data-tooltip="Volatilita vyjadřuje, jak výrazně a často kolísá cena v čase. Čím je vyšší, tím větší je nejistota budoucího vývoje ceny, a tedy i potenciál jak vyšších zisků, tak vyšších ztrát." aria-label="Vysvětlení metriky Volatilita 1Y" role="button" tabindex="0">?</span></div><strong id="stock-risk-vol-1y">—</strong></div>
        <div class="stock-risk-metric"><div class="stock-risk-label"><span>Volatilita 3Y</span><span class="stock-risk-help" data-tooltip="Volatilita vyjadřuje, jak výrazně a často kolísá cena v čase. Čím je vyšší, tím větší je nejistota budoucího vývoje ceny, a tedy i potenciál jak vyšších zisků, tak vyšších ztrát." aria-label="Vysvětlení metriky Volatilita 3Y" role="button" tabindex="0">?</span></div><strong id="stock-risk-vol-3y">—</strong></div>
        <div class="stock-risk-metric"><div class="stock-risk-label"><span>Max. propad 1Y</span><span class="stock-risk-help" data-tooltip="Největší pokles od průběžného maxima za poslední rok. Ukazuje historicky nejhlubší propad v daném období." aria-label="Vysvětlení metriky Max. propad 1Y" role="button" tabindex="0">?</span></div><strong id="stock-risk-dd-1y">—</strong></div>
        ${!isIndexDetail ? `
        <div class="stock-risk-metric"><div class="stock-risk-label"><span>Div. výnos loni</span><span class="stock-risk-help" data-tooltip="Dividendový výnos za minulý kalendářní rok. Počítá se jako součet dividend za minulý rok dělený cenou instrumentu ke konci minulého roku." aria-label="Vysvětlení metriky Div. výnos loni" role="button" tabindex="0">?</span></div><strong id="stock-risk-div-yield">—</strong></div>
        <div class="stock-risk-metric"><div class="stock-risk-label"><span>Výnos vs index 3Y</span><span class="stock-risk-help" data-tooltip="Rozdíl mezi 3letým výnosem instrumentu a 3letým výnosem benchmark indexu. Kladná hodnota znamená lepší vývoj než index." aria-label="Vysvětlení metriky Výnos vs index 3Y" role="button" tabindex="0">?</span></div><strong id="stock-risk-vs-index-3y">—</strong></div>` : ''}
      </div>
    </section>` : ''}

    <div class="period-row">
      <div class="period-switch">
        <button data-period="1M" data-tooltip="Poslední měsíc">1M</button>
        <button data-period="6M" data-tooltip="Posledních 6 měsíců">6M</button>
        <button data-period="1Y" data-tooltip="Poslední rok">1Y</button>
        <button data-period="3Y" data-tooltip="Poslední 3 roky">3Y</button>
        <button data-period="5Y" data-tooltip="Posledních 5 let">5Y</button>
        <button data-period="MAX" data-tooltip="Celá historie">MAX</button>
      </div>
      <div id="period-diff" class="period-diff">—</div>
    </div>

    <div id="chart-stock"></div>
    <button class="back-btn">← Zpět</button>
  `;

  document.querySelector('.back-btn').onclick = navigateSmartBack;

  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadStockData(ticker, btn.dataset.period);
    };
  });

  ensureStockCzkToggleStyle();

  const defaultStockPeriodBtn = document.querySelector('.period-switch button[data-period="3Y"]');
  if (defaultStockPeriodBtn) defaultStockPeriodBtn.classList.add('active');

  if (showAdvanced) {
    ['stock-show-czk', 'stock-compare-index'].forEach(id => {
      const toggle = document.getElementById(id);
      if (toggle) {
        toggle.onchange = () => {
          const activePeriod = document.querySelector('.period-switch button.active')?.dataset.period || '3Y';
          loadStockData(ticker, activePeriod);
        };
      }
    });
  }

  loadStockData(ticker, '3Y');
}

function renderStockMeta(data) {
  if (!data.length) return;
  const first = data[0];
  const exchangeEl = document.getElementById('stock-kpi-exchange');
  if (exchangeEl) exchangeEl.textContent = first.exchange || ' - ';
  document.getElementById('stock-name').textContent = first.name || first.ticker;
  document.getElementById('stock-title').textContent = first.name || first.ticker;
  const symbol = first.symbolData || first.ticker;
  const exchange = first.exchange;
  const url = exchange ? `https://www.tradingview.com/symbols/${exchange}:${symbol}/` : null;
  const meta = document.getElementById('stock-meta');
  if (meta) {
    const sector = first.sector || first.sektor || '';
    const tradingViewLabel = sector === 'Cryptocurrency' ? 'Detail kryptoměny v TradingView ↗' : sector === 'ETF' ? 'Detail ETF v TradingView ↗' : 'Detail akcie v TradingView ↗';
    meta.innerHTML = url ? `<div><a href="${url}" target="_blank" rel="noopener" class="tv-link">${tradingViewLabel}</a></div>` : '';
  }
}
function renderStockRiskMetrics(data) {
  if (!canShowStockAdvancedDetail() || !data || !data.length) return;
  const first = data[0];
  setRiskMetric('stock-risk-vol-1y', first.volatility1Y);
  setRiskMetric('stock-risk-vol-3y', first.volatility3Y);
  setRiskMetric('stock-risk-dd-1y', first.maxDrawdown1Y, 2, true);
  setRiskMetric('stock-risk-div-yield', first.dividendYieldLastYear);
  setRiskMetric('stock-risk-vs-index-3y', first.perfVsBenchmark3Y, 2, true);
  const compareToggle = document.getElementById('stock-compare-index');
  if (compareToggle && first.benchmarkTicker) compareToggle.closest('label')?.setAttribute('title', `Porovná vývoj s benchmarkem ${first.benchmarkTicker}.`);
}

async function loadStockData(ticker, period) {
  const data = await ensureStockHistory(ticker);
  const filtered = filterPeriod(data, period);
  const finalData = filtered.length ? filtered : data;
  const useCzk = isStockCzkMode();
  const compareIndex = isStockCompareMode();
  const displayRows = getStockDisplayRows(finalData, useCzk);
  const stockRowsForChart = displayRows.length ? displayRows : finalData;
  renderStockMeta(finalData);
  renderStockKPI(stockRowsForChart);
  renderStockRiskMetrics(finalData);
  const chartData = stockRowsForChart.map(d => ({ date: d.date, value: getStockChartValue(d, useCzk) })).filter(d => d.value != null && !isNaN(Number(d.value)) && Number(d.value) > 0);
  renderPeriodDifference(chartData);
  if (compareIndex && stockRowsForChart.length) {
    const benchmarkTicker = getBenchmarkTickerForStock(finalData[0]);
    const benchmarkData = await ensureStockHistory(benchmarkTicker);
    const stockName = getInstrumentDisplayName(finalData[0], ticker);
    const benchmarkName = getInstrumentDisplayName(benchmarkData[0], benchmarkTicker);
    updateBenchmarkInfo(benchmarkName, benchmarkTicker, true);
    const benchmarkFiltered = filterPeriod(benchmarkData, period);
    const benchmarkRows = benchmarkFiltered.length ? benchmarkFiltered : benchmarkData;
    const alignedBenchmarkRows = alignBenchmarkToStockDates(stockRowsForChart, benchmarkRows, r => r.close);
    const alignedStockRows = stockRowsForChart.filter(r => alignedBenchmarkRows.some(b => b.date === r.date));
    const stockSeries = normalizeSeriesToBase100(alignedStockRows, r => getStockChartValue(r, useCzk));
    const benchmarkSeries = normalizeSeriesToBase100(alignedBenchmarkRows, r => r.close);
    if (stockSeries.length > 1 && benchmarkSeries.length > 1) {
      renderStockComparisonChart(stockSeries, benchmarkSeries, 'chart-stock', formatComparisonLabel(stockName, finalData[0]?.ticker || ticker), formatComparisonLabel(benchmarkName, benchmarkTicker));
      return;
    }
  }
  updateBenchmarkInfo('', '', false);
  renderPortfolioChart(chartData, 'chart-stock');
}

function renderStockKPI(data) {
  if (!data.length) return;
  const useCzk = isStockCzkMode();
  const validRows = getStockDisplayRows(data, useCzk);
  const rowsForPrice = validRows.length ? validRows : data;
  const last = rowsForPrice.at(-1);
  const prev = rowsForPrice.at(-2);
  const first = data[0];
  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');
  const originalCurrency = last.currency ?? '';
  const displayCurrency = useCzk ? 'CZK' : originalCurrency;
  const lastValue = getStockChartValue(last, useCzk);
  document.getElementById('stock-kpi-last').textContent = lastValue != null ? `${formatStockMoney(lastValue, displayCurrency, 2)} (${dateStr})` : '—';
  document.getElementById('stock-kpi-volume').textContent = last.volume?.toLocaleString('cs-CZ') ?? ' - ';
  const divThisYearEl = document.getElementById('stock-kpi-dividend-this-year');
  const divLastYearEl = document.getElementById('stock-kpi-dividend-last-year');
  if (divThisYearEl) { const value = useCzk ? first.dividendThisYearCzk : first.dividendThisYear; divThisYearEl.textContent = formatStockMoney(value, useCzk ? 'CZK' : originalCurrency, useCzk ? 2 : 4); divThisYearEl.className = Number(value || 0) > 0 ? 'pos' : ''; }
  if (divLastYearEl) { const value = useCzk ? first.dividendLastYearCzk : first.dividendLastYear; divLastYearEl.textContent = formatStockMoney(value, useCzk ? 'CZK' : originalCurrency, useCzk ? 2 : 4); divLastYearEl.className = Number(value || 0) > 0 ? 'pos' : ''; }
  if (prev) {
    const prevValue = getStockChartValue(prev, useCzk);
    const diff = lastValue != null && prevValue != null ? lastValue - prevValue : null;
    const pct = diff != null && prevValue ? (diff / prevValue) * 100 : null;
    const el = document.getElementById('stock-kpi-change');
    if (diff != null && pct != null) { el.textContent = `${diff.toFixed(2)} (${pct.toFixed(2)}%)`; el.className = diff >= 0 ? 'pos' : 'neg'; }
    else { el.textContent = ' - '; el.className = ''; }
  } else document.getElementById('stock-kpi-change').textContent = ' - ';
}

// ===================================================
// GRAF (SPOLEcne)
// ===================================================
let lastChartData = null;

function downsampleHistory(history, maxPoints = 700) {
  if (!Array.isArray(history) || history.length <= maxPoints) return history || [];

  const result = [];
  const step = (history.length - 1) / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i++) {
    result.push(history[Math.round(i * step)]);
  }

  return result;
}

function renderPortfolioChart(history, containerId) {
 lastChartData = { history, containerId };

 const div = document.getElementById(containerId);
 if (!div || history.length < 2) return;

 div.innerHTML = '';
 div.style.position = 'relative';

 
 const width = div.clientWidth;
 const height = Math.min(width * 0.65, 320);
 div.style.height = height + 'px';

 // ✅ BASE CANVAS (graf)
 const baseCanvas = document.createElement('canvas');
 baseCanvas.width = width;
 baseCanvas.height = height;
 baseCanvas.style.position = 'absolute';
 baseCanvas.style.left = '0';
 baseCanvas.style.top = '0';

 // ✅ OVERLAY CANVAS (hover)
 const overlayCanvas = document.createElement('canvas');
 overlayCanvas.width = width;
 overlayCanvas.height = height;
 overlayCanvas.style.position = 'absolute';
 overlayCanvas.style.left = '0';
 overlayCanvas.style.top = '0';

 div.appendChild(baseCanvas);
 div.appendChild(overlayCanvas);

 // Tooltip
 const tooltip = document.createElement('div');
 tooltip.style.position = 'absolute';
 tooltip.style.pointerEvents = 'none';
 tooltip.style.background = 'rgba(82,82,82,0.95)';
 tooltip.style.color = '#C9A646';
 tooltip.style.padding = '6px 8px';
 tooltip.style.fontSize = '11px';
 tooltip.style.borderRadius = '6px';
 tooltip.style.display = 'none';
 tooltip.style.whiteSpace = 'nowrap';
 div.appendChild(tooltip);

 const ctx = baseCanvas.getContext('2d');
 const octx = overlayCanvas.getContext('2d');

 const padding = { top: 20, right: 60, bottom: 30, left: 20 };

 const values = history.map(p => p.value);
 const min = Math.min(...values);
 const max = Math.max(...values);
 const range = max - min || 1;

 const w = width;
 const h = height;

 const points = history.map((p, i) => ({
  x: padding.left + (i / (history.length - 1)) * (w - padding.left - padding.right),
  y: padding.top + ((max - p.value) / range) * (h - padding.top - padding.bottom)
 }));

 // =====================================================
 // ✅ BASE CHART (vykreslí se jen jednou)
 // =====================================================

 ctx.strokeStyle = '#e6e6e6';
 ctx.fillStyle = '#666';
 ctx.font = '12px Arial';
 ctx.textAlign = 'right';

 for (let i = 0; i <= 5; i++) {
  const y = padding.top + (i / 5) * (h - padding.top - padding.bottom);
  ctx.beginPath();
  ctx.moveTo(padding.left, y);
  ctx.lineTo(w - padding.right, y);
  ctx.stroke();

  ctx.fillText((max - (i / 5) * range).toFixed(2), w - 8, y + 4);
 }

 // AREA
 ctx.beginPath();
 ctx.moveTo(points[0].x, h - padding.bottom);
 points.forEach(pt => ctx.lineTo(pt.x, pt.y));
 ctx.lineTo(points.at(-1).x, h - padding.bottom);

 const gradient = ctx.createLinearGradient(0, padding.top, 0, h);
 gradient.addColorStop(0, 'rgba(201,162,70,0.35)');
 gradient.addColorStop(1, 'rgba(201,162,70,0.02)');
 ctx.fillStyle = gradient;
 ctx.fill();

 // LINE
 ctx.beginPath();
 ctx.strokeStyle = '#C9A646';
 ctx.lineWidth = 1.8;
 points.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
 ctx.stroke();

 // =====================================================
 // ✅ X AXIS
 // =====================================================

 ctx.textAlign = 'center';
 ctx.textBaseline = 'top';
 ctx.fillStyle = '#666';

 const maxXTicks = w < 500 ? 3 : 5;
 const step = Math.max(1, Math.floor(history.length / maxXTicks));

 for (let i = 0; i < history.length; i += step) {
  const x = padding.left + (i / (history.length - 1)) * (w - padding.left - padding.right);
  const d = new Date(history[i].date);

  const label = d.toLocaleDateString('cs-CZ');

  ctx.beginPath();
  ctx.moveTo(x, h - padding.bottom);
  ctx.lineTo(x, h - padding.bottom + 4);
  ctx.stroke();

  ctx.fillText(label, x, h - padding.bottom + 6);
 }

 // =====================================================
 // ✅ HOVER (overlay canvas)
 // =====================================================

 overlayCanvas.addEventListener('mousemove', e => {
  const rect = overlayCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;

  const index = Math.round(
   (x - padding.left) /
   (w - padding.left - padding.right) *
   (history.length - 1)
  );

  if (index < 0 || index >= history.length) {
   tooltip.style.display = 'none';
   octx.clearRect(0, 0, w, h);
   return;
  }

  const p = points[index];
  const d = history[index];

  // ✅ smaž jen overlay
  octx.clearRect(0, 0, w, h);

  // ✅ vertikální čára
  octx.beginPath();
  octx.strokeStyle = 'rgba(201,166,70,0.7)';
  octx.lineWidth = 1;
  octx.setLineDash([4, 4]);
  octx.moveTo(p.x, padding.top);
  octx.lineTo(p.x, h - padding.bottom);
  octx.stroke();

  tooltip.style.display = 'block';
  tooltip.innerHTML =
   new Date(d.date).toLocaleDateString('cs-CZ') +
   '<br><strong>' + d.value.toFixed(4) + '</strong>';

  tooltip.style.left = (p.x + 10) + 'px';
  tooltip.style.top = (p.y) + 'px';
 });

 overlayCanvas.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
  octx.clearRect(0, 0, w, h);
 });
}

function renderPeriodDifference(data) {
  const box = document.getElementById('period-diff');
  if (!box || data.length < 2) {
    if (box) box.innerHTML = 'Změna&nbsp;—';
    return;
  }

  const first = data[0];
  const last = data.at(-1);

  const diff = last.value - first.value;
  const pct = (diff / first.value) * 100;

  box.innerHTML = `Změna&nbsp;${diff.toFixed(4)} (<strong>${pct.toFixed(2)} %</strong>)`;

  box.className =
    'period-diff ' + (diff >= 0 ? 'pos' : 'neg');
}

// ===================================================
// RESIZE
// ===================================================
window.addEventListener('resize', () => {
  if (!lastChartData) return;
  if (lastChartData.comparison) {
    renderStockComparisonChart(
      lastChartData.comparison.stockSeries,
      lastChartData.comparison.benchmarkSeries,
      lastChartData.containerId,
      lastChartData.comparison.stockLabel,
      lastChartData.comparison.benchmarkLabel
    );
    return;
  }
  renderPortfolioChart(lastChartData.history, lastChartData.containerId);
});

// ===================================================
// FILTRACE OBDOBi
// ===================================================
function findClosestIndexWithinTolerance(sorted, targetDate, toleranceDays = 30) {
  let bestIndex = -1;
  let bestDiff = Infinity;

  sorted.forEach((item, index) => {
    const diffDays = Math.abs((new Date(item.date) - targetDate) / 86400000);
    if (diffDays <= toleranceDays && diffDays < bestDiff) {
      bestDiff = diffDays;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function filterPeriod(data, period) {
  if (!Array.isArray(data) || !data.length || period === 'MAX') return data || [];

  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const lastDate = new Date(sorted.at(-1).date);
  const target = new Date(lastDate);

  if (period === '1M') {
    target.setMonth(target.getMonth() - 1);
  } else if (period === '6M') {
    target.setMonth(target.getMonth() - 6);
  } else if (period === '1Y') {
    target.setFullYear(target.getFullYear() - 1);
  } else if (period === '3Y') {
    target.setFullYear(target.getFullYear() - 3);
  } else if (period === '5Y') {
    target.setFullYear(target.getFullYear() - 5);
  } else {
    return sorted;
  }

  // Pro 3Y a 5Y sjednoceno s procedurou RefreshInstrumentOverviewMetrics:
  // vybírá se datum nejbližší cílovému datu v toleranci +/- 30 dní.
  if (period === '3Y' || period === '5Y') {
    const closestIndex = findClosestIndexWithinTolerance(sorted, target, 30);
    return closestIndex >= 0 ? sorted.slice(closestIndex) : [];
  }

  // Kratší období necháváme jako dosud: první dostupné datum po cílovém datu.
  let startIndex = sorted.findIndex(d => new Date(d.date) >= target);
  if (startIndex < 0) startIndex = 0;
  return sorted.slice(startIndex);
}


// ===================================================
// MeNY PreHLED
// ===================================================
function loadCurrencies() {
  const grid = document.getElementById('currencyGrid');
  if (!grid) return;

  const { table, gridBtn, tableBtn } = ensureOverviewViewShell(grid, 'currencies');
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';

  const selectCurrency = code => {
    history.pushState(
      { page: `meny/${code}` },
      '',
      `/meny/${code}`
    );
    loadCurrencyDetail(code);
  };

  gridBtn.onclick = () => {
    viewMode = 'grid';
    updateView();
  };

  tableBtn.onclick = () => {
    viewMode = 'table';
    updateView();
  };

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');
    gridBtn.classList.toggle('active', viewMode === 'grid');
    tableBtn.classList.toggle('active', viewMode === 'table');

    if (viewMode === 'grid') renderGrid();
    else renderTable();
  }

  function renderGrid() {
    grid.innerHTML = '';

    apiCache.currenciesList.forEach(c => {
      const card = document.createElement('div');
      card.className = 'fund-card';
      const lastValue = getLastValue(c);
      const lastDate = getLastValuationDate(c);

      card.innerHTML = `
        <h3>${c.name}</h3>
        <small>${c.code}</small>
        <small>Poslední kurz: ${formatOverviewValue(lastValue, { suffix: 'CZK' })}${lastDate ? ` · ${formatOverviewDate(lastDate)}` : ''}</small>
      `;

      card.onclick = () => selectCurrency(c.code);
      grid.appendChild(card);
    });
  }

  function renderTable() {
    if (!table.dataset.sortKey) {
      table.dataset.sortKey = 'name';
      table.dataset.sortAsc = 'true';
    }

    const sortKey = table.dataset.sortKey || 'name';
    const sortAsc = table.dataset.sortAsc !== 'false';
    const getters = {
      name: c => c.name || '',
      code: c => c.code || '',
      lastValue: c => getLastValue(c),
      lastValuationDate: c => getLastValuationDate(c) || ''
    };

    const data = [...apiCache.currenciesList].sort((a, b) => {
      const getter = getters[sortKey] || getters.name;
      let A = getter(a);
      let B = getter(b);

      if (A == null) A = '';
      if (B == null) B = '';
      if (typeof A === 'string') A = A.toLowerCase();
      if (typeof B === 'string') B = B.toLowerCase();

      if (A < B) return sortAsc ? -1 : 1;
      if (A > B) return sortAsc ? 1 : -1;
      return 0;
    });

    table.innerHTML = `
      <table class="fund-table overview-table">
        <thead>
          <tr>
            <th data-key="name" class="${sortKey === 'name' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">Název</th>
            <th data-key="code" class="${sortKey === 'code' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">Kód</th>
            <th data-key="lastValue" class="${sortKey === 'lastValue' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">Poslední kurz</th>
            <th data-key="lastValuationDate" class="${sortKey === 'lastValuationDate' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">Datum ocenění</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(c => {
            const lastValue = getLastValue(c);
            const lastDate = getLastValuationDate(c);

            return `
              <tr data-code="${c.code}">
                <td data-label="Název">${c.name || ''}</td>
                <td data-label="Kód">${c.code || ''}</td>
                <td data-label="Poslední kurz">${formatOverviewValue(lastValue, { suffix: 'CZK' })}</td>
                <td data-label="Datum ocenění">${formatOverviewDate(lastDate)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    table.querySelectorAll('th').forEach(th => {
      th.onclick = e => {
        e.stopPropagation();
        const key = th.dataset.key;
        if (!key) return;

        const currentKey = table.dataset.sortKey || 'name';
        const currentAsc = table.dataset.sortAsc !== 'false';
        table.dataset.sortKey = key;
        table.dataset.sortAsc = currentKey === key ? String(!currentAsc) : 'true';
        renderTable();
      };
    });

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
      tr.addEventListener('mouseenter', () => {
        rows.forEach(r => r.classList.remove('active'));
        tr.classList.add('active');
      });

      tr.addEventListener('click', () => {
        rows.forEach(r => r.classList.remove('active'));
        tr.classList.add('active');
        selectCurrency(tr.dataset.code);
      });
    });
  }

  grid.innerHTML = '<p>Načítám měny ...</p>';
  table.innerHTML = '';

  cachedJsonFetch(publicDataProxyUrl('currencies-list'))
    .then(list => {
      apiCache.currenciesList = Array.isArray(list) ? list : [];
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání měn</p>';
      table.innerHTML = '<p>Chyba načítání měn</p>';
    });
}

// ===================================================
// DETAIL MeNY
// ===================================================
function loadCurrencyDetail(code) {

  
const main = document.getElementById('mainContent');
 if (!main) return;


  main.innerHTML = `
    <h3>Detail měny</h3>
    <p><strong>${code}</strong></p>

    <div class="kpi-row">
      <div class="kpi"><span>Aktuální kurz</span><strong id="cur-kpi-last"> - </strong></div>
      <div class="kpi"><span>Změna</span><strong id="cur-kpi-change"> - </strong></div>
      <div class="kpi"><span>Poměr kurzu</span><strong id="cur-kpi-ratio"> - </strong></div>
    </div>

<div class="period-row">
  <div class="period-switch">
    
      <button data-period="1M" data-tooltip="Poslední měsíc">1M</button>
      <button data-period="6M" data-tooltip="Posledních 6 měsíců">6M</button>
      <button data-period="1Y" data-tooltip="Poslední rok">1Y</button>
      <button data-period="3Y" data-tooltip="Poslední 3 roky">3Y</button>
      <button data-period="5Y" data-tooltip="Posledních 5 let">5Y</button>
      <button data-period="MAX" data-tooltip="Celá historie">MAX</button>

  </div>

  <div id="period-diff" class="period-diff">
    —
  </div>
</div>


    <div id="chart-currency"></div>
    
<button class="back-btn">
  ← Zpět
</button>

  `;

  

document.querySelector('.back-btn').onclick = navigateSmartBack;



  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadCurrencyData(code, btn.dataset.period);
    };
  });

  loadCurrencyData(code, '3Y');
}

async function loadCurrencyData(code, period) {
  if (!apiCache.currencies[code]) {
    let data = await cachedJsonFetch(
      publicDataProxyUrl('currency', code)
    );
    if (!Array.isArray(data)) data = [];
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    apiCache.currencies[code] = data;
  }

  const filtered = filterPeriod(apiCache.currencies[code], period);
  renderCurrencyKPI(filtered, code);
  renderPeriodDifference(filtered);

  renderPortfolioChart(
    filtered.map(d => ({ date: d.date, value: d.value })),
    'chart-currency'
  );
}

function getCurrencyRateAmount(row, currencyCode = '') {
  const candidates = [row?.amount, row?.Amount, row?.unit, row?.Unit, row?.nominal, row?.Nominal,
    row?.quantity, row?.Quantity, row?.currencyAmount, row?.CurrencyAmount, row?.rateAmount, row?.RateAmount,
    row?.multiplier, row?.Multiplier];
  const supplied = candidates.find(value => value != null && Number.isFinite(Number(value)) && Number(value) > 0);
  if (supplied != null) return Number(supplied);
  const code = String(currencyCode || row?.code || row?.Code || row?.currency || row?.Currency || '').toUpperCase();
  return code === 'HUF' || code === 'JPY' ? 100 : 1;
}

function renderCurrencyKPI(data, currencyCode) {
  if (!data.length) return;

  const last = data.at(-1);
  const prev = data.at(-2);
  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');


  document.getElementById('cur-kpi-last').textContent =
    `${last.value.toFixed(4)} CZK (${dateStr})`;


  const ratioEl = document.getElementById('cur-kpi-ratio');
  if (ratioEl) ratioEl.textContent = `${getCurrencyRateAmount(last, currencyCode)}/1`;

  if (prev) {
    const diff = last.value - prev.value;
    const pct = (diff / prev.value) * 100;
    const el = document.getElementById('cur-kpi-change');
    el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}

// ===============================
// LOGIN / REGISTER
// ===============================

async function postJson(url, payload) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { error: text || "Neplatná odpověď serveru" };
    }

    return { res, data };
}

function storeAuthResult(data) {
    clearSession();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("token_type", data.token_type || "Bearer");
    localStorage.setItem("token_expires_at", String(Date.now() + Number(data.expires_in || 3600) * 1000));
    localStorage.setItem("last_activity", String(Date.now()));
}

async function loginUser() {
    const email = document.getElementById("login-email")?.value.trim();
    const password = document.getElementById("login-password")?.value;

    if (!email || !password) {
        showAuthMessage("Doplňte prosím e-mail i heslo, ať vás můžeme bezpečně přihlásit.", "error");
        return false;
    }

    try {
        const { res, data } = await postJson(`${getPortfolioApiBaseUrl()}/login_user`, {
            action: "login",
            email,
            password
        });

        if (!res.ok || !data.access_token) {
            const wrongCredentials = res.status === 400 || res.status === 401 || res.status === 403;
            showAuthMessage(wrongCredentials ? "Tohle heslo nesedí. Zkuste ho prosím zadat znovu, nebo použijte možnost Zapomněl jsem heslo." : "Přihlášení se teď nepodařilo. Zkuste to prosím za chvíli znovu.", "error");
            const passwordInput = document.getElementById("login-password");
            if (passwordInput) { passwordInput.value = ""; passwordInput.focus(); passwordInput.classList.add("input-error"); setTimeout(() => passwordInput.classList.remove("input-error"), 700); }
            return false;
        }

        storeAuthResult(data);
        resetInactivityTimer();
        updateMenu();
        loadPage("portfolio");
        return true;
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        showAuthMessage("Se serverem se teď nepodařilo spojit. Zkontrolujte připojení a zkuste to prosím znovu.", "error");
        return false;
    }
}

function logout() {
    clearSession();
    updateMenu();
    loadPage("uvod");
}

async function requestRegistrationCode(email, password) {
    if (!email || !password) {
        return { ok: false, error: "Vyplň email a heslo" };
    }

    try {
        const { res, data } = await postJson(`${getPortfolioApiBaseUrl()}/save_user`, {
            action: "request_registration_code",
            email,
            password
        });

        if (!res.ok) return { ok: false, error: data.error || "Registrace selhala" };
        return { ok: true, message: data.message, data };
    } catch (err) {
        console.error("REQUEST REGISTRATION CODE ERROR:", err);
        return { ok: false, error: "Chyba registrace" };
    }
}

async function confirmRegistrationCode(email, code) {
    if (!email || !code) {
        return { ok: false, error: "Vyplň e-mail a ověřovací kód" };
    }

    try {
        const { res, data } = await postJson(`${getPortfolioApiBaseUrl()}/save_user`, {
            action: "confirm_registration_code",
            email,
            code
        });

        if (!res.ok || !data.access_token) {
            return { ok: false, error: data.error || "Ověření registrace selhalo" };
        }

        return { ok: true, data };
    } catch (err) {
        console.error("CONFIRM REGISTRATION CODE ERROR:", err);
        return { ok: false, error: "Chyba ověření registrace" };
    }
}

async function requestPasswordResetCode(email) {
    if (!email) {
        return { ok: false, error: "Vyplň email" };
    }

    try {
        const { res, data } = await postJson(`${getPortfolioApiBaseUrl()}/login_user`, {
            action: "request_password_reset_code",
            email
        });

        if (!res.ok) return { ok: false, error: data.error || "Odeslání kódu selhalo" };
        return { ok: true, message: data.message, data };
    } catch (err) {
        console.error("REQUEST PASSWORD RESET CODE ERROR:", err);
        return { ok: false, error: "Chyba odeslání kódu" };
    }
}

async function confirmPasswordResetCode(email, code, password) {
    if (!email || !code || !password) {
        return { ok: false, error: "Vyplň e-mail, kód a nové heslo" };
    }

    try {
        const { res, data } = await postJson(`${getPortfolioApiBaseUrl()}/login_user`, {
            action: "confirm_password_reset_code",
            email,
            code,
            password
        });

        if (!res.ok) return { ok: false, error: data.error || "Změna hesla selhala" };
        return { ok: true, message: data.message, data };
    } catch (err) {
        console.error("CONFIRM PASSWORD RESET CODE ERROR:", err);
        return { ok: false, error: "Chyba změny hesla" };
    }
}

// Zpětná kompatibilita pro případ, že by někde zůstal starší onclick.
async function registerUser() {
    const email = document.getElementById("login-email")?.value.trim();
    const password = document.getElementById("login-password")?.value;
    const result = await requestRegistrationCode(email, password);
    alert(result.ok ? (result.message || "Ověřovací kód byl odeslán") : (result.error || "Registrace selhala"));
    return result.ok;
}

// ===============================
// AUTO LOGOUT (10 min neaktivita)
// ===============================
let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);

  // 10 minut = 600000 ms
  inactivityTimer = setTimeout(() => {
    console.log("Auto logout – neaktivita");
    logout();
  }, 600000);
}

// sleduj aktivitu uživatele
["click", "mousemove", "keydown", "scroll", "touchstart"].forEach(evt => {
  document.addEventListener(evt, resetInactivityTimer, true);
});

function updateLastActivity() {
  localStorage.setItem("last_activity", Date.now());
}

document.addEventListener("click", updateLastActivity);
document.addEventListener("keydown", updateLastActivity);
document.addEventListener("mousemove", updateLastActivity);

function checkSession() {
  const last = localStorage.getItem("last_activity");
  if (!last && !getAccessToken()) return;

  const inactiveFor = last ? Date.now() - parseInt(last, 10) : 0;
  const tokenExpired = !isLoggedIn();

  if (tokenExpired || inactiveFor > 600000) {
    console.log(tokenExpired ? "Session expirovala – token" : "Session expirovala – neaktivita");
    logout();
  }
}

/* Mobile overview table override */
(function ensureMobileOverviewFourColumns() {
  if (document.getElementById('mobile-overview-four-columns-style')) return;
  const style = document.createElement('style');
  style.id = 'mobile-overview-four-columns-style';
  style.textContent = `
    @media (max-width: 767px) {
      .overview-table th,
      .overview-table td,
      #fundTable .dps-overview-table th,
      #fundTable .dps-overview-table td { font-size: 11px !important; }
      .overview-table th:nth-child(5), .overview-table td:nth-child(5),
      .overview-table th:nth-child(6), .overview-table td:nth-child(6),
      #fundTable .dps-overview-table th:nth-child(5), #fundTable .dps-overview-table td:nth-child(5),
      #fundTable .dps-overview-table th:nth-child(6), #fundTable .dps-overview-table td:nth-child(6) { display: none !important; }
    }
  `;
  document.head.appendChild(style);
})();
