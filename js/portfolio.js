// ===================================================
// PORTFOLIO.JS – osobní portfolio (OPRAVENÁ VERZE)
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

  // ✅ KLÍČOVÁ OPRAVA – normalizace routy
  page = page.replace(/^\/+/, '').replace(/\/$/, '');

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
  // /portfolio/{id} – detail portfolia
  // ===============================
  if (page.startsWith('portfolio/')) {
    const portfolioId = page.split('/')[1];

      <!-- TABS -->
      <div class="toolbar" style="gap:.5rem;margin-bottom:1rem">
        <button class="button tab active" data-tab="overview">Přehled</button>
        <button class="button tab" data-tab="instruments">Instrumenty</button>
        <button class="button tab" data-tab="transactions">Transakce</button>
        <button class="button tab" data-tab="settings">Nastavení</button>
      </div>

    main.innerHTML = `
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
          <div class="toolbar" style="justify-content:space-between">
            <div class="muted">Instrumenty v portfoliu</div>
            <button class="button" id="btn-add-trade">Přidat transakci</button>
          </div>

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
          <div class="toolbar" style="justify-content:space-between">
            <div class="muted">Transakce</div>
            <button class="button" id="btn-add-trade-2">Přidat transakci</button>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Instrument</th>
                <th>Směr</th>
                <th>Množství</th>
                <th>Cena</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="portfolio-transactions">
              <tr><td colspan="6" class="muted">Načtení transakcí (API)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ================= SETTINGS ================= -->
      <section id="tab-settings" class="portfolio-tab">
        <div class="card" style="max-width:600px">
          <h3>Nastavení</h3>

          <label class="stack">
            <span class="muted">E-mail</span>
            <input class="input" id="settings-email">
          </label>

          <label class="stack">
            <span class="muted">Denní e-mailový report</span>
            <select class="select" id="settings-email-enabled">
              <option value="0">Vypnuto</option>
              <option value="1">Zapnuto</option>
            </select>
          </label>

          <label class="stack">
            <span class="muted">Změna hesla</span>
            <input class="input" type="password" placeholder="Nové heslo">
          </label>

          <button class="button">Uložit nastavení</button>
        </div>
      </section>

      <button class="back-btn" style="margin-top:1.5rem">← Zpět</button>
    `;

    document.querySelector('.back-btn').onclick = () => history.back();

    const detail = await fetchPortfolioDetail(portfolioId);
    const chart = await fetchPortfolioChart(portfolioId);

    if (detail && detail.valuation) {
      renderPortfolioOverview(detail);
    }

    if (Array.isArray(detail?.positions)) {
      renderPortfolioInstruments(detail.positions);
    }

    if (Array.isArray(chart)) {
      renderPortfolioChartData(chart);
    }

initPortfolioTabs();

    document.getElementById('btn-add-trade').onclick = () =>
      openTradeModal(portfolioId);
    document.getElementById('btn-add-trade-2').onclick = () =>
      openTradeModal(portfolioId);

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
// RENDER – SEZNAM PORTFOLIÍ
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
// RENDER – OVERVIEW
// ===================================================

function renderPortfolioOverview(data) {
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
}

// ===================================================
// RENDER – INSTRUMENTS
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
// GRAF – stejný renderer jako app.js
// ===================================================

function renderPortfolioChartData(chart) {
  if (!Array.isArray(chart) || chart.length < 2) return;

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

  document.getElementById('tx-save').onclick = () =>
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

  renderPortfolioOverview(detail);
  renderPortfolioChartData(chart);
  renderPortfolioInstruments(detail.positions);
}