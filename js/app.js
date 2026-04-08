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

    <div class="period-switch">
      <button data-period="1Y">1Y</button>
      <button data-period="3Y" class="active">3Y</button>
      <button data-period="MAX">MAX</button>
    </div>

    <div id="chart-portfolio" style="height:320px;"></div>

    <button class="back-btn">← Zpět na přehled fondů</button>
  `;

  document.querySelector('.back-btn').onclick = () => loadPage('penze');

  // napojení přepínačů
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

const DPS_API_URL =
  'https://moje-portfolio-a5gkdcgbasg4areg.westeurope-01.azurewebsites.net/api/get_dps_data';

async function loadDPS(isin, period = '3Y') {
  try {
    const res = await fetch(`${DPS_API_URL}?isin=${encodeURIComponent(isin)}`);
    if (!res.ok) throw new Error('API chyba');

    let data = await res.json();
    if (!data.length) return;

    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 🔹 FILTRACE OBDOBÍ
    const now = new Date();
    if (period !== 'MAX') {
      const years = period === '1Y' ? 1 : 3;
      const from = new Date(now);
      from.setFullYear(now.getFullYear() - years);
      data = data.filter(d => new Date(d.date) >= from);
    }

    renderKPI(data);
    renderPortfolioChart(data);

  } catch (err) {
    console.error(err);
    document.getElementById('chart-portfolio').textContent =
      'Chyba načtení API.';
  }
}

    // seřazení podle data
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    renderKPI(data);
    renderPortfolioChart(data);

  } catch (err) {
    console.error(err);
    document.getElementById('chart-portfolio').textContent =
      'Chyba načtení API.';
  }
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

  const padding = 40;

  const values = history.map(p => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);

  // osy
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;

  // Y osa
  ctx.beginPath();
  ctx.moveTo(padding, 10);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.stroke();

  // X osa
  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - 10, canvas.height - padding);
  ctx.stroke();

  // popisky Y
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.fillText(maxV.toFixed(2), 5, 20);
  ctx.fillText(minV.toFixed(2), 5, canvas.height - padding);

  // data
  const pts = history.map((p, i) => ({
    x:
      padding +
      (i / (history.length - 1)) *
        (canvas.width - padding - 10),
    y:
      canvas.height -
      padding -
      ((p.value - minV) / (maxV - minV)) *
        (canvas.height - padding - 20)
  }));

  // křivka
  ctx.beginPath();
  ctx.strokeStyle = '#C9A646';
  ctx.lineWidth = 2;

  pts.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });

  ctx.stroke();
}

let lastChartData = null;

function renderPortfolioChart(history) {
  lastChartData = history;
  // … zbytek funkce beze změny
}

// při změně velikosti okna
window.addEventListener('resize', () => {
  if (lastChartData) {
    renderPortfolioChart(lastChartData);
  }
});