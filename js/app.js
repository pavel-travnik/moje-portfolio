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
// MENU SPA NAVIGACE – POZOR: JEN MENU
// ===================================================
function initMenuNavigation() {
  document.querySelectorAll('a[data-page]').forEach(link => {
    link.onclick = e => {
      e.preventDefault();
      const page = link.dataset.page;
      closeDropdown();
      loadPage(page);
    };
  });
}

// ===================================================
// DROPDOWN
// ===================================================
const dropdownToggle = document.querySelector('.dropdown-toggle');
const dropdownMenu = document.querySelector('.dropdown-menu');

function closeDropdown() {
  dropdownMenu?.classList.remove('open');
}

dropdownToggle?.addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();
  dropdownMenu.classList.toggle('open');
});

document.addEventListener('click', () => closeDropdown());

// ===================================================
// HISTORY
// ===================================================
window.onpopstate = e => {
  if (e.state?.page) loadPage(e.state.page, false);
};

// ===================================================
// INIT
// ===================================================
(() => {
  initMenuNavigation();
  const path = location.pathname.replace(/^\/+/, '');
  loadPage(path || 'uvod', false);
})();

// ===================================================
// ROUTER
// ===================================================
function loadPage(page, pushState = true) {

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

  fetch(`pages/${page}.html`)
    .then(r => r.text())
    .then(html => {
      main.innerHTML = html;

      if (page === 'penze') loadPensionFunds();
      if (page === 'akcie') loadStocks();
      if (page === 'etf') loadEtfs();
      if (page === 'meny') loadCurrencies();

      if (pushState) history.pushState({ page }, '', `/${page}`);
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

  document.querySelectorAll('.period-switch button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      loadDPS(isin, b.dataset.period);
    };
  });

  loadDPS(isin, '3Y');
}

// ===================================================
// PENZE DATA
// ===================================================
async function loadDPS(isin, period) {
  const r = await fetch(`${DPS_API_URL}?isin=${encodeURIComponent(isin)}`);
  let data = await r.json();
  if (!Array.isArray(data)) return;

  data.sort((a, b) => new Date(a.date) - new Date(b.date));
  data = filterPeriod(data, period);

  renderFundKPI(data);
  renderChart(data.map(d => ({ value: d.value })), 'chart-portfolio');
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
// AKCIE / ETF – PŘEHLEDY
// ===================================================
function loadStocks() { loadStockGrid(false); }
function loadEtfs() { loadStockGrid(true); }

function loadStockGrid(isETF) {
  const grid = document.getElementById(isETF ? 'etfGrid' : 'stockGrid');
  if (!grid) return;

  grid.innerHTML = 'Načítám…';

  fetch(STOCK_LIST_API)
    .then(r => r.json())
    .then(list => {
      grid.innerHTML = '';
      list.filter(s => (s.sector === 'ETF') === isETF)
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
    <h3>Detail ${ticker}</h3>
    <div class="kpi-row">
      <div class="kpi"><span>Cena</span><strong id="stock-last">–</strong></div>
      <div class="kpi"><span>Změna</span><strong id="stock-change">–</strong></div>
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
  document.querySelectorAll('.period-switch button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      loadStockData(ticker, b.dataset.period);
    };
  });

  loadStockData(ticker, '3Y');
}

async function loadStockData(ticker, period) {
  const r = await fetch(`${STOCK_API_URL}?ticker=${encodeURIComponent(ticker)}`);
  let data = await r.json();
  if (!Array.isArray(data)) return;

  data.sort((a, b) => new Date(a.date) - new Date(b.date));
  data = filterPeriod(data, period);

  document.getElementById('stock-last').textContent =
    `${data.at(-1).close.toFixed(2)} ${data.at(-1).currency}`;

  renderChart(data.map(d => ({ value: d.close })), 'chart-stock');
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
    <h3>Měna ${code}</h3>
    <div id="chart-currency"></div>
    <button class="back-btn">← Zpět</button>
  `;
  document.querySelector('.back-btn').onclick = () => history.back();
  loadCurrencyData(code);
}

async function loadCurrencyData(code) {
  const r = await fetch(`${CURRENCY_DATA_API}?currency=${encodeURIComponent(code)}`);
  let data = await r.json();
  if (!Array.isArray(data)) return;
  renderChart(data.map(d => ({ value: d.value })), 'chart-currency');
}

// ===================================================
// GRAF – SPOLEČNÝ
// ===================================================
function renderChart(points, id) {
  const div = document.getElementById(id);
  if (!div || points.length < 2) return;

  div.innerHTML = '';
  const c = document.createElement('canvas');
  c.width = div.clientWidth;
  c.height = 260;
  div.appendChild(c);

  const ctx = c.getContext('2d');
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  ctx.strokeStyle = '#C9A646';
  ctx.beginPath();

  points.forEach((p, i) => {
    const x = i / (points.length - 1) * c.width;
    const y = c.height - ((p.value - min) / range * c.height);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });

  ctx.stroke();
}

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