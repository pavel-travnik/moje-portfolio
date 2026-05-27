// ===================================================
// HLAVNi KONTEJNER
// ===================================================
const main = document.getElementById('mainContent');

const apiCache = {
  dps: {},
  stocks: {},
  currencies: {},
  podiloveFondy: {}
};

apiCache.dpsFundsMeta = null;
apiCache.dpsTableMetrics = {};
apiCache.dpsFundsOverview = null;



// ===================================================
// API URL
// ===================================================
// nepoužívaný odkaz const DPS_API_URL = 'https://moje-portfolio-a5gkdcgbasg4areg.westeurope-01.azurewebsites.net/api/get_dps_data';

const DPS_API_URL = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_dps_data';
const DPS_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_dps_funds';
const DPS_FUNDS_OVERVIEW_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_dps_funds_overview';


const STOCK_API_URL = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_stock_data';
const STOCK_LIST_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_active_stocks';

const CURRENCY_LIST_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_active_currencies';
const CURRENCY_DATA_API = 'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_currency_data';

const PODILOVE_FONDY_API =  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_active_podilove_fondy';
const PODILOVY_FOND_DATA_API =  'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_podilovy_fond_data';

// ===================================================
// DROPDOWN – MOBILE SAFE
// ===================================================
document.addEventListener('click', e => {
  const toggle = e.target.closest('.dropdown-toggle');
  const menu = document.querySelector('.dropdown-menu');

  if (toggle) {
    e.preventDefault();
    e.stopPropagation();
    menu.classList.toggle('open');
    return;
  }

  if (menu && menu.classList.contains('open')) {
    menu.classList.remove('open');
  }
});

// ===================================================
// SPA NAVIGATION
// ===================================================
document.addEventListener('click', e => {
  const link = e.target.closest('a[data-page]');
  if (!link) return;
  e.preventDefault();
  e.stopPropagation();
  loadPage(link.dataset.page);
});

window.addEventListener('popstate', e => {
  if (e.state?.page) loadPage(e.state.page, false);
});

// ===================================================
// INIT
// ===================================================

(function init() {
 let path = location.pathname.replace(/^\/+/, '');

 // když je root nebo index → úvod
 

if (!path || path === 'index.html') {
    path = 'uvod';   // ✅ vždy úvod
}



 updateMenu();   // ✅ přidat

 loadPage(path, false);
})();


// ===================================================
// ROUTER
// ===================================================
function updateMenu() {
    const portfolioLink = document.getElementById("menu-portfolio");
    const btnLogin = document.getElementById("btn-login");
    const btnLogout = document.getElementById("btn-logout");

    const logged = !!localStorage.getItem("user_id");

    if (portfolioLink) {
        portfolioLink.style.display = logged ? "block" : "none";
    }

    if (btnLogin) {
        btnLogin.style.display = logged ? "none" : "inline-block";
    }

    if (btnLogout) {
        btnLogout.style.display = logged ? "inline-block" : "none";
    }
}

function openLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';

    modal.innerHTML = `
        <div class="tx-modal">
            
            <h3>Přihlášení</h3>

            <label>Email</label>
            <input id="login-email" class="tx-input" placeholder="Email">

            <label>Heslo</label>
            <input id="login-password" type="password" class="tx-input" placeholder="Heslo">

            <div class="tx-actions">
                <button class="pill-button" id="login-cancel">Zrušit</button>
                <button class="pill-button" id="login-submit">Přihlásit</button>
            </div>

            <div class="tx-actions">
                <button class="pill-button" id="login-register">
                    Nemám účet → Registrovat
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // ❌ zavřít
    document.getElementById("login-cancel").onclick = () => {
        modal.remove();
        document.body.style.overflow = '';
    };

    // ✅ login
    document.getElementById("login-submit").onclick = async () => {
        await loginUser();
        modal.remove();
        document.body.style.overflow = '';
    };

    // ✅ registrace
    document.getElementById("login-register").onclick = async () => {
        await registerUser();
    };
}


function loadPage(page, pushState = true) {

  // ===============================
// LOGIN PAGE
// ===============================
    
if (page.startsWith('portfolio') && !localStorage.getItem("user_id")) {
    loadPage("login");
    return;
}

    if (pushState) history.pushState({ page }, '', `/login`);
    return;

  
 // ===============================
  // OSOBNÍ PORTFOLIO (delegace)
  // ===============================
  if (page.startsWith('portfolio')) {
    if (window.loadPortfolioPage) {
      window.loadPortfolioPage(page);
      if (pushState) history.pushState({ page }, '', `/${page}`);
      return;
    }
  }


  if (page.startsWith('penze/')) {
    loadFundDetail(page.split('/')[1]);
    return;
  }

  if (page.startsWith('podilove-fondy/')) {
    loadPodilovyFondDetail(page.split('/')[1]);
    return;
  }

  if (page.startsWith('akcie/')) {
    loadStockDetail(page.split('/')[1]);
    return;
  }

  if (page.startsWith('etf/')) {
    loadStockDetail(page.split('/')[1]);
    return;
  }

  if (page.startsWith('meny/')) {
    loadStockDetail(page.split('/')[1]);
    return;
  }

  
  fetch(`pages/${page}.html`)
    .then(res => {
      if (!res.ok) throw new Error();
      return res.text();
    })
    .then(html => {
      main.innerHTML = html;

      if (page === 'penze') loadPensionFunds();
      if (page === 'podilove-fondy') loadPodiloveFondy();
      if (page === 'akcie') loadStocks();
      if (page === 'etf') loadEtfs();
      if (page === 'meny') loadCurrencies();

      if (pushState) history.pushState({ page }, '', `/${page}`);
    })
    .catch(() => {
      main.innerHTML = '<h3>404</h3><p>Stránka nenalezena</p>';
    });
}

// ===================================================
// PENZE preHLED
// ===================================================

async function ensureFundsMeta() {
  if (apiCache.dpsFundsMeta) return;

  const res = await fetch(DPS_API);
  apiCache.dpsFundsMeta = await res.json();
}


function loadPensionFunds() {
  const grid = document.getElementById('fundGrid');
  const table = document.getElementById('fundTable');
  if (!grid || !table) return;

  let viewMode = 'grid';
  let sort = { key: 'name', asc: true };

  const selectFund = isin => {
    history.pushState({ page: `penze/${isin}` }, '', `/penze/${isin}`);
    loadFundDetail(isin);
  };

  // ---------- VIEW SWITCH ----------
  const gridBtn = document.getElementById('view-grid');
const tableBtn = document.getElementById('view-table');

gridBtn.onclick = () => {
  viewMode = 'grid';
  gridBtn.classList.add('active');
  tableBtn.classList.remove('active');
  updateView();
};

tableBtn.onclick = () => {
  viewMode = 'table';
  tableBtn.classList.add('active');
  gridBtn.classList.remove('active');
  updateView();
};

  function updateView() {
  grid.classList.toggle('hidden', viewMode !== 'grid');
  table.classList.toggle('hidden', viewMode !== 'table');

  const mobileSort = document.querySelector('.mobile-sort');
  if (mobileSort) {
    mobileSort.classList.toggle('hidden', viewMode !== 'table');
  }

  if (viewMode === 'grid') renderGrid();
  else renderTable();
}

  // ---------- GRID ----------
  function renderGrid() {
  grid.innerHTML = '';

  apiCache.dpsFundsOverview.forEach(f => {
    const card = document.createElement('div');
    card.className = 'fund-card';

    const perf = f.perf3Y != null
      ? `${f.perf3Y.toFixed(2)} %`
      : '—';

    card.innerHTML = `
      <h3>${f.name}</h3>
      <small>${f.provider}</small>
      <div class="fund-perf ${f.perf3Y >= 0 ? 'pos' : 'neg'}">
        3 roky: <strong>${perf}</strong>
      </div>
    `;

    card.onclick = () => selectFund(f.isin);
    grid.appendChild(card);
  });
}

  // ---------- TABLE ----------
  function renderTable() {
  const data = [...apiCache.dpsFundsOverview];

  // ---------- SORT ----------
  data.sort((a, b) => {
    let A = a[sort.key];
    let B = b[sort.key];

    if (A == null) A = '';
    if (B == null) B = '';

    if (typeof A === 'string') A = A.toLowerCase();
    if (typeof B === 'string') B = B.toLowerCase();

    return sort.asc ? (A > B ? 1 : -1) : (A < B ? 1 : -1);
  });

  const mobileSortSelect = document.getElementById('mobile-sort-select');
  const mobileSortDir = document.getElementById('mobile-sort-dir');

if (mobileSortSelect && mobileSortDir) {
  mobileSortSelect.value = sort.key;

  mobileSortSelect.onchange = () => {
    sort.key = mobileSortSelect.value;
    renderTable();
  };

  mobileSortDir.onclick = () => {
    sort.asc = !sort.asc;
    mobileSortDir.textContent = sort.asc ? '↑' : '↓';
    mobileSortDir.classList.toggle('active', !sort.asc);
    renderTable();
  };
}


  // ---------- RENDER ----------
  table.innerHTML = `
    <table class="fund-table">
      <thead>
        <tr>
          <th data-key="name">Název</th>
          <th data-key="provider">Společnost</th>
          <th data-key="lastValuationDate">Ocenění</th>
          <th data-key="perf3Y">3 roky</th>
          <th data-key="riskCategory">Riziko</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(f => `
          <tr data-isin="${f.isin}">
            <td data-label="Fond">${f.name}</td>
            <td data-label="Společnost" class="hide-mobile">${f.provider}</td>
            <td data-label="Ocenění">
              ${f.lastValuationDate
                ? new Date(f.lastValuationDate).toLocaleDateString('cs-CZ')
                : '—'}
            </td>
            <td data-label="3 roky"
                class="${f.perf3Y >= 0 ? 'pos' : 'neg'}">
              ${f.perf3Y != null ? f.perf3Y.toFixed(2) + ' %' : '—'}
            </td>
            <td data-label="Riziko">${f.riskCategory} / 7</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // ---------- SORT HANDLERS ----------
  table.querySelectorAll('th').forEach(th => {
    th.onclick = e => {
      e.stopPropagation();
      const key = th.dataset.key;
      sort.asc = sort.key === key ? !sort.asc : true;
      sort.key = key;
      renderTable();
    };
  });

  // ---------- ROW INTERACTION ----------
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach(tr => {
    // hover = aktivace (desktop)
    tr.addEventListener('mouseenter', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
    });

    // klik = aktivace + detail
    tr.addEventListener('click', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
      selectFund(tr.dataset.isin);
    });
  });
}

  // ---------- INIT ----------
  grid.innerHTML = '<p>Načítám fondy…</p>';
  table.innerHTML = '';

  fetch(DPS_FUNDS_OVERVIEW_API)
    .then(r => r.json())
    .then(data => {
      apiCache.dpsFundsOverview = data;
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání fondů</p>';
    });
}



function renderFundMeta(isin) {
  if (!apiCache.dpsFundsMeta) return;

  const fund = apiCache.dpsFundsMeta.find(f => f.isin === isin);
  if (!fund) return;

  const nameEl = document.getElementById('fund-name');
  const providerEl = document.getElementById('fund-provider');
  const riskEl = document.getElementById('kpi-risk');
  const link = document.getElementById('fund-url');
  const titleEl = document.getElementById('fund-title');

  if (nameEl) nameEl.textContent = fund.name;
  if (titleEl) titleEl.textContent = fund.name;
  if (providerEl) providerEl.textContent = fund.provider;

  if (riskEl) {
    riskEl.textContent = `${fund.riskCategory} / 7`;
    riskEl.className = 'risk risk-' + fund.riskCategory;
  }

  if (link) {
    if (fund.url) {
      link.href = fund.url.startsWith('http') ? fund.url : `https://${fund.url}`;
    } else {
      link.style.display = 'none';
    }
  }
}

async function getDpsTableMetrics(isin) {
  if (apiCache.dpsTableMetrics[isin]) {
    return apiCache.dpsTableMetrics[isin];
  }

  const res = await fetch(
    `${DPS_API_URL}?isin=${encodeURIComponent(isin)}`
  );
  let data = await res.json();
  if (!Array.isArray(data) || data.length < 2) {
    return null;
  }

  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  const last = data.at(-1);
  const lastDate = new Date(last.date);

  // 3Y zpět
  const from = new Date(lastDate);
  from.setFullYear(from.getFullYear() - 3);

  const threeY = data.find(d => new Date(d.date) >= from) || data[0];
  const perf3Y = ((last.value - threeY.value) / threeY.value) * 100;

  const result = {
    lastDate,
    perf3Y
  };

  apiCache.dpsTableMetrics[isin] = result;
  return result;
}

// ===================================================
// DETAIL FONDU
// ===================================================

function loadFundDetail(isin) {
  main.innerHTML = `
    <h3 id="fund-name">Detail fondu</h3>

     <p class="meta">
      <span id="fund-provider"></span><br>
      ISIN: <span id="fund-isin">${isin}</span>
    </p>

    <div class="kpi-row">
      <div class="kpi">
        <span>Poslední hodnota</span>
        <strong id="kpi-last"> - </strong>
      </div>

      <div class="kpi">
        <span>Změna</span>
        <strong id="kpi-change"> - </strong>
      </div>

      <div class="kpi">
        <span>Rizikovost</span>
        <strong id="kpi-risk"> - </strong>
      </div>
    </div>

    <p class="meta">
      <a id="fund-url" href="#" target="_blank" rel="noopener">
        Detail fondu
      </a>
    </p>

    <div class="period-row">
      <div class="period-switch">
        <button data-period="1M">1M</button>
        <button data-period="6M">6M</button>
        <button data-period="1Y">1Y</button>
        <button data-period="3Y" class="active">3Y</button>
        <button data-period="MAX">MAX</button>
      </div>
      <div id="period-diff" class="period-diff">—</div>
    </div>

    <div id="chart-portfolio"></div>
    <button class="back-btn">← Zpět</button>
  `;

  // ✅ BACK
  document.querySelector('.back-btn').onclick = () => history.back();

  // ✅ PERIOD SWITCH
  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document
        .querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));

      btn.classList.add('active');
      loadDPSData(isin, btn.dataset.period);
    };
  });

  // ✅ META (SPRÁVNĚ ASYNC)
  ensureFundsMeta().then(() => renderFundMeta(isin));

  // ✅ DATA
  loadDPSData(isin, '3Y');
}

async function loadDPSData(isin, period) {
 // ✅ 1️⃣ fetch jen jednou
 if (!apiCache.dps[isin]) {
  const res = await fetch(
   `${DPS_API_URL}?isin=${encodeURIComponent(isin)}`
  );

  let data = await res.json();
  if (!Array.isArray(data)) data = [];

  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  apiCache.dps[isin] = data;
 }

 // ✅ 2️⃣ period = frontend filtr (stejné jako akcie)
 const filtered = filterPeriod(apiCache.dps[isin], period);
 const finalData = filtered.length ? filtered : apiCache.dps[isin];

 // ✅ 3️⃣ render (stejná logika)
 renderFundKPI(finalData);
 renderPeriodDifference(
  finalData.map(d => ({ value: d.value }))
 );
 renderPortfolioChart(
  finalData.map(d => ({ date: d.date, value: d.value })),
  'chart-portfolio'
 );
}


function renderFundKPI(data) {
  if (!data.length) return;
  const last = data.at(-1);
  const prev = data.at(-2);
  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');

  
   document.getElementById('kpi-last').textContent =
    `${last.value.toFixed(4)} ${last.currency} (${dateStr})`;


  if (prev) {
    const diff = last.value - prev.value;
    const pct = (diff / prev.value) * 100;
    const el = document.getElementById('kpi-change');
    el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}


// ===================================================
// PODILOVE FONDY
// ===================================================

function loadPodiloveFondy() {
  const grid = document.getElementById('podilovyFondGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám fondy…</p>';

  fetch(PODILOVE_FONDY_API)
    .then(r => r.json())
    .then(funds => {
      grid.innerHTML = '';
      funds.forEach(f => {
        const card = document.createElement('div');
        card.className = 'fund-card';
        card.innerHTML = `
          <h3>${f.name}</h3>
          <small>${f.manager} · ${f.currency}</small>
        `;
        card.onclick = () => {
          history.pushState(
            { page: `podilove-fondy/${f.isin}` },
            '',
            `/podilove-fondy/${f.isin}`
          );
          loadPodilovyFondDetail(f.isin);
        };
        grid.appendChild(card);
      });
    });
}

function loadPodilovyFondDetail(isin) {
  main.innerHTML = `
    <h3>Detail podílového fondu</h3>
    <h3 id="pf-title">Detail podílového fondu</h3>
    <p><strong>ISIN:</strong> ${isin}</p>
    
    <p>
    <strong id="pf-name">—</strong><br>
    <small>ISIN: ${isin}</small>
    </p>


    <div class="kpi-row">
      <div class="kpi">
        <span>Poslední kurz</span>
        <strong id="pf-kpi-last">-</strong>
      </div>
      <div class="kpi">
        <span>Změna</span>
        <strong id="pf-kpi-change">-</strong>
      </div>
      <div class="kpi">
        <span>Záznamů</span>
        <strong id="pf-kpi-count">-</strong>
      </div>
    </div>

<div class="period-row">
  <div class="period-switch">
    <button data-period="1M">1M</button>
    <button data-period="6M">6M</button>
    <button data-period="1Y">1Y</button>
    <button data-period="3Y" class="active">3Y</button>
    <button data-period="MAX">MAX</button>
  </div>

  <div id="period-diff" class="period-diff">
    —
  </div>
</div>


    <div id="chart-podilovy-fond"></div>
    <button class="back-btn">← Zpět</button>
  `;

  renderFundMeta(isin);
  
  document.querySelector('.back-btn').onclick = () => history.back();

  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPodilovyFondData(isin, btn.dataset.period);
    };
  });

  loadPodilovyFondData(isin, '3Y');
  loadPodilovyFondName(isin);
}

async function loadPodilovyFondData(isin, period) {
  if (!apiCache.podiloveFondy[isin]) {
    const res = await fetch(
      `${PODILOVY_FOND_DATA_API}?isin=${encodeURIComponent(isin)}`
    );
    let data = await res.json();
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    apiCache.podiloveFondy[isin] = data;
  }

  const filtered = filterPeriod(
    apiCache.podiloveFondy[isin],
    period
  );

  renderPodilovyFondKPI(filtered);
  renderPeriodDifference(filtered);

  renderPortfolioChart(
    filtered.map(d => ({ date: d.date, value: d.value })),
    'chart-podilovy-fond'
  );
}

async function loadPodilovyFondName(isin) {
    try {
        const res = await fetch(PODILOVE_FONDY_API);
        const funds = await res.json();

        const fund = funds.find(f => f.isin === isin);
        if (!fund) return;

        document.getElementById('pf-name').textContent = fund.name;
        document.getElementById('pf-title').textContent = fund.name;
    } catch (e) {
        console.warn('Nepovedlo se načíst název fondu', e);
    }
}

function renderPodilovyFondKPI(data) {
  if (!data.length) return;

  const last = data.at(-1);
  const prev = data.at(-2);
  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');

  document.getElementById('pf-kpi-last').textContent =
    `${last.value.toFixed(4)} ${last.currency} (${dateStr})`;

  document.getElementById('pf-kpi-count').textContent = data.length;

  if (prev) {
    const diff = last.value - prev.value;
    const pct = (diff / prev.value) * 100;
    const el = document.getElementById('pf-kpi-change');
    el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}

// ===================================================
// AKCIE preEHLED
// ===================================================
function loadStocks() {
  const grid = document.getElementById('stockGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám akcie ...</p>';

  fetch(STOCK_LIST_API)
    .then(r => r.json())
    .then(stocks => {
      grid.innerHTML = '';
      
     stocks
      .filter(s => s.sector !== 'ETF')
      .forEach(s => {
        const card = document.createElement('div');
        card.className = 'fund-card';
        card.innerHTML = `<h3>${s.name}</h3><small>${s.ticker}</small>`;
        card.onclick = () => {
          history.pushState({ page: `etf/${s.ticker}` }, '', `/etf/${s.ticker}`);
          loadStockDetail(s.ticker);
        };
        grid.appendChild(card);
      });
    });
}


function loadEtfs() {
  const grid = document.getElementById('etfGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám ETF…</p>';

  fetch(STOCK_LIST_API)
    .then(r => r.json())
    .then(stocks => {
      grid.innerHTML = '';

      stocks
        .filter(s => s.sector === 'ETF')
        .forEach(s => {
          const card = document.createElement('div');
          card.className = 'fund-card';

          // STEJNa STRUKTURA JAKO PENZE
          card.innerHTML = `
            <h3>${s.name}</h3>
            <small>${s.ticker}</small>
          `;

          card.onclick = () => {
            history.pushState(
              { page: `etf/${s.ticker}` },
              '',
              `/etf/${s.ticker}`
            );
            loadStockDetail(s.ticker);
          };

          grid.appendChild(card);
        });
    });
}

// ===================================================
// DETAIL AKCIE
// ===================================================
function loadStockDetail(ticker) {
  main.innerHTML = `
    <h3 id="stock-title">Detail akcie</h3>
    <p>
      <strong id="stock-name"> - </strong><br>
      <small>ID: ${ticker}</small>
    </p>

<div class="kpi-row">
  <div class="kpi">
    <span>Poslední cena</span>
    <strong id="stock-kpi-last"> - </strong>
  </div>
  <div class="kpi">
    <span>Denní­ změna</span>
    <strong id="stock-kpi-change"> - </strong>
  </div>
  <div class="kpi">
    <span>Objem</span>
    <strong id="stock-kpi-volume"> - </strong>
  </div>
</div>


    <p id="stock-meta" class="meta"> - </p>


<div class="period-row">
  <div class="period-switch">
    <button data-period="1M">1M</button>
    <button data-period="6M">6M</button>
    <button data-period="1Y">1Y</button>
    <button data-period="3Y" class="active">3Y</button>
    <button data-period="MAX">MAX</button>
  </div>

  <div id="period-diff" class="period-diff">
    —
  </div>
</div>



    <div id="chart-stock"></div>
    <button class="back-btn">← Zpět</button>
  `;

  

document.querySelector('.back-btn').onclick = () => history.back();



  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadStockData(ticker, btn.dataset.period);
    };
  });

  loadStockName(ticker);
  loadStockData(ticker, '3Y');
}

async function loadStockName(ticker) {
  try {
    const res = await fetch(STOCK_LIST_API);
    const stocks = await res.json();
    const stock = stocks.find(s => s.ticker === ticker);
    if (stock) {
      document.getElementById('stock-name').textContent = stock.name;
      document.getElementById('stock-title').textContent = stock.name;
    }
  } catch {}
}

async function loadStockData(ticker, period) {

  // ✅ 1️⃣ fetch jen jednou
  if (!apiCache.stocks[ticker]) {
    const res = await fetch(
      `${STOCK_API_URL}?ticker=${encodeURIComponent(ticker)}`
    );
    let data = await res.json();
    if (!Array.isArray(data)) data = [];
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    apiCache.stocks[ticker] = data;
  }

  // ✅ 2️⃣ period = frontend filtr
  const filtered = filterPeriod(apiCache.stocks[ticker], period);
  const finalData = filtered.length ? filtered : apiCache.stocks[ticker];

  // ✅ 3️⃣ render
  renderStockKPI(finalData);
  renderPeriodDifference(
    finalData.map(d => ({ value: d.close }))
  );
  renderPortfolioChart(
    finalData.map(d => ({ date: d.date, value: d.close })),
    'chart-stock'
  );
}

function renderStockKPI(data) {
  if (!data.length) return;

  const last = data.at(-1);
  const prev = data.at(-2);

  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');
  const currency = last.currency ?? '';

  // Poslední cena + datum v závorce
  document.getElementById('stock-kpi-last').textContent =
    `${last.close.toFixed(2)} ${last.currency} (${dateStr})`;

  // Objem
  document.getElementById('stock-kpi-volume').textContent =
    last.volume?.toLocaleString('cs-CZ') ?? ' - ';

  // Denní­ změna
  if (prev) {
    const diff = last.close - prev.close;
    const pct = (diff / prev.close) * 100;
    const el = document.getElementById('stock-kpi-change');

    el.textContent = `${diff.toFixed(2)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  } else {
    document.getElementById('stock-kpi-change').textContent = ' - ';
  }
}

// ===================================================
// GRAF (SPOLEcne)
// ===================================================
let lastChartData = null;

function renderPortfolioChart(history, containerId) {
  lastChartData = { history, containerId };

  const div = document.getElementById(containerId);
  if (!div || history.length < 2) return;

  div.innerHTML = '';
  div.style.position = 'relative';

  const canvas = document.createElement('canvas');
  canvas.width = div.clientWidth;
  canvas.height = Math.min(div.clientWidth * 0.65, 320);
  div.appendChild(canvas);

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.background = 'rgba(20,20,20,0.9)';
  tooltip.style.color = '#C9A646';
  tooltip.style.padding = '6px 8px';
  tooltip.style.fontSize = '11px';
  
  tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
  tooltip.style.border = '1px solid rgba(255,255,255,0.08)';

  tooltip.style.borderRadius = '6px';
  tooltip.style.display = 'none';
  tooltip.style.whiteSpace = 'nowrap';
  div.appendChild(tooltip);

  const ctx = canvas.getContext('2d');

  const padding = { top: 20, right: 60, bottom: 30, left: 20 };
  const w = canvas.width;
  const h = canvas.height;



  const values = history.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Grid
  ctx.strokeStyle = '#e6e6e6';
  ctx.fillStyle = '#666';
  
  const isMobile = canvas.width < 500;
  ctx.font = isMobile ? '10px Arial' : '12px Arial';
  
  ctx.textAlign = 'right';

  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (i / 5) * (h - padding.top - padding.bottom);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillText(
      (max - (i / 5) * range).toFixed(2),
      w - 8,
      y + 4
    );
  }

  // Body (area)
  const points = history.map((p, i) => ({
    x:
      padding.left +
      (i / (history.length - 1)) *
        (w - padding.left - padding.right),
    y:
      padding.top +
      ((max - p.value) / range) *
        (h - padding.top - padding.bottom)
  }));

  ctx.beginPath();
  ctx.moveTo(points[0].x, h - padding.bottom);
  points.forEach(pt => ctx.lineTo(pt.x, pt.y));
  ctx.lineTo(points.at(-1).x, h - padding.bottom);
  const gradient = ctx.createLinearGradient(0, padding.top, 0, h);

  gradient.addColorStop(0, 'rgba(201,162,70,0.35)');
  gradient.addColorStop(1, 'rgba(201,162,70,0.02)');

  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#C9A646';
  ctx.lineWidth = 1.8;
  points.forEach((pt, i) =>
    i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)
  );
  ctx.stroke();

// ===== OSA X – DATUM =====
ctx.textAlign = 'center';
ctx.textBaseline = 'top';
ctx.fillStyle = '#666';

const maxXTicks = isMobile ? 3 : 5; // ✅ pouze jednou
const step = Math.max(1, Math.floor(history.length / maxXTicks));

for (let i = 0; i < history.length; i += step) {
  const x =
    padding.left +
    (i / (history.length - 1)) *
    (w - padding.left - padding.right);

  const d = new Date(history[i].date);
  const dateStr = isMobile
    ? `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`
    : d.toLocaleDateString('cs-CZ');

  ctx.strokeStyle = '#ccc';
  ctx.beginPath();
  ctx.moveTo(x, h - padding.bottom);
  ctx.lineTo(x, h - padding.bottom + 4);
  ctx.stroke();

  ctx.fillText(dateStr, x, h - padding.bottom + 6);


  // malá značka
  ctx.strokeStyle = '#ccc';
  ctx.beginPath();
  ctx.moveTo(x, h - padding.bottom);
  ctx.lineTo(x, h - padding.bottom + 4);
  ctx.stroke();

  // datum
  ctx.fillText(dateStr, x, h - padding.bottom + 6);
}

  // 🔍 Tooltip logic
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const index = Math.round(
      (x - padding.left) /
        (w - padding.left - padding.right) *
        (history.length - 1)
    );

    if (index < 0 || index >= history.length) {
      tooltip.style.display = 'none';
      return;
    }

    const p = points[index];
    const d = history[index];

    
    // ✅ VERTIKÁLNÍ čára
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(201,166,70,0.6)';
    ctx.lineWidth = 1;
    ctx.moveTo(p.x, padding.top);
    ctx.lineTo(p.x, h - padding.bottom);
    ctx.stroke();


    // ctx.clearRect(0, 0, w, h);
    // renderPortfolioChart(history, containerId); // redraw background only once
    tooltip.style.display = 'block';

    const dateStr = new Date(d.date).toLocaleDateString('cs-CZ');
    tooltip.innerHTML = `${dateStr}<br><strong>${d.value.toFixed(4)}</strong>`;

    tooltip.style.left = `${p.x + 10}px`;
    tooltip.style.top = `${p.y}px`;
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });
}

function renderPeriodDifference(data) {
  const box = document.getElementById('period-diff');
  if (!box || data.length < 2) {
    if (box) box.innerHTML = '<span>Změna</span> —';
    return;
  }

  const first = data[0];
  const last = data.at(-1);

  const diff = last.value - first.value;
  const pct = (diff / first.value) * 100;

  box.innerHTML = `
    <span>Změna</span>
    ${diff.toFixed(4)}
    (<strong>${pct.toFixed(2)} %</strong>)
  `;

  box.className =
    'period-diff ' + (diff >= 0 ? 'pos' : 'neg');
}

// ===================================================
// RESIZE
// ===================================================
window.addEventListener('resize', () => {
  if (!lastChartData) return;
  renderPortfolioChart(lastChartData.history, lastChartData.containerId);
});

// ===================================================
// FILTRACE OBDOBi
// ===================================================
function filterPeriod(data, period) {
  if (period === 'MAX') return data;

  const from = new Date();

  if (period === '1M') {
    from.setMonth(from.getMonth() - 1);
  } else if (period === '6M') {
    from.setMonth(from.getMonth() - 6);
  } else if (period === '1Y') {
    from.setFullYear(from.getFullYear() - 1);
  } else if (period === '3Y') {
    from.setFullYear(from.getFullYear() - 3);
  }

  return data.filter(d => new Date(d.date) >= from);
}


// ===================================================
// MeNY PreHLED
// ===================================================
function loadCurrencies() {
  const grid = document.getElementById('currencyGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám měny ...</p>';

  fetch(CURRENCY_LIST_API)
    .then(r => r.json())
    .then(list => {
      grid.innerHTML = '';

      list.forEach(c => {
        const card = document.createElement('div');
        card.className = 'fund-card';

        // STEJNĂ STRUKTURA JAKO PENZE
        card.innerHTML = `
          <h3>${c.name}</h3>
          <small>${c.code}</small>
        `;

        card.onclick = () => {
          history.pushState(
            { page: `meny/${c.code}` },
            '',
            `/meny/${c.code}`
          );
          loadCurrencyDetail(c.code);
        };

        grid.appendChild(card);
      });
    });
}

// ===================================================
// DETAIL MeNY
// ===================================================
function loadCurrencyDetail(code) {
  main.innerHTML = `
    <h3>Detail měny</h3>
    <p><strong>${code}</strong></p>

    <div class="kpi-row">
      <div class="kpi"><span>Aktuální kurz</span><strong id="cur-kpi-last"> - </strong></div>
      <div class="kpi"><span>Změna</span><strong id="cur-kpi-change"> - </strong></div>
      <div class="kpi"><span>Záznamů</span><strong id="cur-kpi-count"> - </strong></div>
    </div>

<div class="period-row">
  <div class="period-switch">
    <button data-period="1M">1M</button>
    <button data-period="6M">6M</button>
    <button data-period="1Y">1Y</button>
    <button data-period="3Y" class="active">3Y</button>
    <button data-period="MAX">MAX</button>
  </div>

  <div id="period-diff" class="period-diff">
    —
  </div>
</div>


    <div id="chart-currency"></div>
    <button class="back-btn">← Zpět</button>
  `;

  

document.querySelector('.back-btn').onclick = () => history.back();



  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadCurrencyData(code, btn.dataset.period);
    };
  });

  loadCurrencyData(code, '3Y');
}

async function loadCurrencyData(code, period) {
  if (!apiCache.currencies[code]) {
    const res = await fetch(
      `${CURRENCY_DATA_API}?currency=${encodeURIComponent(code)}`
    );
    let data = await res.json();
    if (!Array.isArray(data)) data = [];
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    apiCache.currencies[code] = data;
  }

  const filtered = filterPeriod(apiCache.currencies[code], period);
  renderCurrencyKPI(filtered);
  renderPeriodDifference(filtered);

  renderPortfolioChart(
    filtered.map(d => ({ date: d.date, value: d.value })),
    'chart-currency'
  );
}

function renderCurrencyKPI(data) {
  if (!data.length) return;

  const last = data.at(-1);
  const prev = data.at(-2);
  const dateStr = new Date(last.date).toLocaleDateString('cs-CZ');


  document.getElementById('cur-kpi-last').textContent =
    `${last.value.toFixed(4)} CZK (${dateStr})`;


  document.getElementById('cur-kpi-count').textContent = data.length;

  if (prev) {
    const diff = last.value - prev.value;
    const pct = (diff / prev.value) * 100;
    const el = document.getElementById('cur-kpi-change');
    el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
    el.className = diff >= 0 ? 'pos' : 'neg';
  }
}

// ===============================
// LOGIN / REGISTER
// ===============================

async function loginUser() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("Vyplň email a heslo");
        return;
    }

    const res = await fetch(`${PORTFOLIO_API}/login_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.error || "Login failed");
        return;
    }

    localStorage.setItem("user_id", data.user_id);

    updateMenu();
    loadPage("portfolio");
}

function logout() {
    localStorage.removeItem("user_id");
    updateMenu();
    loadPage("uvod");
}


async function registerUser() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const res = await fetch(`${PORTFOLIO_API}/save_user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        // ✅ DEBUG – klíčové!
        console.log("STATUS:", res.status);

        const text = await res.text();
        console.log("RESPONSE:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { error: text };
        }

        if (!res.ok) {
            alert(data.error || "Registrace selhala");
            return;
        }

        alert("Registrace OK – přihlas se");

    } catch (err) {
        console.error("REGISTER ERROR:", err);
        alert("Chyba registrace");
    }
}