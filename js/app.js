// === HLAVNÍ KONTEJNER OBSAHU ===
const main = document.getElementById('mainContent');

// === SPA ROUTING – NAČTENÍ STRÁNKY ===
function loadPage(page, pushState = true) {

  // ✅ DETAIL FONDU – NENAČÍTÁME HTML SOUBOR
  if (page.startsWith('penze/')) {
    const isin = page.split('/')[1];
    loadFundDetail(isin);
    return;
  }

  // ✅ KLASICKÁ STRÁNKA (penze, fondy, atd.)
  fetch(`pages/${page}.html`)
    .then(res => {
      if (!res.ok) throw new Error();
      return res.text();
    })
    .then(html => {
      main.innerHTML = html;

      // ✅ SPECIFICKÝ KÓD PRO STRÁNKU PENZE
      if (page === 'penze' && typeof loadPensionFunds === 'function') {
        loadPensionFunds();
      }

      if (pushState) {
        history.pushState({ page }, '', `/${page}`);
      }
    })
    .catch(() => {
      main.innerHTML = `
        <h2>404</h2>
        <p>Obsah nenalezen</p>
      `;
    });
}

// === ZACHYCENÍ KLIKŮ NA MENU (data-page) ===
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-page]');
  if (!link) return;

  e.preventDefault();
  loadPage(link.dataset.page);
});

// === BACK / FORWARD V PROHLÍŽEČI ===
window.addEventListener('popstate', (e) => {
  if (e.state?.page) {
    loadPage(e.state.page, false);
  }
});

// === PRVNÍ NAČTENÍ STRÁNKY PODLE URL ===
(function init() {
  const path = location.pathname.replace(/^\/+/, '');
  if (path) {
    loadPage(path, false);
  }
})();

// ===================================================
// === PENZE – PŘEHLED FONDŮ (DLAŽDICE) ===============
// ===================================================
function loadPensionFunds() {
  const grid = document.getElementById('fundGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám fondy…</p>';

  fetch('/api/get_dps_funds')
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(funds => {
      grid.innerHTML = '';

      if (!funds.length) {
        grid.innerHTML = '<p>Žádné fondy k dispozici.</p>';
        return;
      }

      funds.forEach(fund => {
        const card = document.createElement('div');
        card.className = 'fund-card';

        card.innerHTML = `
          <h2>${fund.name}</h2>
          <div class="provider">${fund.provider}</div>
          ${
            fund.yield3y !== undefined && fund.yield3y !== null
              ? `<div class="yield">Výnos 3 roky: ${fund.yield3y.toFixed(2)} %</div>`
              : `<div class="yield">Výnos 3 roky: –</div>`
          }
        `;

        card.addEventListener('click', () => openFundDetail(fund.isin));
        grid.appendChild(card);
      });
    })
    .catch(() => {
      grid.innerHTML = '<p>Chyba při načítání dat.</p>';
    });
}

// ===================================================
// === DETAIL FONDU ===================================
// ===================================================
function openFundDetail(isin) {
  history.pushState(
    { page: `penze/${isin}` },
    '',
    `/penze/${isin}`
  );

  loadFundDetail(isin);
}

function loadFundDetail(isin) {
  main.innerHTML = `
    <h1>Detail fondu</h1>
    <p><strong>ISIN:</strong> ${isin}</p>
    <p>Načítám detail fondu…</p>
  `;

  // 🔜 TADY BUDE VOLÁNÍ:
  // /api/get_dps_data?isin=...
  // + vykreslení grafu (Chart.js)
}