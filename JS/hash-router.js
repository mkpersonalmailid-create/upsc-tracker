/* ═══════════════════════════════════════════════════════
   UNIVERSAL HASH ROUTING + PREMIUM GRACE PERIOD
   Refresh pe same view me raho + premature modal block
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
     FLASH PREVENTION — Content ko initially hide karo
     taaki default (Study) view flash na dikhe
     ═══════════════════════════════════════════════════════ */
  (function hideContentInitially() {
    if (document.head) {
      const style = document.createElement('style');
      style.id = 'hash-route-hide';
      style.textContent = '#content { opacity: 0 !important; transition: opacity 0.12s ease-in; }';
      document.head.appendChild(style);
    } else {
      // Agar head abhi ready nahi, toh DOMContentLoaded pe add karo
      document.addEventListener('DOMContentLoaded', function () {
        const style = document.createElement('style');
        style.id = 'hash-route-hide';
        style.textContent = '#content { opacity: 0 !important; transition: opacity 0.12s ease-in; }';
        document.head.appendChild(style);
      });
    }

    // Safety: 4 second baad khud reveal karo
    setTimeout(function () {
      revealContent();
    }, 4000);
  })();

  function revealContent() {
    const el = document.getElementById('hash-route-hide');
    if (el) {
      el.remove();
      log('✅ Content revealed');
    }
  }

  /* ═══════════════════════════════════════════════════════
     PREMIUM GRACE PERIOD
     Page load ke pehle 3 sec me premium modals block karo
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
  [100, 500, 1000, 2000].forEach(function (t) {
    setTimeout(installPremiumGrace, t);
  });

  /* ═══════════════════════════════════════════════════════
     FORCE RESTORE — Direct DOM manipulation
     Jab nav click handler fail ho jaye (premium check block)
     ═══════════════════════════════════════════════════════ */
  function forceRestoreView(viewName) {
    try {
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
      log('✅ View activated via DOM:', viewName);

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

  /* ═══════════════════════════════════════════════════════
     NAV ITEM CLICK TRACKING
     Click pe URL hash + localStorage update
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
      revealContent();
      return;
    }

    log('Trying to restore:', targetView);

    let attempts = 0;
    const maxAttempts = 60;

    const tryRestore = setInterval(function () {
      attempts++;

      // Step 1: State load hone ka wait
      let state = null;
      try {
        if (typeof getState === 'function') state = getState();
        if (!state) state = window.state || window.appState;
      } catch (e) {}

      if (!state || !state.user) {
        if (attempts % 5 === 0) log('⏳ Waiting for user... attempt ' + attempts);
        if (attempts > maxAttempts) {
          revealContent();
          clearInterval(tryRestore);
        }
        return;
      }

      // Step 2: Premium info bhi wait
      if (state.isPremium === undefined && state.profile === undefined && attempts < 30) {
        if (attempts % 5 === 0) log('⏳ Waiting for premium info... attempt ' + attempts);
        return;
      }

      // Step 3: Nav item dhundo
      const navItem = document.querySelector('.nav-item[data-view="' + targetView + '"]');
      if (!navItem) {
        if (attempts > maxAttempts) {
          revealContent();
          clearInterval(tryRestore);
        }
        return;
      }

      // Already active?
      if (navItem.classList.contains('active')) {
        log('✅ Already active:', targetView);
        revealContent();
        clearInterval(tryRestore);
        return;
      }

      log('👆 Clicking nav:', targetView);
      navItem.click();

      // Step 4: Verify after 500ms
      setTimeout(function () {
        const isActive = navItem.classList.contains('active');
        const viewEl = document.getElementById('view-' + targetView);
        const viewActive = viewEl && viewEl.classList.contains('active');

        if (isActive && viewActive) {
          log('✅ Restored view:', targetView);
          revealContent();
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
            revealContent();
            return;
          }

          // Force restore
          log('🚨 Force restoring via DOM:', targetView);
          forceRestoreView(targetView);
          revealContent();
        }, 600);
      }, 500);

      clearInterval(tryRestore);
    }, 250);
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
     BOOT — Nav items render hone ka wait
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

        // 1.5s baad view restore karo (state load hone ke liye)
        setTimeout(restoreLastView, 1500);

        // Naye nav items ke liye periodic re-scan
        setInterval(attachNavListeners, 2000);
      }

      if (attempts > maxAttempts) {
        log('⚠️ Nav items never appeared, revealing content');
        revealContent();
        clearInterval(waitForNav);
      }
    }, 200);
  }

  /* ═══════════════════════════════════════════════════════
     START
     ═══════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  log('✅ Universal hash routing loaded');
})();
