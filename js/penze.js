function loadPensionFunds() {
  const grid = document.getElementById('fundGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Načítám data…</p>';

  fetch('https://portfolio-func-app-hvc9bbfbahdmhbb0.westeurope-01.azurewebsites.net/api/get_dps_funds')
    .then(res => {
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
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
        `;

        card.addEventListener('click', () => {
          openFundDetail(fund.isin);
        });

        grid.appendChild(card);
      });
    })
    .catch(err => {
      console.error('FETCH ERROR:', err);
      grid.innerHTML = '<p>Chyba při načítání dat.</p>';
    });
}