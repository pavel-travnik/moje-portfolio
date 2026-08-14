const https = require('https');
const http = require('http');

const DEFAULT_APIM_BASE_URL = 'https://portfolio-apimpt.azure-api.net/portfolio-func-app';
const INTERNAL_APIM_BASE_URL = (process.env.INTERNAL_APIM_BASE_URL || DEFAULT_APIM_BASE_URL).replace(/\/+$/, '');
const INTERNAL_APIM_SUBSCRIPTION_KEY = process.env.INTERNAL_APIM_SUBSCRIPTION_KEY || '';
const CACHE_TTL_SECONDS = Number(process.env.PUBLIC_PROXY_CACHE_TTL_SECONDS || 21600); // 6 hodin
const MAX_ID_LENGTH = 64;

// Jednoduchá in-memory cache. Pro MVP stačí. Později lze vyměnit za Azure Storage/Redis.
const memoryCache = global.__PUBLIC_DATA_PROXY_CACHE__ || new Map();
global.__PUBLIC_DATA_PROXY_CACHE__ = memoryCache;

const TYPE_MAP = {
  stock: {
    path: '/get_stock_data',
    queryName: 'ticker',
    idPattern: /^[A-Za-z0-9._:-]{1,64}$/
  },
  dps: {
    path: '/get_dps_data',
    queryName: 'isin',
    idPattern: /^[A-Za-z0-9._:-]{1,64}$/
  },
  fund: {
    path: '/get_podilovy_fond_data',
    queryName: 'isin',
    idPattern: /^[A-Za-z0-9._:-]{1,64}$/
  },
  currency: {
    path: '/get_currency_data',
    queryName: 'currency',
    idPattern: /^[A-Za-z]{3}$/
  }
};

function jsonResponse(status, body, headers = {}) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

function getParam(req, name) {
  return req.query?.[name] || req.params?.[name] || '';
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'http:' ? http : https;
    const request = client.request(parsed, { method: 'GET', headers }, response => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { raw += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const err = new Error(`Backend HTTP ${response.statusCode}`);
          err.statusCode = response.statusCode;
          err.body = raw;
          reject(err);
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error('Backend returned invalid JSON'));
        }
      });
    });
    request.on('error', reject);
    request.setTimeout(25000, () => {
      request.destroy(new Error('Backend request timeout'));
    });
    request.end();
  });
}

module.exports = async function (context, req) {
  const type = String(getParam(req, 'type')).trim().toLowerCase();
  const id = String(getParam(req, 'id')).trim();
  const config = TYPE_MAP[type];

  if (!config) {
    context.res = jsonResponse(400, { error: 'Neplatný typ dat.' });
    return;
  }

  if (!id || id.length > MAX_ID_LENGTH || !config.idPattern.test(id)) {
    context.res = jsonResponse(400, { error: 'Neplatný identifikátor.' });
    return;
  }

  const normalizedId = type === 'currency' ? id.toUpperCase() : id;
  const cacheKey = `${type}:${normalizedId}`;
  const now = Date.now();
  const hit = memoryCache.get(cacheKey);

  if (hit && hit.expiresAt > now) {
    context.res = jsonResponse(200, hit.data, {
      'x-proxy-cache': 'HIT',
      'cache-control': 'public, max-age=300'
    });
    return;
  }

  const target = new URL(INTERNAL_APIM_BASE_URL + config.path);
  target.searchParams.set(config.queryName, normalizedId);

  const headers = {
    'accept': 'application/json'
  };
  if (INTERNAL_APIM_SUBSCRIPTION_KEY) {
    headers['Ocp-Apim-Subscription-Key'] = INTERNAL_APIM_SUBSCRIPTION_KEY;
  }

  try {
    const data = await fetchJson(target.toString(), headers);
    memoryCache.set(cacheKey, {
      data,
      cachedAt: now,
      expiresAt: now + CACHE_TTL_SECONDS * 1000
    });
    context.res = jsonResponse(200, data, {
      'x-proxy-cache': 'MISS',
      'cache-control': 'public, max-age=300'
    });
  } catch (err) {
    context.log.error('[public-data] backend error', err.message);
    if (hit && hit.data) {
      context.res = jsonResponse(200, hit.data, {
        'x-proxy-cache': 'STALE',
        'cache-control': 'public, max-age=60'
      });
      return;
    }
    context.res = jsonResponse(502, { error: 'Data se nepodařilo načíst.' });
  }
};
