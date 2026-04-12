// ===================================================
// HLAVNÍ KONTEJNER
// ===================================================
const main = document.getElementById('mainContent');

// ===================================================
// API URL
// ===================================================
const DPS_API_URL =
    'https://moje-portfolio-a5gkdcgbasg4areg.westeurope-01.azurewebsites.net/api/get_dps_data';

const STOCK_API_URL =
    'https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_stock_data';

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

// INIT
(function init() {
    const path = location.pathname.replace(/^\/+/, '');
    loadPage(path || 'penze', false);
})();

// ===================================================
// ROUTER
// ===================================================
function loadPage(page, pushState = true) {

    // DETAIL FONDU
    if (page.startsWith('penze/')) {
        loadFundDetail(page.split('/')[1]);
        return;
    }

    // DETAIL AKCIE
    if (page.startsWith('akcie/')) {
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
            if (page === 'akcie') loadStocks();

            if (pushState) history.pushState({ page }, '', `/${page}`);
        })
        .catch(() => {
            main.innerHTML = '<h3>404</h3><p>Stránka nenalezena</p>';
        });
}

// ===================================================
// PENZE – PŘEHLED FONDŮ
// ===================================================
function loadPensionFunds() {
    const grid = document.getElementById('fundGrid');
    if (!grid) return;

    grid.innerHTML = '<p>Načítám fondy…</p>';

    fetch('https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_dps_funds')
        .then(r => r.json())
        .then(funds => {
            grid.innerHTML = '';
            funds.forEach(f => {
                const card = document.createElement('div');
                card.className = 'fund-card';
                card.innerHTML = `<h3>${f.name}</h3><small>${f.provider}</small>`;
                card.onclick = () => {
                    history.pushState({ page: `penze/${f.isin}` }, '', `/penze/${f.isin}`);
                    loadFundDetail(f.isin);
                };
                grid.appendChild(card);
            });
        });
}

// ===================================================
// DETAIL FONDU
// ===================================================
function loadFundDetail(isin) {
    main.innerHTML = `
        <h3>Detail fondu</h3>
        <p><strong>ISIN:</strong> ${isin}</p>

        <div class="kpi-row">
            <div class="kpi"><span>Poslední hodnota</span><strong id="kpi-last">–</strong></div>
            <div class="kpi"><span>Změna</span><strong id="kpi-change">–</strong></div>
            <div class="kpi"><span>Počet záznamů</span><strong id="kpi-count">–</strong></div>
        </div>

        <div class="period-switch">
            <button data-period="1Y">1Y</button>
            <button data-period="3Y" class="active">3Y</button>
            <button data-period="MAX">MAX</button>
        </div>

        <div id="chart-portfolio"></div>
        <button class="back-btn">← Zpět</button>
    `;

    document.querySelector('.back-btn').onclick = () => history.back();

    document.querySelectorAll('.period-switch button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.period-switch button')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadDPS(isin, btn.dataset.period);
        };
    });

    loadDPS(isin, '3Y');
}

async function loadDPS(isin, period) {
    const res = await fetch(`${DPS_API_URL}?isin=${encodeURIComponent(isin)}`);
    let data = await res.json();

    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    data = filterPeriod(data, period);

    renderFundKPI(data);
    renderPortfolioChart(
        data.map(d => ({ date: d.date, value: d.value })),
        'chart-portfolio'
    );
}

function renderFundKPI(data) {
    const last = data.at(-1);
    const prev = data.at(-2);

    document.getElementById('kpi-last').textContent =
        `${last.value.toFixed(4)} ${last.currency}`;
    document.getElementById('kpi-count').textContent = data.length;

    if (prev) {
        const diff = last.value - prev.value;
        const pct = (diff / prev.value) * 100;
        const el = document.getElementById('kpi-change');
        el.textContent = `${diff.toFixed(4)} (${pct.toFixed(2)}%)`;
        el.className = diff >= 0 ? 'pos' : 'neg';
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
        .then(r => r.json())
        .then(stocks => {
            grid.innerHTML = '';
            stocks.forEach(s => {
                const card = document.createElement('div');
                card.className = 'fund-card';
                card.innerHTML = `<h3>${s.name}</h3><small>${s.ticker}</small>`;
                card.onclick = () => {
                    history.pushState({ page: `akcie/${s.ticker}` }, '', `/akcie/${s.ticker}`);
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
        <h3>Detail akcie</h3>
        <p><strong>Ticker:</strong> ${ticker}</p>

        <div class="kpi-row">
            <div class="kpi"><span>Poslední cena</span><strong id="stock-kpi-last">–</strong></div>
            <div class="kpi"><span>Denní změna</span><strong id="stock-kpi-change">–</strong></div>
            <div class="kpi"><span>Počet záznamů</span><strong id="stock-kpi-count">–</strong></div>
        </div>

        <div class="period-switch">
            <button data-period="1Y">1Y</button>
            <button data-period="3Y" class="active">3Y</button>
            <button data-period="MAX">MAX</button>
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

    loadStockData(ticker, '3Y');
}

async function loadStockData(ticker, period) {
    const res = await fetch(`${STOCK_API_URL}?ticker=${encodeURIComponent(ticker)}`);
    let data = await res.json();

    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    data = filterPeriod(data, period);

    renderStockKPI(data);
    renderPortfolioChart(
        data.map(d => ({ date: d.date, value: d.close })),
        'chart-stock'
    );
}

function renderStockKPI(data) {
    const last = data.at(-1);
    const prev = data.at(-2);

    document.getElementById('stock-kpi-last').textContent =
        `${last.close.toFixed(2)} ${last.currency}`;
    document.getElementById('stock-kpi-count').textContent = data.length;

    if (prev) {
        const diff = last.close - prev.close;
        const pct = (diff / prev.close) * 100;
        const el = document.getElementById('stock-kpi-change');
        el.textContent = `${diff.toFixed(2)} (${pct.toFixed(2)}%)`;
        el.className = diff >= 0 ? 'pos' : 'neg';
    }
}

// ===================================================
// PROFESIONÁLNÍ GRAF (RESPONZIVNÍ)
// ===================================================
let lastChartData = null;

function renderPortfolioChart(history, containerId) {
    lastChartData = { history, containerId };

    const div = document.getElementById(containerId);
    if (!div || history.length < 2) return;

    div.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.width = div.clientWidth;
    canvas.height = Math.min(div.clientWidth * 0.65, 320);
    div.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const padding = { top: 20, right: 60, bottom: 30, left: 20 };
    const w = canvas.width;
    const h = canvas.height;

    const values = history.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // GRID + Y AXIS
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
        ctx.fillText(
            (max - (i / 5) * range).toFixed(2),
            w - 8,
            y + 4
        );
    }

    // DATA
    const points = history.map((p, i) => ({
        x: padding.left + (i / (history.length - 1)) *
            (w - padding.left - padding.right),
        y: padding.top + ((max - p.value) / range) *
            (h - padding.top - padding.bottom),
    }));

    // FILL
    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padding.bottom);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points.at(-1).x, h - padding.bottom);
    ctx.fillStyle = 'rgba(201,162,70,0.15)';
    ctx.fill();

    // LINE
    ctx.beginPath();
    ctx.strokeStyle = '#C9A646';
    ctx.lineWidth = 2;
    points.forEach((pt, i) =>
        i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)
    );
    ctx.stroke();

    // LAST POINT
    const last = points.at(-1);
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#C9A646';
    ctx.fill();
}

// RESIZE
window.addEventListener('resize', () => {
    if (!lastChartData) return;
    renderPortfolioChart(
        lastChartData.history,
        lastChartData.containerId
    );
});

// ===================================================
// Filtrované období
// ===================================================
function filterPeriod(data, period) {
    if (period === 'MAX') return data;
    const years = period === '1Y' ? 1 : 3;
    const from = new Date();
    from.setFullYear(from.getFullYear() - years);
    return data.filter(d => new Date(d.date) >= from);
}