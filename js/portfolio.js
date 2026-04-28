// ===================================================
// PORTFOLIO.JS – finální opravená verze
// ===================================================

const PORTFOLIO_API =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api';

// ⛔ zatím natvrdo – později z JWT
const CURRENT_USER_ID = 1;

// ===================================================
// ROUTER ENTRY – volá app.js
// ===================================================
window.loadPortfolioPage = async function (page) {
  const main = document.getElementById('mainContent');

  // ✅ normalizace routy
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
      <!-- TABS (nahoře stránky) -->
      <div class="toolbar" style="gap:.5rem;margin-bottom:1rem">
        <button class="button tab active" data-tab="overview">Přehled</button>
        <button class="button tab" data-tab="instruments">Instrumenty</button>
        <button class="button tab" data-tab="transactions">Transakce</button>
        <button class="button tab" data-tab="settings">Nastavení</button>
      </div>

      <h1 class="h1">Portfolio ${portfolioId}</h1>
      <p class="muted">Správa a přehled portfolia</p>

      <!-- ================= OVERVIEW ================= -->
      <section id="tab-overview" class="portfolio-tab active">
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
          <div class="muted">Graf vývoje hodnoty</div>
          <div id="chart-portfolio"></div>
        </div>
      </section>

      <!-- ================= INSTRUMENTS ================= -->
      <section id="tab-instruments" class="portfolio-tab">
        <div class="card">
          <div class="muted">Instrumenty v portfoliu</div>
          <table class="table">
            <thead>
              <tr>
                <th>Název</th>
                <th>Měna</th>
                <th>Aktuální hodnota</th>
                <th>1M</th>
                <th>6M</th>
                <th>1Y</th>
              </tr>
            </thead>
            <tbody id="portfolio-instruments"></tbody>
          </table>
        </div>
      </section>

      <!-- ================= TRANSACTIONS ================= -->
      <section id="tab-transactions" class="portfolio-tab">
        <div class="card">
          <div class="muted">Transakce</div>
          <table class="table">
            <tbody>
              <tr>
                <td class="muted">Načtení transakcí (API)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ================= SETTINGS ================= -->
      <section id="tab-settings" class="portfolio-tab">
        <div class="card" style="max-width:600px">
          <h3>Nastavení</h3>
          <p class="muted">Změna hesla a e‑mailové reporty (API)</p>
        </div>
      </section>

      <button class="back-btn" style="margin-top:1.5rem">← Zpět</button>
    `;

    document.querySelector('.back-btn').onclick = () => history.back();

    // ✅ API volání
    const detail = await fetchPortfolioDetail(portfolioId);
    const chart = await fetchPortfolioChart(portfolioId);

    renderPortfolioOverview(detail);

    if (Array.isArray(detail?.positions)) {
      renderPortfolioInstruments(detail.positions);
    }

    if (Array.isArray(chart) && chart.length > 1) {
      renderPortfolioChartData(chart);
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

async function fetchPortfolioChart(id) {
  const r = await fetch(
    `${PORTFOLIO_API}/get_portfolio_chart?portfolio_id=${id}&user_id=${CURRENT_USER_ID}`
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
// RENDER – overview
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
// GRAF – používá renderPortfolioChart z app.js
// ===================================================
function renderPortfolioChartData(chart) {
  renderPortfolioChart(
    chart.map(d => ({ date: d.date, value: d.value })),
    'chart-portfolio'
  );
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