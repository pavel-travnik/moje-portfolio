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

    if (!portfolioId || isNaN(Number(portfolioId))) {
  alert('Chyba: neplatné portfolio ID.');
  return;
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

    // ✅ API vrací PŘÍMO POLE, ne objekt
    if (Array.isArray(data)) return data;

    // fallback pokud by se struktura změnila
    if (Array.isArray(data.trades)) return data.trades;

    return [];
  } catch (err) {
    console.warn('Chyba při načítání transakcí:', err);
    return [];
  }
}

// ===================================================
// LOAD ASSETS BY TYPE – PRO MODAL
// ===================================================
async function loadAssetsByType(assetType) {
  let url;

  switch (assetType) {
    case 'DPS':
      url = `${PORTFOLIO_API}/get_dps_funds`;
      break;

    case 'ETF':
    case 'STOCK':
      url = `${PORTFOLIO_API}/get_active_stocks`;
      break;

    case 'FUND':
      url = `${PORTFOLIO_API}/get_active_podilove_fondy`;
      break;

    default:
      return [];
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Asset list load failed (${res.status})`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('API nevrátilo pole instrumentů');
  }

  return data;
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
// TRANSACTION MODAL – CREATE / SAVE
// ===================================================
function openTransactionModal(portfolioId) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal gold-theme">
      <h3>Nová transakce</h3>

      <div class="form-row">
        <div class="form-group">
          <label>Typ aktiva</label>
          <select id="tx-asset-type">
            <option value="">— vyber —</option>
            <option value="DPS">DPS</option>
            <option value="ETF">ETF</option>
            <option value="STOCK">Akcie</option>
            <option value="FUND">Podílový fond</option>
          </select>
        </div>

        <div class="form-group">
          <label>Instrument</label>
          <select id="tx-asset-id">
            <option value="">— nejdříve zvol typ —</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Směr</label>
          <select id="tx-direction">
            <option value="BUY">Nákup</option>
            <option value="SELL">Prodej</option>
          </select>
        </div>

        <div class="form-group">
          <label>Datum</label>
          <input type="date" id="tx-date" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Množství</label>
          <input type="number" step="0.0001" id="tx-quantity" />
        </div>

        <div class="form-group">
          <label>Cena</label>
          <input type="number" step="0.0001" id="tx-price" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group single">
          <label>Měna</label>
          <select id="tx-currency">
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div class="modal-actions">
        <button class="button secondary" id="tx-cancel">Zrušit</button>
        <button class="button primary" id="tx-save">Uložit</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // ===== Dynamické načtení instrumentů =====
  document.getElementById('tx-asset-type').onchange = async e => {
    const type = e.target.value;
    const sel = document.getElementById('tx-asset-id');
    sel.innerHTML = `<option>Načítám…</option>`;

    try {
      const list = await loadAssetsByType(type);
      sel.innerHTML = `<option value="">— vyber —</option>`;
      list.forEach(a => {
        const id = a.isin || a.ticker;
        if (!id) return;
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = a.name || id;
        sel.appendChild(opt);
      });
    } catch {
      sel.innerHTML = `<option>Chyba načítání</option>`;
    }
  };

  // ===== Zrušit =====
  document.getElementById('tx-cancel').onclick = () => {
    modal.remove();
    document.body.style.overflow = '';
  };

  // ===== Uložit =====
  document.getElementById('tx-save').onclick = async () => {
    const trade = {
      asset_type: document.getElementById('tx-asset-type').value,
      asset_id: document.getElementById('tx-asset-id').value,
      trade_type: document.getElementById('tx-direction').value,
      quantity: Number(document.getElementById('tx-quantity').value),
      price: Number(document.getElementById('tx-price').value),
      currency: document.getElementById('tx-currency').value,
      trade_date: document.getElementById('tx-date').value
    };

    if (!trade.asset_type || !trade.asset_id || !trade.quantity || !trade.price) {
      alert('Vyplň prosím všechna povinná pole.');
      return;
    }

    if (!trade.asset_type || !trade.asset_id) {
      alert('Vyber typ aktiva a konkrétní instrument.');
      return;
    }


    try {
      await savePortfolioTrade(portfolioId, trade);
      modal.remove();
      document.body.style.overflow = '';
      loadPortfolioPage(`portfolio/${portfolioId}`);
    } catch (e) {
      alert('Uložení transakce selhalo');
      console.error(e);
    }
  };
}

async function savePortfolioTrade(portfolioId, trade) {
  const payload = {
    portfolio_id: Number(portfolioId), // ← DŮLEŽITÉ
    user_id: CURRENT_USER_ID,
    trades: [trade]
  };

  const res = await fetch(`${PORTFOLIO_API}/save_portfolio_trades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text }; }

  if (!res.ok) {
    console.error('API ERROR:', data);
    throw new Error(data.error || 'Save failed');
  }
  return data;
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