// ===================================================
// HLAVNi KONTEJNER
// ===================================================

// ===================================================
// PAGE INTRO TEXTS – fallback pro datové podstránky
// ===================================================
function ensurePageIntro(page) {
  const main = document.getElementById('mainContent');
  if (!main || main.querySelector('.section-intro')) return;
  const intros = {
    'penze': { icon: '♧', title: 'Penze', text: 'Zde najdete přehled vybraných <a href="/info-penze" data-page="info-penze">penzijních účastnických fondů</a> a jejich základních parametrů. Kliknutím na konkrétní fond otevřete detail s historickým vývojem hodnoty, rizikovostí a posledním dostupným oceněním. <a href="/aktualizace" data-page="aktualizace">Data jsou aktualizována</a> z veřejně dostupných zdrojů a slouží pouze pro informativní přehled — neposkytujeme investiční, penzijní ani jiné finanční poradenství.' },
    'podilove-fondy': { icon: '◈', title: 'Podílové fondy', text: 'Zobrazen je přehled <a href="/info-podilove-fondy" data-page="info-podilove-fondy">podílových fondů</a> s možností otevřít detail konkrétního fondu. Detail fondu obsahuje historický vývoj kurzu, poslední dostupnou hodnotu a základní údaje pro rychlou orientaci. <a href="/aktualizace" data-page="aktualizace">Data jsou průběžně aktualizována</a> z veřejných zdrojů a slouží pouze jako informační přehled — nejde o investiční doporučení ani poradenství.' },
    'akcie': { icon: '↗', title: 'Akcie', text: 'Sekce akcie nabízí přehled vybraných <a href="/info-akcie" data-page="info-akcie">akciových titulů</a> včetně měny, vývoje ceny a základních tržních údajů. Po otevření detailu je možné sledovat historický vývoj ceny v různých časových obdobích a přejít na externí tržní detail. <a href="/aktualizace" data-page="aktualizace">Uvedené informace jsou aktualizovány</a> z veřejně dostupných dat a slouží pouze pro orientaci, nikoliv jako investiční doporučení.' },
    'etf': { icon: '◎', title: 'ETF', text: 'Přehled <a href="/info-etf" data-page="info-etf">ETF</a> zobrazuje vybrané burzovně obchodované fondy odděleně od jednotlivých akcií. V detailu ETF najdete historický vývoj ceny, poslední dostupnou hodnotu a základní údaje pro srovnání. <a href="/aktualizace" data-page="aktualizace">Data jsou aktualizována</a> z veřejných zdrojů a mají informativní charakter — neposkytujeme investiční ani jiné finanční poradenství.' },
    'meny': { icon: '¤', title: 'Měny', text: 'Sekce měny nabízí přehled vybraných <a href="/info-meny" data-page="info-meny">měnových kurzů</a> a jejich historického vývoje vůči CZK. Kliknutím na konkrétní měnu otevřete detail s posledním dostupným kurzem, změnou za vybrané období a grafem vývoje. <a href="/aktualizace" data-page="aktualizace">Data jsou aktualizována</a> z veřejně dostupných zdrojů a slouží pouze pro informativní přehled — neposkytujeme měnové, investiční ani jiné finanční poradenství.' }
  };
  const intro = intros[page];
  if (!intro) return;
  main.insertAdjacentHTML('afterbegin', `<section class="section-intro"><div class="intro-heading"><span class="icon-badge" aria-hidden="true">${intro.icon}</span><div><h2>${intro.title}</h2><p class="intro-lead">${intro.text}</p></div></div></section>`);
  if (!main.querySelector('.disclaimer')) {
    main.insertAdjacentHTML('beforeend', `<p class="disclaimer">Informace na této stránce mají pouze informativní charakter. Nejedná se o doporučení, nabídku ani poradenství. Minulá výkonnost není zárukou budoucích výsledků.</p>`);
  }
}

const apiCache = {
  dps: {},
  stocks: {},
  currencies: {},
  podiloveFondy: {}
};

apiCache.dpsFundsMeta = null;
apiCache.dpsTableMetrics = {};
apiCache.dpsFundsOverview = null;
apiCache.dpsPromises = {};
apiCache.dpsMetaPromise = null;



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
// DROPDOWN - MOBILE SAFE / DIRECT BINDING
// ===================================================
function initDropdownControls() {
  if (window.__dropdownControlsReady) return;
  window.__dropdownControlsReady = true;

  const dropdown = document.querySelector('.dropdown');
  const toggle = document.querySelector('.dropdown-toggle');
  const menu = document.querySelector('.dropdown-menu');

  if (!dropdown || !toggle || !menu) return;

  let lastTouch = 0;

  function setMenu(open) {
    menu.classList.toggle('open', open);
    dropdown.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function handleToggle(e) {
    if (e.type === 'click' && Date.now() - lastTouch < 500) return;
    if (e.type === 'touchstart') lastTouch = Date.now();

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation();
    }

    setMenu(!menu.classList.contains('open'));
  }

  // touchstart is the most reliable on mobile; click keeps desktop/keyboard support.
  toggle.addEventListener('touchstart', handleToggle, { passive: false });
  toggle.addEventListener('click', handleToggle);

  menu.addEventListener('click', e => {
    if (e.target.closest('[data-page]')) {
      setMenu(false);
    }
  });

  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target)) {
      setMenu(false);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDropdownControls);
} else {
  initDropdownControls();
}

// ===================================================
// SPA NAVIGATION
// ===================================================
document.addEventListener('click', e => {
 if (e.target.closest('.dropdown-toggle')) return;
 const link = e.target.closest('[data-page]');
 if (!link) return;

 e.preventDefault();
 e.stopImmediatePropagation(); // 🔥 KRITICKÉ

 const page = link.dataset.page;

 if (!page) return;

 // ✅ VŽDY načti root (žádná relativita)
 loadPage(page);

 // ✅ zavři dropdown
 const menu = document.querySelector('.dropdown-menu');
 if (menu) menu.classList.remove('open');
});

window.addEventListener('popstate', e => {
  if (e.state?.page) loadPage(e.state.page, false);
});

document.addEventListener('click', e => {
 const card = e.target.closest('.side-card');
 if (!card) return;

 const page = card.dataset.page;
 if (!page) return;

 e.preventDefault();
 e.stopImmediatePropagation();

 loadPage(page);
});

const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
document.body.appendChild(tooltip);

let tooltipTimeout = null;

// ✅ DESKTOP (hover)
document.addEventListener('mouseover', e => {
  if (window.innerWidth < 768) return; // mobil ignoruj

  const el = e.target.closest('[data-tooltip]');
  if (!el) return;

  showTooltip(el);
});

document.addEventListener('mouseout', e => {
  if (window.innerWidth < 768) return;

  if (e.target.closest('[data-tooltip]')) {
    hideTooltip();
  }
});

// ✅ MOBILE (tap)
document.addEventListener('click', e => {
  if (window.innerWidth >= 768) return; // desktop ignoruj

  const el = e.target.closest('[data-tooltip]');
  if (!el) return;

  e.preventDefault();

  showTooltip(el);

  // auto hide
  clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => {
    hideTooltip();
  }, 2000);
});

function showTooltip(el) {
  tooltip.textContent = el.dataset.tooltip;

  const rect = el.getBoundingClientRect();

  const top = rect.top + window.scrollY;
  const left = rect.left + window.scrollX;

  tooltip.style.left =
    left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';

  tooltip.style.top =
    top - 35 + 'px';

  tooltip.classList.add('show');
}

function hideTooltip() {
  tooltip.classList.remove('show');
}

// ===================================================
// INIT
// ===================================================


function decorateSideCards() {
  const icons = { 'penze':'♧', 'podilove-fondy':'◈', 'akcie':'↗', 'etf':'◎', 'meny':'¤', 'aktualizace':'↻', 'info-penze':'♧', 'info-podilove-fondy':'◈', 'info-akcie':'↗', 'info-etf':'◎', 'info-meny':'¤' };
  document.querySelectorAll('.side-card').forEach(card => {
    if (card.querySelector('.side-card-icon')) return;
    const icon = icons[card.dataset.page] || '›';
    card.insertAdjacentHTML('afterbegin', `<span class="side-card-icon" aria-hidden="true">${icon}</span>`);
  });
}

(function init() {
 let path = location.pathname.replace(/^\/+/, '');

 // když je root nebo index → úvod
 

if (!path || path === 'index.html') {
    path = 'uvod';   // ✅ vždy úvod
}



 updateMenu();
 initDropdownControls();
 decoratePortfolioLabel();
 decorateSideCards();   // ✅ přidat

 loadPage(path, false);

 checkSession();
})();


// ===================================================
// ROUTER
// ===================================================

function decoratePortfolioLabel() {
  const el = document.getElementById('menu-portfolio');
  if (!el || el.querySelector('.mp-label')) return;

  el.setAttribute('aria-label', 'Moje portfolio');
  el.innerHTML = `
    <span class="mp-label" aria-hidden="true">
      <span class="mp-word-small">moje</span>
      <span class="mp-word-main">portfolio</span>
    </span>
  `;
}

function updateMenu() {
    const portfolioLink = document.getElementById("menu-portfolio");
    const btnLogin = document.getElementById("btn-login");
    const btnLogout = document.getElementById("btn-logout");

    const logged = !!localStorage.getItem("user_id");

    if (portfolioLink) {
        portfolioLink.style.display = logged ? "inline-flex" : "none";
        decoratePortfolioLabel();
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

if (!page || page === "undefined") {
    page = "uvod";
}  
 const main = document.getElementById('mainContent'); // ✅ přesun sem

 if (!main) {
  console.error('mainContent not found');
  return;
 }



 main.innerHTML = ''; // bezpečné
     if (typeof hideTooltip === 'function') hideTooltip();


    
     // 🔥 vždy reset obsah (kill nested render)
  
     window.scrollTo(0, 0);


    // 🔒 ochrana portfolio
    if (page.startsWith('portfolio') && !localStorage.getItem("user_id")) {
        openLoginModal();
        return;
    }

    // ===============================
    // OSOBNÍ PORTFOLIO (delegace)
    // ===============================
    if (page.startsWith('portfolio')) {
        if (window.loadPortfolioPage) {
            window.loadPortfolioPage(page);

            if (pushState) {
                history.pushState({ page }, '', `/${page}`);
            }
            return;
        }
    }

    // ===============================
    // DETAIL PAGES
    // ===============================
    if (page.startsWith('penze/')) {
        loadFundDetail(page.split('/')[1]);
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }

    if (page.startsWith('podilove-fondy/')) {
        loadPodilovyFondDetail(page.split('/')[1]);
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }

    if (page.startsWith('akcie/')) {
        loadStockDetail(page.split('/')[1]);
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }

    if (page.startsWith('etf/')) {
        loadStockDetail(page.split('/')[1]);
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }

    if (page.startsWith('meny/')) {
        loadCurrencyDetail(page.split('/')[1]);
        if (pushState) history.pushState({ page }, '', `/${page}`);
        return;
    }

    // ===============================
    // STANDARD PAGE LOAD
    // ===============================
    fetch(`/pages/${page}.html`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.text();
        })
        .then(html => {
          
const main = document.getElementById('mainContent');
 if (!main) return;

            main.innerHTML = html;

            
            ensurePageIntro(page);

            decorateSideCards();
            if (page === 'penze') loadPensionFunds();
            if (page === 'podilove-fondy') loadPodiloveFondy();
            if (page === 'akcie') loadStocks();
            if (page === 'etf') loadEtfs();
            if (page === 'meny') loadCurrencies();

            if (pushState) {
                history.pushState({ page }, '', `/${page}`);
            }
        })
        .catch(() => {
    console.warn("Page not found, redirect to uvod:", page);

    history.replaceState({ page: "uvod" }, "", "/uvod");
    loadPage("uvod", false);
      });
    }

// ===================================================
// PENZE preHLED
// ===================================================


// ===================================================
// OVERVIEW TABLE HELPERS – mobile/table view
// ===================================================
function ensureOverviewTableStyle() {
  if (document.getElementById('overview-table-style')) return;

  const style = document.createElement('style');
  style.id = 'overview-table-style';
  style.textContent = `
    .overview-view-switch {
      display: flex;
      gap: .5rem;
      justify-content: flex-end;
      margin: 0 0 1rem;
    }

    .overview-view-switch .pill-button.active {
      background: #111;
      color: #C9A646;
    }

    @media (max-width: 767px) {
      .overview-view-switch {
        justify-content: stretch;
      }

      .overview-view-switch .pill-button {
        flex: 1;
      }

      .overview-table,
      #fundTable .dps-overview-table {
        display: table !important;
        width: 100% !important;
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0;
      }

      .overview-table thead,
      #fundTable .dps-overview-table thead {
        display: table-header-group !important;
      }

      .overview-table tbody,
      #fundTable .dps-overview-table tbody {
        display: table-row-group !important;
      }

      .overview-table tr,
      #fundTable .dps-overview-table tr {
        display: table-row !important;
      }

      .overview-table th,
      .overview-table td,
      #fundTable .dps-overview-table th,
      #fundTable .dps-overview-table td {
        display: table-cell !important;
        padding: 10px 8px !important;
        font-size: 12px !important;
        vertical-align: middle;
      }

      .overview-table td::before,
      #fundTable .dps-overview-table td::before {
        content: none !important;
        display: none !important;
      }

      .overview-table th:nth-child(1),
      .overview-table td:nth-child(1),
      #fundTable .dps-overview-table th:nth-child(1),
      #fundTable .dps-overview-table td:nth-child(1) {
        width: 43%;
      }

      .overview-table th:nth-child(2),
      .overview-table td:nth-child(2),
      #fundTable .dps-overview-table th:nth-child(2),
      #fundTable .dps-overview-table td:nth-child(2) {
        width: 17%;
        text-align: right;
      }

      .overview-table th:nth-child(3),
      .overview-table td:nth-child(3),
      #fundTable .dps-overview-table th:nth-child(3),
      #fundTable .dps-overview-table td:nth-child(3) {
        width: 20%;
        text-align: right;
      }

      .overview-table th:nth-child(4),
      .overview-table td:nth-child(4),
      #fundTable .dps-overview-table th:nth-child(4),
      #fundTable .dps-overview-table td:nth-child(4) {
        width: 20%;
        text-align: right;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureOverviewViewShell(grid, prefix) {
  ensureOverviewTableStyle();

  let switchEl = document.getElementById(`${prefix}-view-switch`);
  if (!switchEl) {
    switchEl = document.createElement('div');
    switchEl.id = `${prefix}-view-switch`;
    switchEl.className = 'overview-view-switch';
    switchEl.innerHTML = `
      <button id="${prefix}-view-grid" class="pill-button">Dlaždice</button>
      <button id="${prefix}-view-table" class="pill-button">Řádky</button>
    `;
    grid.parentNode.insertBefore(switchEl, grid);
  }

  let table = document.getElementById(`${prefix}Table`);
  if (!table) {
    table = document.createElement('div');
    table.id = `${prefix}Table`;
    grid.insertAdjacentElement('afterend', table);
  }

  return {
    table,
    gridBtn: document.getElementById(`${prefix}-view-grid`),
    tableBtn: document.getElementById(`${prefix}-view-table`)
  };
}


function formatPerf(value) {
  return value != null && !isNaN(Number(value))
    ? `${Number(value).toFixed(2)} %`
    : '—';
}

function formatPerf3Y(value) {
  return formatPerf(value);
}

function formatPerf5Y(value) {
  return formatPerf(value);
}

function perfClass(value) {
  return value == null || isNaN(Number(value))
    ? ''
    : Number(value) >= 0 ? 'pos' : 'neg';
}

function formatLastValuation(item) {
  if (!item) return '';

  const date = item.lastValuationDate
    ? new Date(item.lastValuationDate).toLocaleDateString('cs-CZ')
    : '';

  const value = item.lastValue ?? item.lastValuationValue;
  const valueText = value != null && !isNaN(Number(value))
    ? Number(value).toLocaleString('cs-CZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      })
    : '';

  if (valueText && date) return `${valueText} · ${date}`;
  if (date) return date;
  if (valueText) return valueText;
  return '';
}

function renderOverviewCardMetric(item) {
  const last = formatLastValuation(item);

  return `
    <div class="fund-perf ${perfClass(item?.perf3Y)}">
      3 roky: <strong>${formatPerf3Y(item?.perf3Y)}</strong>
    </div>
    <div class="fund-perf ${perfClass(item?.perf5Y)}">
      5 let: <strong>${formatPerf5Y(item?.perf5Y)}</strong>
    </div>
    ${last ? `<small>Poslední ocenění: ${last}</small>` : ''}
  `;
}

function normalizeOverviewSortValue(value) {
  if (value == null || value === '—') return '';
  return typeof value === 'string' ? value.toLowerCase() : value;
}
function renderThreeColumnOverviewTable({
  table,
  data,
  getName,
  getMetric,
  getPerf3Y = item => item?.perf3Y,
  getPerf5Y = item => item?.perf5Y,
  getId,
  onSelect,
  metricLabel = 'Měna'
}) {
  const sortKey = table.dataset.sortKey || 'name';
  const sortAsc = table.dataset.sortAsc !== 'false';

  const getters = {
    name: getName,
    metric: getMetric,
    perf3Y: getPerf3Y,
    perf5Y: getPerf5Y
  };

  const sortedData = [...data].sort((a, b) => {
    const getter = getters[sortKey] || getName;
    const A = normalizeOverviewSortValue(getter(a));
    const B = normalizeOverviewSortValue(getter(b));

    if (A < B) return sortAsc ? -1 : 1;
    if (A > B) return sortAsc ? 1 : -1;
    return 0;
  });

  table.innerHTML = `
    <table class="fund-table overview-table">
      <thead>
        <tr>
          <th data-key="name" class="${sortKey === 'name' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">Název</th>
          <th data-key="metric" class="${sortKey === 'metric' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">${metricLabel}</th>
          <th data-key="perf3Y" class="${sortKey === 'perf3Y' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">Výnos 3 roky</th>
          <th data-key="perf5Y" class="${sortKey === 'perf5Y' ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}">Výnos 5 let</th>
        </tr>
      </thead>
      <tbody>
        ${sortedData.map(item => {
          const p3y = getPerf3Y(item);
          const p5y = getPerf5Y(item);
          const last = formatLastValuation(item);

          return `
            <tr data-id="${getId(item)}" ${last ? `title="Poslední ocenění: ${last}"` : ''}>
              <td data-label="Název">${getName(item) || ''}</td>
              <td data-label="${metricLabel}">${getMetric(item) || ''}</td>
              <td data-label="Výnos 3 roky" class="${perfClass(p3y)}">${formatPerf3Y(p3y)}</td>
              <td data-label="Výnos 5 let" class="${perfClass(p5y)}">${formatPerf5Y(p5y)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  // řazení klikem na hlavičku – stejné chování jako v penzích
  table.querySelectorAll('th').forEach(th => {
    th.onclick = e => {
      e.stopPropagation();
      const key = th.dataset.key;
      if (!key) return;

      const currentKey = table.dataset.sortKey || 'name';
      const currentAsc = table.dataset.sortAsc !== 'false';

      table.dataset.sortKey = key;
      table.dataset.sortAsc = currentKey === key ? String(!currentAsc) : 'true';

      renderThreeColumnOverviewTable({
        table,
        data,
        getName,
        getMetric,
        getPerf3Y,
        getPerf5Y,
        getId,
        onSelect,
        metricLabel
      });
    };
  });

  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(tr => {
    tr.addEventListener('mouseenter', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
    });

    tr.addEventListener('click', () => {
      rows.forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
      onSelect(tr.dataset.id);
    });
  });
}

async function ensureFundsMeta() {
  if (apiCache.dpsFundsMeta) return apiCache.dpsFundsMeta;

  // Pokud už byl načten přehled penzí, použij ho i jako metadata pro detail.
  // Tím se při otevření detailu z přehledu nevolá zbytečně znovu get_dps_funds.
  if (Array.isArray(apiCache.dpsFundsOverview)) {
    apiCache.dpsFundsMeta = apiCache.dpsFundsOverview;
    return apiCache.dpsFundsMeta;
  }

  if (!apiCache.dpsMetaPromise) {
    apiCache.dpsMetaPromise = fetch(DPS_API)
      .then(res => {
        if (!res.ok) throw new Error(`DPS metadata HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        apiCache.dpsFundsMeta = Array.isArray(data) ? data : [];
        return apiCache.dpsFundsMeta;
      })
      .finally(() => {
        apiCache.dpsMetaPromise = null;
      });
  }

  return apiCache.dpsMetaPromise;
}

function loadPensionFunds() {
  const grid = document.getElementById('fundGrid');
  const table = document.getElementById('fundTable');
  if (!grid || !table) return;

  ensureOverviewTableStyle();

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';
  let sort = { key: 'name', asc: true };

  const selectFund = isin => {
    history.pushState({ page: `penze/${isin}` }, '', `/penze/${isin}`);
    loadFundDetail(isin);
  };

  // ---------- VIEW SWITCH ----------
  const gridBtn = document.getElementById('view-grid');
  const tableBtn = document.getElementById('view-table');

  if (gridBtn) {
    gridBtn.onclick = () => {
      viewMode = 'grid';
      updateView();
    };
  }

  if (tableBtn) {
    tableBtn.onclick = () => {
      viewMode = 'table';
      updateView();
    };
  }

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');

    if (gridBtn) gridBtn.classList.toggle('active', viewMode === 'grid');
    if (tableBtn) tableBtn.classList.toggle('active', viewMode === 'table');

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

      card.innerHTML = `
        <h3>${f.name}</h3>
        <small>${f.provider || ''}</small>
        <div class="fund-perf ${perfClass(f.perf3Y)}">
          3 roky: <strong>${formatPerf3Y(f.perf3Y)}</strong>
        </div>
        <div class="fund-perf ${perfClass(f.perf5Y)}">
          5 let: <strong>${formatPerf5Y(f.perf5Y)}</strong>
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

      if (A < B) return sort.asc ? -1 : 1;
      if (A > B) return sort.asc ? 1 : -1;
      return 0;
    });

    const mobileSortSelect = document.getElementById('mobile-sort-select');
    const mobileSortDir = document.getElementById('mobile-sort-dir');

    if (mobileSortSelect && mobileSortDir) {
      mobileSortSelect.innerHTML = `
        <option value="name">Název</option>
        <option value="riskCategory">Riziko</option>
        <option value="perf3Y">Výnos 3 roky</option>
        <option value="perf5Y">Výnos 5 let</option>
      `;
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
      <table class="fund-table dps-overview-table">
        <thead>
          <tr>
            <th data-key="name">Název</th>
            <th data-key="riskCategory">Riziko</th>
            <th data-key="perf3Y">Výnos 3 roky</th>
            <th data-key="perf5Y">Výnos 5 let</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(f => `
            <tr data-isin="${f.isin}">
              <td data-label="Název">${f.name}</td>
              <td data-label="Riziko">${f.riskCategory != null ? f.riskCategory + ' / 7' : '—'}</td>
              <td data-label="Výnos 3 roky" class="${perfClass(f.perf3Y)}">
                ${formatPerf3Y(f.perf3Y)}
              </td>
              <td data-label="Výnos 5 let" class="${perfClass(f.perf5Y)}">
                ${formatPerf5Y(f.perf5Y)}
              </td>
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
        if (!key) return;

        sort.asc = sort.key === key ? !sort.asc : true;
        sort.key = key;
        renderTable();
      };
    });

    // ---------- ROW INTERACTION ----------
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
      tr.addEventListener('mouseenter', () => {
        rows.forEach(r => r.classList.remove('active'));
        tr.classList.add('active');
      });

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

  fetch(DPS_API)
    .then(r => r.json())
    .then(data => {
      apiCache.dpsFundsOverview = Array.isArray(data) ? data : [];
      apiCache.dpsFundsMeta = apiCache.dpsFundsOverview;
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání fondů</p>';
      table.innerHTML = '<p>Chyba načítání fondů</p>';
    });
}

function renderFundMeta(isin) {
  if (!apiCache.dpsFundsMeta) return;

  const normalizedIsin = String(isin || '').trim();
  const fund = apiCache.dpsFundsMeta.find(f => String(f.isin || '').trim() === normalizedIsin);
  if (!fund) return;

  const nameEl = document.getElementById('fund-name');
  const providerEl = document.getElementById('fund-provider');
  const riskEl = document.getElementById('kpi-risk');
  const link = document.getElementById('fund-url');
  const titleEl = document.getElementById('fund-title');

  if (nameEl) nameEl.textContent = fund.name || 'Detail fondu - web ↗';
  if (titleEl) titleEl.textContent = fund.name || 'Detail fondu - web ↗';
  if (providerEl) providerEl.textContent = fund.provider || '';
  if (riskEl) {
    riskEl.textContent = fund.riskCategory != null ? `${fund.riskCategory} / 7` : '—';
    riskEl.className = fund.riskCategory != null ? 'risk risk-' + fund.riskCategory : 'risk';
  }

  // Rychlé vyplnění poslední hodnoty z přehledového endpointu ještě před načtením historie.
  const lastEl = document.getElementById('kpi-last');
  const value = fund.lastValue ?? fund.lastValuationValue;
  if (lastEl && value != null && !isNaN(Number(value))) {
    const dateText = fund.lastValuationDate
      ? ` (${new Date(fund.lastValuationDate).toLocaleDateString('cs-CZ')})`
      : '';
    const currency = fund.currency ? ` ${fund.currency}` : '';
    lastEl.textContent = `${Number(value).toFixed(4)}${currency}${dateText}`;
  }

  if (link) {
    if (fund.url) {
      link.href = fund.url.startsWith('http') ? fund.url : `https://${fund.url}`;
      link.style.display = '';
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
  
const main = document.getElementById('mainContent');
 if (!main) return;

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
        
      <button data-period="1M" data-tooltip="Poslední měsíc">1M</button>
      <button data-period="6M" data-tooltip="Posledních 6 měsíců">6M</button>
      <button data-period="1Y" data-tooltip="Poslední rok">1Y</button>
      <button data-period="3Y" data-tooltip="Poslední 3 roky">3Y</button>
      <button data-period="5Y" data-tooltip="Posledních 5 let">5Y</button>
      <button data-period="MAX" data-tooltip="Celá historie">MAX</button>

      </div>
      <div id="period-diff" class="period-diff">—</div>
    </div>

    <div id="chart-portfolio"></div>
    
<button class="back-btn">
  ← Zpět
</button>

  `;

  // ✅ BACK
  document.querySelector('.back-btn').onclick = () => { hideTooltip(); history.back(); };

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

  const defaultPeriodBtn = document.querySelector('.period-switch button[data-period="3Y"]');
  if (defaultPeriodBtn) defaultPeriodBtn.classList.add('active');

  const chart = document.getElementById('chart-portfolio');
  if (chart) chart.innerHTML = '<p>Načítám historická data…</p>';

  // ✅ META se vykreslí okamžitě z přehledu, pokud už existuje.
  if (Array.isArray(apiCache.dpsFundsOverview)) {
    apiCache.dpsFundsMeta = apiCache.dpsFundsOverview;
    renderFundMeta(isin);
  }

  // ✅ META fallback při přímém otevření URL detailu.
  ensureFundsMeta()
    .then(() => renderFundMeta(isin))
    .catch(err => console.error('Chyba načítání metadat fondu:', err));

  // ✅ DATA
  loadDPSData(isin, '3Y');
}

async function loadDPSData(isin, period) {
  const cacheKey = String(isin || '').trim();
  const requestKey = `${cacheKey}|${period}`;
  window.__activeDpsRequestKey = requestKey;

  try {
    // ✅ 1️⃣ fetch jen jednou, včetně sdílené promise proti duplicitním klikům.
    if (!apiCache.dps[cacheKey]) {
      if (!apiCache.dpsPromises[cacheKey]) {
        const chart = document.getElementById('chart-portfolio');
        if (chart && !chart.innerHTML.trim()) {
          chart.innerHTML = '<p>Načítám historická data…</p>';
        }

        apiCache.dpsPromises[cacheKey] = fetch(
          `${DPS_API_URL}?isin=${encodeURIComponent(cacheKey)}`
        )
          .then(res => {
            if (!res.ok) throw new Error(`DPS data HTTP ${res.status}`);
            return res.json();
          })
          .then(data => {
            if (!Array.isArray(data)) data = [];
            data.sort((a, b) => new Date(a.date) - new Date(b.date));
            apiCache.dps[cacheKey] = data;
            return data;
          })
          .finally(() => {
            delete apiCache.dpsPromises[cacheKey];
          });
      }

      await apiCache.dpsPromises[cacheKey];
    }

    // Pokud mezitím uživatel přepnul fond/období, starý request už nevykresluj.
    if (window.__activeDpsRequestKey !== requestKey) return;

    // ✅ 2️⃣ period = frontend filtr (stejné jako akcie)
    const filtered = filterPeriod(apiCache.dps[cacheKey], period);
    const finalData = filtered.length ? filtered : apiCache.dps[cacheKey];

    // ✅ 3️⃣ render (KPI z plných dat, graf může být zlehčený)
    renderFundKPI(finalData);
    renderPeriodDifference(
      finalData.map(d => ({ value: d.value }))
    );
    renderPortfolioChart(
      downsampleHistory(finalData.map(d => ({ date: d.date, value: d.value })), 700),
      'chart-portfolio'
    );
  } catch (err) {
    console.error('Chyba načítání DPS dat:', err);
    const chart = document.getElementById('chart-portfolio');
    if (chart) chart.innerHTML = '<p>Chyba načítání historických dat.</p>';
  }
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

  const { table, gridBtn, tableBtn } = ensureOverviewViewShell(grid, 'podiloveFondy');
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';

  const selectFund = isin => {
    history.pushState(
      { page: `podilove-fondy/${isin}` },
      '',
      `/podilove-fondy/${isin}`
    );
    loadPodilovyFondDetail(isin);
  };

  gridBtn.onclick = () => {
    viewMode = 'grid';
    updateView();
  };

  tableBtn.onclick = () => {
    viewMode = 'table';
    updateView();
  };

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');
    gridBtn.classList.toggle('active', viewMode === 'grid');
    tableBtn.classList.toggle('active', viewMode === 'table');

    if (viewMode === 'grid') renderGrid();
    else renderTable();
  }

  function renderGrid() {
    grid.innerHTML = '';

    apiCache.podiloveFondyList.forEach(f => {
      const card = document.createElement('div');
      card.className = 'fund-card';
      card.innerHTML = `
        <h3>${f.name}</h3>
        <small>${f.manager || ''} · ${f.currency || ''}</small>
        ${renderOverviewCardMetric(f)}
      `;
      card.onclick = () => selectFund(f.isin);
      grid.appendChild(card);
    });
  }

  function renderTable() {
    if (!table.dataset.sortKey) { table.dataset.sortKey = 'name'; table.dataset.sortAsc = 'true'; }
    const data = [...apiCache.podiloveFondyList]
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'));

    renderThreeColumnOverviewTable({
      table,
      data,
      getName: f => f.name,
      getMetric: f => f.currency || f.mena || f.Mena || '',
      metricLabel: 'Měna',
      getPerf3Y: f => f.perf3Y,
      getPerf5Y: f => f.perf5Y,
      getId: f => f.isin,
      onSelect: selectFund
    });
  }

  grid.innerHTML = '<p>Načítám fondy…</p>';
  table.innerHTML = '';

  fetch(PODILOVE_FONDY_API)
    .then(r => r.json())
    .then(funds => {
      apiCache.podiloveFondyList = Array.isArray(funds) ? funds : [];
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání fondů</p>';
      table.innerHTML = '<p>Chyba načítání fondů</p>';
    });
}

function loadPodilovyFondDetail(isin) {
  const main = document.getElementById('mainContent');
  if (!main) return;

  main.innerHTML = `
  <h3 id="pf-title">Detail fondu</h3>
  <p class="meta">
    <span id="pf-name"> - </span><br>
    <small>ID: ${isin}</small>
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
      
      <button data-period="1M" data-tooltip="Poslední měsíc">1M</button>
      <button data-period="6M" data-tooltip="Posledních 6 měsíců">6M</button>
      <button data-period="1Y" data-tooltip="Poslední rok">1Y</button>
      <button data-period="3Y" data-tooltip="Poslední 3 roky">3Y</button>
      <button data-period="5Y" data-tooltip="Posledních 5 let">5Y</button>
      <button data-period="MAX" data-tooltip="Celá historie">MAX</button>

    </div>
    <div id="period-diff" class="period-diff">—</div>
  </div>

  <div id="chart-podilovy-fond"></div>

  
<button class="back-btn">
  ← Zpět
</button>

  `;

  // ✅ BACK
  document.querySelector('.back-btn').onclick = () => { hideTooltip(); history.back(); };

  // ✅ PERIOD SWITCH
  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPodilovyFondData(isin, btn.dataset.period);
    };
  });

  // ✅ název – použij cache (bez dalšího fetch)
  const list = apiCache.podiloveFondyList;
  if (list) {
    const fund = list.find(f => f.isin === isin);
    if (fund) {
      document.getElementById('pf-name').textContent = fund.name;
      document.getElementById('pf-title').textContent = fund.name;
    }
  }

  // ✅ data
  loadPodilovyFondData(isin, '3Y');
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

  const { table, gridBtn, tableBtn } = ensureOverviewViewShell(grid, 'stocks');
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';

  const selectStock = ticker => {
    history.pushState({ page: `akcie/${ticker}` }, '', `/akcie/${ticker}`);
    loadStockDetail(ticker);
  };

  gridBtn.onclick = () => {
    viewMode = 'grid';
    updateView();
  };

  tableBtn.onclick = () => {
    viewMode = 'table';
    updateView();
  };

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');
    gridBtn.classList.toggle('active', viewMode === 'grid');
    tableBtn.classList.toggle('active', viewMode === 'table');

    if (viewMode === 'grid') renderGrid();
    else renderTable();
  }

  function renderGrid() {
    grid.innerHTML = '';

    apiCache.stocksList.forEach(s => {
      const card = document.createElement('div');
      card.className = 'fund-card';
      card.innerHTML = `
        <h3>${s.name}</h3>
        <small>${s.ticker} · ${s.currency || s.mena || s.Mena || ''}</small>
        ${renderOverviewCardMetric(s)}
      `;
      card.onclick = () => selectStock(s.ticker);
      grid.appendChild(card);
    });
  }

  function renderTable() {
    if (!table.dataset.sortKey) { table.dataset.sortKey = 'name'; table.dataset.sortAsc = 'true'; }
    const data = [...apiCache.stocksList]
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'));

    renderThreeColumnOverviewTable({
      table,
      data,
      getName: s => s.name,
      getMetric: s => s.currency || s.mena || s.Mena || '',
      metricLabel: 'Měna',
      getPerf3Y: s => s.perf3Y,
      getPerf5Y: s => s.perf5Y,
      getId: s => s.ticker,
      onSelect: selectStock
    });
  }

  grid.innerHTML = '<p>Načítám akcie ...</p>';
  table.innerHTML = '';

  fetch(STOCK_LIST_API)
    .then(r => r.json())
    .then(stocks => {
      apiCache.stocksList = (Array.isArray(stocks) ? stocks : [])
        .filter(s => s.sector !== 'ETF');
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání akcií</p>';
      table.innerHTML = '<p>Chyba načítání akcií</p>';
    });
}

function loadEtfs() {
  const grid = document.getElementById('etfGrid');
  if (!grid) return;

  const { table, gridBtn, tableBtn } = ensureOverviewViewShell(grid, 'etfs');
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  let viewMode = isMobile ? 'table' : 'grid';

  const selectEtf = ticker => {
    history.pushState({ page: `etf/${ticker}` }, '', `/etf/${ticker}`);
    loadStockDetail(ticker);
  };

  gridBtn.onclick = () => {
    viewMode = 'grid';
    updateView();
  };

  tableBtn.onclick = () => {
    viewMode = 'table';
    updateView();
  };

  function updateView() {
    grid.classList.toggle('hidden', viewMode !== 'grid');
    table.classList.toggle('hidden', viewMode !== 'table');
    gridBtn.classList.toggle('active', viewMode === 'grid');
    tableBtn.classList.toggle('active', viewMode === 'table');

    if (viewMode === 'grid') renderGrid();
    else renderTable();
  }

  function renderGrid() {
    grid.innerHTML = '';

    apiCache.etfsList.forEach(s => {
      const card = document.createElement('div');
      card.className = 'fund-card';
      card.innerHTML = `
        <h3>${s.name}</h3>
        <small>${s.ticker} · ${s.currency || s.mena || s.Mena || ''}</small>
        ${renderOverviewCardMetric(s)}
      `;
      card.onclick = () => selectEtf(s.ticker);
      grid.appendChild(card);
    });
  }

  function renderTable() {
    if (!table.dataset.sortKey) { table.dataset.sortKey = 'name'; table.dataset.sortAsc = 'true'; }
    const data = [...apiCache.etfsList]
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'));

    renderThreeColumnOverviewTable({
      table,
      data,
      getName: s => s.name,
      getMetric: s => s.currency || s.mena || s.Mena || '',
      metricLabel: 'Měna',
      getPerf3Y: s => s.perf3Y,
      getPerf5Y: s => s.perf5Y,
      getId: s => s.ticker,
      onSelect: selectEtf
    });
  }

  grid.innerHTML = '<p>Načítám ETF…</p>';
  table.innerHTML = '';

  fetch(STOCK_LIST_API)
    .then(r => r.json())
    .then(stocks => {
      apiCache.etfsList = (Array.isArray(stocks) ? stocks : [])
        .filter(s => s.sector === 'ETF');
      updateView();
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba načítání ETF</p>';
      table.innerHTML = '<p>Chyba načítání ETF</p>';
    });
}

function loadStockDetail(ticker) {

  
const main = document.getElementById('mainContent');
 if (!main) return;


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
  
  <div class="kpi">
    <span>Obor</span>
    <strong id="stock-kpi-sector"> - </strong>
  </div>

  <div class="kpi">
    <span>Burza</span>
    <strong id="stock-kpi-exchange"> - </strong>
  </div>

</div>


    <p id="stock-meta" class="meta"> - </p>


<div class="period-row">
  <div class="period-switch">
    
      <button data-period="1M" data-tooltip="Poslední měsíc">1M</button>
      <button data-period="6M" data-tooltip="Posledních 6 měsíců">6M</button>
      <button data-period="1Y" data-tooltip="Poslední rok">1Y</button>
      <button data-period="3Y" data-tooltip="Poslední 3 roky">3Y</button>
      <button data-period="5Y" data-tooltip="Posledních 5 let">5Y</button>
      <button data-period="MAX" data-tooltip="Celá historie">MAX</button>

  </div>

  <div id="period-diff" class="period-diff">
    —
  </div>
</div>



    <div id="chart-stock"></div>
    
<button class="back-btn">
  ← Zpět
</button>

  `;

  

document.querySelector('.back-btn').onclick = () => { hideTooltip(); history.back(); };



  document.querySelectorAll('.period-switch button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-switch button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadStockData(ticker, btn.dataset.period);
    };
  });

  
  loadStockData(ticker, '3Y');
}

function renderStockMeta(data) {
  if (!data.length) return;

  const first = data[0];

  document.getElementById('stock-kpi-sector').textContent = first.sektor || ' - ';
  document.getElementById('stock-kpi-exchange').textContent = first.exchange || ' - ';

  // ✅ název
  document.getElementById('stock-name').textContent = first.name || first.ticker;
  document.getElementById('stock-title').textContent = first.name || first.ticker;

  // ✅ TradingView URL
  const symbol = first.symbolData || first.ticker;
  const exchange = first.exchange;

  const url = exchange
    ? `https://www.tradingview.com/symbols/${exchange}:${symbol}/`
    : null;

  const meta = document.getElementById('stock-meta');

  if (meta) {
    
  meta.innerHTML = `
  <div>
    <a href="${url}" target="_blank" rel="noopener" class="tv-link">
      Detail akcie v TradingView ↗
    </a>
  </div>
  `;

  }
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
  renderStockMeta(finalData);
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

function downsampleHistory(history, maxPoints = 700) {
  if (!Array.isArray(history) || history.length <= maxPoints) return history || [];

  const result = [];
  const step = (history.length - 1) / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i++) {
    result.push(history[Math.round(i * step)]);
  }

  return result;
}

function renderPortfolioChart(history, containerId) {
 lastChartData = { history, containerId };

 const div = document.getElementById(containerId);
 if (!div || history.length < 2) return;

 div.innerHTML = '';
 div.style.position = 'relative';

 
 const width = div.clientWidth;
 const height = Math.min(width * 0.65, 320);
 div.style.height = height + 'px';

 // ✅ BASE CANVAS (graf)
 const baseCanvas = document.createElement('canvas');
 baseCanvas.width = width;
 baseCanvas.height = height;
 baseCanvas.style.position = 'absolute';
 baseCanvas.style.left = '0';
 baseCanvas.style.top = '0';

 // ✅ OVERLAY CANVAS (hover)
 const overlayCanvas = document.createElement('canvas');
 overlayCanvas.width = width;
 overlayCanvas.height = height;
 overlayCanvas.style.position = 'absolute';
 overlayCanvas.style.left = '0';
 overlayCanvas.style.top = '0';

 div.appendChild(baseCanvas);
 div.appendChild(overlayCanvas);

 // Tooltip
 const tooltip = document.createElement('div');
 tooltip.style.position = 'absolute';
 tooltip.style.pointerEvents = 'none';
 tooltip.style.background = 'rgba(20,20,20,0.9)';
 tooltip.style.color = '#C9A646';
 tooltip.style.padding = '6px 8px';
 tooltip.style.fontSize = '11px';
 tooltip.style.borderRadius = '6px';
 tooltip.style.display = 'none';
 tooltip.style.whiteSpace = 'nowrap';
 div.appendChild(tooltip);

 const ctx = baseCanvas.getContext('2d');
 const octx = overlayCanvas.getContext('2d');

 const padding = { top: 20, right: 60, bottom: 30, left: 20 };

 const values = history.map(p => p.value);
 const min = Math.min(...values);
 const max = Math.max(...values);
 const range = max - min || 1;

 const w = width;
 const h = height;

 const points = history.map((p, i) => ({
  x: padding.left + (i / (history.length - 1)) * (w - padding.left - padding.right),
  y: padding.top + ((max - p.value) / range) * (h - padding.top - padding.bottom)
 }));

 // =====================================================
 // ✅ BASE CHART (vykreslí se jen jednou)
 // =====================================================

 ctx.strokeStyle = '#e6e6e6';
 ctx.fillStyle = '#666';
 ctx.font = '12px Arial';
 ctx.textAlign = 'right';

 for (let i = 0; i <= 5; i++) {
  const y = padding.top + (i / 5) * (h - padding.top - padding.bottom);
  ctx.beginPath();
  ctx.moveTo(padding.left, y);
  ctx.lineTo(w - padding.right, y);
  ctx.stroke();

  ctx.fillText((max - (i / 5) * range).toFixed(2), w - 8, y + 4);
 }

 // AREA
 ctx.beginPath();
 ctx.moveTo(points[0].x, h - padding.bottom);
 points.forEach(pt => ctx.lineTo(pt.x, pt.y));
 ctx.lineTo(points.at(-1).x, h - padding.bottom);

 const gradient = ctx.createLinearGradient(0, padding.top, 0, h);
 gradient.addColorStop(0, 'rgba(201,162,70,0.35)');
 gradient.addColorStop(1, 'rgba(201,162,70,0.02)');
 ctx.fillStyle = gradient;
 ctx.fill();

 // LINE
 ctx.beginPath();
 ctx.strokeStyle = '#C9A646';
 ctx.lineWidth = 1.8;
 points.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
 ctx.stroke();

 // =====================================================
 // ✅ X AXIS
 // =====================================================

 ctx.textAlign = 'center';
 ctx.textBaseline = 'top';
 ctx.fillStyle = '#666';

 const maxXTicks = w < 500 ? 3 : 5;
 const step = Math.max(1, Math.floor(history.length / maxXTicks));

 for (let i = 0; i < history.length; i += step) {
  const x = padding.left + (i / (history.length - 1)) * (w - padding.left - padding.right);
  const d = new Date(history[i].date);

  const label = d.toLocaleDateString('cs-CZ');

  ctx.beginPath();
  ctx.moveTo(x, h - padding.bottom);
  ctx.lineTo(x, h - padding.bottom + 4);
  ctx.stroke();

  ctx.fillText(label, x, h - padding.bottom + 6);
 }

 // =====================================================
 // ✅ HOVER (overlay canvas)
 // =====================================================

 overlayCanvas.addEventListener('mousemove', e => {
  const rect = overlayCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;

  const index = Math.round(
   (x - padding.left) /
   (w - padding.left - padding.right) *
   (history.length - 1)
  );

  if (index < 0 || index >= history.length) {
   tooltip.style.display = 'none';
   octx.clearRect(0, 0, w, h);
   return;
  }

  const p = points[index];
  const d = history[index];

  // ✅ smaž jen overlay
  octx.clearRect(0, 0, w, h);

  // ✅ vertikální čára
  octx.beginPath();
  octx.strokeStyle = 'rgba(201,166,70,0.7)';
  octx.lineWidth = 1;
  octx.setLineDash([4, 4]);
  octx.moveTo(p.x, padding.top);
  octx.lineTo(p.x, h - padding.bottom);
  octx.stroke();

  tooltip.style.display = 'block';
  tooltip.innerHTML =
   new Date(d.date).toLocaleDateString('cs-CZ') +
   '<br><strong>' + d.value.toFixed(4) + '</strong>';

  tooltip.style.left = (p.x + 10) + 'px';
  tooltip.style.top = (p.y) + 'px';
 });

 overlayCanvas.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
  octx.clearRect(0, 0, w, h);
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
function findClosestIndexWithinTolerance(sorted, targetDate, toleranceDays = 30) {
  let bestIndex = -1;
  let bestDiff = Infinity;

  sorted.forEach((item, index) => {
    const diffDays = Math.abs((new Date(item.date) - targetDate) / 86400000);
    if (diffDays <= toleranceDays && diffDays < bestDiff) {
      bestDiff = diffDays;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function filterPeriod(data, period) {
  if (!Array.isArray(data) || !data.length || period === 'MAX') return data || [];

  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const lastDate = new Date(sorted.at(-1).date);
  const target = new Date(lastDate);

  if (period === '1M') {
    target.setMonth(target.getMonth() - 1);
  } else if (period === '6M') {
    target.setMonth(target.getMonth() - 6);
  } else if (period === '1Y') {
    target.setFullYear(target.getFullYear() - 1);
  } else if (period === '3Y') {
    target.setFullYear(target.getFullYear() - 3);
  } else if (period === '5Y') {
    target.setFullYear(target.getFullYear() - 5);
  } else {
    return sorted;
  }

  // Pro 3Y a 5Y sjednoceno s procedurou RefreshInstrumentOverviewMetrics:
  // vybírá se datum nejbližší cílovému datu v toleranci +/- 30 dní.
  if (period === '3Y' || period === '5Y') {
    const closestIndex = findClosestIndexWithinTolerance(sorted, target, 30);
    return closestIndex >= 0 ? sorted.slice(closestIndex) : [];
  }

  // Kratší období necháváme jako dosud: první dostupné datum po cílovém datu.
  let startIndex = sorted.findIndex(d => new Date(d.date) >= target);
  if (startIndex < 0) startIndex = 0;
  return sorted.slice(startIndex);
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

  
const main = document.getElementById('mainContent');
 if (!main) return;


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
    
      <button data-period="1M" data-tooltip="Poslední měsíc">1M</button>
      <button data-period="6M" data-tooltip="Posledních 6 měsíců">6M</button>
      <button data-period="1Y" data-tooltip="Poslední rok">1Y</button>
      <button data-period="3Y" data-tooltip="Poslední 3 roky">3Y</button>
      <button data-period="5Y" data-tooltip="Posledních 5 let">5Y</button>
      <button data-period="MAX" data-tooltip="Celá historie">MAX</button>

  </div>

  <div id="period-diff" class="period-diff">
    —
  </div>
</div>


    <div id="chart-currency"></div>
    
<button class="back-btn">
  ← Zpět
</button>

  `;

  

document.querySelector('.back-btn').onclick = () => { hideTooltip(); history.back(); };



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
    resetInactivityTimer(); // ⬅️ důležité
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

// ===============================
// AUTO LOGOUT (10 min neaktivita)
// ===============================
let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);

  // 10 minut = 600000 ms
  inactivityTimer = setTimeout(() => {
    console.log("Auto logout – neaktivita");
    logout();
  }, 600000);
}

// sleduj aktivitu uživatele
["click", "mousemove", "keydown", "scroll", "touchstart"].forEach(evt => {
  document.addEventListener(evt, resetInactivityTimer, true);
});

function updateLastActivity() {
  localStorage.setItem("last_activity", Date.now());
}

document.addEventListener("click", updateLastActivity);
document.addEventListener("keydown", updateLastActivity);
document.addEventListener("mousemove", updateLastActivity);

function checkSession() {
  const last = localStorage.getItem("last_activity");
  if (!last) return;

  const diff = Date.now() - parseInt(last);

  // 10 minut
  if (diff > 600000) {
    console.log("Session expirovala");
    logout();
  }
}

