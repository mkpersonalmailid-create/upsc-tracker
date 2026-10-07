/* ═══════════════════════════════════════════════════════
   UNIVERSAL HASH ROUTING + PREMIUM GRACE PERIOD
   File: JS/hash-router.js
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'last_active_view';
  const DEBUG = true;
  const GRACE_PERIOD_MS = 3000;

  function log(...args) {
    if (DEBUG) console.log('%c🔗 [HashRoute]', 'color:#8B5CF6;font-weight:700', ...args);
  }

  /* ═══════════════════════════════════════════════════════
     GLOBAL PREMIUM GRACE PERIOD
     ═══════════════════════════════════════════════════════ */
  window.__appLoadTime = Date.now();

  function installPremiumGrace() {
    if (typeof window.openUpgradeModal === 'function' && !window.openUpgradeModal.__graced) {
      const origUpgrade = window.openUpgradeModal;
      const wrapped = function (...args) {
        const elapsed = Date.now() - window.__appLoadTime;
        if (elapsed < GRACE_PERIOD_MS) {
          log('🛑 Blocked premature openUpgradeModal (' + elapsed + 'ms)');
          return;
        }
        return origUpgrade.apply(this, args);
      };
      wrapped.__graced = true;
      window.openUpgradeModal = wrapped;
      log('✅ openUpgradeModal protected');
    }

    ['showPremiumPrompt', 'openPremiumModal', 'showUpgradePrompt', 'openUpgrade'].forEach(function (fnName) {
      if (typeof window[fnName] === 'function' && !window[fnName].__graced) {
        const orig = window[fnName];
        const wrapped = function (...args) {
          const elapsed = Date.now() - window.__appLoadTime;
          if (elapsed < GRACE_PERIOD_MS) {
            log('🛑 Blocked premature ' + fnName + ' (' + elapsed + 'ms)');
            return;
          }
          return orig.apply(this, args);
        };
        wrapped.__graced = true;
        window[fnName] = wrapped;
        log('✅ ' + fnName + ' protected');
      }
    });
  }

  installPremiumGrace();
  setTimeout(installPremiumGrace, 100);
  setTimeout(installPremiumGrace, 500);
  setTimeout(installPremiumGrace, 1000);
  setTimeout(installPremiumGrace, 2000);

  /* ═══════════════════════════════════════════════════════
     NAV ITEM CLICK TRACKING
     ═══════════════════════════════════════════════════════ */
  function attachNavListeners() {
    document.querySelectorAll('.nav-item[data-view]').forEach(function (item) {
      if (item.dataset.hashBound === 'true') return;
      item.dataset.hashBound = 'true';

      item.addEventListener('click', function () {
        const view = item.dataset.view;
        if (!view) return;
        history.replaceState(null, '', '#' + view);
        try {
          localStorage.setItem(STORAGE_KEY, view);
        } catch (e) {}
        log('Saved view:', view);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     VIEW RESTORE — Refresh ke baad same view pe wapas
     ═══════════════════════════════════════════════════════ */
  function restoreLastView() {
    let targetView = location.hash.replace('#', '');
    if (!targetView) {
      try {
        targetView = localStorage.getItem(STORAGE_KEY);
      } catch (e) {}
    }
    if (!targetView || targetView === 'study') {
      log('No view to restore (target:', targetView, ')');
      return;
    }

    log('Trying to restore:', targetView);

    let attempts = 0;
    const maxAttempts = 50;

    const tryRestore = setInterval(function () {
      attempts++;

      // Step 1: State wait
      let state = null;
      try {
        if (typeof getState === 'function') state = getState();
        if (!state) state = window.state || window.appState;
      } catch (e) {}

      if (!state || !state.user) {
        if (attempts % 5 === 0) log('⏳ Waiting for user... attempt ' + attempts);
        if (attempts > maxAttempts) clearInterval(tryRestore);
        return;
      }

      // Step 2: Premium info wait
      if (state.isPremium === undefined && state.profile === undefined && attempts < 25) {
        if (attempts % 5 === 0) log('⏳ Waiting for premium info... attempt ' + attempts);
        return;
      }

      // Step 3: Nav item dhundo aur click karo
      const navItem = document.querySelector('.nav-item[data-view="' + targetView + '"]');
      if (navItem) {
        // Pehle se active hai?
        if (navItem.classList.contains('active')) {
          log('✅ View already active:', targetView);
          clearInterval(tryRestore);
          return;
        }

        log('👆 Clicking nav item:', targetView);
        navItem.click();

        // 400ms baad verify
        setTimeout(function () {
          const stillNotActive = !navItem.classList.contains('active');
          const viewEl = document.getElementById('view-' + targetView);
          const viewNotActive = viewEl && !viewEl.classList.contains('active');

          if (stillNotActive || viewNotActive) {
            log("⚠️ View didn't switch, retrying click:", targetView);
            navItem.click();

            // Ek aur retry
            setTimeout(function () {
              log('🔄 Second retry for:', targetView);
              navItem.click();
              setTimeout(function () {
                if (navItem.classList.contains('active')) {
                  log('✅ Restored view successfully:', targetView);
                } else {
                  log('❌ Failed to restore view:', targetView);
                }
              }, 400);
            }, 500);
          } else {
            log('✅ Restored view successfully:', targetView);
          }
        }, 400);

        clearInterval(tryRestore);
        return;
      }

      // Step 4: Fallback
      if (typeof window.switchView === 'function') {
        try {
          window.switchView(targetView);
          log('✅ Switched via switchView:', targetView);
          clearInterval(tryRestore);
          return;
        } catch (e) {
          log('switchView error:', e.message);
        }
      }

      if (attempts > maxAttempts) {
        log('⚠️ Could not restore view:', targetView);
        clearInterval(tryRestore);
      }
    }, 200);
  }

  /* ═══════════════════════════════════════════════════════
     BROWSER BACK/FORWARD BUTTONS
     ═══════════════════════════════════════════════════════ */
  window.addEventListener('hashchange', function () {
    const view = location.hash.replace('#', '');
    if (!view) return;
    const navItem = document.querySelector('.nav-item[data-view="' + view + '"]');
    if (navItem) {
      log('Hash changed → clicking nav:', view);
      navItem.click();
    }
  });

  /* ═══════════════════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════════════════ */
  function boot() {
    let attempts = 0;
    const maxAttempts = 60;

    const waitForNav = setInterval(function () {
      attempts++;
      const navItems = document.querySelectorAll('.nav-item[data-view]');

      if (navItems.length >= 3) {
        log('Nav items detected (' + navItems.length + '), attaching listeners');
        attachNavListeners();
        clearInterval(waitForNav);

        setTimeout(restoreLastView, 500);
        setInterval(attachNavListeners, 2000);
      }

      if (attempts > maxAttempts) {
        log('⚠️ Nav items never appeared, giving up');
        clearInterval(waitForNav);
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  log('✅ Universal hash routing loaded');
})();
