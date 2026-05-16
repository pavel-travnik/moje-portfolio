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

  
const GOLD_PALETTE = [
  '#C9A646',
  '#D8B85A',
  '#E3C97A',
  '#B89A3C',
  '#A8872F'
];


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

      <section id="tab-overview" class="portfolio-tab">
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

        
        <div class="overview-right">
          <div id="portfolio-allocation-chart"></div>
          </div>
        </div>

      </section>

    <section id="tab-instruments" class="portfolio-tab">

    <div class="mobile-sort">
      <label for="inst-sort">Řadit podle</label>
      <select id="inst-sort">
        <option value="type">Instrument</option>
        <option value="name">Název</option>
        <option value="quantity">Počet kusů</option>
    </select>
    <button id="inst-sort-dir">↑</button>
    </div>

    <table class="fund-table" id="instruments-table">
      <thead>
        <tr>
          <th data-key="type">Instrument</th>
          <th data-key="name">Název</th>
          <th data-key="quantity">Počet kusů</th>
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

       
    <div class="mobile-sort">
      <label for="tx-sort">Řadit podle</label>
      <select id="tx-sort">
        <option value="date">Datum</option>
        <option value="instrument">Instrument</option>
        <option value="type">Směr</option>
        <option value="quantity">Množství</option>
        <option value="price">Cena</option>
      </select>
      <button id="tx-sort-dir">↑</button>
    </div>

    <table class="fund-table" id="transactions-table">
      <thead>
        <tr>
          <th data-key="date">Datum</th>
          <th data-key="instrument">Instrument</th>
          <th data-key="type">Směr</th>
          <th data-key="quantity">Množství</th>
          <th data-key="price">Cena</th>
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

    
    const allocation = calculateAllocationByType(detail.positions);

    renderAllocationDonut(
      allocation,
      'portfolio-allocation-chart',
      detail?.valuation?.gross_value_base
    );


    if (!portfolioId || isNaN(Number(portfolioId))) {
  alert('Chyba: neplatné portfolio ID.');
  return;
}
    const trades = await fetchPortfolioTransactions(portfolioId);
    renderPortfolioTransactions(trades);
  }
};

function calculateAllocationByType(positions) {
  const map = {
    ETF: 'ETF',
    STOCK: 'Akcie',
    FUND: 'Fondy',
    DPS: 'Penze'
  };

  const totals = {};
  let sum = 0;

  positions.forEach(p => {
    const key = map[p.asset_type] ?? 'Ostatní';
    const val = Number(p.book_value) || 0;
    totals[key] = (totals[key] || 0) + val;
    sum += val;
  });

  return Object.entries(totals)
    .map(([label, value]) => ({
      label,
      value,
      pct: sum ? value / sum : 0
    }))
    .filter(x => x.value > 0);
}

function renderAllocationDonut(data, containerId, totalValueCZK = null) {
  const el = document.getElementById(containerId);
  if (!el || !data.length) return;

  el.innerHTML = '';

  const size = 230;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  el.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 8;
  const rInner = rOuter * 0.65;

  
  let activeIndex = null;
  let hoverIndex = null;


  // přiřazení barev
  data.forEach((d, i) => {
    d._color = GOLD_PALETTE[i % GOLD_PALETTE.length];
  });

  const DONUT_GAP = 0.025; // cca 1.4°

  function lightenColor(hex, factor = 0.2) {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) + 255 * factor;
    let g = ((num >> 8) & 0x00FF) + 255 * factor;
    let b = (num & 0x0000FF) + 255 * factor;

    r = Math.min(255, Math.floor(r));
    g = Math.min(255, Math.floor(g));
    b = Math.min(255, Math.floor(b));

    return `rgb(${r}, ${g}, ${b})`;
}

  function draw() {
    ctx.clearRect(0, 0, size, size);

    let angle = 0; // 0 = horní střed

  data.forEach((d, i) => {
  const a = d.pct * Math.PI * 2;
  const gap = DONUT_GAP;
  const isTooSmall = a < gap * 2;

  
  const offset = -Math.PI / 2;

  const start = angle + (isTooSmall ? 0 : gap) + offset;
  const end = angle + a - (isTooSmall ? 0 : gap) + offset;


  const isActive = i === activeIndex;
  const isHover = i === hoverIndex;

  const bump = isActive ? 8 : isHover ? 4 : 0;

  ctx.beginPath();
  ctx.arc(cx, cy, rOuter + bump, start, end);
  ctx.arc(cx, cy, rInner, end, start, true);
  ctx.closePath();
  if (isActive) {
    ctx.fillStyle = d._color;
  } else if (isHover) {
    ctx.fillStyle = lightenColor(d._color, 0.25);
  } else {
    ctx.fillStyle = d._color;
  }
  ctx.fill();

  // ✅ logické úhly zůstávají CELÉ (bez mezery!)
  d._start = angle;
  d._end = angle + a;

  angle += a;
});

    // ===== STŘED =====
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '12px Arial';

    if (activeIndex === null) {
      ctx.fillStyle = '#666';
      ctx.fillText('Celkem', cx, cy - 10);

      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#111';
      ctx.fillText(
        `${totalValueCZK.toLocaleString('cs-CZ')} Kč`,
        cx,
        cy + 10
      );
    } else {
      const d = data[activeIndex];
      ctx.fillStyle = '#666';
      ctx.fillText(d.label, cx, cy - 10);

      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = '#111';
      ctx.fillText(
        `${(d.pct * 100).toFixed(1)} %`,
        cx,
        cy + 12
      );
    }
  }

  // ===== KLIK INTERAKCE =====
  canvas.onclick = e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - cx;
  const y = e.clientY - rect.top - cy;
  const dist = Math.sqrt(x * x + y * y);

  // mimo donut
  if (dist < rInner || dist > rOuter + 10) {
    activeIndex = null;
    draw();
    return;
  }

  // ✅ správná normalizace úhlu
  let ang = Math.atan2(y, x) + Math.PI / 2;
  if (ang < 0) ang += 2 * Math.PI;

  activeIndex = null;
  data.forEach((d, i) => {
    if (ang >= d._start && ang < d._end) {
      activeIndex = i;
    }
  });

  draw();
  };

  draw();
}

canvas.onmousemove = e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - cx;
    const y = e.clientY - rect.top - cy;

    const dist = Math.sqrt(x * x + y * y);

    // mimo donut
    if (dist < rInner || dist > rOuter + 10) {
        if (hoverIndex !== null) {
            hoverIndex = null;
            draw();
        }
        return;
    }

    let ang = Math.atan2(y, x) + Math.PI / 2;
    if (ang < 0) ang += 2 * Math.PI;

    let newHover = null;

    data.forEach((d, i) => {
        if (ang >= d._start && ang < d._end) {
            newHover = i;
        }
    });

    if (hoverIndex !== newHover) {
        hoverIndex = newHover;
        draw();
    }
};

canvas.onmouseleave = () => {
    if (hoverIndex !== null) {
        hoverIndex = null;
        draw();
    }
};

function openAssetDetail(assetType, assetId) {
  let path;

  switch (assetType) {
    case 'ETF':
      path = `etf/${assetId}`;
      break;
    case 'STOCK':
      path = `akcie/${assetId}`;
      break;
    case 'FUND':
      path = `podilove-fondy/${assetId}`;
      break;
    case 'DPS':
      path = `penze/${assetId}`;
      break;
    default:
      return;
  }

  history.pushState({ page: path }, '', `/${path}`);
  loadPage(path, false); // ✅ stejný router jako app.js
}

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
  const table = document.getElementById('instruments-table');
  if (!tbody || !table) return;

  let sort = { key: 'type', asc: true };

  const typeLabel = {
    ETF: 'ETF',
    STOCK: 'Akcie',
    FUND: 'Fondy',
    DPS: 'Penze'
  };

  function getValue(p, key) {
    switch (key) {
      case 'type':
        return (typeLabel[p.asset_type] || p.asset_type).toLowerCase();
      case 'name':
        return (p.asset_name || p.asset_id).toLowerCase();
      case 'quantity':
        return p.quantity || 0;
      default:
        return '';
    }
  }

  function render() {
    const data = [...positions];

    data.sort((a, b) => {
      const A = getValue(a, sort.key);
      const B = getValue(b, sort.key);
      if (A < B) return sort.asc ? -1 : 1;
      if (A > B) return sort.asc ? 1 : -1;
      return 0;
    });

    tbody.innerHTML = '';

    data.forEach(p => {
      const tr = document.createElement('tr');
      tr.className = 'clickable';

      tr.innerHTML = `
        <td data-label="Instrument">${typeLabel[p.asset_type] || p.asset_type}</td>
        <td data-label="Název">${p.asset_name || p.asset_id}</td>
        <td data-label="Počet kusů">
          ${p.quantity != null ? fmtNumber(p.quantity, 4) : '—'}
        </td>
      `;

      // ✅ klik → detail instrumentu
      tr.onclick = () => openAssetDetail(p.asset_type, p.asset_id);

      tbody.appendChild(tr);
    });

    bindAppTableRows(table);
  }

  // ===== desktop sort (klik na hlavičku) =====
  table.querySelectorAll('th').forEach(th => {
    th.onclick = () => {
      const key = th.dataset.key;
      if (!key) return;

      sort.asc = sort.key === key ? !sort.asc : true;
      sort.key = key;

      table.querySelectorAll('th')
        .forEach(x => x.classList.remove('sort-asc', 'sort-desc'));

      th.classList.add(sort.asc ? 'sort-asc' : 'sort-desc');
      render();
    };
  });

  // ===== mobile sort =====
  const mobileSelect = document.getElementById('inst-sort');
  const mobileDir = document.getElementById('inst-sort-dir');

  if (mobileSelect && mobileDir) {
    mobileSelect.onchange = () => {
      sort.key = mobileSelect.value;
      render();
    };

    mobileDir.onclick = () => {
      sort.asc = !sort.asc;
      mobileDir.textContent = sort.asc ? '↑' : '↓';
      mobileDir.classList.toggle('active', sort.asc);
      render();
    };
  }

  render();

  
}

function renderPortfolioTransactions(trades) {
  const tbody = document.getElementById('portfolio-transactions');
  const table = document.getElementById('transactions-table');
  if (!tbody || !table) return;

  let sort = { key: 'date', asc: false };

  function getValue(t, key) {
    switch (key) {
      case 'date': return new Date(t.trade_date);
      case 'instrument': return `${t.asset_type}-${t.asset_id}`.toLowerCase();
      case 'type': return t.trade_type;
      case 'quantity': return t.quantity;
      case 'price': return t.price;
      default: return '';
    }
  }

  function render() {
    const data = [...trades];

    data.sort((a, b) => {
      const A = getValue(a, sort.key);
      const B = getValue(b, sort.key);
      if (A < B) return sort.asc ? -1 : 1;
      if (A > B) return sort.asc ? 1 : -1;
      return 0;
    });

    tbody.innerHTML = '';

    data.forEach(t => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td data-label="Datum">
          ${new Date(t.trade_date).toLocaleDateString('cs-CZ')}
        </td>
        <td data-label="Instrument">
          ${t.asset_type} · ${t.asset_id}
        </td>
        <td data-label="Směr">
          ${t.trade_type}
        </td>
        <td data-label="Množství">
          ${fmtNumber(t.quantity, 4)}
        </td>
        <td data-label="Cena">
          ${fmtNumber(t.price, 4)} ${t.currency}
        </td>
      `;

      tbody.appendChild(tr);
    });

    bindAppTableRows(table);
  }

  // ===== desktop sort (klik na th) =====
  table.querySelectorAll('th').forEach(th => {
    th.onclick = e => {
      const key = th.dataset.key;
      if (!key) return;

      sort.asc = sort.key === key ? !sort.asc : true;
      sort.key = key;

      table.querySelectorAll('th')
        .forEach(x => x.classList.remove('sort-asc', 'sort-desc'));

      th.classList.add(sort.asc ? 'sort-asc' : 'sort-desc');
      render();
    };
  });

  // ===== mobile sort =====
  const mobileSelect = document.getElementById('tx-sort');
  const mobileDir = document.getElementById('tx-sort-dir');

  if (mobileSelect && mobileDir) {
    mobileSelect.onchange = () => {
      sort.key = mobileSelect.value;
      render();
    };

    mobileDir.onclick = () => {
      sort.asc = !sort.asc;
      mobileDir.textContent = sort.asc ? '↑' : '↓';
      mobileDir.classList.toggle('active', sort.asc);
      render();
    };
  }

  render();
}

// ===================================================
// TRANSACTION MODAL – CREATE / SAVE
// ===================================================
function openTransactionModal(portfolioId) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
<div class="modal">
    <h3>Nová transakce</h3>

    <div class="form-grid">
        <div>
            <label>Typ aktiva</label>
            <select id="tx-asset-type">
                <option value="">— vyber —</option>
                <option value="DPS">DPS</option>
                <option value="ETF">ETF</option>
                <option value="STOCK">Akcie</option>
                <option value="FUND">Podílový fond</option>
            </select>
        </div>

        <div class="full">
            <label>Instrument</label>
            <select id="tx-asset-id"></select>
        </div>

        <div>
            <label>Směr</label>
            <select id="tx-direction">
                <option value="BUY">Nákup</option>
                <option value="SELL">Prodej</option>
            </select>
        </div>

        <div>
            <label>Datum</label>
            <input type="date" id="tx-date"/>
        </div>

        <div>
            <label>Množství</label>
            <input type="number" id="tx-quantity"/>
        </div>

        <div>
            <label>Měna</label>
            <input type="text" id="tx-currency" disabled/>
        </div>
    </div>

    <div class="modal-actions">
        <button id="tx-cancel">Zrušit</button>
        <button id="tx-save">Uložit</button>
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

        // ✅ uložíme měnu
        opt.dataset.currency = a.currency || '';

        sel.appendChild(opt);
    });

    // ✅ onchange handler
    sel.onchange = e => {
        const selected = e.target.selectedOptions[0];
        const currency = selected?.dataset?.currency || '';

        document.getElementById('tx-currency').value = currency || 'CZK';
    };

} catch (e) {
    sel.innerHTML = `<option>Chyba načítání</option>`;
}

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
      price: null, // ✅ důležité
      currency: document.getElementById('tx-currency').value,
      trade_date: document.getElementById('tx-date').value
    };

    if (!trade.asset_type || !trade.asset_id || !trade.quantity) {
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

  // ✅ reset – všechno pryč
  tabs.forEach(t => t.classList.remove('active'));
  sections.forEach(s => s.classList.remove('active'));

  // ✅ výchozí tab = Přehled
  const defaultTab = document.querySelector('.portfolio-tabs .tab[data-tab="overview"]');
  const defaultSection = document.getElementById('tab-overview');

  if (defaultTab && defaultSection) {
    defaultTab.classList.add('active');
    defaultSection.classList.add('active');
  }

  // ✅ klikání na taby
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