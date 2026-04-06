function loadPensionFunds() {
  const grid = document.getElementById('fundGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám data…</p>';

  fetch('/api/get_dps_funds')
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
          <h2>${fund.name}</h2>
          <div class="provider">${fund.provider}</div>
          ${
            fund.yield3y !== undefined && fund.yield3y !== null
              ? `<div class="yield">Výnos 3 roky: ${fund.yield3y.toFixed(2)} %</div>`
              : `<div class="yield">Výnos 3 roky: –</div>`
          }
        `;

        // ✅ připravený proklik na detail
        card.addEventListener('click', () => {
          openFundDetail(fund.isin);
        });

        grid.appendChild(card);
      });
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Chyba při načítání dat.</p>';
    });
}