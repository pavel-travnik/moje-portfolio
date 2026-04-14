// ===================================================
// HLAVNÍ KONTEJNER
// ===================================================
const main = document.getElementById('mainContent');

// ===================================================
// API URL
// ===================================================
const DPS_API_URL =
  'https://moje-portfolio-a5gkdcgbasg4areg.westeurope-01.azurewebsites.net/api/get_dps_data';
const DPS_FUNDS_API =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_dps_funds';
const STOCK_API_URL =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_stock_data';
const STOCK_LIST_API =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_active_stocks';
const CURRENCY_LIST_API =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_active_currencies';
const CURRENCY_DATA_API =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_currency_data';

// ===================================================
// DROPDOWN + SPA MENU (JEDINÝ LISTENER)
// ===================================================
document.addEventListener('click', e => {

  const toggle = e.target.closest('.dropdown-toggle');
  if (toggle) {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector('.dropdown-menu')?.classList.toggle('open');
    return;
  }

  const link = e.target.closest('a[data-page]');
  if (!link) return;

  e.preventDefault();
  e.stopPropagation();

  document.querySelector('.dropdown-menu')?.classList.remove('open');
  loadPage(link.dataset.page);
});

document.addEventListener('click', () => {
  document.querySelector('.dropdown-menu')?.classList.remove('open');
});

// ===================================================
// HISTORY
// ===================================================
window.addEventListener('popstate', e => {
  if (e.state?.page) loadPage(e.state.page, false);
});

// ===================================================
// INIT
// ===================================================
(() => {
  const path = location.pathname.replace(/^\/+/, '');
  loadPage(path || 'uvod', false);
})();

// ===================================================
// ROUTER
// ===================================================
function loadPage(page, pushState = true) {

  // ---- DETAIL PAGES ----
  if (page.startsWith('penze/')) {
    loadFundDetail(page.split('/')[1]);
    return;
  }

  if (page.startsWith('akcie/') || page.startsWith('etf/')) {
    loadStockDetail(page.split('/')[1]);
    return;
  }

  if (page.startsWith('meny/')) {
    loadCurrencyDetail(page.split('/')[1]);
    return;
  }

  // ---- OVERVIEW PAGES ----
  fetch(`pages/${page}.html`)
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(html => {
      main.innerHTML = html;

      if (page === 'penze') loadPensionFunds();
      if (page === 'akcie') loadStocks();
      if (page === 'etf') loadEtfs();
      if (page === 'meny') loadCurrencies();

      if (pushState) {
        history.pushState({ page }, '', `/${page}`);
      }
    })
    .catch(() => {
      main.innerHTML = '<h3>404</h3><p>Stránka nenalezena</p>';
    });
}

// ===================================================
// PENZE – PŘEHLED
// ===================================================
function loadPensionFunds() {
  const grid = document.getElementById('fundGrid');
  if (!grid) return;

  grid.innerHTML = 'Načítám…';

  fetch(DPS_FUNDS_API)
    .then(r => r.json())
    .then(funds => {
      grid.innerHTML = '';
      funds.forEach(f => {
        const card = document.createElement('div');
        card.className = 'fund-card';
        card.innerHTML = `<h3>${f.name}</h3><small>${f.provider}</small>`;
        card.onclick = () => {
          history.pushState({ page: `penze/${f.isin}` }, '', `/penze/${f.isin}`);
          loadFundDetail(f.isin);
        };
        grid.appendChild(card);
      });
    });
}

// ===================================================
// DETAIL FONDU
// ===================================================
function loadFundDetail(isin) {
  main.innerHTML = `
    <h3>Detail fondu</h3>
    <p><strong>ISIN:</strong> ${isin}</p>

    <div class="kpi-row">
      <div class="kpi"><span>Hodnota</span><strong id="kpi-last">–</strong></div>
      <div class="kpi"><span>Změna</span><strong id="kpi-change">–</strong></div>
      <div class="kpi"><span>Záznamů</span><strong id="kpi-count">–</strong></div>
    </div>

    <div class="period-switch">
      <button data-period="1M">1M</button>
      <button data-period="6M">6M</button>
      <button data-period="1Y">1Y</button>
      <button data-period="3Y" class="active">3Y</button>
      <button data-period="MAX">MAX</button>
    </div>

    <div id="chart-portfolio"></div>
    <button class="back-btn">← Zpět</button>
  `;

  document.querySelector('.back-btn').onclick = () => history.back();

  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadDPS(isin, btn.dataset.period);
    };
  });

  loadDPS(isin, '3Y');
}

async function loadDPS(isin, period) {
  const res = await fetch(`${DPS_API_URL}?isin=${encodeURIComponent(isin)}`);
  let data = await res.json();
  if (!Array.isArray(data)) return;

  data.sort((a, b) => new Date(a.date) - new Date(b.date));
  data = filterPeriod(data, period);

  renderFundKPI(data);
  renderPortfolioChart(
    data.map(d => ({ date: d.date, value: d.value })),
    'chart-portfolio'
  );
}

function renderFundKPI(data) {
  if (!data.length) return;
  const last = data.at(-1);
  const prev = data.at(-2);

  document.getElementById('kpi-last').textContent =
    `${last.value.toFixed(4)} ${last.currency}`;
  document.getElementById('kpi-count').textContent = data.length;

  if (prev) {
    const diff = last.value - prev.value;
    const pct = diff / prev.value * 100;
    const el = document.getElementById('kpi-change');
    el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}

// ===================================================
// AKCIE & ETF – PŘEHLEDY
// ===================================================
function loadStocks() {
  loadStockGrid(false);
}

function loadEtfs() {
  loadStockGrid(true);
}

function loadStockGrid(isETF) {
  const grid = document.getElementById(isETF ? 'etfGrid' : 'stockGrid');
  if (!grid) return;

  grid.innerHTML = 'Načítám…';

  fetch(STOCK_LIST_API)
    .then(r => r.json())
    .then(list => {
      grid.innerHTML = '';
      list
        .filter(s => (s.sector === 'ETF') === isETF)
        .forEach(s => {
          const card = document.createElement('div');
          card.className = 'fund-card';
          card.innerHTML = `<h3>${s.name}</h3><small>${s.ticker}</small>`;
          card.onclick = () => {
            history.pushState({ page: `etf/${s.ticker}` }, '', `/etf/${s.ticker}`);
            loadStockDetail(s.ticker);
          };
          grid.appendChild(card);
        });
    });
}

// ===================================================
// DETAIL AKCIE / ETF
// ===================================================
function loadStockDetail(ticker) {
  main.innerHTML = `
    <h3 id="stock-title">Detail</h3>

    <div class="kpi-row">
      <div class="kpi"><span>Cena</span><strong id="stock-kpi-last">–</strong></div>
      <div class="kpi"><span>Změna</span><strong id="stock-kpi-change">–</strong></div>
      <div class="kpi"><span>Objem</span><strong id="stock-kpi-volume">–</strong></div>
    </div>

    <div class="period-switch">
      <button data-period="1M">1M</button>
      <button data-period="6M">6M</button>
      <button data-period="1Y">1Y</button>
      <button data-period="3Y" class="active">3Y</button>
      <button data-period="MAX">MAX</button>
    </div>

    <div id="chart-stock"></div>
    <button class="back-btn">← Zpět</button>
  `;

  document.querySelector('.back-btn').onclick = () => history.back();

  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadStockData(ticker, btn.dataset.period);
    };
  });

  loadStockData(ticker, '3Y');
}

async function loadStockData(ticker, period) {
  const res = await fetch(`${STOCK_API_URL}?ticker=${encodeURIComponent(ticker)}`);
  let data = await res.json();
  if (!Array.isArray(data)) return;

  data.sort((a, b) => new Date(a.date) - new Date(b.date));
  data = filterPeriod(data, period);

  renderStockKPI(data);
  renderPortfolioChart(
    data.map(d => ({ date: d.date, value: d.close })),
    'chart-stock'
  );
}

function renderStockKPI(data) {
  if (!data.length) return;
  const last = data.at(-1);
  const prev = data.at(-2);

  document.getElementById('stock-kpi-last').textContent =
    `${last.close.toFixed(2)} ${last.currency ?? ''}`;

  document.getElementById('stock-kpi-volume').textContent =
    last.volume?.toLocaleString('cs-CZ') ?? '–';

  if (prev) {
    const diff = last.close - prev.close;
    const pct = diff / prev.close * 100;
    const el = document.getElementById('stock-kpi-change');
    el.textContent = `${diff.toFixed(2)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}

// ===================================================
// MĚNY – PŘEHLED & DETAIL
// ===================================================
function loadCurrencies() {
  const grid = document.getElementById('currencyGrid');
  if (!grid) return;

  grid.innerHTML = 'Načítám…';

  fetch(CURRENCY_LIST_API)
    .then(r => r.json())
    .then(list => {
      grid.innerHTML = '';
      list.forEach(c => {
        const card = document.createElement('div');
        card.className = 'fund-card';
        card.innerHTML = `<h3>${c.name}</h3><small>${c.code}</small>`;
        card.onclick = () => {
          history.pushState({ page: `meny/${c.code}` }, '', `/meny/${c.code}`);
          loadCurrencyDetail(c.code);
        };
        grid.appendChild(card);
      });
    });
}

function loadCurrencyDetail(code) {
  main.innerHTML = `
    <h3>Detail měny</h3>

    <div class="kpi-row">
      <div class="kpi"><span>Kurz</span><strong id="cur-kpi-last">–</strong></div>
      <div class="kpi"><span>Změna</span><strong id="cur-kpi-change">–</strong></div>
      <div class="kpi"><span>Záznamů</span><strong id="cur-kpi-count">–</strong></div>
    </div>

    <div class="period-switch">
      <button data-period="1M">1M</button>
      <button data-period="6M">6M</button>
      <button data-period="1Y">1Y</button>
      <button data-period="3Y" class="active">3Y</button>
      <button data-period="MAX">MAX</button>
    </div>

    <div id="chart-currency"></div>
    <button class="back-btn">← Zpět</button>
  `;

  document.querySelector('.back-btn').onclick = () => history.back();

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
  const res = await fetch(`${CURRENCY_DATA_API}?currency=${encodeURIComponent(code)}`);
  let data = await res.json();
  if (!Array.isArray(data)) return;

  data.sort((a, b) => new Date(a.date) - new Date(b.date));
  data = filterPeriod(data, period);

  renderCurrencyKPI(data);
  renderPortfolioChart(
    data.map(d => ({ date: d.date, value: d.value })),
    'chart-currency'
  );
}

function renderCurrencyKPI(data) {
  if (!data.length) return;
  const last = data.at(-1);
  const prev = data.at(-2);

  document.getElementById('cur-kpi-last').textContent =
    `${last.value.toFixed(4)} CZK`;
  document.getElementById('cur-kpi-count').textContent = data.length;

  if (prev) {
    const diff = last.value - prev.value;
    const pct = diff / prev.value * 100;
    const el = document.getElementById('cur-kpi-change');
    el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}

// ===================================================
// GRAF (SPOLEČNÝ CANVAS)
// ===================================================
let lastChart = null;

function renderPortfolioChart(history, containerId) {
  lastChart = { history, containerId };

  const div = document.getElementById(containerId);
  if (!div || history.length < 2) return;

  div.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = div.clientWidth;
  canvas.height = Math.min(div.clientWidth * 0.65, 320);
  div.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const padding = { top: 20, right: 60, bottom: 30, left: 20 };
  const w = canvas.width;
  const h = canvas.height;

  const values = history.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  ctx.strokeStyle = '#e6e6e6';
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';

  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (i / 5) * (h - padding.top - padding.bottom);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillText((max - i / 5 * range).toFixed(2), w - 8, y + 4);
  }

  const pts = history.map((p, i) => ({
    x: padding.left + i / (history.length - 1) * (w - padding.left - padding.right),
    y: padding.top + (max - p.value) / range * (h - padding.top - padding.bottom)
  }));

  ctx.beginPath();
  ctx.moveTo(pts[0].x, h - padding.bottom);
  pts.forEach(pt => ctx.lineTo(pt.x, pt.y));
  ctx.lineTo(pts.at(-1).x, h - padding.bottom);
  ctx.fillStyle = 'rgba(201,162,70,0.15)';
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = '#C9A646';
  ctx.lineWidth = 2;
  pts.forEach((pt, i) =>
    i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)
  );
  ctx.stroke();
}

window.addEventListener('resize', () => {
  if (lastChart) {
    renderPortfolioChart(lastChart.history, lastChart.containerId);
  }
});

// ===================================================
// FILTRACE OBDOBÍ
// ===================================================
function filterPeriod(data, period) {
  if (period === 'MAX') return data;
  const from = new Date();
  if (period === '1M') from.setMonth(from.getMonth() - 1);
  if (period === '6M') from.setMonth(from.getMonth() - 6);
  if (period === '1Y') from.setFullYear(from.getFullYear() - 1);
  if (period === '3Y') from.setFullYear(from.getFullYear() - 3);
  return data.filter(d => new Date(d.date) >= from);
}