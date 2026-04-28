// ===================================================
// PORTFOLIO.JS – FINÁLNÍ STABILNÍ VERZE
// ===================================================

const PORTFOLIO_API =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api';

// DOČASNĚ – později z JWT
const CURRENT_USER_ID = 1;

// ===== FORMÁTOVÁNÍ ČÍSEL (CZ) =====
const fmtNumber = (value, decimals = 2) =>
  new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);

// ===================================================
// ROUTER ENTRY – volá app.js
// ===================================================
window.loadPortfolioPage = async function (page) {
  const main = document.getElementById('mainContent');

  // normalizace routy
  page = page.replace(/^\/+/, '').replace(/\/$/, '');

  // ===================================================
  // /portfolio – seznam portfolií
  // ===================================================
  if (page === 'portfolio') {
    main.innerHTML = `
      <h1 class="h1">Moje portfolia</h1>
      <div id="portfolioList" class="fund-grid"></div>
    `;

    const portfolios = await fetchUserPortfolios();
    renderPortfolioList(portfolios);
    return;
  }

  // ===================================================
  // /portfolio/{id} – detail portfolia
  // ===================================================
  if (page.startsWith('portfolio/')) {
    const portfolioId = page.split('/')[1];

    main.innerHTML = `
      <!-- TABS -->
      <div class="toolbar" style="gap:.5rem;margin-bottom:1rem">
        <button class="button tab active" data-tab="overview">Přehled</button>
        <button class="button tab" data-tab="instruments">Instrumenty</button>
        <button class="button tab" data-tab="transactions">Transakce</button>
        <button class="button tab" data-tab="settings">Nastavení</button>
      </div>

      <h1 class="h1">Portfolio ${portfolioId}</h1>

      <!-- ================= PŘEHLED ================= -->
      <section id="tab-overview" class="portfolio-tab active">
        <div class="kpi-row">
          <div class="kpi">
            <span>Hodnota</span>
            <strong id="pf-kpi-value">—</strong>
          </div>
          <div class="kpi">
            <span>Denní změna</span>
            <strong id="pf-kpi-daily">—</strong>
          </div>
        </div>
      </section>

      <!-- ================= INSTRUMENTY ================= -->
      <section id="tab-instruments" class="portfolio-tab">
        <table class="portfolio-table">
          <thead>
            <tr>
              <th>Název</th>
              <th>Měna</th>
              <th>Hodnota</th>
              <th>1M</th>
              <th>6M</th>
              <th>1Y</th>
            </tr>
          </thead>
          <tbody id="portfolio-instruments"></tbody>
        </table>
      </section>

      <!-- ================= TRANSAKCE ================= -->
      <section id="tab-transactions" class="portfolio-tab">
        <div class="toolbar" style="justify-content:space-between">
          <span class="muted">Transakce</span>
          <button class="button" id="btn-add-transaction">Přidat transakci</button>
        </div>
        <table class="portfolio-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Instrument</th>
              <th>Směr</th>
              <th>Množství</th>
              <th>Cena</th>
            </tr>
          </thead>
          <tbody id="portfolio-transactions"></tbody>
        </table>
      </section>

      <!-- ================= NASTAVENÍ ================= -->
      <section id="tab-settings" class="portfolio-tab">
        <div class="card" style="max-width:420px">
          <label class="stack">
            <span class="muted">E‑mail</span>
            <input class="input" type="email">
          </label>

          <label class="stack">
            <span class="muted">Zasílání přehledu</span>
            <select class="select">
              <option value="off">Vypnuto</option>
              <option value="daily">Denně</option>
              <option value="weekly">Týdně</option>
            </select>
          </label>

          <button class="button">Uložit</button>
        </div>
      </section>

      <button class="back-btn">← Zpět</button>
    `;

    document.querySelector('.back-btn').onclick = () => history.back();

    // ===== API =====
    const detail = await fetchPortfolioDetail(portfolioId);
    renderPortfolioOverview(detail);

    if (Array.isArray(detail?.positions)) {
      renderPortfolioInstruments(detail.positions);
    }

    const trades = await fetchPortfolioTransactions(portfolioId);
    renderPortfolioTransactions(trades);

    document.getElementById('btn-add-transaction').onclick =
      () => openTransactionModal(portfolioId);

    initPortfolioTabs();
  }
};

// ===================================================
// API
// ===================================================
async function fetchUserPortfolios() {
  const r = await fetch(
    `${PORTFOLIO_API}/get_portfolios?user_id=${CURRENT_USER_ID}`
  );
  return await r.json();
}

async function fetchPortfolioDetail(id) {
  const r = await fetch(
    `${PORTFOLIO_API}/get_portfolio_detail?portfolio_id=${id}&user_id=${CURRENT_USER_ID}`
  );
  return await r.json();
}

// ✅ ROBUSTNÍ – endpoint může chybět
async function fetchPortfolioTransactions(id) {
  try {
    const r = await fetch(
      `${PORTFOLIO_API}/get_portfolio_trades?portfolio_id=${id}&user_id=${CURRENT_USER_ID}`
    );
    if (!r.ok) return [];
    return await r.json();
  } catch {
    return [];
  }
}

// ===================================================
// RENDER
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
      history.pushState({}, '', `/portfolio/${p.portfolio_id}`);
      loadPortfolioPage(`portfolio/${p.portfolio_id}`);
    };
    grid.appendChild(card);
  });
}

function renderPortfolioOverview(data) {
  const valueEl = document.getElementById('pf-kpi-value');
  const dailyEl = document.getElementById('pf-kpi-daily');

  if (!data || !data.valuation) {
    valueEl.textContent = '—';
    dailyEl.textContent = '—';
    return;
  }

  valueEl.textContent =
    `${fmtNumber(data.valuation.gross_value_base)} CZK`;

  if (data.valuation.pnl_day_czk !== null) {
    const diff = data.valuation.pnl_day_czk;
    const pct = data.valuation.pnl_day_pct * 100;
    dailyEl.textContent =
      `${fmtNumber(diff)} (${fmtNumber(pct, 2)} %)`;
    dailyEl.className = diff >= 0 ? 'pos' : 'neg';
  } else {
    dailyEl.textContent = '—';
  }
}

function renderPortfolioInstruments(positions) {
  const tbody = document.getElementById('portfolio-instruments');
  tbody.innerHTML = '';

  positions.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.asset_type} · ${p.asset_id}</td>
      <td>${p.cost_currency}</td>
      <td>${fmtNumber(p.book_value)} ${p.cost_currency}</td>
      <td>—</td>
      <td>—</td>
      <td>—</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPortfolioTransactions(trades) {
  const tbody = document.getElementById('portfolio-transactions');
  tbody.innerHTML = '';

  if (!Array.isArray(trades) || trades.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="muted">Zatím žádné transakce</td></tr>';
    return;
  }

  trades.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.trade_date}</td>
      <td>${t.asset_type} · ${t.asset_id}</td>
      <td>${t.trade_type}</td>
      <td>${fmtNumber(t.quantity, 4)}</td>
      <td>${fmtNumber(t.price, 4)} ${t.currency}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===================================================
// TABS
// ===================================================
function initPortfolioTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document
        .querySelectorAll('.portfolio-tab')
        .forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      document
        .getElementById(`tab-${btn.dataset.tab}`)
        .classList.add('active');
    };
  });
}