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

document.addEventListener('click', e => {
  const btn = e.target.closest('#btn-add-transaction');
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const portfolioId = btn.dataset.portfolioId;
  if (!portfolioId) {
    console.warn('Chybí portfolioId na tlačítku');
    return;
  }

  openTransactionModal(portfolioId);
});

function bindAppTableRows(table, onSelect) {
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach(tr => {
    tr.addEventListener('mouseenter', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
    });

    tr.addEventListener('click', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
      if (onSelect) {
        onSelect(tr.dataset.id);
      }
    });
  });
}

// ===================================================
// SHARED TABLE ROW BINDING
// ===================================================
function bindAppTableRows(tableEl, onSelect) {
  if (!tableEl) return;

  const rows = tableEl.querySelectorAll('tbody tr');

  rows.forEach(tr => {
    // hover = aktivace (desktop)
    tr.addEventListener('mouseenter', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
    });

    // klik = aktivace (+ případná akce)
    tr.addEventListener('click', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
      if (onSelect) onSelect(tr.dataset.id);
    });
  });
}

  // ===================================================
  // /portfolio/{id} – detail portfolia
  // ===================================================
  if (page.startsWith('portfolio/')) {
    const portfolioId = page.split('/')[1];

    main.innerHTML = `
      <!-- TABS -->
      
<div class="toolbar portfolio-tabs" style="gap:.5rem;margin-bottom:1rem">
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
        <table class="app-table">
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
          <button
            class="button pill-button"
            id="btn-add-transaction"
            data-portfolio-id="${portfolioId}"
            >
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
 
    initPortfolioTabs();

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
async function fetchPortfolioTransactions(portfolioId) {
  try {
    const res = await fetch(
      `${PORTFOLIO_API}/get_portfolio_trades?portfolio_id=${portfolioId}&user_id=${CURRENT_USER_ID}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    return data.trades || [];

  } catch (err) {
    console.warn('Transakce se nepodařilo načíst:', err);
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

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('API error', res.status);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('API nevrátilo pole', data);
      return [];
    }

    return data;

  } catch (e) {
    console.error('Chyba při načítání CP', e);
    return [];
  }
}

function renderPortfolioOverview(data) {
  const valueEl = document.getElementById('pf-kpi-value');
  const dailyEl = document.getElementById('pf-kpi-daily');

  if (!data || !data.valuation) {
    valueEl.textContent = '—';
    dailyEl.textContent = '—';
    return;
  }

  valueEl.textContent = `${fmtNumber(data.valuation.gross_value_base)} CZK`;

  if (data.valuation.pnl_day_czk !== null) {
    const diff = data.valuation.pnl_day_czk;
    const pct = data.valuation.pnl_day_pct * 100;
    dailyEl.textContent = `${fmtNumber(diff)} (${fmtNumber(pct, 2)} %)`;
    dailyEl.className = diff >= 0 ? 'pos' : 'neg';
  } else {
    dailyEl.textContent = '—';
  }
}

function renderPortfolioInstruments(positions) {
  const tbody = document.getElementById('portfolio-instruments');
  tbody.innerHTML = '';

  if (!Array.isArray(positions) || positions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Žádné instrumenty v portfoliu</td>
      </tr>
    `;
    return;
  }

  positions.forEach(p => {
    const tr = document.createElement('tr');
    tr.dataset.id = p.asset_id;

    tr.innerHTML = `
      <td data-label="Instrument">
        <strong>${p.asset_type}</strong><br>
        <small>${p.asset_id}</small>
      </td>
      <td data-label="Měna">${p.cost_currency}</td>
      <td data-label="Hodnota">
        ${fmtNumber(p.book_value)} ${p.cost_currency}
      </td>
      <td data-label="1M">—</td>
      <td data-label="6M">—</td>
      <td data-label="1Y">—</td>
    `;

    tbody.appendChild(tr);
  });

  // ✅ jednotné chování (hover / tap)
  bindAppTableRows(tbody.closest('table'));
}

function renderPortfolioTransactions(trades) {
  const tbody = document.getElementById('portfolio-transactions');
  tbody.innerHTML = '';

  if (!Array.isArray(trades) || trades.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">Zatím žádné transakce</td>
      </tr>
    `;
    return;
  }

  trades.forEach(t => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td data-label="Datum">
        ${new Date(t.trade_date).toLocaleDateString('cs-CZ')}
      </td>
      <td data-label="Instrument">
        <strong>${t.asset_type}</strong><br>
        <small>${t.asset_id}</small>
      </td>
      <td data-label="Směr">${t.trade_type}</td>
      <td data-label="Množství">
        ${fmtNumber(t.quantity, 4)}
      </td>
      <td data-label="Cena">
        ${fmtNumber(t.price, 4)} ${t.currency}
      </td>
    `;

    tbody.appendChild(tr);
  });

  // ✅ jednotné chování (hover / tap)
  bindAppTableRows(tbody.closest('table'));
}

function openTransactionModal(portfolioId) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal gold-theme">
      <h3>Nová transakce</h3>

      <!-- ŘÁDEK 1 -->
      <div class="form-row">
        <div class="form-group">
          <label>Typ aktiva</label>
          <select id="tx-asset-type">
            <option value="DPS">DPS</option>
            <option value="ETF">ETF</option>
            <option value="STOCK">Akcie</option>
            <option value="FUND">Podílový fond</option>
          </select>
        </div>

        <div class="form-group">
          <label>Cenný papír</label>
          <select id="tx-asset-id">
            <option value="">— vyber typ aktiva —</option>
          </select>
        </div>
      </div>

      <!-- ŘÁDEK 2 -->
      <div class="form-row">
        <div class="form-group">
          <label>Typ transakce</label>
          <select id="tx-direction">
            <option value="BUY">Nákup</option>
            <option value="SELL">Odkup</option>
          </select>
        </div>

        <div class="form-group">
          <label>Množství</label>
          <input id="tx-quantity" type="number" step="0.0001">
        </div>
      </div>

      <!-- ŘÁDEK 3 -->
      <div class="form-row">
        <div class="form-group">
          <label>Cena</label>
          <input id="tx-price" type="number" step="0.0001">
        </div>

        <div class="form-group">
          <label>Měna</label>
          <select id="tx-currency">
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <!-- ŘÁDEK 4 -->
      <div class="form-row single">
        <div class="form-group">
          <label>Datum obchodu</label>
          <input id="tx-date" type="date">
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

  /* ✅ Dynamické CP podle typu aktiva */

  document.getElementById('tx-asset-type').onchange = async e => {
  const sel = document.getElementById('tx-asset-id');
  sel.innerHTML = `<option value="">Načítám…</option>`;

  try {
    const list = await loadAssetsByType(e.target.value);

    sel.innerHTML = `<option value="">— vyber —</option>`;

    list.forEach(a => {
      const id = a.isin || a.ticker;
      const name = a.name || a.ticker || a.isin;
      if (!id) return;

      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = name;
      sel.appendChild(opt);
    });

  } catch (err) {
    console.error('Chyba při plnění seznamu CP', err);
    sel.innerHTML = `<option value="">Chyba načítání</option>`;
  }
};

  /* ✅ Zavření */
  document.getElementById('tx-cancel').onclick = () => {
    modal.remove();
    document.body.style.overflow = '';
  };

  /* ✅ Uložení */
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

    await savePortfolioTrade(portfolioId, trade);
    modal.remove();
    document.body.style.overflow = '';
    loadPortfolioPage(`portfolio/${portfolioId}`);
  };
}

async function savePortfolioTrade(portfolioId, trade) {
  const payload = {
    portfolio_id: portfolioId,
    user_id: CURRENT_USER_ID,
    trades: [trade]
  };

  const res = await fetch(
    `${PORTFOLIO_API}/save_portfolio_trades`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Uložení transakce selhalo');
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
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    };
  });
}