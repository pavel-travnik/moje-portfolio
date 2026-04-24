// ===================================================
// HLAVNi KONTEJNER
// ===================================================
const main = document.getElementById('mainContent');

const apiCache = {
  dps: {},
  stocks: {},
  currencies: {},
  podiloveFondy: {}
};

apiCache.dpsFundsMeta = null;

// ===================================================
// API URL
// ===================================================
// nepoužívaný odkaz const DPS_API_URL = 'https://moje-portfolio-a5gkdcgbasg4areg.westeurope-01.azurewebsites.net/api/get_dps_data';

const DPS_API_URL = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_dps_data';
const DPS_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_dps_funds';

const STOCK_API_URL = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_stock_data';
const STOCK_LIST_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_active_stocks';

const CURRENCY_LIST_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_active_currencies';
const CURRENCY_DATA_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_currency_data';

const PODILOVE_FONDY_API =  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_active_podilove_fondy';
const PODILOVY_FOND_DATA_API =  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_podilovy_fond_data';

// ===================================================
// DROPDOWN – MOBILE SAFE
// ===================================================
document.addEventListener('click', e => {
  const toggle = e.target.closest('.dropdown-toggle');
  const menu = document.querySelector('.dropdown-menu');

  if (toggle) {
    e.preventDefault();
    e.stopPropagation();
    menu.classList.toggle('open');
    return;
  }

  if (menu && menu.classList.contains('open')) {
    menu.classList.remove('open');
  }
});

// ===================================================
// SPA NAVIGATION
// ===================================================
document.addEventListener('click', e => {
  const link = e.target.closest('a[data-page]');
  if (!link) return;
  e.preventDefault();
  e.stopPropagation();
  loadPage(link.dataset.page);
});

window.addEventListener('popstate', e => {
  if (e.state?.page) loadPage(e.state.page, false);
});

// ===================================================
// INIT
// ===================================================
(function init() {
  const path = location.pathname.replace(/^\/+/, '');
  loadPage(path || 'penze', false);
})();

// ===================================================
// ROUTER
// ===================================================
function loadPage(page, pushState = true) {
  if (page.startsWith('penze/')) {
    loadFundDetail(page.split('/')[1]);
    return;
  }

  if (page.startsWith('podilove-fondy/')) {
    loadPodilovyFondDetail(page.split('/')[1]);
    return;
  }

  if (page.startsWith('akcie/')) {
    loadStockDetail(page.split('/')[1]);
    return;
  }

  if (page.startsWith('etf/')) {
    loadStockDetail(page.split('/')[1]);
    return;
  }

  if (page.startsWith('meny/')) {
    loadStockDetail(page.split('/')[1]);
    return;
  }

  fetch(`pages/${page}.html`)
    .then(res => {
      if (!res.ok) throw new Error();
      return res.text();
    })
    .then(html => {
      main.innerHTML = html;

      if (page === 'penze') loadPensionFunds();
      if (page === 'podilove-fondy') loadPodiloveFondy();
      if (page === 'akcie') loadStocks();
      if (page === 'etf') loadEtfs();
      if (page === 'meny') loadCurrencies();

      if (pushState) history.pushState({ page }, '', `/${page}`);
    })
    .catch(() => {
      main.innerHTML = '<h3>404</h3><p>Stránka nenalezena</p>';
    });
}

// ===================================================
// PENZE preHLED
// ===================================================
function loadPensionFunds() {
  const grid = document.getElementById('fundGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám fondy</p>';

  fetch(DPS_API)
    .then(r => r.json())
    .then(funds => {
      apiCache.dpsFundsMeta = funds;
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

function renderFundMeta(isin) {
  if (!apiCache.dpsFundsMeta) return;

  const fund = apiCache.dpsFundsMeta.find(f => f.isin === isin);
  if (!fund) return;

  document.getElementById('fund-name').textContent = fund.name;
  document.getElementById('fund-provider').textContent = fund.provider;

  // Rizikovost (1–7)
  const riskEl = document.getElementById('kpi-risk');
  riskEl.textContent = ` ${fund.riskCategory} / 7`;
  riskEl.className = 'risk risk-' + fund.riskCategory;

  // URL fondu
  const link = document.getElementById('fund-url');
  link.href = fund.url;
}

// ===================================================
// DETAIL FONDU
// ===================================================

function loadFundDetail(isin) {
 main.innerHTML = `
  
  <h3 id="fund-name">Detail fondu</h3>
  <p class="meta">
  <span id="fund-provider"></span>
  </p>

  <p><strong>ISIN:</strong> ${isin}</p>

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
	
 

  <div class="period-row">
   <div class="period-switch">
    <button data-period="1M">1M</button>
    <button data-period="6M">6M</button>
    <button data-period="1Y">1Y</button>
    <button data-period="3Y" class="active">3Y</button>
    <button data-period="MAX">MAX</button>
   </div>
   <div id="period-diff" class="period-diff">—</div>
  </div>

  <div id="chart-portfolio"></div>
  <button class="back-btn">← Zpět</button>

 `;

 document.querySelector('.back-btn').onclick = () => history.back();

 document.querySelectorAll('.period-switch button').forEach(btn => {
  btn.onclick = () => {
   document
    .querySelectorAll('.period-switch button')
    .forEach(b => b.classList.remove('active'));
   btn.classList.add('active');
   loadDPSData(isin, btn.dataset.period);
  };
 });

 renderFundMeta(isin); 

 // stejně jako akcie → default 3Y
 loadDPSData(isin, '3Y');
}

async function loadDPSData(isin, period) {
 // ✅ 1️⃣ fetch jen jednou
 if (!apiCache.dps[isin]) {
  const res = await fetch(
   `${DPS_API_URL}?isin=${encodeURIComponent(isin)}`
  );

  let data = await res.json();
  if (!Array.isArray(data)) data = [];

  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  apiCache.dps[isin] = data;
 }

 // ✅ 2️⃣ period = frontend filtr (stejné jako akcie)
 const filtered = filterPeriod(apiCache.dps[isin], period);
 const finalData = filtered.length ? filtered : apiCache.dps[isin];

 // ✅ 3️⃣ render (stejná logika)
 renderFundKPI(finalData);
 renderPeriodDifference(
  finalData.map(d => ({ value: d.value }))
 );
 renderPortfolioChart(
  finalData.map(d => ({ date: d.date, value: d.value })),
  'chart-portfolio'
 );
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

  grid.innerHTML = '<p>Načítám fondy…</p>';

  fetch(PODILOVE_FONDY_API)
    .then(r => r.json())
    .then(funds => {
      grid.innerHTML = '';
      funds.forEach(f => {
        const card = document.createElement('div');
        card.className = 'fund-card';
        card.innerHTML = `
          <h3>${f.name}</h3>
          <small>${f.manager} · ${f.currency}</small>
        `;
        card.onclick = () => {
          history.pushState(
            { page: `podilove-fondy/${f.isin}` },
            '',
            `/podilove-fondy/${f.isin}`
          );
          loadPodilovyFondDetail(f.isin);
        };
        grid.appendChild(card);
      });
    });
}

function loadPodilovyFondDetail(isin) {
  main.innerHTML = `
    <h3>Detail podílového fondu</h3>
    <p><strong>ISIN:</strong> ${isin}</p>

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
        <span>Záznamů</span>
        <strong id="pf-kpi-count">-</strong>
      </div>
    </div>

<div class="period-row">
  <div class="period-switch">
    <button data-period="1M">1M</button>
    <button data-period="6M">6M</button>
    <button data-period="1Y">1Y</button>
    <button data-period="3Y" class="active">3Y</button>
    <button data-period="MAX">MAX</button>
  </div>

  <div id="period-diff" class="period-diff">
    —
  </div>
</div>


    <div id="chart-podilovy-fond"></div>
    <button class="back-btn">← Zpět</button>
  `;

  renderFundMeta(isin);
  
  document.querySelector('.back-btn').onclick = () => history.back();

  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPodilovyFondData(isin, btn.dataset.period);
    };
  });

  loadPodilovyFondData(isin, '3Y');
}

async function loadPodilovyFondData(isin, period) {
  if (!apiCache.podiloveFondy[isin]) {
    const res = await fetch(
      `${PODILOVY_FOND_DATA_API}?isin=${encodeURIComponent(isin)}`
    );
    let data = await res.json();
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    apiCache.podiloveFondy[isin] = data;
  }

  const filtered = filterPeriod(
    apiCache.podiloveFondy[isin],
    period
  );

  renderPodilovyFondKPI(filtered);
  renderPeriodDifference(filtered);

  renderPortfolioChart(
    filtered.map(d => ({ date: d.date, value: d.value })),
    'chart-podilovy-fond'
  );
}

function renderPodilovyFondKPI(data) {
  if (!data.length) return;

  const last = data.at(-1);
  const prev = data.at(-2);
  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');

  document.getElementById('pf-kpi-last').textContent =
    `${last.value.toFixed(4)} ${last.currency} (${dateStr})`;

  document.getElementById('pf-kpi-count').textContent = data.length;

  if (prev) {
    const diff = last.value - prev.value;
    const pct = (diff / prev.value) * 100;
    const el = document.getElementById('pf-kpi-change');
    el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}

// ===================================================
// AKCIE preEHLED
// ===================================================
function loadStocks() {
  const grid = document.getElementById('stockGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám akcie ...</p>';

  fetch(STOCK_LIST_API)
    .then(r => r.json())
    .then(stocks => {
      grid.innerHTML = '';
      
     stocks
      .filter(s => s.sector !== 'ETF')
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


function loadEtfs() {
  const grid = document.getElementById('etfGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám ETF…</p>';

  fetch(STOCK_LIST_API)
    .then(r => r.json())
    .then(stocks => {
      grid.innerHTML = '';

      stocks
        .filter(s => s.sector === 'ETF')
        .forEach(s => {
          const card = document.createElement('div');
          card.className = 'fund-card';

          // STEJNa STRUKTURA JAKO PENZE
          card.innerHTML = `
            <h3>${s.name}</h3>
            <small>${s.ticker}</small>
          `;

          card.onclick = () => {
            history.pushState(
              { page: `etf/${s.ticker}` },
              '',
              `/etf/${s.ticker}`
            );
            loadStockDetail(s.ticker);
          };

          grid.appendChild(card);
        });
    });
}

// ===================================================
// DETAIL AKCIE
// ===================================================
function loadStockDetail(ticker) {
  main.innerHTML = `
    <h3 id="stock-title">Detail akcie</h3>
    <p>
      <strong id="stock-name"> - </strong><br>
      <small>ID: ${ticker}</small>
    </p>

<div class="kpi-row">
  <div class="kpi">
    <span>Poslední cena</span>
    <strong id="stock-kpi-last"> - </strong>
  </div>
  <div class="kpi">
    <span>Denní­ změna</span>
    <strong id="stock-kpi-change"> - </strong>
  </div>
  <div class="kpi">
    <span>Objem</span>
    <strong id="stock-kpi-volume"> - </strong>
  </div>
</div>


    <p id="stock-meta" class="meta"> - </p>


<div class="period-row">
  <div class="period-switch">
    <button data-period="1M">1M</button>
    <button data-period="6M">6M</button>
    <button data-period="1Y">1Y</button>
    <button data-period="3Y" class="active">3Y</button>
    <button data-period="MAX">MAX</button>
  </div>

  <div id="period-diff" class="period-diff">
    —
  </div>
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

  loadStockName(ticker);
  loadStockData(ticker, '3Y');
}

async function loadStockName(ticker) {
  try {
    const res = await fetch(STOCK_LIST_API);
    const stocks = await res.json();
    const stock = stocks.find(s => s.ticker === ticker);
    if (stock) {
      document.getElementById('stock-name').textContent = stock.name;
      document.getElementById('stock-title').textContent = stock.name;
    }
  } catch {}
}

async function loadStockData(ticker, period) {
  const res = await fetch(`${STOCK_API_URL}?ticker=${encodeURIComponent(ticker)}`);
  let data = await res.json();
  if (!Array.isArray(data)) data = [];

  data.sort((a, b) => new Date(a.date) - new Date(b.date));
  const filtered = filterPeriod(data, period);
  const finalData = filtered.length ? filtered : data;

  renderStockKPI(finalData);
  
  renderPeriodDifference(
  finalData.map(d => ({ value: d.close }))
  );


  renderPortfolioChart(
    finalData.map(d => ({ date: d.date, value: d.close })),
    'chart-stock'
  );
}

function renderStockKPI(data) {
  if (!data.length) return;

  const last = data.at(-1);
  const prev = data.at(-2);

  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');
  const currency = last.currency ?? '';

  // Poslední cena + datum v závorce
  document.getElementById('stock-kpi-last').textContent =
    `${last.close.toFixed(2)} ${last.currency} (${dateStr})`;

  // Objem
  document.getElementById('stock-kpi-volume').textContent =
    last.volume?.toLocaleString('cs-CZ') || ' - ';

  // Denní­ změna
  if (prev) {
    const diff = last.close - prev.close;
    const pct = (diff / prev.close) * 100;
    const el = document.getElementById('stock-kpi-change');

    el.textContent = `${diff.toFixed(2)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  } else {
    document.getElementById('stock-kpi-change').textContent = ' - ';
  }
}

// ===================================================
// GRAF (SPOLEcne)
// ===================================================
let lastChartData = null;

function renderPortfolioChart(history, containerId) {
  lastChartData = { history, containerId };

  const div = document.getElementById(containerId);
  if (!div || history.length < 2) return;

  div.innerHTML = '';
  div.style.position = 'relative';

  const canvas = document.createElement('canvas');
  canvas.width = div.clientWidth;
  canvas.height = Math.min(div.clientWidth * 0.65, 320);
  div.appendChild(canvas);

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.background = '#111';
  tooltip.style.color = '#C9A646';
  tooltip.style.padding = '6px 8px';
  tooltip.style.fontSize = '12px';
  tooltip.style.borderRadius = '6px';
  tooltip.style.display = 'none';
  tooltip.style.whiteSpace = 'nowrap';
  div.appendChild(tooltip);

  const ctx = canvas.getContext('2d');

  const padding = { top: 20, right: 60, bottom: 30, left: 20 };
  const w = canvas.width;
  const h = canvas.height;



  const values = history.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Grid
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
    ctx.fillText(
      (max - (i / 5) * range).toFixed(2),
      w - 8,
      y + 4
    );
  }

  // Body (area)
  const points = history.map((p, i) => ({
    x:
      padding.left +
      (i / (history.length - 1)) *
        (w - padding.left - padding.right),
    y:
      padding.top +
      ((max - p.value) / range) *
        (h - padding.top - padding.bottom)
  }));

  ctx.beginPath();
  ctx.moveTo(points[0].x, h - padding.bottom);
  points.forEach(pt => ctx.lineTo(pt.x, pt.y));
  ctx.lineTo(points.at(-1).x, h - padding.bottom);
  ctx.fillStyle = 'rgba(201,162,70,0.15)';
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#C9A646';
  ctx.lineWidth = 2;
  points.forEach((pt, i) =>
    i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)
  );
  ctx.stroke();

// ===== OSA X – DATUM =====
ctx.textAlign = 'center';
ctx.textBaseline = 'top';
ctx.fillStyle = '#666';

const maxXTicks = 5;
const step = Math.max(1, Math.floor(history.length / maxXTicks));

for (let i = 0; i < history.length; i += step) {
  const x =
    padding.left +
    (i / (history.length - 1)) *
      (w - padding.left - padding.right);

  const dateStr = new Date(history[i].date).toLocaleDateString('cs-CZ');

  // malá značka
  ctx.strokeStyle = '#ccc';
  ctx.beginPath();
  ctx.moveTo(x, h - padding.bottom);
  ctx.lineTo(x, h - padding.bottom + 4);
  ctx.stroke();

  // datum
  ctx.fillText(dateStr, x, h - padding.bottom + 6);
}

  // 🔍 Tooltip logic
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const index = Math.round(
      (x - padding.left) /
        (w - padding.left - padding.right) *
        (history.length - 1)
    );

    if (index < 0 || index >= history.length) {
      tooltip.style.display = 'none';
      return;
    }

    const p = points[index];
    const d = history[index];

    // ctx.clearRect(0, 0, w, h);
    // renderPortfolioChart(history, containerId); // redraw background only once
    tooltip.style.display = 'block';

    const dateStr = new Date(d.date).toLocaleDateString('cs-CZ');
    tooltip.innerHTML = `${dateStr}<br><strong>${d.value.toFixed(4)}</strong>`;

    tooltip.style.left = `${p.x + 10}px`;
    tooltip.style.top = `${p.y}px`;
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });
}

function renderPeriodDifference(data) {
  const box = document.getElementById('period-diff');
  if (!box || data.length < 2) {
    if (box) box.innerHTML = '<span>Změna</span> —';
    return;
  }

  const first = data[0];
  const last = data.at(-1);

  const diff = last.value - first.value;
  const pct = (diff / first.value) * 100;

  box.innerHTML = `
    <span>Změna</span>
    ${diff.toFixed(4)}
    (<strong>${pct.toFixed(2)} %</strong>)
  `;

  box.className =
    'period-diff ' + (diff >= 0 ? 'pos' : 'neg');
}

// ===================================================
// RESIZE
// ===================================================
window.addEventListener('resize', () => {
  if (!lastChartData) return;
  renderPortfolioChart(lastChartData.history, lastChartData.containerId);
});

// ===================================================
// FILTRACE OBDOBi
// ===================================================
function filterPeriod(data, period) {
  if (period === 'MAX') return data;

  const from = new Date();

  if (period === '1M') {
    from.setMonth(from.getMonth() - 1);
  } else if (period === '6M') {
    from.setMonth(from.getMonth() - 6);
  } else if (period === '1Y') {
    from.setFullYear(from.getFullYear() - 1);
  } else if (period === '3Y') {
    from.setFullYear(from.getFullYear() - 3);
  }

  return data.filter(d => new Date(d.date) >= from);
}


// ===================================================
// MeNY PreHLED
// ===================================================
function loadCurrencies() {
  const grid = document.getElementById('currencyGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám měny ...</p>';

  fetch(CURRENCY_LIST_API)
    .then(r => r.json())
    .then(list => {
      grid.innerHTML = '';

      list.forEach(c => {
        const card = document.createElement('div');
        card.className = 'fund-card';

        // STEJNĂ STRUKTURA JAKO PENZE
        card.innerHTML = `
          <h3>${c.name}</h3>
          <small>${c.code}</small>
        `;

        card.onclick = () => {
          history.pushState(
            { page: `meny/${c.code}` },
            '',
            `/meny/${c.code}`
          );
          loadCurrencyDetail(c.code);
        };

        grid.appendChild(card);
      });
    });
}

// ===================================================
// DETAIL MeNY
// ===================================================
function loadCurrencyDetail(code) {
  main.innerHTML = `
    <h3>Detail měny</h3>
    <p><strong>${code}</strong></p>

    <div class="kpi-row">
      <div class="kpi"><span>Aktuální kurz</span><strong id="cur-kpi-last"> - </strong></div>
      <div class="kpi"><span>Změna</span><strong id="cur-kpi-change"> - </strong></div>
      <div class="kpi"><span>Záznamů</span><strong id="cur-kpi-count"> - </strong></div>
    </div>

<div class="period-row">
  <div class="period-switch">
    <button data-period="1M">1M</button>
    <button data-period="6M">6M</button>
    <button data-period="1Y">1Y</button>
    <button data-period="3Y" class="active">3Y</button>
    <button data-period="MAX">MAX</button>
  </div>

  <div id="period-diff" class="period-diff">
    —
  </div>
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
  if (!apiCache.currencies[code]) {
    const res = await fetch(
      `${CURRENCY_DATA_API}?currency=${encodeURIComponent(code)}`
    );
    let data = await res.json();
    if (!Array.isArray(data)) data = [];
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    apiCache.currencies[code] = data;
  }

  const filtered = filterPeriod(apiCache.currencies[code], period);
  renderCurrencyKPI(filtered);
  renderPeriodDifference(filtered);

  renderPortfolioChart(
    filtered.map(d => ({ date: d.date, value: d.value })),
    'chart-currency'
  );
}

function renderCurrencyKPI(data) {
  if (!data.length) return;

  const last = data.at(-1);
  const prev = data.at(-2);
  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');


  document.getElementById('cur-kpi-last').textContent =
    `${last.value.toFixed(4)} CZK (${dateStr})`;


  document.getElementById('cur-kpi-count').textContent = data.length;

  if (prev) {
    const diff = last.value - prev.value;
    const pct = (diff / prev.value) * 100;
    const el = document.getElementById('cur-kpi-change');
    el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}