// ===================================================
// PORTFOLIO MODULE (osobní část aplikace)
// ===================================================

const PORTFOLIO_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api';
const CURRENT_USER_ID = 1; // ⛔ zatím natvrdo, později z JWT

window.loadPortfolioPage = async function (page) {
  const main = document.getElementById('mainContent');

  // ===================================================
  // /portfolio – seznam portfolií
  // ===================================================
  if (page === 'portfolio') {
    main.innerHTML = `
      <h3>Moje portfolia</h3>
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
      <h3>Portfolio ${portfolioId}</h3>

      <div class="kpi-row">
        <div class="kpi">
          <span>Aktuální hodnota</span>
          <strong id="pf-kpi-value">-</strong>
        </div>
        <div class="kpi">
          <span>Denní změna</span>
          <strong id="pf-kpi-change">-</strong>
        </div>
      </div>

      <div id="chart-portfolio"></div>

      <h4>Pozice</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Aktivum</th>
            <th>Množství</th>
            <th>Průměrná cena</th>
            <th>Hodnota</th>
          </tr>
        </thead>
        <tbody id="portfolioPositions"></tbody>
      </table>

      <button class="back-btn">← Zpět</button>
    `;

    document.querySelector('.back-btn').onclick = () => history.back();

    const data = await fetchPortfolioDetail(portfolioId);
    renderPortfolioDetail(data, portfolioId);
    return;
  }
};

// ===================================================
// API FUNCTIONS
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
// RENDER – SEZNAM PORTFOLIÍ
// ===================================================

function renderPortfolioList(portfolios) {
  const grid = document.getElementById('portfolioList');
  grid.innerHTML = '';

  if (!portfolios.length) {
    grid.innerHTML = '<p>Žádné portfolio</p>';
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
// RENDER – DETAIL PORTFOLIA
// ===================================================

async function renderPortfolioDetail(data, portfolioId) {
  // ---------- KPI ----------
  if (data.valuation) {
    document.getElementById('pf-kpi-value').textContent =
      `${data.valuation.gross_value_base.toFixed(2)} CZK`;

    const changeEl = document.getElementById('pf-kpi-change');
    if (data.valuation.pnl_day_czk !== null) {
      const diff = data.valuation.pnl_day_czk;
      const pct = data.valuation.pnl_day_pct * 100;
      changeEl.textContent = `${diff.toFixed(2)} (${pct.toFixed(2)}%)`;
      changeEl.className = diff >= 0 ? 'pos' : 'neg';
    } else {
      changeEl.textContent = '—';
    }
  }

  // ---------- POZICE ----------
  const tbody = document.getElementById('portfolioPositions');
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

  // ---------- GRAF ----------
  const chartData = await fetchPortfolioChart(portfolioId);
  if (Array.isArray(chartData) && chartData.length > 1) {
    renderPortfolioChart(
      chartData.map(d => ({
        date: d.date,
        value: d.value
      })),
      'chart-portfolio'
    );
  }
}