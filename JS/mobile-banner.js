/* ═══════════════════════════════════════════════════════════════
   SMART INSTALL & EXPERIENCE BANNER (Modified)
   ---------------------------------------------------------------
   - Not Installed -> Install banner on ALL devices
   - Installed -> Experience banner ONLY on mobile
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // 1. Check standalone mode
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // 2. Capture Chrome's install prompt immediately (Ekdum top par)
  window.deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Chrome ka default popup rokne ke liye
    window.deferredPrompt = e;
  });

  function injectCSS() {
    if (document.getElementById('mobileBannerCSS')) return;
    const style = document.createElement('style');
    style.id = 'mobileBannerCSS';
    style.textContent = `
      /* ═══ INSTALL BANNER CSS (All Devices) ═══ */
      .install-app-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        margin-bottom: 16px;
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.08));
        border: 1px solid rgba(168, 85, 247, 0.35);
        border-radius: 14px;
        animation: fadeIn 0.4s;
        position: relative;
        z-index: 50;
      }
      .install-app-content { display: flex; align-items: center; gap: 12px; }
      .install-app-icon { font-size: 1.8rem; flex-shrink: 0; animation: float 3s ease-in-out infinite; }
      .install-app-text { display: flex; flex-direction: column; }
      .install-app-text strong { font-size: 0.95rem; font-weight: 800; color: var(--text); line-height: 1.3; }
      .install-app-text span { font-size: 0.78rem; color: var(--text-2); }
      .install-app-btn {
        background: var(--grad-1);
        color: #fff;
        border: none;
        padding: 10px 18px;
        border-radius: 10px;
        font-weight: 800;
        font-size: 0.85rem;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(168, 85, 247, 0.3);
        transition: transform 0.2s;
      }
      .install-app-btn:hover { transform: scale(1.05); }

      /* ═══ EXPERIENCE BANNER CSS (Sirf Mobile) ═══ */
      .mobile-tip-banner { display: none; }
      @media (max-width: 700px) {
        .mobile-tip-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          margin-bottom: 14px;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(168, 85, 247, 0.08));
          border: 1px solid rgba(251, 191, 36, 0.35);
          border-radius: 14px;
          animation: fadeIn 0.4s;
        }
        .mobile-tip-icon { font-size: 1.6rem; flex-shrink: 0; animation: float 3s ease-in-out infinite; }
        .mobile-tip-text { display: flex; flex-direction: column; gap: 2px; }
        .mobile-tip-text strong { font-size: 0.85rem; font-weight: 800; color: #fbbf24; line-height: 1.3; }
        .mobile-tip-text span { font-size: 0.74rem; color: var(--text-2); line-height: 1.4; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectBanner() {
    // ✅ FIX: Study tab ke bajaye main 'content' area me daalo (Jo har tab pe dikhta hai)
    const mainContent = document.getElementById('content');
    if (!mainContent) return false;

    // Purane banner hatao agar koi hain
    const oldInstall = document.getElementById('installAppBanner');
    if (oldInstall) oldInstall.remove();
    const oldExp = document.getElementById('mobileTipBanner');
    if (oldExp) oldExp.remove();

    if (!isInstalled) {
      // ═══ 1. NOT INSTALLED -> INSTALL BANNER ═══
      const banner = document.createElement('div');
      banner.className = 'install-app-banner';
      banner.id = 'installAppBanner';
      banner.innerHTML = `
        <div class="install-app-content">
          <span class="install-app-icon">📱</span>
          <div class="install-app-text">
            <strong>Install UPSC Tracker App</strong>
            <span>Fast, offline access & daily updates.</span>
          </div>
        </div>
        <button class="install-app-btn" id="installPwaBtn">Install</button>
      `;

      // Content area ke sabse upar lagao
      mainContent.insertBefore(banner, mainContent.firstChild);

      // Button Click Logic
      document.getElementById('installPwaBtn').onclick = async () => {
        if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          const { outcome } = await window.deferredPrompt.userChoice;
          if (outcome === 'accepted') banner.remove();
          window.deferredPrompt = null;
        } else {
          alert("Install karne ke liye apne browser ke menu (⋮) mein jaayein aur 'Add to Home Screen' select karein.");
        }
      };
    } else {
      // ═══ 2. INSTALLED -> EXPERIENCE BANNER (Sirf mobile me CSS se dikhega) ═══
      const banner = document.createElement('div');
      banner.className = 'mobile-tip-banner';
      banner.id = 'mobileTipBanner';
      banner.innerHTML = `
        <span class="mobile-tip-icon">💻</span>
        <div class="mobile-tip-text">
          <strong>Best experience on laptop or desktop</strong>
          <span>Access all features and detailed analytics easily on a bigger screen.</span>
        </div>
      `;
      mainContent.insertBefore(banner, mainContent.firstChild);
    }
    return true;
  }

  function boot() {
    injectCSS();
    injectBanner();
    console.log('[banner] ✅ loaded');
  }

  // Initial boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1000));
  } else {
    setTimeout(boot, 1000);
  }

  // 🚀 THE MAGIC FIX: App jab bhi view change karegi, banner wapas inject ho jayega
  let retries = 0;
  const interval = setInterval(() => {
    retries++;
    if (injectBanner() || retries > 30) clearInterval(interval);
  }, 500);

  // App re-render hone par bhi track karo
  window.addEventListener('load', () => {
    setTimeout(() => {
      const observer = new MutationObserver(() => {
        const content = document.getElementById('content');
        if (content && !document.getElementById('installAppBanner') && !document.getElementById('mobileTipBanner')) {
          injectBanner();
        }
      });
      const targetNode = document.getElementById('content');
      if (targetNode) observer.observe(targetNode, { childList: true });
    }, 2000);
  });

  // Install event handle karo
  window.addEventListener('appinstalled', () => {
    const installBanner = document.getElementById('installAppBanner');
    if (installBanner) installBanner.remove();
    injectBanner(); // Experience banner inject karega
  });
})();
