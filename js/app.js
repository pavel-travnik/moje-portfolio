const main = document.getElementById('mainContent');

function loadPage(page, pushState = true) {
  fetch(`pages/${page}.html`)
    .then(res => {
      if (!res.ok) throw new Error();
      return res.text();
    })
    .then(html => {
      main.innerHTML = html;
      if (pushState) {
        history.pushState({ page }, '', `/${page}`);
      }
    })
    .catch(() => {
      main.innerHTML = '<h1>404</h1><p>Obsah nenalezen</p>';
    });
}

// Zachycení kliků
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-page]');
  if (!link) return;

  e.preventDefault();
  loadPage(link.dataset.page);
});

// Back / Forward
window.addEventListener('popstate', (e) => {
  if (e.state?.page) {
    loadPage(e.state.page, false);
  }
});

// Přímý vstup na URL (např. /penze)
const initialPage = location.pathname.replace('/', '');
if (initialPage) {
  loadPage(initialPage, false);
}
