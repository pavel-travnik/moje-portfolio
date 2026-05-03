// ===================================================
// PORTFOLIO.JS – NOVÝ STABILNÍ SOUBOR
// ===================================================

const PORTFOLIO_API =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api';

const CURRENT_USER_ID = 1;

// ===================================================
// HELPERS
// ===================================================
const fmtNumber = (value, decimals = 2) =>
  new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);

// ===================================================
// TABLE ROW BEHAVIOUR (GLOBAL)
// ===================================================
function bindAppTableRows(tableEl) {
  if (!tableEl) return;
  const rows = tableEl.querySelectorAll('tbody tr');

  rows.forEach(tr => {
    tr.addEventListener('mouseenter', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
    });
    tr.addEventListener('click', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
    });
  });
}

// ===================================================
// ROUTER ENTRY (volá app.js)
// ===================================================
window.loadPortfolioPage = async function (page) {
  const main = document.getElementById('mainContent');
  page = page.replace(/^\/+/, '').replace(/\/$/, '');

  // ===============================
  // /portfolio – seznam
  // ===============================
  if (page === 'portfolio') {
    main.innerHTML = `
      <h1>Moje portfolia</h1>
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
      <div class="toolbar portfolio-tabs" style="gap:.5rem;margin-bottom:1rem">
        <button class="button tab active" data-tab="overview">Přehled</button>
        <button class="button tab" data-tab="instruments">Instrumenty</button>
        <button class="button tab" data-tab="transactions">Transakce</button>
        <button class="button tab" data-tab="settings">Nastavení</button>
      </div>

      <h1>Portfolio ${portfolioId}</h1>

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

      <section id="tab-instruments" class="portfolio-tab">
        <table class="app-table">
          <thead>
            <tr>
              <th>Instrument</th>
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

      <section id="tab-transactions" class="portfolio-tab">
        <div class="toolbar" style="justify-content:space-between">
          <span class="muted">Transakce</span>
          <button
            id="btn-add-transaction"
            class="button pill-button"
            data-portfolio-id="${portfolioId}">
            Přidat transakci
          </button>
        </div>

        <table class="app-table">
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

    initPortfolioTabs();
    document.querySelector('.back-btn').onclick = () => history.back();
    document.getElementById('btn-add-transaction').onclick =
      () => openTransactionModal(portfolioId);

    const detail = await fetchPortfolioDetail(portfolioId);
    renderPortfolioOverview(detail);

    if (Array.isArray(detail?.positions)) {
      renderPortfolioInstruments(detail.positions);
    }

    const trades = await fetchPortfolioTransactions(portfolioId);
    renderPortfolioTransactions(trades);
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

async function fetchPortfolioTransactions(portfolioId) {
  try {
    const r = await fetch(
      `${PORTFOLIO_API}/get_portfolio_trades?portfolio_id=${portfolioId}&user_id=${CURRENT_USER_ID}`
    );
    if (!r.ok) return [];
    const data = await r.json();
    return data.trades ?? [];
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
      <small>${p.base_ccy}</small>
    `;
    card.onclick = () => {
      history.pushState({}, '', `/portfolio/${p.portfolio_id}`);
      loadPortfolioPage(`portfolio/${p.portfolio_id}`);
    };
    grid.appendChild(card);
  });
}

function renderPortfolioOverview(data) {
  if (!data?.valuation) return;
  const val = data.valuation;

  document.getElementById('pf-kpi-value').textContent =
    `${fmtNumber(val.gross_value_base)} CZK`;

  const el = document.getElementById('pf-kpi-daily');
  const diff = val.pnl_day_czk;
  const pct = val.pnl_day_pct * 100;

  el.textContent = `${fmtNumber(diff)} (${fmtNumber(pct)} %)`;
  el.className = diff >= 0 ? 'pos' : 'neg';
}

function renderPortfolioInstruments(positions) {
  const tbody = document.getElementById('portfolio-instruments');
  tbody.innerHTML = '';

  positions.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Instrument">${p.asset_type} · ${p.asset_id}</td>
      <td data-label="Měna">${p.cost_currency}</td>
      <td data-label="Hodnota">${fmtNumber(p.book_value)} ${p.cost_currency}</td>
      <td data-label="1M">—</td>
      <td data-label="6M">—</td>
      <td data-label="1Y">—</td>
    `;
    tbody.appendChild(tr);
  });

  bindAppTableRows(tbody.closest('table'));
}

function renderPortfolioTransactions(trades) {
  const tbody = document.getElementById('portfolio-transactions');
  tbody.innerHTML = '';

  trades.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Datum">${new Date(t.trade_date).toLocaleDateString('cs-CZ')}</td>
      <td data-label="Instrument">${t.asset_type} · ${t.asset_id}</td>
      <td data-label="Směr">${t.trade_type}</td>
      <td data-label="Množství">${fmtNumber(t.quantity, 4)}</td>
      <td data-label="Cena">${fmtNumber(t.price, 4)} ${t.currency}</td>
    `;
    tbody.appendChild(tr);
  });

  bindAppTableRows(tbody.closest('table'));
}

// ===================================================
// MODAL (zatím stub – rozšíříš později)
// ===================================================
function openTransactionModal(portfolioId) {
  alert(`Přidání transakce – portfolio ${portfolioId}`);
}

// ===================================================
// TABS
// ===================================================
function initPortfolioTabs() {
  const tabs = document.querySelectorAll('.portfolio-tabs .tab');
  const sections = document.querySelectorAll('.portfolio-tab');

  tabs.forEach(btn => {
    btn.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document
        .getElementById(`tab-${btn.dataset.tab}`)
        ?.classList.add('active');
    };
  });
}