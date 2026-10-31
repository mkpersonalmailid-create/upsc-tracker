(function () {
  'use strict';

  // Setup global variables for the PWA install prompt
  window.deferredPrompt = null;
  window.canInstallPWA = false;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    window.canInstallPWA = true;
  });

  function injectCSS() {
    if (document.getElementById('mobileBannerCSS')) return;
    const style = document.createElement('style');
    style.id = 'mobileBannerCSS';
    style.textContent = `
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

  // Main Logic: Checks the state and renders the correct banner
  function checkAndInjectBanner() {
    const content = document.getElementById('content');
    if (!content) return; // Wait for the app content to load

    // 1. Check if running in standalone mode (installed app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    // 2. Check localStorage for install/dismiss states
    const isSavedAsInstalled = localStorage.getItem('pwa_installed') === 'true';
    const isDismissed = localStorage.getItem('pwa_banner_dismissed') === 'true';

    const hasInstallBanner = document.getElementById('installAppBanner');
    const hasExpBanner = document.getElementById('mobileTipBanner');

    // If app is open in standalone mode OR user dismissed the banner previously
    if (isStandalone || isDismissed) {
      if (hasInstallBanner) hasInstallBanner.remove();

      // Show mobile experience tip if in standalone mode
      if (isStandalone && !hasExpBanner) {
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

    // If we are here, it means we need to show the Install/Open App banner
    if (!hasInstallBanner) {
      if (hasExpBanner) hasExpBanner.remove(); // Remove mobile tip banner

      // SMART DETECTION: If deferredPrompt is missing, the app is likely already installed (or browser blocked it)
      const isAlreadyInstalled = isSavedAsInstalled || !window.deferredPrompt;
      const buttonText = isAlreadyInstalled ? 'Open App' : 'Install';
      const descriptionText = isAlreadyInstalled ? 'App is already installed.' : 'Fast access & daily updates.';

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

      // Button Click logic
      document.getElementById('installPwaBtn').onclick = async () => {
        if (window.deferredPrompt) {
          // Standard Install Flow
          window.deferredPrompt.prompt();
          const { outcome } = await window.deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            localStorage.setItem('pwa_installed', 'true'); // Save state permanently
            banner.remove();
          }
          window.deferredPrompt = null;
        } else {
          // Open App Flow (Since browser cannot open the app directly due to security)
          alert(
            'App is already installed! \n\nPlease open it from your Home Screen (Mobile) or Applications folder (Laptop).',
          );
        }
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

  // 🚀 PERFORMANCE FIX: Removed setInterval.
  // Using MutationObserver to only trigger when the DOM changes (Much better for battery).
  const observer = new MutationObserver(() => {
    checkAndInjectBanner();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Listen for the install event to immediately update the UI and save state
  window.addEventListener('appinstalled', () => {
    localStorage.setItem('pwa_installed', 'true');
    checkAndInjectBanner();
  });
})();
