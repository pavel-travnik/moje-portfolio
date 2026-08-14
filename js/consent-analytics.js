// ===================================================
// CONSENT + ANALYTICS LOADER
// ===================================================
// Nastav ID az po zalozeni projektu v nastrojich.
// Pokud necháš ID prázdné, nic externího se nenačte.
const ANALYTICS_CONFIG = {
  clarityProjectId: '',       // např. 'abcd123xyz'
  gaMeasurementId: '',        // např. 'G-XXXXXXXXXX'
  consentStorageKey: 'mp_cookie_consent_v1'
};

function getCookieConsent() {
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_CONFIG.consentStorageKey) || 'null');
  } catch {
    return null;
  }
}

function setCookieConsent(value) {
  localStorage.setItem(
    ANALYTICS_CONFIG.consentStorageKey,
    JSON.stringify({
      analytics: value === 'granted',
      decidedAt: new Date().toISOString(),
      version: 1
    })
  );
}

function loadScriptOnce(id, src, onload) {
  if (document.getElementById(id)) {
    if (onload) onload();
    return;
  }
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  if (onload) script.onload = onload;
  document.head.appendChild(script);
}

function enableGoogleAnalytics() {
  const id = ANALYTICS_CONFIG.gaMeasurementId;
  if (!id) return;

  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Google Consent Mode V2: default denied, po souhlasu update na granted.
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  loadScriptOnce('ga4-script', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`, () => {
    window.gtag('js', new Date());
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      analytics_storage: 'granted',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('config', id, {
      anonymize_ip: true,
      send_page_view: true
    });
  });
}

function enableMicrosoftClarity() {
  const id = ANALYTICS_CONFIG.clarityProjectId;
  if (!id) return;

  // Standardní loader Clarity. Cookies se v projektu Clarity nastaví podle consent mode.
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, 'clarity', 'script', id);

  // Consent V2 signál po uděleném souhlasu.
  window.clarity('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: 'granted'
  });
}

function enableAnalytics() {
  enableGoogleAnalytics();
  enableMicrosoftClarity();
}

function trackSpaPageView(page) {
  if (!getCookieConsent()?.analytics) return;

  const path = page ? `/${String(page).replace(/^\/+/, '')}` : window.location.pathname;

  if (window.gtag && ANALYTICS_CONFIG.gaMeasurementId) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title
    });
  }

  if (window.clarity) {
    window.clarity('set', 'spa_page', path);
  }
}

function showCookieBanner() {
  if (document.getElementById('cookieConsentBanner')) return;

  const banner = document.createElement('div');
  banner.id = 'cookieConsentBanner';
  banner.className = 'cookie-banner';
  banner.innerHTML = `
    <div class="cookie-banner-inner">
      <div>
        <strong>Cookies a analytika</strong>
        <p>
          Používáme nezbytné technické ukládání pro fungování webu. Analytické cookies
          pomáhají měřit návštěvnost a zlepšovat web. Analytiku spustíme jen po vašem souhlasu.
        </p>
      </div>
      <div class="cookie-actions">
        <button class="pill-button" id="cookieReject">Jen nezbytné</button>
        <button class="pill-button" id="cookieAccept">Povolit analytiku</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('cookieReject').onclick = () => {
    setCookieConsent('denied');
    banner.remove();
  };

  document.getElementById('cookieAccept').onclick = () => {
    setCookieConsent('granted');
    banner.remove();
    enableAnalytics();
    trackSpaPageView(location.pathname);
  };
}

function initCookieConsent() {
  const consent = getCookieConsent();

  if (!consent) {
    showCookieBanner();
    return;
  }

  if (consent.analytics) {
    enableAnalytics();
  }
}

window.initCookieConsent = initCookieConsent;
window.trackSpaPageView = trackSpaPageView;
window.getCookieConsent = getCookieConsent;
window.showCookieBanner = showCookieBanner;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieConsent);
} else {
  initCookieConsent();
}
