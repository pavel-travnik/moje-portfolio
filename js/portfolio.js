// ===================================================
// PORTFOLIO.JS – osobní portfolio
// ===================================================

const PORTFOLIO_API =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api';

// ⛔ DOČASNĚ – později z JWT
const CURRENT_USER_ID = 1;

// ===================================================
// ROUTER ENTRY (voláno z app.js)
// ===================================================
window.loadPortfolioPage = async function (page) {
  const main = document.getElementById('mainContent');

  // ===============================
  // /portfolio – seznam portfolií
  // ===============================
  if (page === 'portfolio') {
    main.innerHTML = `
      <h1 class="h1">Moje portfolia</h1>
      <div id="portfolioList" class="fund-grid"></div>
    `;

    const portfolios = await fetchUserPortfolios();
    renderPortfolioList(portfolios);
    return;
  }

  // ===============================
  // /portfolio/{id} – detail
  // ===============================
  if (page.startsWith('portfolio/')) {
    const portfolioId = page.split('/')[1];

    main.innerHTML = `
      <h1 class="h1">Portfolio ${portfolioId}</h1>
      <p class="muted">Denní valuace, pozice a vývoj hodnoty.</p>

      <div class="grid-3">
        <div class="card">
          <div class="muted">Hodnota</div>
          <div class="kpi" id="pf-kpi-value">–</div>
        </div>
        <div class="card">
          <div class="muted">Denní změna</div>
          <span id="pf-kpi-daily" class="chip">–</span>
        </div>
        <div class="card">
          <div class="muted">YTD</div>
          <span class="chip">—</span>
        </div>
      </div>

      <div class="card" style="margin-top:1rem">
        <div class="toolbar" style="justify-content:space-between">
          <div class="muted">Graf vývoje hodnoty</div>
          <div>
            <button class="button" data-range="1M">1M</button>
            <button class="button" data-range="3M">3M</button>
            <button class="button" data-range="6M">6M</button>
            <button class="button" data-range="1Y">1R</button>
            <button class="button" data-range="MAX">MAX</button>
          </div>
        </div>
        <div id="chart-portfolio"></div>
      </div>

      <div class="card" style="margin-top:1rem">
        <div class="toolbar" style="justify-content:space-between">
          <div class="muted">Pozice</div>
          <div>
            <button class="button" id="btn-add-trade">Přidat transakci</button>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Množství</th>
              <th>Průměrná cena</th>
              <th>Hodnota</th>
            </tr>
          </thead>
          <tbody id="portfolio-positions"></tbody>
        </table>
      </div>

      <button class="back-btn" style="margin-top:1.5rem">← Zpět</button>
    `;

    document.querySelector('.back-btn').onclick = () => history.back();

    const detail = await fetchPortfolioDetail(portfolioId);
    const chart = await fetchPortfolioChart(portfolioId);

    renderPortfolioDetail(detail);
    renderPortfolioChartData(chart);

    document.getElementById('btn-add-trade').onclick = () =>
      openTradeModal(portfolioId);

    return;
  }
};

// ===================================================
// API CALLS
// ===================================================

async function fetchUserPortfolios() {
  const res = await fetch(
    `${PORTFOLIO_API}/get_portfolios?user_id=${CURRENT_USER_ID}`
  );
  return await res.json();
}

async function fetchPortfolioDetail(portfolioId) {
  const res = await fetch(
    `${PORTFOLIO_API}/get_portfolio_detail?portfolio_id=${portfolioId}&user_id=${CURRENT_USER_ID}`
  );
  return await res.json();
}

async function fetchPortfolioChart(portfolioId) {
  const res = await fetch(
    `${PORTFOLIO_API}/get_portfolio_chart?portfolio_id=${portfolioId}&user_id=${CURRENT_USER_ID}`
  );
  return await res.json();
}

// ===================================================
// RENDER – seznam portfolií
// ===================================================

function renderPortfolioList(portfolios) {
  const grid = document.getElementById('portfolioList');
  grid.innerHTML = '';

  portfolios.forEach(p => {
    const card = document.createElement('div');
    card.className = 'fund-card';
    card.innerHTML = `
      <h3>Portfolio ${p.portfolio_id}</h3>
      <small>Základní měna: ${p.base_ccy}</small>
    `;
    card.onclick = () => {
      history.pushState(
        { page: `portfolio/${p.portfolio_id}` },
        '',
        `/portfolio/${p.portfolio_id}`
      );
      window.loadPortfolioPage(`portfolio/${p.portfolio_id}`);
    };
    grid.appendChild(card);
  });
}

// ===================================================
// RENDER – detail portfolia
// ===================================================

function renderPortfolioDetail(data) {
  if (!data.valuation) return;

  document.getElementById('pf-kpi-value').textContent =
    `${data.valuation.gross_value_base.toFixed(2)} CZK`;

  const daily = document.getElementById('pf-kpi-daily');
  if (data.valuation.pnl_day_czk !== null) {
    const diff = data.valuation.pnl_day_czk;
    const pct = data.valuation.pnl_day_pct * 100;
    daily.textContent = `${diff.toFixed(2)} (${pct.toFixed(2)}%)`;
    daily.className = 'chip ' + (diff >= 0 ? 'pos' : 'neg');
  } else {
    daily.textContent = '—';
  }

  const tbody = document.getElementById('portfolio-positions');
  tbody.innerHTML = '';

  data.positions.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.asset_type} · ${p.asset_id}</td>
      <td>${p.quantity}</td>
      <td>${p.avg_cost.toFixed(2)} ${p.cost_currency}</td>
      <td>${p.book_value.toFixed(2)} ${p.cost_currency}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===================================================
// GRAF – stejný renderer jako app.js
// ===================================================

function renderPortfolioChartData(chart) {
  if (!Array.isArray(chart) || chart.length < 2) return;

  renderPortfolioChart(
    chart.map(d => ({
      date: d.date,
      value: d.value
    })),
    'chart-portfolio'
  );
}

// ===================================================
// MODAL – PŘIDAT TRANSAKCI
// ===================================================

function injectTradeModal() {
  if (document.getElementById('trade-modal')) return;

  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div class="modal-backdrop" id="trade-modal">
      <div class="modal">
        <div class="modal-head">
          <h3 style="margin:0;color:var(--green)">Přidat transakci</h3>
          <button class="close" id="trade-modal-close">×</button>
        </div>

        <div class="stack">
          <input id="tx-asset-id" class="input" placeholder="Ticker / ISIN">
          <select id="tx-asset-type" class="select">
            <option value="ETF">ETF</option>
            <option value="STOCK">Akcie</option>
            <option value="FUND">Podílový fond</option>
            <option value="DPS">Penzijní fond</option>
          </select>
          <select id="tx-side" class="select">
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <input id="tx-qty" type="number" step="0.0001" class="input" placeholder="Množství">
          <input id="tx-price" type="number" step="0.0001" class="input" placeholder="Cena">
          <select id="tx-currency" class="select">
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>

          <div style="display:flex;justify-content:flex-end">
            <button class="button" id="tx-save">Uložit</button>
          </div>
        </div>
      </div>
    </div>
  `
  );
}

function openTradeModal(portfolioId) {
  injectTradeModal();
  const modal = document.getElementById('trade-modal');
  modal.style.display = 'flex';

  document.getElementById('trade-modal-close').onclick = () =>
    (modal.style.display = 'none');

  document.getElementById('tx-save').onclick = async () =>
    submitTrade(portfolioId);
}

async function submitTrade(portfolioId) {
  const payload = {
    asset_type: document.getElementById('tx-asset-type').value,
    asset_id: document.getElementById('tx-asset-id').value.trim(),
    trade_type: document.getElementById('tx-side').value,
    quantity: parseFloat(document.getElementById('tx-qty').value),
    price: parseFloat(document.getElementById('tx-price').value),
    currency: document.getElementById('tx-currency').value,
    trade_date: new Date().toISOString().slice(0, 10)
  };

  if (!payload.asset_id || !payload.quantity || !payload.price) {
    alert('Vyplň všechna povinná pole.');
    return;
  }

  await fetch(
    `${PORTFOLIO_API}/add_portfolio_trade?portfolio_id=${portfolioId}&user_id=${CURRENT_USER_ID}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  document.getElementById('trade-modal').style.display = 'none';

  const detail = await fetchPortfolioDetail(portfolioId);
  const chart = await fetchPortfolioChart(portfolioId);

  renderPortfolioDetail(detail);
  renderPortfolioChartData(chart);
}