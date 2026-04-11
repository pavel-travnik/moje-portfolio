// ===================================================
// HLAVNÍ KONTEJNER
// ===================================================
const main = document.getElementById('mainContent');

// ===================================================
// SPA ROUTER
// ===================================================
function loadPage(page, pushState = true) {

    // DETAIL FONDU: /penze/ISIN
    if (page.startsWith('penze/')) {
        const isin = page.split('/')[1];
        loadFundDetail(isin);
        return;
    }

    // DETAIL AKCIE: /akcie/TICKER
    if (page.startsWith('akcie/')) {
        const ticker = page.split('/')[1];
        loadStockDetail(ticker);
        return;
    }

    // KLASICKÁ STRÁNKA
    fetch(`pages/${page}.html`)
        .then(res => {
            if (!res.ok) throw new Error('Page not found');
            return res.text();
        })
        .then(html => {
            main.innerHTML = html;

            if (page === 'penze') {
                loadPensionFunds();
            }

            if (page === 'akcie') {
                loadStocks();
            }

            if (pushState) {
                history.pushState({ page }, '', `/${page}`);
            }
        })
        .catch(() => {
            main.innerHTML = `
                <h3>404</h3>
                <p>Obsah nenalezen</p>
            `;
        });
}

// ===================================================
// MENU – ZACHYCENÍ KLIKŮ
// ===================================================
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-page]');
    if (!link) return;

    e.preventDefault();
    loadPage(link.dataset.page);
});

// ===================================================
// BACK / FORWARD
// ===================================================
window.addEventListener('popstate', (e) => {
    if (e.state?.page) {
        loadPage(e.state.page, false);
    }
});

// ===================================================
// INIT – NAČTENÍ PODLE URL
// ===================================================
(function init() {
    const path = location.pathname.replace(/^\/+/, '');
    if (path) {
        loadPage(path, false);
    }
})();

// ===================================================
// PENZE – PŘEHLED FONDŮ
// ===================================================
function loadPensionFunds() {
    const grid = document.getElementById('fundGrid');
    if (!grid) return;

    grid.innerHTML = '<p>Načítám fondy…</p>';

    fetch('https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_dps_funds')
        .then(res => {
            if (!res.ok) throw new Error('API error');
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
                    <h3>${fund.name}</h3>
                    <small>${fund.provider}</small>
                `;
                card.addEventListener('click', () => {
                    openFundDetail(fund.isin);
                });
                grid.appendChild(card);
            });
        })
        .catch(() => {
            grid.innerHTML = '<p>Chyba při načítání dat.</p>';
        });
}

// ===================================================
// DETAIL FONDU – ROUTING
// ===================================================
function openFundDetail(isin) {
    history.pushState(
        { page: `penze/${isin}` },
        '',
        `/penze/${isin}`
    );
    loadFundDetail(isin);
}

// ===================================================
// DETAIL FONDU – OBSAH
// ===================================================
function loadFundDetail(isin) {
    main.innerHTML = `
        <h2>Detail fondu</h2>

        <p><strong>ISIN:</strong> ${isin}</p>

        <div class="kpi-row">
            <div class="kpi">
                <span>Poslední hodnota</span>
                <strong id="kpi-last">–</strong>
            </div>
            <div class="kpi">
                <span>Změna</span>
                <strong id="kpi-change">–</strong>
            </div>
            <div class="kpi">
                <span>Počet záznamů</span>
                <strong id="kpi-count">–</strong>
            </div>
        </div>

        <div class="period-switch">
            <button data-period="1Y">1Y</button>
            <button data-period="3Y" class="active">3Y</button>
            <button data-period="MAX">MAX</button>
        </div>

        <div id="chart-portfolio"></div>

        <button class="back-btn">← Zpět na přehled fondů</button>
    `;

    document.querySelector('.back-btn').onclick = () => loadPage('penze');

    document.querySelectorAll('.period-switch button').forEach(btn => {
        btn.onclick = () => {
            document
                .querySelectorAll('.period-switch button')
                .forEach(b => b.classList.remove('active'));

            btn.classList.add('active');
            loadDPS(isin, btn.dataset.period);
        };
    });

    loadDPS(isin, '3Y');
}

// ===================================================
// API – DETAIL FONDU
// ===================================================
const DPS_API_URL =
    'https://moje-portfolio-a5gkdcgbasg4areg.westeurope-01.azurewebsites.net/api/get_dps_data';

async function loadDPS(isin, period = '3Y') {
    try {
        const res = await fetch(`${DPS_API_URL}?isin=${encodeURIComponent(isin)}`);
        if (!res.ok) throw new Error('API chyba');

        let data = await res.json();
        if (!data.length) return;

        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (period !== 'MAX') {
            const years = period === '1Y' ? 1 : 3;
            const from = new Date();
            from.setFullYear(from.getFullYear() - years);
            data = data.filter(d => new Date(d.date) >= from);
        }

        renderKPI(data);
        renderPortfolioChart(data);

    } catch (err) {
        document.getElementById('chart-portfolio').textContent =
            'Chyba načtení API.';
    }
}

// ===================================================
// KPI
// ===================================================
function renderKPI(data) {
    const last = data[data.length - 1];
    const prev = data[data.length - 2];

    document.getElementById('kpi-last').textContent =
        `${last.value.toFixed(4)} ${last.currency}`;

    document.getElementById('kpi-count').textContent = data.length;

    if (prev) {
        const diff = last.value - prev.value;
        const pct = (diff / prev.value) * 100;
        const chip = document.getElementById('kpi-change');

        chip.textContent =
            `${diff >= 0 ? '+' : ''}${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
        chip.className = diff >= 0 ? 'pos' : 'neg';
    }
}

// ===================================================
// AKCIE – PŘEHLED
// ===================================================
function loadStocks() {
    const grid = document.getElementById('stockGrid');
    if (!grid) return;

    grid.innerHTML = '<p>Načítám akcie…</p>';

    fetch('https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_active_stocks')
        .then(res => {
            if (!res.ok) throw new Error('API error');
            return res.json();
        })
        .then(stocks => {
            grid.innerHTML = '';

            if (!stocks.length) {
                grid.innerHTML = '<p>Žádné akcie k dispozici.</p>';
                return;
            }

            stocks.forEach(stock => {
                const card = document.createElement('div');
                card.className = 'fund-card';
                card.innerHTML = `
                    <h3>${stock.name}</h3>
                    <small>${stock.ticker}</small>
                `;
                card.onclick = () => openStockDetail(stock.ticker);
                grid.appendChild(card);
            });
        })
        .catch(() => {
            grid.innerHTML = '<p>Chyba při načítání dat.</p>';
        });
}

// ===================================================
// DETAIL AKCIE – ROUTING + OBSAH
// ===================================================
function openStockDetail(ticker) {
    history.pushState(
        { page: `akcie/${ticker}` },
        '',
        `/akcie/${ticker}`
    );
    loadStockDetail(ticker);
}

function loadStockDetail(ticker) {
    main.innerHTML = `
        <h2>Detail akcie</h2>

        <p><strong>Ticker:</strong> ${ticker}</p>

        <div class="kpi-row">
            <div class="kpi">
                <span>Cena</span>
                <strong>–</strong>
            </div>
            <div class="kpi">
                <span>Změna</span>
                <strong>–</strong>
            </div>
        </div>

        <button class="back-btn">← Zpět na přehled akcií</button>
    `;

    document.querySelector('.back-btn').onclick = () => loadPage('akcie');
}