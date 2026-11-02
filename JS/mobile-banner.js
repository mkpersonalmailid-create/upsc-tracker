(function () {
  'use strict';

  window.deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
  });

  function injectCSS() {
    if (document.getElementById('mobileBannerCSS')) return;
    const style = document.createElement('style');
    style.id = 'mobileBannerCSS';
    style.textContent = `
      .install-app-banner {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 14px 16px; margin-bottom: 16px; position: relative;
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.08));
        border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 14px; animation: fadeIn 0.4s;
      }
      .install-app-content { display: flex; align-items: center; gap: 12px; padding-right: 20px; }
      .install-app-icon { font-size: 1.8rem; flex-shrink: 0; }
      .install-app-text { display: flex; flex-direction: column; }
      .install-app-text strong { font-size: 0.95rem; font-weight: 800; color: var(--text); line-height: 1.3; }
      .install-app-text span { font-size: 0.78rem; color: var(--text-2); }
      .install-app-btn {
        background: var(--grad-1); color: #fff; border: none; padding: 10px 18px;
        border-radius: 10px; font-weight: 800; font-size: 0.85rem; cursor: pointer;
        box-shadow: 0 4px 14px rgba(168, 85, 247, 0.3); white-space: nowrap;
      }
      .banner-close-btn {
        position: absolute; top: 8px; right: 10px; background: transparent; border: none;
        color: rgba(255,255,255,0.5); font-size: 1.2rem; cursor: pointer; padding: 2px;
      }
      .banner-close-btn:hover { color: #fff; }

      /* Best Experience Banner CSS (Sirf Mobile ke liye) */
      .mobile-tip-banner { display: none; }
      @media (max-width: 700px) {
        .mobile-tip-banner {
          display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 14px;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(168, 85, 247, 0.08));
          border: 1px solid rgba(251, 191, 36, 0.35); border-radius: 14px;
        }
        .mobile-tip-text { display: flex; flex-direction: column; gap: 2px; }
        .mobile-tip-text strong { font-size: 0.85rem; font-weight: 800; color: #fbbf24; }
        .mobile-tip-text span { font-size: 0.74rem; color: var(--text-2); }
      }
    `;
    document.head.appendChild(style);
  }

  function checkAndInjectBanner() {
    const content = document.getElementById('content');
    if (!content) return;

    // Check display mode
    const isBrowser = window.matchMedia('(display-mode: browser)').matches;
    const isDismissed = localStorage.getItem('pwa_banner_dismissed') === 'true';
    const isSavedAsInstalled = localStorage.getItem('pwa_installed') === 'true';

    const hasInstallBanner = document.getElementById('installAppBanner');
    const hasExpBanner = document.getElementById('mobileTipBanner');

    // CASE 1: App ke andar hain (PWA Mode) YA user ne dismiss kar diya hai
    if (!isBrowser || isDismissed) {
      if (hasInstallBanner) hasInstallBanner.remove();

      // "Best Experience" banner sirf tab dikhao jab mobile size ho
      if (!isBrowser && !hasExpBanner && window.innerWidth <= 700) {
        const tipBanner = document.createElement('div');
        tipBanner.id = 'mobileTipBanner';
        tipBanner.className = 'mobile-tip-banner';
        tipBanner.innerHTML = `
          <span class="mobile-tip-icon">💻</span>
          <div class="mobile-tip-text">
            <strong>Best experience on laptop or desktop</strong>
            <span>Access all features and detailed analytics easily on a bigger screen.</span>
          </div>
        `;
        content.prepend(tipBanner);
      }
      return;
    }

    // CASE 2: Normal Web Browser me hain (Desktop ya Mobile Web)
    if (hasExpBanner) hasExpBanner.remove(); // Tip banner hata do agar dikh raha hai

    if (!hasInstallBanner) {
      const isAlreadyInstalled = isSavedAsInstalled || !window.deferredPrompt;
      const buttonText = isAlreadyInstalled ? 'Open App' : 'Install';
      const descriptionText = isAlreadyInstalled ? 'App is already installed.' : 'Fast access & daily updates.';

      const banner = document.createElement('div');
      banner.id = 'installAppBanner';
      banner.className = 'install-app-banner';
      banner.innerHTML = `
        <button class="banner-close-btn" id="closeBannerBtn" title="Dismiss">✕</button>
        <div class="install-app-content">
          <span class="install-app-icon">📱</span>
          <div class="install-app-text">
            <strong>UPSC Tracker App</strong>
            <span>${descriptionText}</span>
          </div>
        </div>
        <button class="install-app-btn" id="installPwaBtn">${buttonText}</button>
      `;

      content.prepend(banner);

      // Install / Open App Button
      document.getElementById('installPwaBtn').onclick = async () => {
        if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          const { outcome } = await window.deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            localStorage.setItem('pwa_installed', 'true');
            banner.remove();
          }
          window.deferredPrompt = null;
        } else {
          alert(
            'App is already installed! \n\nPlease open it from your Home Screen (Mobile) or Applications folder (Laptop).',
          );
        }
      };

      // Close Button
      document.getElementById('closeBannerBtn').onclick = () => {
        localStorage.setItem('pwa_banner_dismissed', 'true');
        banner.remove();
      };
    }
  }

  function boot() {
    injectCSS();
    checkAndInjectBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  const observer = new MutationObserver(() => {
    checkAndInjectBanner();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('appinstalled', () => {
    localStorage.setItem('pwa_installed', 'true');
    checkAndInjectBanner();
  });
})();
