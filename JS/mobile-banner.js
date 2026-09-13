/* ═══════════════════════════════════════════════════════════════
   MOBILE EXPERIENCE BANNER
   ---------------------------------------------------------------
   Sirf mobile (<= 700px) pe dikhta hai, "Good afternoon" hero ke upar.
   Text/banner change karna ho toh neeche BANNER_HTML edit kar.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     CONFIG — Yahan se text / icon change kar sakte ho
     ═══════════════════════════════════════════════════ */
  const BANNER_ICON = '💻';
  const BANNER_TITLE = 'Best experience on laptop or desktop';
  const BANNER_DESC = 'Access all features and detailed analytics easily on a bigger screen.';

  /* ═══════════════════════════════════════════════════
     CSS — Banner ki styling
     ═══════════════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById('mobileBannerCSS')) return;
    const style = document.createElement('style');
    style.id = 'mobileBannerCSS';
    style.textContent = `
      .mobile-tip-banner { display: none; }

      @media (max-width: 700px) {
        .mobile-tip-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          margin-bottom: 14px;
          background: linear-gradient(
            135deg,
            rgba(251, 191, 36, 0.12),
            rgba(168, 85, 247, 0.08)
          );
          border: 1px solid rgba(251, 191, 36, 0.35);
          border-radius: 14px;
          animation: fadeIn 0.4s;
        }
        .mobile-tip-icon {
          font-size: 1.6rem;
          flex-shrink: 0;
          animation: float 3s ease-in-out infinite;
        }
        .mobile-tip-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .mobile-tip-text strong {
          font-size: 0.85rem;
          font-weight: 800;
          color: #fbbf24;
          line-height: 1.3;
        }
        .mobile-tip-text span {
          font-size: 0.74rem;
          color: var(--text-2);
          line-height: 1.4;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════
     HTML INJECT — Banner ko hero section ke upar daalo
     ═══════════════════════════════════════════════════ */
  function injectBanner() {
    // Already injected? Skip.
    if (document.getElementById('mobileTipBanner')) return false;

    // Study view aur hero dhundo
    const studyView = document.getElementById('view-study');
    if (!studyView) return false;

    const hero = studyView.querySelector('.hero');
    if (!hero) return false;

    const banner = document.createElement('div');
    banner.className = 'mobile-tip-banner';
    banner.id = 'mobileTipBanner';
    banner.innerHTML = `
      <span class="mobile-tip-icon">${BANNER_ICON}</span>
      <div class="mobile-tip-text">
        <strong>${BANNER_TITLE}</strong>
        <span>${BANNER_DESC}</span>
      </div>
    `;

    studyView.insertBefore(banner, hero);
    return true;
  }

  /* ═══════════════════════════════════════════════════
     BOOT — App ready hone par chalao
     ═══════════════════════════════════════════════════ */
  function boot() {
    injectCSS();
    injectBanner();
    console.log('[mobile-banner] ✅ loaded');
  }

  // DOM ready check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1000));
  } else {
    setTimeout(boot, 1000);
  }

  // Re-inject on view switch (agar switchView se view change ho)
  let retries = 0;
  const interval = setInterval(() => {
    retries++;
    if (injectBanner() || retries > 30) clearInterval(interval);
  }, 500);
})();
