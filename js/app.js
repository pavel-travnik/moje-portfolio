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

    <div class="kpi-bar">
      <div>Poslední hodnota: <strong id="kpi-last">–</strong></div>
      <div>Změna: <strong id="kpi-change">–</strong></div>
      <div>Počet záznamů: <strong id="kpi-count">–</strong></div>
    </div>

    <div id="chart-portfolio" style="height:300px;"></div>

    <button class="back-btn">← Zpět na přehled fondů</button>
  `;

  document.querySelector('.back-btn').addEventListener('click', () => {
    loadPage('penze');
  });

  loadDPS(isin);
}

function renderKPI(data) {
  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  document.getElementById(
    'kpi-last'
  ).textContent = `${last.value.toFixed(4)} ${last.currency}`;
  document.getElementById('kpi-count').textContent = data.length;

  if (prev) {
    const diff = last.value - prev.value;
    const pct = (diff / prev.value) * 100;
    const chip = document.getElementById('kpi-change');

    chip.textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(4)} (${pct.toFixed(
      2
    )}%)`;
    chip.className = diff >= 0 ? 'pos' : 'neg';
  }
}

function renderPortfolioChart(history) {
  const div = document.getElementById('chart-portfolio');
  div.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.width = div.clientWidth;
  canvas.height = div.clientHeight;
  div.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  const values = history.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);

  const pts = history.map((p, i) => ({
    x: (i / (history.length - 1)) * canvas.width,
    y:
      canvas.height -
      ((p.value - minV) / (maxV - minV)) * canvas.height,
  }));

  ctx.beginPath();
  ctx.strokeStyle = '#C9A646';
  ctx.lineWidth = 2;

  pts.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });

  ctx.stroke();
}