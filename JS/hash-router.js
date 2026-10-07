/* ═══════════════════════════════════════════════════════
   UNIVERSAL HASH ROUTING + PREMIUM GRACE PERIOD
   Free users ke liye disabled — blank screen prevent
   File: JS/hash-router.js
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'last_active_view';
  const DEBUG = true;
  const GRACE_PERIOD_MS = 3000;

  // Premium views jo free users ke liye block hain
  const PREMIUM_VIEWS = ['analytics', 'partner', 'insights', 'premium'];

  function log(...args) {
    if (DEBUG) console.log('%c🔗 [HashRoute]', 'color:#8B5CF6;font-weight:700', ...args);
  }

  /* ═══════════════════════════════════════════════════════
     PREMIUM GRACE PERIOD — Page load ke 3 sec me modals block
     ═══════════════════════════════════════════════════════ */
  window.__appLoadTime = Date.now();

  function installPremiumGrace() {
    if (typeof window.openUpgradeModal === 'function' && !window.openUpgradeModal.__graced) {
      const origUpgrade = window.openUpgradeModal;
      const wrapped = function (...args) {
        const elapsed = Date.now() - window.__appLoadTime;
        if (elapsed < GRACE_PERIOD_MS) {
          log('🛑 Blocked premature openUpgradeModal');
          return;
        }
        return origUpgrade.apply(this, args);
      };
      wrapped.__graced = true;
      window.openUpgradeModal = wrapped;
    }

    ['showPremiumPrompt', 'openPremiumModal', 'showUpgradePrompt', 'openUpgrade'].forEach(function (fnName) {
      if (typeof window[fnName] === 'function' && !window[fnName].__graced) {
        const orig = window[fnName];
        const wrapped = function (...args) {
          const elapsed = Date.now() - window.__appLoadTime;
          if (elapsed < GRACE_PERIOD_MS) {
            log('🛑 Blocked premature ' + fnName);
            return;
          }
          return orig.apply(this, args);
        };
        wrapped.__graced = true;
        window[fnName] = wrapped;
      }
    });
  }

  installPremiumGrace();
  [100, 500, 1000, 2000].forEach(function (t) {
    setTimeout(installPremiumGrace, t);
  });

  /* ═══════════════════════════════════════════════════════
     STATE HELPERS
     ═══════════════════════════════════════════════════════ */
  function getAppState() {
    try {
      if (typeof getState === 'function') {
        const s = getState();
        if (s) return s;
      }
    } catch (e) {}
    return window.state || window.appState || null;
  }

  function isUserPremium(state) {
    if (!state) return null; // Unknown
    if (state.profile?.is_admin === true) return true;
    if (state.isPremium === true) return true;
    if (state.profile?.is_premium === true) return true;
    if (state.isTrial === true) return true;
    if (state.trialActive === true) return true;
    if (state.profile?.is_trial === true) return true;

    const trialEnd = state.trialEndsAt || state.trial_end_date || state.profile?.trial_end_date;
    if (trialEnd) {
      try {
        if (new Date(trialEnd) > new Date()) return true;
      } catch (e) {}
    }

    if (state.subscription?.status === 'active' || state.subscription?.status === 'trialing') return true;
    if (state.profile?.subscription_status === 'active' || state.profile?.subscription_status === 'trialing')
      return true;

    return false;
  }

  /* ═══════════════════════════════════════════════════════
     FORCE RESTORE — Direct DOM manipulation
     ═══════════════════════════════════════════════════════ */
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

      document.querySelectorAll('.nav-item').forEach(function (n) {
        n.classList.remove('active');
      });
      const nav = document.querySelector('.nav-item[data-view="' + viewName + '"]');
      if (nav) nav.classList.add('active');

      const content = document.getElementById('content');
      if (content) content.scrollTop = 0;

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
            break;
          } catch (e) {}
        }
      }
      log('✅ Force restored:', viewName);
      return true;
    } catch (e) {
      log('❌ Force restore error:', e.message);
      return false;
    }
  }

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
     VIEW RESTORE — Main logic
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
    const maxAttempts = 60;

    const tryRestore = setInterval(function () {
      attempts++;

      // ⚡ State load hone ka wait
      const state = getAppState();
      if (!state || !state.user) {
        if (attempts % 5 === 0) log('⏳ Waiting for user... attempt ' + attempts);
        if (attempts > maxAttempts) clearInterval(tryRestore);
        return;
      }

      // ⚡ Premium info load hone ka wait
      if (state.isPremium === undefined && state.profile === undefined && attempts < 30) {
        if (attempts % 5 === 0) log('⏳ Waiting for premium info... attempt ' + attempts);
        return;
      }

      // ⚡ PREMIUM CHECK: Free user ko premium views me mat bhejo
      if (PREMIUM_VIEWS.indexOf(targetView) !== -1) {
        const premium = isUserPremium(state);
        if (premium === false) {
          log('🔒 Free user — premium view blocked:', targetView);
          // Hash clear karo aur Study pe wapas
          history.replaceState(null, '', '#study');
          try {
            localStorage.setItem(STORAGE_KEY, 'study');
          } catch (e) {}

          // Study view pe switch karo (agar already nahi hai)
          const studyNav = document.querySelector('.nav-item[data-view="study"]');
          if (studyNav && !studyNav.classList.contains('active')) {
            studyNav.click();
          }
          clearInterval(tryRestore);
          return;
        }
      }

      // ⚡ Nav item dhundo
      const navItem = document.querySelector('.nav-item[data-view="' + targetView + '"]');
      if (!navItem) {
        if (attempts > maxAttempts) clearInterval(tryRestore);
        return;
      }

      // Already active?
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

        // Content check — premium block se blank toh nahi hua
        const content = document.getElementById('content');
        const contentEmpty = !content || content.innerHTML.trim().length < 50;

        if (isActive && viewActive && !contentEmpty) {
          log('✅ Restored view:', targetView);
          return;
        }

        if (contentEmpty) {
          // Premium block ya koi aur issue — Study pe wapas
          log('⚠️ Content empty — falling back to Study');
          history.replaceState(null, '', '#study');
          try {
            localStorage.setItem(STORAGE_KEY, 'study');
          } catch (e) {}
          const studyNav = document.querySelector('.nav-item[data-view="study"]');
          if (studyNav) studyNav.click();
          return;
        }

        // Retry
        log('⚠️ Retry click...');
        navItem.click();

        setTimeout(function () {
          const isActive2 = navItem.classList.contains('active');
          const viewActive2 = viewEl && viewEl.classList.contains('active');
          const content2 = document.getElementById('content');
          const contentEmpty2 = !content2 || content2.innerHTML.trim().length < 50;

          if (isActive2 && viewActive2 && !contentEmpty2) {
            log('✅ Restored on retry:', targetView);
            return;
          }

          if (contentEmpty2) {
            log('⚠️ Still empty — falling back to Study');
            history.replaceState(null, '', '#study');
            try {
              localStorage.setItem(STORAGE_KEY, 'study');
            } catch (e) {}
            const studyNav = document.querySelector('.nav-item[data-view="study"]');
            if (studyNav) studyNav.click();
            return;
          }

          // Force restore
          log('🚨 Force restoring via DOM:', targetView);
          forceRestoreView(targetView);
        }, 600);
      }, 500);

      clearInterval(tryRestore);
    }, 250);
  }

  /* ═══════════════════════════════════════════════════════
     HASH CHANGE (back/forward buttons)
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
        log('Nav items ready (' + navItems.length + ')');
        attachNavListeners();
        clearInterval(waitForNav);

        setTimeout(restoreLastView, 1500);
        setInterval(attachNavListeners, 2000);
      }

      if (attempts > maxAttempts) {
        log('⚠️ Nav items never appeared');
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
