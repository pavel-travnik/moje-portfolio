const main = document.getElementById('mainContent');

/**
 * Načte HTML stránku do hlavního okna (SPA)
 */
function loadPage(page) {
    fetch(`${page}.html`)
        .then(res => {
            if (!res.ok) {
                throw new Error('Stránka nenalezena');
            }
            return res.text();
        })
        .then(html => {
            main.innerHTML = html;

            // ✅ hooky pro jednotlivé stránky
            if (page === 'penze' && typeof loadDpsFunds === 'function') {
                loadDpsFunds();
            }
        })
        .catch(() => {
            main.innerHTML = `
                <h1>404</h1>
                <p>Obsah nenalezen</p>
            `;
        });
}

/**
 * Zachycení kliknutí na všechny SPA odkazy
 */
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-page]');
    if (!link) return;

    e.preventDefault();
    const page = link.dataset.page;
    loadPage(page);
});

/**
 * Prvotní obsah po načtení stránky
 * (bez manipulace s URL – bezpečné pro file://)
 */
document.addEventListener('DOMContentLoaded', () => {
    // výchozí stránka
    loadPage('penze'); // případně 'home', pokud máš
});