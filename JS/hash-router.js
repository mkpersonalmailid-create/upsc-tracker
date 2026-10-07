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

  /* ═══════ PREMIUM GRACE PERIOD ═══════ */
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
  [100, 500, 1000, 2000].forEach(function (t) {
    setTimeout(installPremiumGrace, t);
  });

  /* ═══════ FORCE RESTORE — Direct DOM ═══════ */
  function forceRestoreView(viewName) {
    try {
      document.querySelectorAll('.view').forEach(function (v) {
        v.classList.remove('active');
      });

      const viewEl = document.getElementById('view-' + viewName);
      if (!viewEl) {
        log('❌ View element not found:', 'view-' + viewName);
        return false;
      }
      viewEl.classList.add('active');
      log('✅ View activated via DOM:', viewName);

      document.querySelectorAll('.nav-item').forEach(function (n) {
        n.classList.remove('active');
      });
      const nav = document.querySelector('.nav-item[data-view="' + viewName + '"]');
      if (nav) nav.classList.add('active');

      const content = document.getElementById('content');
      if (content) content.scrollTop = 0;

      // Lazy loaders
      const loaders = {
        analytics: ['loadAnalytics', 'loadAnalyticsV2', 'renderAnalytics'],
        insights: ['loadInsights', 'renderInsights'],
        partner: ['openPartnerView', 'renderPartnerView'],
        calendar: ['loadCalendar', 'renderCalendar'],
        history: ['loadHistory', 'renderHistory'],
        syllabus: ['loadSyllabus', 'renderSyllabus'],
        subjects: ['loadSubjects', 'renderSubjects'],
        revision: ['loadRevision', 'renderRevision'],
        goals: ['loadGoals', 'renderGoals'],
        planner: ['loadPlanner', 'renderPlanner'],
        notes: ['loadNotes', 'renderNotes'],
        tests: ['loadTests', 'renderTests'],
        premium: ['loadPremium', 'renderPremium'],
        dashboard: ['loadDashboard', 'renderDashboard'],
      };

      const fns = loaders[viewName] || [];
      for (let i = 0; i < fns.length; i++) {
        if (typeof window[fns[i]] === 'function') {
          try {
            window[fns[i]]();
            log('✅ Triggered loader:', fns[i]);
            break;
          } catch (e) {
            log('⚠️ Loader error:', fns[i], e.message);
          }
        }
      }
      return true;
    } catch (e) {
      log('❌ Force restore error:', e.message);
      return false;
    }
  }

  /* ═══════ NAV CLICK TRACKING ═══════ */
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

  /* ═══════ VIEW RESTORE ═══════ */
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
    const maxAttempts = 60;

    const tryRestore = setInterval(function () {
      attempts++;

      // Wait for state
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

      // Wait for premium info
      if (state.isPremium === undefined && state.profile === undefined && attempts < 30) {
        if (attempts % 5 === 0) log('⏳ Waiting for premium info... attempt ' + attempts);
        return;
      }

      // Click nav item
      const navItem = document.querySelector('.nav-item[data-view="' + targetView + '"]');
      if (!navItem) {
        if (attempts > maxAttempts) clearInterval(tryRestore);
        return;
      }

      if (navItem.classList.contains('active')) {
        log('✅ Already active:', targetView);
        clearInterval(tryRestore);
        return;
      }

      log('👆 Clicking nav:', targetView);
      navItem.click();

      // Verify after 500ms
      setTimeout(function () {
        const isActive = navItem.classList.contains('active');
        const viewEl = document.getElementById('view-' + targetView);
        const viewActive = viewEl && viewEl.classList.contains('active');

        if (isActive && viewActive) {
          log('✅ Restored view:', targetView);
          return;
        }

        // Retry once
        log('⚠️ First click failed, retrying...');
        navItem.click();

        setTimeout(function () {
          const isActive2 = navItem.classList.contains('active');
          const viewActive2 = viewEl && viewEl.classList.contains('active');
          if (isActive2 && viewActive2) {
            log('✅ Restored on retry:', targetView);
            return;
          }

          // FORCE RESTORE
          log('🚨 Force restoring via DOM:', targetView);
          forceRestoreView(targetView);
        }, 600);
      }, 500);

      clearInterval(tryRestore);
    }, 250);
  }

  /* ═══════ HASH CHANGE (back/forward) ═══════ */
  window.addEventListener('hashchange', function () {
    const view = location.hash.replace('#', '');
    if (!view) return;
    const navItem = document.querySelector('.nav-item[data-view="' + view + '"]');
    if (navItem) {
      log('Hash changed → clicking nav:', view);
      navItem.click();
    }
  });

  /* ═══════ BOOT ═══════ */
  function boot() {
    let attempts = 0;
    const waitForNav = setInterval(function () {
      attempts++;
      const navItems = document.querySelectorAll('.nav-item[data-view]');

      if (navItems.length >= 3) {
        log('Nav items ready (' + navItems.length + ')');
        attachNavListeners();
        clearInterval(waitForNav);

        setTimeout(restoreLastView, 1500);
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
