// ===================================================
// PORTFOLIO.JS – NOVÝ STABILNÍ SOUBOR
// ===================================================

const PORTFOLIO_API =
  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api';

  window.PORTFOLIO_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api';

function getCurrentUserId() {
    return Number(localStorage.getItem("user_id"));

}

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

let CURRENT_PORTFOLIO_POSITIONS = [];
let portfolioInstrumentFilter = null;

function assetTypeLabel(assetType) {
  const map = {
    ETF: 'ETF',
    CRYPTO: 'Crypto',
    STOCK: 'Akcie',
    FUND: 'Fondy',
    DPS: 'Penze'
  };
  return map[assetType] || assetType || 'Ostatní';
}

function ensurePortfolioUiStyles() {
  if (document.getElementById('portfolio-ui-styles')) return;

  const style = document.createElement('style');
  style.id = 'portfolio-ui-styles';
  style.textContent = `
    .portfolio-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
      align-items: center;
    }

    .portfolio-tabs .tab,
    .portfolio-tabs .portfolio-switch-btn {
      flex: 0 0 auto;
      white-space: nowrap;
    }

    @media (max-width: 640px) {
      .portfolio-tabs {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: .5rem;
      }

      .portfolio-tabs .tab,
      .portfolio-tabs .portfolio-switch-btn {
        width: 100%;
        min-width: 0;
        text-align: center;
        justify-content: center;
      }

      /* Mobil: v detailu portfolia preferuj hodnotu, ne počet kusů */
      #instruments-table th[data-key="quantity"],
      #instruments-table td[data-label="Počet kusů"] {
        display: none !important;
      }

      #inst-sort option[value="quantity"] {
        display: none;
      }

      /* Mobil: nastavení portfolia jako karta přes celou dostupnou šířku */
      #tab-settings .tx-modal {
        width: 100% !important;
        max-width: none !important;
        box-sizing: border-box;
        margin: 0 !important;
        padding: 1rem !important;
        border-radius: 18px;
      }

      #tab-settings .tx-modal label {
        display: block;
        margin-top: .85rem;
      }

      #tab-settings .tx-input,
      #tab-settings select.tx-input {
        width: 100%;
        box-sizing: border-box;
        min-height: 44px;
        font-size: 16px;
      }

      #tab-settings .tx-actions {
        display: grid;
        grid-template-columns: 1fr;
        gap: .5rem;
        margin-top: 1rem;
      }

      #tab-settings .tx-actions .pill-button {
        width: 100%;
        min-height: 44px;
      }
    }

    .sort-dir-btn {
      width: 38px;
      min-width: 38px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .sort-dir-btn::before,
    .fund-table th.sort-asc::after,
    .fund-table th.sort-desc::after {
      content: '' !important;
      display: inline-block;
      margin-left: 6px;
      width: 0;
      height: 0;
      vertical-align: middle;
      font-size: 0;
      line-height: 0;
    }

    .sort-dir-btn.sort-asc::before,
    .fund-table th.sort-asc::after {
      border-left: 5px solid transparent !important;
      border-right: 5px solid transparent !important;
      border-bottom: 8px solid #C9A646 !important;
      border-top: 0 !important;
    }

    .sort-dir-btn.sort-desc::before,
    .fund-table th.sort-desc::after {
      border-left: 5px solid transparent !important;
      border-right: 5px solid transparent !important;
      border-top: 8px solid #C9A646 !important;
      border-bottom: 0 !important;
    }

    .fund-table th[data-key] {
      cursor: pointer;
      white-space: nowrap;
    }

    .portfolio-instruments-filter {
      display: none;
      align-items: center;
      justify-content: space-between;
      gap: .75rem;
      margin: 0 0 .75rem;
      padding: .75rem 1rem;
      border-radius: 14px;
      background: rgba(201, 166, 70, 0.12);
      color: #111;
      font-weight: 600;
    }
    .portfolio-instruments-filter.active {
      display: flex;
    }
    .portfolio-instruments-filter .clear-filter-btn {
      border: 1px solid rgba(201, 166, 70, .55);
      background: transparent;
      color: inherit;
      border-radius: 999px;
      padding: .35rem .7rem;
      cursor: pointer;
      white-space: nowrap;
    }
    #portfolioList {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 280px));
      gap: 1rem;
      align-items: stretch;
      justify-content: start;
      margin-top: 1rem;
    }
    #portfolioList .fund-card,
    .portfolio-switch-list .fund-card {
      width: 100%;
      max-width: 280px;
      box-sizing: border-box;
      cursor: pointer;
    }
    .portfolio-switch-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 280px));
      gap: 1rem;
      margin-top: 1rem;
      justify-content: start;
    }

    .portfolio-value-intro {
      margin-bottom: 1rem;
    }
    .portfolio-value-intro .icon-badge {
      background: rgba(201, 166, 70, 0.14);
      color: #C9A646;
    }
    #portfolio-allocation-chart.allocation-chart-layout {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      flex-wrap: wrap;
    }
    .allocation-legend {
      display: grid;
      gap: .55rem;
      min-width: 220px;
      max-width: 320px;
    }
    .allocation-legend-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: .5rem;
      align-items: center;
      font-size: .92rem;
    }
    .allocation-legend-color {
      width: 11px;
      height: 11px;
      border-radius: 999px;
      box-shadow: 0 0 0 2px rgba(201, 166, 70, .12);
    }
    .allocation-legend-label {
      color: #111;
      font-weight: 600;
    }
    .allocation-legend-value {
      color: #666;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      text-align: right;
    }
    #instruments-table {
      table-layout: fixed;
      width: 100%;
    }
    #instruments-table th[data-key="type"],
    #instruments-table td[data-label="Typ"] {
      width: 9%;
      white-space: nowrap;
    }
    #instruments-table th[data-key="name"],
    #instruments-table td[data-label="Název"] {
      width: 34%;
    }
    #instruments-table th[data-key="quantity"],
    #instruments-table td[data-label="Počet kusů"] {
      width: 12%;
      text-align: right;
    }
    #instruments-table th[data-key="value"],
    #instruments-table td[data-label="Hodnota"] {
      width: 27%;
      text-align: right;
      white-space: nowrap;
    }
    #instruments-table th[data-key="lastValuation"],
    #instruments-table td[data-label="Poslední ocenění"] {
      width: 18%;
      white-space: nowrap;
    }
    .portfolio-switch-modal {
      width: min(720px, calc(100vw - 2rem));
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
      box-sizing: border-box;
    }
    .portfolio-switch-modal .portfolio-switch-list {
      max-height: min(58vh, 520px);
      overflow-y: auto;
      padding-right: .25rem;
    }
    @media (max-width: 640px) {
      .portfolio-switch-modal {
        width: calc(100vw - 1rem);
        max-height: calc(100vh - 1rem);
        padding: 1rem !important;
      }
      #portfolioList,
      .portfolio-switch-list {
        grid-template-columns: 1fr;
      }
      #portfolioList .fund-card,
      .portfolio-switch-list .fund-card {
        max-width: none;
      }
      #portfolio-allocation-chart.allocation-chart-layout {
        justify-content: flex-start;
      }
      .allocation-legend {
        width: 100%;
        max-width: none;
      }
      #instruments-table th[data-key="type"],
      #instruments-table td[data-label="Typ"],
      #instruments-table th[data-key="name"],
      #instruments-table td[data-label="Název"],
      #instruments-table th[data-key="value"],
      #instruments-table td[data-label="Hodnota"],
      #instruments-table th[data-key="lastValuation"],
      #instruments-table td[data-label="Poslední ocenění"] {
        width: auto;
      }
    }
  `;
  document.head.appendChild(style);
}

function setSortDirectionButton(btn, asc) {
  if (!btn) return;
  btn.textContent = '';
  btn.setAttribute('aria-label', asc ? 'Řadit vzestupně' : 'Řadit sestupně');
  btn.title = asc ? 'Řadit vzestupně' : 'Řadit sestupně';
  btn.classList.toggle('sort-asc', asc);
  btn.classList.toggle('sort-desc', !asc);
}



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
  ensurePortfolioUiStyles();
  const main = document.getElementById('mainContent');
  page = page.replace(/^\/+/, '').replace(/\/$/, '');

  // ===============================
  // /portfolio – seznam
  // ===============================
  if (page === 'portfolio') {
    const portfolios = await fetchUserPortfolios();

    
  // ✅ VŽDY zobraz seznam
  main.innerHTML = ` 
  <h2>Moje portfolia</h2>
  <button id="btn-create-portfolio">+ Nové portfolio</button>
  <div id="portfolioList"></div>
  `;

      document.getElementById("btn-create-portfolio").onclick = openCreatePortfolioModal;
      renderPortfolioList(portfolios);
      
    

    // ❗ jinak zobraz seznam (a možnost vytvořit)
    main.innerHTML = `
        <h2>Moje portfolia</h2>
        <button id="btn-create-portfolio" class="pill-button">
            + Nové portfolio
        </button>
        <div id="portfolioList"></div>
    `;

    document.getElementById("btn-create-portfolio").onclick =
        openCreatePortfolioModal;

    renderPortfolioList(portfolios);
    return;
}

function openCreatePortfolioModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';

    modal.innerHTML = `
        <div class="tx-modal">
            <h3>Nové portfolio</h3>

            <label>Název</label>
            <input id="pf-name" class="tx-input" placeholder="Např. Dlouhodobé investice">

            <div class="tx-actions">
                <button id="pf-cancel" class="pill-button">Zrušit</button>
                <button id="pf-save" class="pill-button">Vytvořit</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    document.getElementById("pf-cancel").onclick = () => {
        modal.remove();
        document.body.style.overflow = '';
    };

    document.getElementById("pf-save").onclick = async () => {
    const name = document.getElementById("pf-name").value;

    if (!name) {
        alert("Zadej název");
        return;
    }

    try {
        const pf = await createPortfolio(name);
        modal.remove();
        document.body.style.overflow = '';

        history.pushState({}, '', `/portfolio/${pf.portfolio_id}`);
        loadPortfolioPage(`portfolio/${pf.portfolio_id}`);

    } catch (e) {
        alert(e.message || "Nepodařilo se vytvořit portfolio");
    }
    };

    }



    async function openPortfolioSwitcherModal(prefetchedPortfolios = null) {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal portfolio-switch-modal">
          <div class="toolbar" style="justify-content:space-between;margin-bottom:1rem">
            <h3 style="margin:0">Přehled portfolií</h3>
            <button id="pf-switch-close" class="pill-button" type="button">Zavřít</button>
          </div>
          <button id="pf-switch-create" class="pill-button" type="button">+ Nové portfolio</button>
          <div id="pf-switch-list" class="portfolio-switch-list"></div>
        </div>
      `;

      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';

      const close = () => {
        modal.remove();
        document.body.style.overflow = '';
      };

      document.getElementById('pf-switch-close').onclick = close;
      document.getElementById('pf-switch-create').onclick = () => {
        close();
        openCreatePortfolioModal();
      };

      const listEl = document.getElementById('pf-switch-list');
      listEl.innerHTML = '<p class="muted">Načítám portfolia…</p>';

      try {
        const portfolios = prefetchedPortfolios || await fetchUserPortfolios();
        listEl.innerHTML = '';

        portfolios.forEach(p => {
          const card = document.createElement('div');
          card.className = 'fund-card';
          card.innerHTML = `
            <h4>${portfolioDisplayName(p)}</h4>
            <p>${p.base_ccy || 'CZK'}</p>
          `;
          card.onclick = () => {
            close();
            history.pushState({}, '', `/portfolio/${p.portfolio_id}`);
            loadPortfolioPage(`portfolio/${p.portfolio_id}`);
          };
          listEl.appendChild(card);
        });

        if (!portfolios.length) {
          listEl.innerHTML = '<p class="muted">Zatím nemáš vytvořené žádné portfolio.</p>';
        }
      } catch (e) {
        console.error(e);
        listEl.innerHTML = '<p class="muted">Přehled portfolií se nepodařilo načíst.</p>';
      }
    }

  // ===============================
  // /portfolio/{id} – detail
  // ===============================
  if (page.startsWith('portfolio/')) {
    const portfolioId = page.split('/')[1];

    if (!portfolioId || isNaN(Number(portfolioId))) {
      alert('Chyba: neplatné portfolio ID.');
      return;
    }

    main.innerHTML = `
      <div class="toolbar portfolio-tabs" style="gap:.5rem;margin-bottom:1rem">
        <button class="button tab active" data-tab="value">Hodnota</button>
        <button class="button tab" data-tab="instruments">Detail</button>
        <button class="button tab" data-tab="transactions">Transakce</button>
        <button class="button tab" data-tab="settings">Nastavení</button>
        <button id="btn-other-portfolio" class="button pill-button portfolio-switch-btn" type="button">Jiné portfolio</button>
      </div>

      <h1 id="pf-detail-title">Portfolio</h1>

      <section id="tab-value" class="portfolio-tab">
        <div class="section-intro portfolio-value-intro">
          <div class="intro-heading">
            <span class="icon-badge" aria-hidden="true">◌</span>
            <div>
              <h2>Moje portfolio</h2>
              <p class="intro-lead">
                Zde si můžete zadat údaje o svém portfoliu a sledovat jeho vývoj v detailu.
                Můžete si vytvořit více portfolií a doplnit do nich jednotlivé instrumenty
                pomocí transakcí. Hodnota portfolia je přepočítávána každý den a přehled
                si můžete nechat zasílat e-mailem. Kliknutím na konkrétní instrument
                otevřete jeho detail s historickým vývojem hodnoty, rizikovostí a posledním
                dostupným oceněním.
                <a href="https://icy-sea-053d99203.4.azurestaticapps.net/aktualizace" target="_blank" rel="noopener noreferrer">Data jsou aktualizována</a>
                z veřejně dostupných zdrojů a slouží pouze pro informativní přehled.
                Neposkytujeme investiční, penzijní ani jiné finanční poradenství.
              </p>
            </div>
          </div>
        </div>
        <div class="kpi-row">
          <div class="kpi"><span>Hodnota</span><strong id="pf-kpi-value">—</strong></div>
          <div class="kpi"><span>Denní změna</span><strong id="pf-kpi-daily">—</strong></div>
          <div class="kpi"><span>Poslední ocenění</span><strong id="pf-kpi-last-valuation">—</strong></div>
        </div>
        <div class="overview-right">
          <div id="portfolio-allocation-chart"></div>
        </div>
      </section>

      <section id="tab-instruments" class="portfolio-tab">
        <h2>Detail</h2>
        <div id="portfolio-instruments-filter" class="portfolio-instruments-filter"></div>
        <div class="mobile-sort">
          <label for="inst-sort">Řadit podle</label>
          <select id="inst-sort">
            <option value="value" selected>Hodnota</option>
            <option value="type">Typ</option>
            <option value="name">Název</option>
            <option value="lastValuation">Poslední ocenění</option>
          </select>
          <button id="inst-sort-dir" class="sort-dir-btn sort-asc" type="button"></button>
        </div>
        <table class="fund-table" id="instruments-table">
          <thead><tr>
            <th data-key="type">Typ</th>
            <th data-key="name">Název</th>
            <th data-key="quantity">Počet kusů</th>
            <th data-key="value">Hodnota</th>
            <th data-key="lastValuation">Poslední ocenění</th>
          </tr></thead>
          <tbody id="portfolio-instruments"></tbody>
        </table>
      </section>

      <section id="tab-transactions" class="portfolio-tab">
        <div class="toolbar" style="justify-content:space-between">
          <span class="muted">Transakce</span>
          <button id="btn-add-transaction" class="button pill-button" data-portfolio-id="${portfolioId}">Přidat transakci</button>
        </div>
        <div class="mobile-sort">
          <label for="tx-sort">Řadit podle</label>
          <select id="tx-sort">
            <option value="date">Datum</option>
            <option value="instrument">Typ</option>
            <option value="type">Směr</option>
            <option value="quantity">Počet kusů</option>
            <option value="price">Cena</option>
          </select>
          <button id="tx-sort-dir" class="sort-dir-btn sort-asc" type="button"></button>
        </div>
        <table class="fund-table" id="transactions-table">
          <thead><tr>
            <th data-key="date">Datum</th>
            <th data-key="instrument">Typ</th>
            <th data-key="type">Směr</th>
            <th data-key="quantity">Počet kusů</th>
            <th data-key="price">Cena</th>
          </tr></thead>
          <tbody id="portfolio-transactions"></tbody>
        </table>
      </section>

    <section id="tab-settings" class="portfolio-tab">
      <div class="tx-modal" style="max-width:420px;position:relative;transform:none;left:auto;top:auto;margin:0;box-shadow:none">
        <h3>Nastavení zasílání přehledu</h3>

        <label>E-mail</label>
        <input id="pf-settings-email" class="tx-input" type="email" inputmode="email" autocomplete="email" placeholder="např. pavel@email.cz">

        <label>Zasílání přehledu</label>
          <select id="pf-settings-frequency" class="tx-input">
          <option value="off">Vypnuto</option>
          <option value="daily">Denně</option>
          <option value="weekly">Týdně</option>
          <option value="monthly">Měsíčně</option>
        </select>

        <p class="muted" id="pf-settings-info" style="margin-top:.75rem">
          Přehled se odesílá vždy poslední den zvoleného období v 18:00.
        </p>

        <div class="tx-actions">
          <button id="btn-save-portfolio-settings" class="pill-button">Uložit</button>
        </div>
      </div>
    </section>

      <button class="back-btn">← Zpět</button>
    `;

    initPortfolioTabs();
    document.querySelector('.back-btn').onclick = () => history.back();
    document.getElementById('btn-add-transaction').onclick = () => openTransactionModal(portfolioId);

    const portfolios = await fetchUserPortfolios();
    document.getElementById('btn-other-portfolio').onclick = () => openPortfolioSwitcherModal(portfolios);

    const detail = await fetchPortfolioDetail(portfolioId);
    const currentPortfolio = portfolios.find(p => String(p.portfolio_id) === String(portfolioId));
    setPortfolioTitle(detail, currentPortfolio, portfolioId);
    renderPortfolioOverview(detail);
    renderPortfolioSettings(detail, portfolioId);

    CURRENT_PORTFOLIO_POSITIONS = Array.isArray(detail?.positions) ? detail.positions : [];
    portfolioInstrumentFilter = null;
    renderPortfolioInstruments(CURRENT_PORTFOLIO_POSITIONS);

    const raw = detail.valuation_by_asset_type || [];
    const total = raw.reduce((sum, x) => sum + (Number(x.value) || 0), 0);
    const allocation = raw.map(x => {
      const value = Number(x.value) || 0;
      return {
        label: assetTypeLabel(x.asset_type),
        value,
        pct: total > 0 ? value / total : 0
      };
    });
    renderAllocationDonut(allocation, 'portfolio-allocation-chart', detail?.valuation?.gross_value_base);

    const trades = await fetchPortfolioTransactions(portfolioId);
    renderPortfolioTransactions(trades);
  }
};

function calculateAllocationByType(positions) {
  const totals = {};
  let sum = 0;

  positions.forEach(p => {
    const key = assetTypeLabel(p.asset_type);
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

function renderAllocationDonut(data, containerId, totalValueCZK = null, options = {}) {
  const isDrilldown = options.drilldown === true;
  totalValueCZK = Number(totalValueCZK) || 0;
  const el = document.getElementById(containerId);
  if (!el || !data.length) return;

  el.innerHTML = '';

  const size = isDrilldown ? 140 : 230;
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
  if (!isDrilldown) {
    const legend = document.createElement('div');
    legend.className = 'allocation-legend';
    legend.setAttribute('aria-label', 'Legenda rozložení portfolia');
    data.forEach(d => {
      const item = document.createElement('div');
      item.className = 'allocation-legend-item';
      item.innerHTML = `
        <span class="allocation-legend-color" style="background:${d._color}"></span>
        <span class="allocation-legend-label">${d.label}</span>
        <span class="allocation-legend-value">${fmtNumber(d.value, 0)} Kč · ${(d.pct * 100).toFixed(1)} %</span>
      `;
      legend.appendChild(item);
    });
    el.appendChild(legend);
  }

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

    if (isDrilldown) {
    if (hoverIndex !== null) {
        const d = data[hoverIndex];

        ctx.fillStyle = '#666';
        ctx.fillText(d.label, cx, cy - 10);

        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#111';
        ctx.fillText(`${fmtNumber(d.value, 0)}`, cx, cy + 5);

        ctx.font = '11px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(`${(d.pct * 100).toFixed(1)} %`, cx, cy + 18);

    } else {
        const sum = data.reduce((s, d) => s + d.value, 0);

        ctx.fillStyle = '#666';
        ctx.fillText('Součet', cx, cy - 10);

        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#111';
        ctx.fillText(`${fmtNumber(sum, 0)}`, cx, cy + 10);
    }
}
else {
    // PŮVODNÍ LOGIKA (hlavní graf)
    const idx = hoverIndex !== null ? hoverIndex : activeIndex;

    if (idx === null) {
        ctx.fillStyle = '#666';
        ctx.fillText('Celkem', cx, cy - 10);

        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#111';
        const safeTotal = Number(totalValueCZK) || 0;
        ctx.fillText(`${safeTotal.toLocaleString('cs-CZ')} Kč`, cx, cy + 10);

    } else {
        const d = data[idx];

        ctx.fillStyle = '#666';
        ctx.fillText(d.label, cx, cy - 15);

        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#111';
        ctx.fillText(`${fmtNumber(d.value, 0)} Kč`, cx, cy + 5);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(`${(d.pct * 100).toFixed(1)} %`, cx, cy + 20);
    }
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
    if (!isDrilldown) clearPortfolioInstrumentFilter();
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
  
      // ✅ Klik na donut filtruje tabulku v záložce Detail
      applyPortfolioInstrumentFilter(d.label);

    }
  });

  draw();
  };

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

  draw();



canvas.onmouseleave = () => {
    if (hoverIndex !== null) {
        hoverIndex = null;
        draw();
    }
};
}

function activatePortfolioTab(tabName) {
  const tabs = document.querySelectorAll('.portfolio-tabs .tab');
  const sections = document.querySelectorAll('.portfolio-tab');

  tabs.forEach(t => t.classList.remove('active'));
  sections.forEach(s => s.classList.remove('active'));

  document
    .querySelector(`.portfolio-tabs .tab[data-tab="${tabName}"]`)
    ?.classList.add('active');

  document
    .getElementById(`tab-${tabName}`)
    ?.classList.add('active');
}

function scrollPortfolioPageToTop() {
  const main = document.getElementById('mainContent');

  if (main && main.scrollHeight > main.clientHeight) {
    main.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyPortfolioInstrumentFilter(label) {
  portfolioInstrumentFilter = label;
  activatePortfolioTab('instruments');
  renderPortfolioInstruments(CURRENT_PORTFOLIO_POSITIONS, { filterLabel: label });
  scrollPortfolioPageToTop();
}

function clearPortfolioInstrumentFilter() {
  portfolioInstrumentFilter = null;
  renderPortfolioInstruments(CURRENT_PORTFOLIO_POSITIONS);
}

function backToPortfolioDonut() {
  portfolioInstrumentFilter = null;
  renderPortfolioInstruments(CURRENT_PORTFOLIO_POSITIONS);
  activatePortfolioTab('value');
  scrollPortfolioPageToTop();
}

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
    `${PORTFOLIO_API}/get_portfolios?user_id=${getCurrentUserId()}&is_active=1`
  );
  const data = await r.json();
  if (!Array.isArray(data)) return [];
  // Bezpečnostní klientský filtr. Primární filtr má být na API/SQL:
  // SELECT * FROM dbo.Portfolio WHERE user_id = ? AND is_active = 1
  return data.filter(p => p.is_active === undefined || p.is_active === null || Number(p.is_active) === 1 || p.is_active === true);
}

async function fetchPortfolioDetail(id) {
  const r = await fetch(
    `${PORTFOLIO_API}/get_portfolio_detail?portfolio_id=${id}&user_id=${getCurrentUserId()}`
  );
  return await r.json();
}

async function fetchPortfolioTransactions(portfolioId) {
  try {
    const r = await fetch(
      `${PORTFOLIO_API}/get_portfolio_trades?portfolio_id=${portfolioId}&user_id=${getCurrentUserId()}`
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

async function createPortfolio(name) {
    const payload = {
        user_id: getCurrentUserId(),
        name: name,
        base_ccy: "CZK"
    };

    const res = await fetch(`${PORTFOLIO_API}/create_portfolio`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("CREATE PORTFOLIO ERROR:", data);
        throw new Error(data.error || "Create failed");
    }

    return data;
}

function renderPortfolioSettings(detail, portfolioId) {
  const settings = detail?.settings || {};
  const emailEl = document.getElementById('pf-settings-email');
  const frequencyEl = document.getElementById('pf-settings-frequency');
  const infoEl = document.getElementById('pf-settings-info');
  const saveBtn = document.getElementById('btn-save-portfolio-settings');

  if (!emailEl || !frequencyEl || !saveBtn) return;

  emailEl.value = settings.email || '';
  frequencyEl.value = settings.frequency || 'off';

  if (infoEl) {
    const next = settings.next_send_at
      ? new Date(settings.next_send_at).toLocaleString('cs-CZ')
      : '—';

    infoEl.textContent =
      `Přehled se odesílá vždy poslední den zvoleného období v 18:00. Další odeslání: ${next}`;
  }

  saveBtn.onclick = async () => {
    const email = emailEl.value.trim();
    const frequency = frequencyEl.value;

    if (frequency !== 'off' && !email) {
      alert('Zadej e-mail pro zasílání přehledu.');
      return;
    }

    try {
      const result = await savePortfolioSettings(portfolioId, email, frequency);

      if (infoEl) {
        const next = result?.settings?.next_send_at
          ? new Date(result.settings.next_send_at).toLocaleString('cs-CZ')
          : '—';
        infoEl.textContent =
          `Přehled se odesílá vždy poslední den zvoleného období v 18:00. Další odeslání: ${next}`;
      }

      alert('Nastavení bylo uloženo.');
    } catch (e) {
      console.error(e);
      alert(e.message || 'Nastavení se nepodařilo uložit.');
    }
  };
}

async function savePortfolioSettings(portfolioId, email, frequency) {
  const res = await fetch(`${PORTFOLIO_API}/save_portfolio_settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      portfolio_id: Number(portfolioId),
      user_id: getCurrentUserId(),
      email,
      frequency
    })
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    throw new Error(data.error || 'Save portfolio settings failed');
  }

  return data;
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
    case 'CRYPTO':
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

  if (assetType === 'ETF') {
    return data.filter(x => x.sector === 'ETF');
  }
  if (assetType === 'CRYPTO') {
    return data.filter(x => x.sector === 'Cryptocurrency');
  }
  if (assetType === 'STOCK') {
    return data.filter(x => x.sector !== 'ETF' && x.sector !== 'Cryptocurrency');
  }

  return data;
}

// ===================================================
// RENDER
// ===================================================
function portfolioDisplayName(portfolio) {
  return portfolio?.name || portfolio?.portfolio_name || `Portfolio ${portfolio?.portfolio_id || ''}`.trim();
}

function positionDisplayName(position) {
  return position?.asset_name ||
    position?.instrument_name ||
    position?.name ||
    position?.security_name ||
    position?.fund_name ||
    position?.ticker ||
    position?.asset_id ||
    '—';
}

function positionCurrentValue(position) {
  return Number(
    position?.value_base ??
    position?.market_value_base ??
    position?.market_value_czk ??
    position?.current_value ??
    position?.value ??
    position?.book_value ??
    0
  ) || 0;
}

function formatPortfolioDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('cs-CZ');
}

function positionLastValuationDate(position) {
  return position?.LastValuationDate ??
    position?.lastValuationDate ??
    position?.last_valuation_date ??
    position?.valuation_date ??
    position?.price_date ??
    position?.as_of_date ??
    position?.date ??
    position?.last_date ??
    position?.updated_at ??
    null;
}

function portfolioLastValuationDate(detail) {
  const val = detail?.valuation || {};
  const direct = val.LastValuationDate ??
    val.lastValuationDate ??
    val.last_valuation_date ??
    val.valuation_date ??
    val.as_of_date ??
    val.price_date ??
    val.date ??
    val.updated_at ??
    detail?.LastValuationDate ??
    detail?.lastValuationDate ??
    detail?.last_valuation_date ??
    detail?.valuation_date ??
    detail?.as_of_date ??
    detail?.updated_at ??
    null;
  if (direct) return direct;
  const dates = (Array.isArray(detail?.positions) ? detail.positions : [])
    .map(positionLastValuationDate)
    .filter(Boolean)
    .map(x => new Date(x))
    .filter(d => !Number.isNaN(d.getTime()));
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map(d => d.getTime()))).toISOString();
}

function setPortfolioTitle(detail, portfolio, portfolioId) {
  const title = document.getElementById('pf-detail-title');
  if (!title) return;
  const name = detail?.portfolio?.name || detail?.portfolio_name || detail?.name || portfolioDisplayName(portfolio) || `Portfolio ${portfolioId}`;
  title.textContent = `Portfolio: ${name}`;
}

function renderPortfolioList(portfolios, containerId = 'portfolioList') {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';

  portfolios.forEach(p => {
    const card = document.createElement('div');
    card.className = 'fund-card';
    card.innerHTML = `
      <h3>${portfolioDisplayName(p)}</h3>
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
  const lastValuationEl = document.getElementById('pf-kpi-last-valuation');
  if (lastValuationEl) {
    lastValuationEl.textContent = formatPortfolioDate(portfolioLastValuationDate(data));
  }
}
function renderPortfolioInstrumentFilterBar(filterLabel, visibleCount, totalCount) {
  const filterEl = document.getElementById('portfolio-instruments-filter');
  if (!filterEl) return;

  if (!filterLabel) {
    filterEl.classList.remove('active');
    filterEl.innerHTML = '';
    return;
  }

  filterEl.classList.add('active');
  filterEl.innerHTML = `
    <span>Zobrazuji: ${filterLabel} (${visibleCount} z ${totalCount} pozic)</span>
    <span style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:flex-end">
      <button id="clear-portfolio-instrument-filter" class="clear-filter-btn" type="button">Zrušit filtr</button>
      <button id="back-to-portfolio-donut" class="clear-filter-btn" type="button">Zpět na graf</button>
    </span>
  `;

  document.getElementById('clear-portfolio-instrument-filter').onclick = clearPortfolioInstrumentFilter;
  document.getElementById('back-to-portfolio-donut').onclick = backToPortfolioDonut;
}

function renderPortfolioInstruments(positions, options = {}) {
  const tbody = document.getElementById('portfolio-instruments');
  const table = document.getElementById('instruments-table');
  if (!tbody || !table) return;

  const allPositions = Array.isArray(positions) ? positions : [];
  const filterLabel = options.filterLabel || portfolioInstrumentFilter;
  const visiblePositions = filterLabel
    ? allPositions.filter(p => assetTypeLabel(p.asset_type) === filterLabel)
    : allPositions;

  renderPortfolioInstrumentFilterBar(filterLabel, visiblePositions.length, allPositions.length);

  let sort = { key: 'value', asc: false };

  function getValue(p, key) {
    switch (key) {
      case 'type':
        return assetTypeLabel(p.asset_type).toLowerCase();
      case 'name':
        return positionDisplayName(p).toLowerCase();
      case 'quantity':
        return p.quantity || 0;
      case 'value':
        return positionCurrentValue(p);
      case 'lastValuation': {
        const d = new Date(positionLastValuationDate(p));
        return Number.isNaN(d.getTime()) ? 0 : d.getTime();
      }
      default:
        return '';
    }
  }

  function render() {
    table.querySelectorAll('th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.key === sort.key) {
        th.classList.add(sort.asc ? 'sort-asc' : 'sort-desc');
      }
    });

    const data = [...visiblePositions];

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
      const instrumentValue = positionCurrentValue(p);

      tr.innerHTML = `
        <td data-label="Typ">${assetTypeLabel(p.asset_type)}</td>
        <td data-label="Název">${positionDisplayName(p)}</td>
        <td data-label="Počet kusů">
          ${p.quantity != null ? fmtNumber(p.quantity, 1) : '—'}
        </td>
        <td data-label="Hodnota">
          ${instrumentValue ? fmtNumber(instrumentValue, 2) + ' CZK' : '—'}
        </td>
        <td data-label="Poslední ocenění">
          ${formatPortfolioDate(positionLastValuationDate(p))}
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
    setSortDirectionButton(mobileDir, sort.asc);
    mobileSelect.onchange = () => {
      sort.key = mobileSelect.value;
      render();
    };

    mobileDir.onclick = () => {
      sort.asc = !sort.asc;
      setSortDirectionButton(mobileDir, sort.asc);
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
      case 'instrument': return `${t.asset_type} · ${positionDisplayName(t)}`.toLowerCase();
      case 'type': return t.trade_type;
      case 'quantity': return t.quantity;
      case 'price': return t.price;
      default: return '';
    }
  }

  function render() {
    table.querySelectorAll('th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.key === sort.key) {
        th.classList.add(sort.asc ? 'sort-asc' : 'sort-desc');
      }
    });

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
        <td data-label="Typ">
          ${assetTypeLabel(t.asset_type)} · ${positionDisplayName(t)}
        </td>
        <td data-label="Směr">
          ${t.trade_type}
        </td>
        <td data-label="Množství">
          ${fmtNumber(t.quantity, 1)}
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
    setSortDirectionButton(mobileDir, sort.asc);
    mobileSelect.onchange = () => {
      sort.key = mobileSelect.value;
      render();
    };

    mobileDir.onclick = () => {
      sort.asc = !sort.asc;
      setSortDirectionButton(mobileDir, sort.asc);
      mobileDir.classList.toggle('active', sort.asc);
      render();
    };
  }

  render();
}

// ===================================================
// TRANSACTION MODAL – CREATE / SAVE
// ===================================================
function ensurePortfolioSavingStyles() {
  if (document.getElementById('portfolio-saving-styles')) return;

  const style = document.createElement('style');
  style.id = 'portfolio-saving-styles';
  style.textContent = `
    .tx-saving-status {
      display: none;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      background: rgba(201, 166, 70, 0.12);
      color: #111;
      font-weight: 600;
    }

    .tx-saving-status.active {
      display: flex;
    }

    .tx-spinner {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid rgba(201, 166, 70, 0.30);
      border-top-color: #C9A646;
      animation: tx-spin 0.8s linear infinite;
      flex: 0 0 auto;
    }

    @keyframes tx-spin {
      to { transform: rotate(360deg); }
    }

    .modal-backdrop.tx-busy button,
    .modal-backdrop.tx-busy input,
    .modal-backdrop.tx-busy select {
      opacity: 0.55;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}

function openTransactionModal(portfolioId) {
  ensurePortfolioSavingStyles();

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
<div class="modal">
  <h3>Nová transakce</h3>

  <div class="tx-form">

    <label class="full">Typ aktiva</label>
    <select id="tx-asset-type" class="full">
      <option value="">— vyber —</option>
      <option value="DPS">DPS</option>
      <option value="ETF">ETF</option>
      <option value="CRYPTO">Crypto</option>
      <option value="STOCK">Akcie</option>
      <option value="FUND">Podílový fond</option>
    </select>

    <label class="full">Typ</label>
    <select id="tx-asset-id" disabled class="full">
      <option value="">Nejprve vyber typ aktiva</option>
    </select>

    <label>Směr</label>
    <select id="tx-direction">
      <option value="BUY">Nákup</option>
      <option value="SELL">Prodej</option>
    </select>

    <label>Datum</label>
    <input id="tx-date" type="date">

    <label>Množství</label>
    <input id="tx-quantity" type="number" inputmode="decimal" step="any" min="0">

    <label>Nákupní/prodejní cena za kus</label>
    <input id="tx-price" type="number" inputmode="decimal" step="any" min="0" placeholder="Např. 123,45">

    <label>Měna</label>
    <input id="tx-currency" disabled>

    <div id="tx-saving-status" class="full tx-saving-status" role="status" aria-live="polite">
      <span class="tx-spinner" aria-hidden="true"></span>
      <span>Probíhá ukládání dat a přepočet portfolia…</span>
    </div>

    <div class="full tx-actions">
      <button id="tx-cancel" class="pill-button" type="button">Zrušit</button>
      <button id="tx-save" class="pill-button" type="button">Uložit</button>
    </div>

  </div>
</div>
`;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  const assetTypeEl = document.getElementById('tx-asset-type');
  const assetIdEl = document.getElementById('tx-asset-id');
  const directionEl = document.getElementById('tx-direction');
  const dateEl = document.getElementById('tx-date');
  const quantityEl = document.getElementById('tx-quantity');
  const priceEl = document.getElementById('tx-price');
  const currencyEl = document.getElementById('tx-currency');
  const cancelBtn = document.getElementById('tx-cancel');
  const saveBtn = document.getElementById('tx-save');
  const savingStatus = document.getElementById('tx-saving-status');

  let isSaving = false;

  function closeModal() {
    if (isSaving) return;
    modal.remove();
    document.body.style.overflow = '';
  }

  function setSavingState(saving) {
    isSaving = saving;
    modal.classList.toggle('tx-busy', saving);
    savingStatus.classList.toggle('active', saving);

    [assetTypeEl, assetIdEl, directionEl, dateEl, quantityEl, priceEl, cancelBtn, saveBtn].forEach(el => {
      if (el) el.disabled = saving;
    });

    saveBtn.textContent = saving ? 'Ukládám…' : 'Uložit';
  }

  // ===== Zrušit =====
  cancelBtn.onclick = closeModal;

  // ===== Dynamické načtení instrumentů =====
  assetTypeEl.onchange = async e => {
    const type = e.target.value;

    if (!type) {
      assetIdEl.innerHTML = `<option value="">Nejprve vyber typ aktiva</option>`;
      assetIdEl.disabled = true;
      currencyEl.value = '';
      return;
    }

    assetIdEl.disabled = false;
    assetIdEl.innerHTML = `<option value="">Načítám…</option>`;
    currencyEl.value = '';

    try {
      const list = await loadAssetsByType(type);
      assetIdEl.innerHTML = `<option value="">— vyber —</option>`;

      list.forEach(a => {
        const id = a.isin || a.ticker;
        if (!id) return;

        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = a.name || id;
        opt.dataset.currency = a.currency || '';
        assetIdEl.appendChild(opt);
      });
    } catch (e) {
      console.error('Chyba načítání instrumentů:', e);
      assetIdEl.innerHTML = `<option value="">Chyba načítání</option>`;
    }
  };

  assetIdEl.onchange = e => {
    const selected = e.target.selectedOptions[0];
    const currency = selected?.dataset?.currency || '';
    currencyEl.value = currency || 'CZK';
  };

  // ===== Uložit =====
  saveBtn.onclick = async () => {
    if (isSaving) return; // ochrana proti dvojkliku / opakovanému submitu

    const trade = {
      asset_type: assetTypeEl.value,
      asset_id: assetIdEl.value,
      trade_type: directionEl.value,
      quantity: Number(String(quantityEl.value).replace(',', '.')),
      price: Number(String(priceEl.value || '0').replace(',', '.')),
      currency: currencyEl.value || 'CZK',
      trade_date: dateEl.value
    };

    if (!trade.asset_type || !trade.asset_id || !trade.quantity || !trade.trade_date) {
      alert('Vyplň prosím všechna povinná pole.');
      return;
    }
    if (Number.isNaN(trade.quantity) || trade.quantity <= 0) {
      alert('Množství musí být větší než nula.');
      return;
    }
    if (Number.isNaN(trade.price) || trade.price < 0) {
      alert('Cena musí být číslo od nuly výše.');
      return;
    }

    try {
      setSavingState(true);

      // DŮLEŽITÉ: ukládáme pouze jednou.
      // Endpoint save_portfolio_trades už na backendu spouští rebuild pozic i přepočet valuace.
      await savePortfolioTrade(portfolioId, trade);

      // Načti nová data až po dokončení uložení + backendového přepočtu.
      const detail = await fetchPortfolioDetail(portfolioId);
      renderPortfolioOverview(detail);

      CURRENT_PORTFOLIO_POSITIONS = Array.isArray(detail?.positions) ? detail.positions : [];
      portfolioInstrumentFilter = null;
      renderPortfolioInstruments(CURRENT_PORTFOLIO_POSITIONS);

      const allocation = calculateAllocationByType(detail?.positions || []);
      renderAllocationDonut(
        allocation,
        'portfolio-allocation-chart',
        detail?.valuation?.gross_value_base
      );

      modal.remove();
      document.body.style.overflow = '';
      await loadPortfolioPage(`portfolio/${portfolioId}`);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Uložení transakce selhalo');
      setSavingState(false);
    }
  };
}


async function savePortfolioTrade(portfolioId, trade) {
  const payload = {
    portfolio_id: Number(portfolioId), // ← DŮLEŽITÉ
    user_id: getCurrentUserId(), // ✅ FIX
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
  const defaultTab = document.querySelector('.portfolio-tabs .tab[data-tab="value"]');
  const defaultSection = document.getElementById('tab-value');

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
