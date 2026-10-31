/* ═══════════════════════════════════════════════════════════════
   SMART INSTALL & EXPERIENCE BANNER
   ---------------------------------------------------------------
   1. Install nahi hai -> Saare devices par Install banner.
   2. Install ho gaya -> Sirf Mobile par Experience banner.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // 1. Check karo ki app pehle se install hai ya nahi (Standalone mode)
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

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

      /* ═══ EXPERIENCE BANNER CSS (Sirf Mobile Ke Liye) ═══ */
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

  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  function injectBanner() {
    const studyView = document.getElementById('view-study');
    if (!studyView) return false;
    const hero = studyView.querySelector('.hero');
    if (!hero) return false;

    // Purane banners hatao (agar hain toh)
    const oldInstall = document.getElementById('installAppBanner');
    if (oldInstall) oldInstall.remove();
    const oldExp = document.getElementById('mobileTipBanner');
    if (oldExp) oldExp.remove();

    if (!isInstalled) {
      // ═══ 1. AGAR INSTALL NAHI HAI -> INSTALL BANNER DIKHAO ═══
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
      studyView.insertBefore(banner, hero);

      // Install Button Click Logic
      document.getElementById('installPwaBtn').onclick = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') banner.remove();
          deferredPrompt = null;
        } else {
          alert(
            "Install karne ke liye apne browser ke menu (⋮) mein jaayein aur 'Add to Home Screen' / 'Install App' select karein.",
          );
        }
      };
    } else {
      // ═══ 2. AGAR INSTALL HAI -> SIRF EXPERIENCE BANNER DIKHAO ═══
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
      // Note: Ye banner CSS ki wajah se sirf mobile par hi dikhega. Desktop par automatic chhup jayega.
      studyView.insertBefore(banner, hero);
    }
    return true;
  }

  function boot() {
    injectCSS();
    injectBanner();
    console.log('[banner] ✅ loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1000));
  } else {
    setTimeout(boot, 1000);
  }

  // View change hone par dobara check karo
  let retries = 0;
  const interval = setInterval(() => {
    retries++;
    if (injectBanner() || retries > 30) clearInterval(interval);
  }, 500);

  // Jab user install kar le, toh turant banner change karo
  window.addEventListener('appinstalled', () => {
    const installBanner = document.getElementById('installAppBanner');
    if (installBanner) {
      installBanner.remove();
      injectBanner(); // Ye experience banner inject kar dega (mobile par dikhega)
    }
  });
})();
