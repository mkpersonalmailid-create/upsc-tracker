/* ═══════════════════════════════════════════════════════
   UNIVERSAL HASH ROUTING
   Refresh pe same view me raho
   File: JS/hash-router.js
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'last_active_view';
  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log('%c🔗 [HashRoute]', 'color:#8B5CF6;font-weight:700', ...args);
  }

  // 1. Nav item pe click hone pe hash + localStorage update karo
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

  // 2. Page load pe last view restore karo
  function restoreLastView() {
    let targetView = location.hash.replace('#', '');
    if (!targetView) {
      try {
        targetView = localStorage.getItem(STORAGE_KEY);
      } catch (e) {}
    }
    if (!targetView || targetView === 'study') return;

    log('Trying to restore:', targetView);

    let attempts = 0;
    const tryRestore = setInterval(function () {
      attempts++;

      const navItem = document.querySelector('.nav-item[data-view="' + targetView + '"]');
      if (navItem) {
        navItem.click();
        log('✅ Restored view:', targetView);
        clearInterval(tryRestore);
        return;
      }

      if (typeof window.switchView === 'function') {
        try {
          window.switchView(targetView);
          log('✅ Switched via switchView:', targetView);
          clearInterval(tryRestore);
          return;
        } catch (e) {}
      }

      if (attempts > 30) {
        log('⚠️ Could not restore:', targetView);
        clearInterval(tryRestore);
      }
    }, 100);
  }

  // 3. Browser back/forward buttons ke liye
  window.addEventListener('hashchange', function () {
    const view = location.hash.replace('#', '');
    if (!view) return;
    const navItem = document.querySelector('.nav-item[data-view="' + view + '"]');
    if (navItem) navItem.click();
  });

  // 4. Boot — wait karo jab tak nav items render ho jayein
  function boot() {
    let attempts = 0;
    const waitForNav = setInterval(function () {
      attempts++;
      const navItems = document.querySelectorAll('.nav-item[data-view]');

      if (navItems.length >= 3) {
        attachNavListeners();
        clearInterval(waitForNav);

        setTimeout(restoreLastView, 800);
        setInterval(attachNavListeners, 2000);
      }

      if (attempts > 60) clearInterval(waitForNav);
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  log('✅ Universal hash routing loaded');
})();
