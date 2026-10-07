/* ═══════════════════════════════════════════════════════
   UNIVERSAL HASH ROUTING — SIMPLE VERSION
   No premium check, no blocking — direct view restore
   File: JS/hash-router.js
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'last_active_view';
  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log('%c🔗 [HashRoute]', 'color:#8B5CF6;font-weight:700', ...args);
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
      });
    });
  }

  /* ═══════ DIRECT VIEW RESTORE — Bypass all checks ═══════ */
  function restoreViewDirectly(viewName) {
    try {
      log('🎯 Force restoring:', viewName);

      // 1. Saare views hide karo
      document.querySelectorAll('.view').forEach(function (v) {
        v.classList.remove('active');
      });

      // 2. Target view show karo
      const viewEl = document.getElementById('view-' + viewName);
      if (viewEl) {
        viewEl.classList.add('active');
      } else {
        log('❌ View element not found:', 'view-' + viewName);
        return false;
      }

      // 3. Nav active state update karo
      document.querySelectorAll('.nav-item').forEach(function (n) {
        n.classList.remove('active');
      });
      const nav = document.querySelector('.nav-item[data-view="' + viewName + '"]');
      if (nav) nav.classList.add('active');

      // 4. Content top pe scroll
      const content = document.getElementById('content');
      if (content) content.scrollTop = 0;

      // 5. Lazy loaders trigger karo
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
            log('✅ Loader:', fns[i]);
            break;
          } catch (e) {}
        }
      }

      // 6. Partner view special case
      if (viewName === 'partner' && window.__partner && window.__partner.open) {
        try {
          window.__partner.open();
          log('✅ Partner view opened');
        } catch (e) {}
      }

      log('✅ Restored:', viewName);
      return true;
    } catch (e) {
      log('❌ Error:', e.message);
      return false;
    }
  }

  /* ═══════ RESTORE ON LOAD ═══════ */
  function restoreLastView() {
    let targetView = location.hash.replace('#', '');
    if (!targetView) {
      try {
        targetView = localStorage.getItem(STORAGE_KEY);
      } catch (e) {}
    }
    if (!targetView || targetView === 'study') {
      log('No view to restore');
      return;
    }

    log('Will restore:', targetView);

    // 1.5 sec wait karo state load hone ke liye, phir DIRECT restore
    setTimeout(function () {
      // Pehle nav click try karo (best case)
      const navItem = document.querySelector('.nav-item[data-view="' + targetView + '"]');
      if (navItem && !navItem.classList.contains('active')) {
        log('👆 Trying nav click...');
        navItem.click();
      }

      // 300ms baad verify — agar active nahi hua toh FORCE
      setTimeout(function () {
        const navActive = navItem && navItem.classList.contains('active');
        const viewEl = document.getElementById('view-' + targetView);
        const viewActive = viewEl && viewEl.classList.contains('active');

        if (navActive && viewActive) {
          log('✅ Nav click worked');
          return;
        }

        // FORCE restore — koi premium check nahi
        log('🚨 Forcing view directly');
        restoreViewDirectly(targetView);
      }, 300);
    }, 1500);
  }

  /* ═══════ HASH CHANGE ═══════ */
  window.addEventListener('hashchange', function () {
    const view = location.hash.replace('#', '');
    if (!view) return;
    const navItem = document.querySelector('.nav-item[data-view="' + view + '"]');
    if (navItem) navItem.click();
  });

  /* ═══════ BOOT ═══════ */
  function boot() {
    let attempts = 0;
    const waitForNav = setInterval(function () {
      attempts++;
      const navItems = document.querySelectorAll('.nav-item[data-view]');

      if (navItems.length >= 3) {
        log('Nav ready (' + navItems.length + ')');
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

  log('✅ Simple hash router loaded');
})();
