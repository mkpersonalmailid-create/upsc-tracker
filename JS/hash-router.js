/* ═══════════════════════════════════════════════════════
   UNIVERSAL HASH ROUTING — FINAL VERSION
   Har user (free, trial, admin, premium) ke liye kaam karega
   Direct DOM manipulation — no premium check, no nav click
   File: JS/hash-router.js
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'upsc_last_view';
  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log('%c🔗 [HashRoute]', 'color:#8B5CF6;font-weight:700', ...args);
  }

  /* ═══════════════════════════════════════════════════════
     STEP 1: NAV CLICK SE PEHLE SAVE KARO
     ═══════════════════════════════════════════════════════ */
  function attachNavListeners() {
    document.querySelectorAll('.nav-item[data-view]').forEach(function (item) {
      if (item.dataset.hashBound === 'true') return;
      item.dataset.hashBound = 'true';

      item.addEventListener(
        'click',
        function () {
          const view = item.dataset.view;
          if (!view) return;
          history.replaceState(null, '', '#' + view);
          try {
            localStorage.setItem(STORAGE_KEY, view);
          } catch (e) {}
          log('💾 Saved:', view);
        },
        true,
      ); // capture phase — BEFORE other handlers
    });
  }

  /* ═══════════════════════════════════════════════════════
     STEP 2: VIEW RESTORE — DIRECT DOM MANIPULATION
     Koi nav click nahi, koi premium check nahi
     ═══════════════════════════════════════════════════════ */
  function activateView(viewName) {
    log('🎯 Activating view:', viewName);

    // 1. Saare views hide karo
    document.querySelectorAll('.view').forEach(function (v) {
      v.classList.remove('active');
    });

    // 2. Target view show karo
    const viewEl = document.getElementById('view-' + viewName);
    if (!viewEl) {
      log('❌ View element not found:', 'view-' + viewName);
      return false;
    }
    viewEl.classList.add('active');
    log('✅ View activated in DOM');

    // 3. Nav active state update karo
    document.querySelectorAll('.nav-item').forEach(function (n) {
      n.classList.remove('active');
    });
    const navEl = document.querySelector('.nav-item[data-view="' + viewName + '"]');
    if (navEl) {
      navEl.classList.add('active');
      log('✅ Nav highlighted');
    }

    // 4. Scroll to top
    const content = document.getElementById('content');
    if (content) content.scrollTop = 0;

    // 5. Trigger lazy loaders
    const loaders = {
      analytics: ['loadAnalytics', 'loadAnalyticsV2', 'renderAnalytics', 'initAnalytics', 'initAnalyticsV2'],
      insights: ['loadInsights', 'renderInsights', 'initInsights'],
      partner: ['openPartnerView', 'renderPartnerView', 'initPartner'],
      calendar: ['loadCalendar', 'renderCalendar', 'initCalendar'],
      history: ['loadHistory', 'renderHistory', 'initHistory'],
      syllabus: ['loadSyllabus', 'renderSyllabus', 'initSyllabus'],
      subjects: ['loadSubjects', 'renderSubjects', 'initSubjects'],
      revision: ['loadRevision', 'renderRevision', 'initRevision'],
      goals: ['loadGoals', 'renderGoals', 'initGoals'],
      planner: ['loadPlanner', 'renderPlanner', 'initPlanner'],
      notes: ['loadNotes', 'renderNotes', 'initNotes'],
      tests: ['loadTests', 'renderTests', 'initTests'],
      premium: ['loadPremium', 'renderPremium', 'initPremium'],
      dashboard: ['loadDashboard', 'renderDashboard', 'initDashboard'],
    };

    const fns = loaders[viewName] || [];
    for (let i = 0; i < fns.length; i++) {
      if (typeof window[fns[i]] === 'function') {
        try {
          window[fns[i]]();
          log('⚡ Loader called:', fns[i]);
          break;
        } catch (e) {
          log('⚠️ Loader error:', fns[i], e.message);
        }
      }
    }

    // 6. Partner view special handling
    if (viewName === 'partner' && window.__partner && typeof window.__partner.open === 'function') {
      try {
        window.__partner.open();
        log('✅ Partner view opened via __partner');
      } catch (e) {}
    }

    log('🎉 View fully activated:', viewName);
    return true;
  }

  /* ═══════════════════════════════════════════════════════
     STEP 3: WAIT FOR STATE + VIEWS, THEN ACTIVATE
     ═══════════════════════════════════════════════════════ */
  function restoreLastView() {
    // Priority: URL hash > localStorage
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

    log('🔄 Will restore:', targetView);

    let attempts = 0;
    const maxAttempts = 80; // 16 seconds max (80 * 200ms)

    const waitAndRestore = setInterval(function () {
      attempts++;

      // 1. State check
      let state = null;
      try {
        if (typeof getState === 'function') state = getState();
        if (!state) state = window.state || window.appState;
      } catch (e) {}

      // 2. View element check
      const viewEl = document.getElementById('view-' + targetView);
      const navEl = document.querySelector('.nav-item[data-view="' + targetView + '"]');

      // 3. State + view + nav — sab ready hone chahiye
      const stateReady = state && state.user;
      const viewReady = !!viewEl;
      const navReady = !!navEl;

      if (!stateReady || !viewReady || !navReady) {
        if (attempts % 5 === 0) {
          log(
            '⏳ Waiting... attempt ' +
              attempts +
              ' (state:' +
              !!stateReady +
              ' view:' +
              viewReady +
              ' nav:' +
              navReady +
              ')',
          );
        }
        if (attempts > maxAttempts) {
          log('❌ Timeout — giving up');
          clearInterval(waitAndRestore);
        }
        return;
      }

      // Sab ready — ab activate karo
      clearInterval(waitAndRestore);

      // Chhota sa delay taaki sab handlers ready ho jayein
      setTimeout(function () {
        const success = activateView(targetView);
        if (success) {
          log('🎯 SUCCESS: ' + targetView);
        } else {
          log('❌ FAILED to activate: ' + targetView);
        }
      }, 300);
    }, 200);
  }

  /* ═══════════════════════════════════════════════════════
     STEP 4: BROWSER BACK/FORWARD
     ═══════════════════════════════════════════════════════ */
  window.addEventListener('hashchange', function () {
    const view = location.hash.replace('#', '');
    if (!view || view === 'study') return;

    // Direct activate karo
    setTimeout(function () {
      activateView(view);
    }, 100);
  });

  /* ═══════════════════════════════════════════════════════
     STEP 5: BOOT
     ═══════════════════════════════════════════════════════ */
  function boot() {
    let attempts = 0;
    const maxAttempts = 60;

    const waitForNav = setInterval(function () {
      attempts++;
      const navItems = document.querySelectorAll('.nav-item[data-view]');

      if (navItems.length >= 3) {
        log('📋 Nav items ready (' + navItems.length + ')');
        attachNavListeners();
        clearInterval(waitForNav);

        // View restore 800ms baad start karo
        setTimeout(restoreLastView, 800);

        // Naye nav items ke liye re-scan
        setInterval(attachNavListeners, 2000);
      }

      if (attempts > maxAttempts) {
        log('❌ Nav never appeared');
        clearInterval(waitForNav);
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  log('✅ FINAL hash router loaded');
})();
