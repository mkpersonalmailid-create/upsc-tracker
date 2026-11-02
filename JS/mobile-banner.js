(function () {
  'use strict';

  window.deferredPrompt = null;

  // Capture the install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    checkAndInjectBanner(); // Prompt aate hi banner update karo
  });

  function injectCSS() {
    if (document.getElementById('mobileBannerCSS')) return;
    const style = document.createElement('style');
    style.id = 'mobileBannerCSS';
    style.textContent = `
      /* Install / Open App Banner */
      .install-app-banner {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 14px 16px; margin-bottom: 16px;
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.08));
        border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 14px; animation: fadeIn 0.4s;
      }
      .install-app-content { display: flex; align-items: center; gap: 12px; }
      .install-app-icon { font-size: 1.8rem; flex-shrink: 0; }
      .install-app-text { display: flex; flex-direction: column; }
      .install-app-text strong { font-size: 0.95rem; font-weight: 800; color: var(--text); line-height: 1.3; }
      .install-app-text span { font-size: 0.78rem; color: var(--text-2); }
      .install-app-btn {
        background: var(--grad-1); color: #fff; border: none; padding: 10px 18px;
        border-radius: 10px; font-weight: 800; font-size: 0.85rem; cursor: pointer;
        box-shadow: 0 4px 14px rgba(168, 85, 247, 0.3); white-space: nowrap;
      }

      /* Best Experience Banner */
      .mobile-tip-banner {
        display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 14px;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(168, 85, 247, 0.08));
        border: 1px solid rgba(251, 191, 36, 0.35); border-radius: 14px;
      }
      .mobile-tip-text { display: flex; flex-direction: column; gap: 2px; }
      .mobile-tip-text strong { font-size: 0.85rem; font-weight: 800; color: #fbbf24; }
      .mobile-tip-text span { font-size: 0.74rem; color: var(--text-2); }
    `;
    document.head.appendChild(style);
  }

  function checkAndInjectBanner() {
    const content = document.getElementById('content');
    if (!content) return; // Agar content load nahi hua, toh wapas jao

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isBrowser = window.matchMedia('(display-mode: browser)').matches;
    const isAppMode = isStandalone && !isBrowser;

    const hasInstallBanner = document.getElementById('installAppBanner');
    const hasExpBanner = document.getElementById('mobileTipBanner');

    // 1. APP MODE (Mobile PWA)
    if (isAppMode) {
      if (hasInstallBanner) hasInstallBanner.remove();

      if (window.innerWidth <= 700 && !hasExpBanner) {
        const banner = document.createElement('div');
        banner.id = 'mobileTipBanner';
        banner.className = 'mobile-tip-banner';
        banner.innerHTML = `
          <span class="mobile-tip-icon">💻</span>
          <div class="mobile-tip-text">
            <strong>Best experience on laptop or desktop</strong>
            <span>Access all features and detailed analytics easily on a bigger screen.</span>
          </div>
        `;
        content.prepend(banner);
      }
      return;
    }

    // 2. BROWSER MODE (Web/Laptop)
    if (hasExpBanner) hasExpBanner.remove();

    // Agar prompt available hai matlab install nahi hai
    const canInstall = !!window.deferredPrompt;
    const buttonText = canInstall ? 'Install' : 'Open App';
    const descriptionText = canInstall ? 'Fast access & daily updates.' : 'App is already installed.';

    if (!hasInstallBanner) {
      const banner = document.createElement('div');
      banner.id = 'installAppBanner';
      banner.className = 'install-app-banner';
      banner.innerHTML = `
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

      document.getElementById('installPwaBtn').onclick = async () => {
        if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          const { outcome } = await window.deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            localStorage.setItem('pwa_installed', 'true');
            banner.remove();
          }
          window.deferredPrompt = null;
          setTimeout(checkAndInjectBanner, 500); // UI update
        } else {
          alert(
            'App is already installed! \n\nPlease open it from your Home Screen (Mobile) or Applications folder (Laptop).',
          );
        }
      };
    }
  }

  function boot() {
    injectCSS();
    // App load hone ke baad thoda wait karke banner check karo (taaki content render ho jaye)
    setTimeout(checkAndInjectBanner, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // ❌ MutationObserver hata diya gaya hai taaki app load na atke.

  window.addEventListener('appinstalled', () => {
    localStorage.setItem('pwa_installed', 'true');
    window.deferredPrompt = null;
    checkAndInjectBanner();
  });
})();
