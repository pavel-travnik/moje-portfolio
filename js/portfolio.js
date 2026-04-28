// ===================================================
// PORTFOLIO.JS – FINÁLNÍ FUNKČNÍ VERZE
// ===================================================

const PORTFOLIO_API =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api';

// DOČASNĚ – později z JWT
const CURRENT_USER_ID = 1;

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
      <p class="muted">Správa a přehled portfolia</p>

      <!-- OVERVIEW -->
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

        <div id="chart-portfolio"></div>
      </section>

      <!-- INSTRUMENTS -->
      <section id="tab-instruments" class="portfolio-tab">
        <table class="table">
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

      <!-- TRANSACTIONS -->
      <section id="tab-transactions" class="portfolio-tab">
        <p class="muted">Načtení transakcí (API)</p>
      </section>

      <!-- SETTINGS -->
      <section id="tab-settings" class="portfolio-tab">
        <p class="muted">Nastavení účtu (API)</p>
      </section>

      <button class="back-btn">← Zpět</button>
    `;

    document.querySelector('.back-btn').onclick = () => history.back();

    // === API ===
    const detail = await fetchPortfolioDetail(portfolioId);

    renderPortfolioOverview(detail);

    if (Array.isArray(detail?.positions)) {
      renderPortfolioInstruments(detail.positions);
    }

    initPortfolioTabs();
    return;
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

// ===================================================
// RENDER – seznam portfolií
// ===================================================
function renderPortfolioList(portfolios) {
  const grid = document.getElementById('portfolioList');
  grid.innerHTML = '';

  if (!Array.isArray(portfolios) || portfolios.length === 0) {
    grid.innerHTML = '<p class="muted">Žádné portfolio</p>';
    return;
  }

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
// RENDER – overview (ODOLNÉ PRO NULL)
// ===================================================
function renderPortfolioOverview(data) {
  const valueEl = document.getElementById('pf-kpi-value');
  const dailyEl = document.getElementById('pf-kpi-daily');

  if (!data || !data.valuation) {
    valueEl.textContent = '—';
    dailyEl.textContent = '—';
    return;
  }

  valueEl.textContent =
    `${data.valuation.gross_value_base.toFixed(2)} CZK`;

  if (data.valuation.pnl_day_czk !== null) {
    const diff = data.valuation.pnl_day_czk;
    const pct = data.valuation.pnl_day_pct * 100;
    dailyEl.textContent = `${diff.toFixed(2)} (${pct.toFixed(2)}%)`;
    dailyEl.className = diff >= 0 ? 'pos' : 'neg';
  } else {
    dailyEl.textContent = '—';
  }
}

// ===================================================
// RENDER – instruments
// ===================================================
function renderPortfolioInstruments(positions) {
  const tbody = document.getElementById('portfolio-instruments');
  tbody.innerHTML = '';

  positions.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.asset_type} · ${p.asset_id}</td>
      <td>${p.cost_currency}</td>
      <td>${p.book_value.toFixed(2)} ${p.cost_currency}</td>
      <td>—</td>
      <td>—</td>
      <td>—</td>
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