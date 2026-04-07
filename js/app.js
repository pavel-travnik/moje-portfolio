// ===================================================
// === HLAVNÍ KONTEJNER ===============================
// ===================================================
const main = document.getElementById('mainContent');

// ===================================================
// === SPA ROUTING ====================================
// ===================================================
function loadPage(page) {

    // ✅ DETAIL FONDU
    if (page.startsWith('penze/')) {
        const isin = page.split('/')[1];
        loadFundDetail(isin);
        return;
    }

    fetch(`pages/${page}.html`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.text();
        })
        .then(html => {
            main.innerHTML = html;

            // ✅ speciální hook pro penze
            if (page === 'penze') {
                loadPensionFunds();
            }
        })
        .catch(() => {
            main.innerHTML = `<h1>404</h1><p>Obsah nenalezen</p>`;
        });
}

// ===================================================
// === MENU / ODKAZY =================================
// ===================================================
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-page]');
    if (!link) return;

    e.preventDefault();
    loadPage(link.dataset.page);
});

// ===================================================
// === INIT ===========================================
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
    loadPage('penze');
});

// ===================================================
// === PENZE – PŘEHLED FONDŮ ==========================
// ===================================================
function loadPensionFunds() {
    const grid = document.getElementById('fundGrid');
    if (!grid) return;

    grid.innerHTML = '<p>Načítám fondy…</p>';

    fetch('https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_dps_funds')
        .then(res => res.json())
        .then(funds => {
            grid.innerHTML = '';

            funds.forEach(fund => {
                const card = document.createElement('div');
                card.className = 'fund-card';

                card.innerHTML = `
                    <h3>${fund.name}</h3>
                    <p>${fund.provider}</p>
                    <p>Výnos 3 roky: <strong>${fund.yield3y ?? '–'} %</strong></p>
                `;

                card.addEventListener('click', () => {
                    loadFundDetail(fund.isin);
                });

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
function loadFundDetail(isin) {
    main.innerHTML = `
        <h1>Detail fondu</h1>
        <p><strong>ISIN:</strong> ${isin}</p>
        <p>Načítám detail fondu…</p>
    `;

    // 🔜 zde později:
    // fetch(`/api/get_dps_detail?isin=${isin}`)
    // + graf, data, výnosy
}
