const https = require('https');

const APIM_BASE_URL = (process.env.INTERNAL_APIM_BASE_URL || 'https://portfolio-apimpt.azure-api.net/portfolio-func-app').replace(/\/+$/, '');
const APIM_KEY = process.env.INTERNAL_APIM_SUBSCRIPTION_KEY || '';
const MAX_REQUEST_BYTES = Math.max(16384, Number(process.env.PRIVATE_PROXY_MAX_REQUEST_BYTES || 262144));
const MAX_RESPONSE_BYTES = Math.max(65536, Number(process.env.PRIVATE_PROXY_MAX_RESPONSE_BYTES || 5242880));

const OPERATIONS = Object.freeze({
  login_user: { methods: ['POST'], auth: false },
  save_user: { methods: ['POST'], auth: false },
  get_portfolios: { methods: ['GET'], auth: true, query: ['is_active'] },
  get_portfolio_detail: { methods: ['GET'], auth: true, query: ['portfolio_id'] },
  get_portfolio_trades: { methods: ['GET'], auth: true, query: ['portfolio_id'] },
  create_portfolio: { methods: ['POST'], auth: true },
  save_portfolio_settings: { methods: ['POST'], auth: true },
  save_portfolio_trades: { methods: ['POST'], auth: true }
});

const RESPONSE_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  pragma: 'no-cache',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'cross-origin-resource-policy': 'same-origin'
});

function reply(status, body, headers = {}) {
  return { status, headers: { ...RESPONSE_HEADERS, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) };
}
function validBearer(value) {
  return typeof value === 'string' && /^Bearer [A-Za-z0-9._~+\-/]+=*$/i.test(value) && value.length <= 8192;
}
function safeQuery(req, allowed) {
  const params = new URLSearchParams();
  for (const name of allowed || []) {
    const value = req.query?.[name];
    if (value == null || value === '') continue;
    const text = String(value);
    if (name === 'portfolio_id' && !/^\d{1,18}$/.test(text)) throw new Error('INVALID_QUERY');
    if (name === 'is_active' && !/^[01]$/.test(text)) throw new Error('INVALID_QUERY');
    params.set(name, text);
  }
  return params;
}
function callBackend(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return reject(new Error('Only HTTPS backend is allowed'));
    const request = https.request(parsed, { method, headers }, response => {
      let raw = '';
      let bytes = 0;
      response.setEncoding('utf8');
      response.on('data', chunk => {
        bytes += Buffer.byteLength(chunk, 'utf8');
        if (bytes > MAX_RESPONSE_BYTES) { request.destroy(new Error('Backend response too large')); return; }
        raw += chunk;
      });
      response.on('end', () => resolve({ status: response.statusCode || 502, body: raw || '{}' }));
    });
    request.on('error', reject);
    request.setTimeout(20000, () => request.destroy(new Error('Backend request timeout')));
    if (body) request.write(body);
    request.end();
  });
}

module.exports = async function (context, req) {
  const operation = String(req.params?.operation || '').trim();
  const cfg = OPERATIONS[operation];
  if (!cfg) { context.res = reply(404, { error: 'Unknown operation.' }); return; }
  if (!cfg.methods.includes(req.method)) { context.res = reply(405, { error: 'Method not allowed.' }, { allow: cfg.methods.join(', ') }); return; }

  const authorization = req.headers?.authorization || req.headers?.Authorization || '';
  if (cfg.auth && !validBearer(authorization)) { context.res = reply(401, { error: 'Missing or invalid bearer token.' }, { 'www-authenticate': 'Bearer' }); return; }

  let query;
  try { query = safeQuery(req, cfg.query); }
  catch { context.res = reply(400, { error: 'Invalid query.' }); return; }

  let body = '';
  if (req.method === 'POST') {
    body = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body || {});
    if (Buffer.byteLength(body, 'utf8') > MAX_REQUEST_BYTES) { context.res = reply(413, { error: 'Request too large.' }); return; }
    try { JSON.parse(body); } catch { context.res = reply(400, { error: 'Invalid JSON.' }); return; }
  }

  const target = new URL(`${APIM_BASE_URL}/${operation}`);
  target.search = query.toString();
  const headers = { accept: 'application/json', 'user-agent': 'swa-private-proxy/1.0' };
  if (body) { headers['content-type'] = 'application/json'; headers['content-length'] = Buffer.byteLength(body); }
  if (authorization) headers.authorization = authorization;
  if (APIM_KEY) headers['Ocp-Apim-Subscription-Key'] = APIM_KEY;

  try {
    const result = await callBackend(target.toString(), req.method, headers, body);
    context.res = reply(result.status, result.body);
  } catch (error) {
    context.log.error('[private-api] backend error', { operation, message: error.message });
    context.res = reply(502, { error: 'Backend unavailable.' });
  }
};
