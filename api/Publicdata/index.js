const https = require('https');

const DEFAULT_APIM_BASE_URL = 'https://portfolio-apimpt.azure-api.net/portfolio-func-app';
const APIM_BASE_URL = (process.env.INTERNAL_APIM_BASE_URL || DEFAULT_APIM_BASE_URL).replace(/\/+$/, '');
const APIM_KEY = process.env.INTERNAL_APIM_SUBSCRIPTION_KEY || '';
const CACHE_TTL_SECONDS = Math.max(60, Number(process.env.PUBLIC_PROXY_CACHE_TTL_SECONDS || 21600));
const MAX_CACHE_ITEMS = Math.max(50, Number(process.env.PUBLIC_PROXY_MAX_CACHE_ITEMS || 500));
const MAX_RESPONSE_BYTES = Math.max(65536, Number(process.env.PUBLIC_PROXY_MAX_RESPONSE_BYTES || 5242880));
const BACKEND_TIMEOUT_MS = Math.min(40000, Math.max(5000, Number(process.env.PUBLIC_PROXY_BACKEND_TIMEOUT_MS || 40000)));

const cache = global.__PUBLIC_DATA_PROXY_CACHE__ || new Map();
const pending = global.__PUBLIC_DATA_PROXY_PENDING__ || new Map();
global.__PUBLIC_DATA_PROXY_CACHE__ = cache;
global.__PUBLIC_DATA_PROXY_PENDING__ = pending;

const TYPE_MAP = Object.freeze({
  stock: { path: '/get_stock_data', queryName: 'ticker', pattern: /^[A-Za-z0-9._:\-^=]{1,80}$/ },
  dps: { path: '/get_dps_data', queryName: 'isin', pattern: /^[A-Za-z0-9._:\-]{1,64}$/ },
  fund: { path: '/get_podilovy_fond_data', queryName: 'isin', pattern: /^[A-Za-z0-9._:\-]{1,64}$/ },
  currency: { path: '/get_currency_data', queryName: 'currency', pattern: /^[A-Za-z]{3}$/ },
  'stocks-list': { path: '/get_active_stocks' },
  'dps-list': { path: '/get_dps_funds' },
  'dps-overview-list': { path: '/get_dps_funds_overview' },
  'funds-list': { path: '/get_active_podilove_fondy' },
  'currencies-list': { path: '/get_active_currencies' }
});

const BASE_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'cross-origin-resource-policy': 'same-origin'
});

function reply(status, body, headers = {}) {
  return { status, headers: { ...BASE_HEADERS, 'cache-control': 'public, max-age=300', ...headers }, body: JSON.stringify(body) };
}
function param(req, name) { return req.query?.[name] || req.params?.[name] || ''; }
function cleanCache(now) {
  for (const [key, value] of cache) if (!value || value.staleUntil <= now) cache.delete(key);
  while (cache.size >= MAX_CACHE_ITEMS) cache.delete(cache.keys().next().value);
}
function requestJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return reject(new Error('Only HTTPS backend is allowed'));
    const req = https.request(parsed, { method: 'GET', headers }, res => {
      let raw = '';
      let bytes = 0;
      res.setEncoding('utf8');
      res.on('data', chunk => {
        bytes += Buffer.byteLength(chunk, 'utf8');
        if (bytes > MAX_RESPONSE_BYTES) {
          req.destroy(new Error('Backend response too large'));
          return;
        }
        raw += chunk;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const error = new Error(`Backend HTTP ${res.statusCode}`);
          error.statusCode = res.statusCode;
          return reject(error);
        }
        try { resolve(JSON.parse(raw)); } catch { reject(new Error('Backend returned invalid JSON')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(BACKEND_TIMEOUT_MS, () => req.destroy(new Error('Backend request timeout')));
    req.end();
  });
}

module.exports = async function (context, req) {
  if (req.method !== 'GET') { context.res = reply(405, { error: 'Method not allowed.' }, { allow: 'GET', 'cache-control': 'no-store' }); return; }
  const type = String(param(req, 'type')).trim().toLowerCase();
  const id = String(param(req, 'id')).trim();
  const cfg = TYPE_MAP[type];
  if (!cfg) { context.res = reply(400, { error: 'Neplatny typ dat.' }, { 'cache-control': 'no-store' }); return; }

  let normalizedId = '';
  if (cfg.queryName) {
    if (!cfg.pattern.test(id)) { context.res = reply(400, { error: 'Neplatny identifikator.' }, { 'cache-control': 'no-store' }); return; }
    normalizedId = type === 'currency' ? id.toUpperCase() : id;
  }

  const key = normalizedId ? `${type}:${normalizedId}` : type;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) { context.res = reply(200, hit.data, { 'x-proxy-cache': 'HIT' }); return; }

  if (!pending.has(key)) {
    const target = new URL(APIM_BASE_URL + cfg.path);
    if (cfg.queryName) target.searchParams.set(cfg.queryName, normalizedId);
    const headers = { accept: 'application/json', 'user-agent': 'swa-public-proxy/2.0' };
    if (APIM_KEY) headers['Ocp-Apim-Subscription-Key'] = APIM_KEY;
    pending.set(key, requestJson(target.toString(), headers).then(data => {
      cleanCache(Date.now());
      cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000, staleUntil: Date.now() + CACHE_TTL_SECONDS * 2000 });
      return data;
    }).finally(() => pending.delete(key)));
  }

  try {
    const data = await pending.get(key);
    context.res = reply(200, data, { 'x-proxy-cache': 'MISS' });
  } catch (error) {
    context.log.error('[public-data] backend error', {
      message: error.message,
      statusCode: error.statusCode || null,
      type,
      id: normalizedId || null,
      apimKeyConfigured: Boolean(APIM_KEY),
      apimBaseUrlConfigured: Boolean(APIM_BASE_URL),
      backendTimeoutMs: BACKEND_TIMEOUT_MS
    });
    if (hit?.data) { context.res = reply(200, hit.data, { 'x-proxy-cache': 'STALE', 'cache-control': 'public, max-age=60' }); return; }
    context.res = reply(502, { error: 'Data se nepodarilo nacist.' }, { 'cache-control': 'no-store' });
  }
};
