(function () {
  'use strict';
  // 👇 YE LINES SABSE UPAR ADD KARO 👇
  window.deferredPrompt = null;
  window.canInstallPWA = false;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    window.canInstallPWA = true;
  });
  // 👆 YAHAN TAK 👆

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
        box-shadow: 0 4px 14px rgba(168, 85, 247, 0.3);
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

  // Main Logic: Har 1 second me check karega ki banner dikhana hai ya nahi
  function checkAndInjectBanner() {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const content = document.getElementById('content');

    // Agar app load nahi hua hai toh wait karo
    if (!content) return;

    const hasInstallBanner = document.getElementById('installAppBanner');
    const hasExpBanner = document.getElementById('mobileTipBanner');

    if (!isInstalled) {
      // ═══ 1. INSTALL NAHI HAI -> INSTALL BANNER ═══
      if (!hasInstallBanner) {
        if (hasExpBanner) hasExpBanner.remove(); // Purana hatao

        const banner = document.createElement('div');
        banner.id = 'installAppBanner';
        banner.className = 'install-app-banner';
        banner.innerHTML = `
          <div class="install-app-content">
            <span class="install-app-icon">📱</span>
            <div class="install-app-text">
              <strong>Install UPSC Tracker App in Phone and Laptop </strong>
              <span>Fast access & daily updates.</span>
            </div>
          </div>
          <button class="install-app-btn" id="installPwaBtn">Install</button>
        `;

        // Content area me sabse upar lagao
        content.prepend(banner);

        // Button Click logic
        document.getElementById('installPwaBtn').onclick = async () => {
          if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            if (outcome === 'accepted') banner.remove();
            window.deferredPrompt = null;
          } else {
            // Agar Chrome ne prompt block kiya hai (kabhi kabhi hota hai)
            alert("To install, go to the 3 dots (⋮) in your browser and select 'Install App' / 'Add to Home Screen'.");
          }
        };
      }
    } else {
      // ═══ 2. INSTALL HAI -> EXPERIENCE BANNER (Mobile) ═══
      if (!hasExpBanner) {
        if (hasInstallBanner) hasInstallBanner.remove(); // Purana hatao

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
    }
  }

  // DOM ready hone par CSS inject karo aur check shuru karo
  function boot() {
    injectCSS();
    checkAndInjectBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 🚀 MAGIC FIX: Har 1 second me check karega.
  // Agar app ne screen clear kar di, toh banner wapas lag jayega.
  setInterval(checkAndInjectBanner, 1000);

  // Jab user install kar le, toh turant banner change karo
  window.addEventListener('appinstalled', () => {
    checkAndInjectBanner();
  });
})();
