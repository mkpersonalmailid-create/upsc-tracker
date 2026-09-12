/* ═══════════════════════════════════════════════════════════════
   RENDER FIX v3 — Boot-aware bulletproof chips rendering
   ─────────────────────────────────────────────────────────────
   ✅ Waits for boot to COMPLETE before any render
   ✅ Prevents double-render (flicker) during boot
   ✅ MutationObserver for instant recovery if cleared later
   ✅ Slow polling fallback
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[render-fix] v3 loaded');

  var lastRenderAt = 0;
  var RENDER_THROTTLE = 1000;

  function forceRenderStudy() {
    try {
      if (typeof state === 'undefined' || !state) return;
      if (state.view !== 'study') return;

      var now = Date.now();
      if (now - lastRenderAt < RENDER_THROTTLE) return;

      var chipsEl = document.getElementById('categoryChips');
      if (!chipsEl) return;
      if (chipsEl.children.length > 0) return; /* already rendered */

      lastRenderAt = now;
      console.log('[render-fix] chips empty — rendering');

      try {
        if (typeof renderCategoryChips === 'function') renderCategoryChips();
      } catch (e) {
        console.warn('[render-fix] rcc err:', e);
      }

      try {
        if (typeof renderSubjectSelector === 'function') renderSubjectSelector();
      } catch (e) {
        console.warn('[render-fix] rss err:', e);
      }

      try {
        if (typeof renderTopicSelect === 'function') renderTopicSelect();
      } catch (e) {
        console.warn('[render-fix] rts err:', e);
      }
    } catch (e) {
      console.warn('[render-fix] error:', e);
    }
  }

  /* ═══ Watcher — fires instantly when chips are cleared ═══ */
  function watchChips() {
    var chipsEl = document.getElementById('categoryChips');
    if (!chipsEl) return setTimeout(watchChips, 300);
    if (chipsEl._renderFixWatching) return;
    chipsEl._renderFixWatching = true;

    var obs = new MutationObserver(function () {
      if (chipsEl.children.length === 0 && state && state.view === 'study') {
        /* Debounce 250ms — if still empty, render */
        setTimeout(function () {
          if (chipsEl.children.length === 0 && state.view === 'study') {
            forceRenderStudy();
          }
        }, 250);
      }
    });
    obs.observe(chipsEl, { childList: true, subtree: false });
    console.log('[render-fix] watching #categoryChips');
  }

  /* ═══ Wait for boot to COMPLETE, then start ═══ */
  function isBootComplete() {
    var loader = document.getElementById('appLoader');
    /* Loader present AND not active = boot finished */
    if (loader && !loader.classList.contains('active')) return true;
    /* Fallback: 12 sec max wait */
    if (Date.now() - (window._rfBootStart || 0) > 12000) return true;
    return false;
  }

  function waitForBoot() {
    var userReady = typeof state !== 'undefined' && state && state.user;

    if (userReady && isBootComplete()) {
      console.log('[render-fix] boot complete — starting watcher');

      /* Now safe to check — but boot already rendered chips, so this is a no-op */
      setTimeout(forceRenderStudy, 500);
      setTimeout(forceRenderStudy, 2000);

      /* Watch for accidental clears */
      watchChips();

      /* Slow fallback polling (every 2 sec) */
      setInterval(function () {
        if (state.view === 'study') forceRenderStudy();
      }, 2000);

      /* Re-watch on view switches to study */
      var lastView = null;
      setInterval(function () {
        if (typeof state === 'undefined' || !state) return;
        if (state.view !== lastView) {
          lastView = state.view;
          if (state.view === 'study') {
            setTimeout(forceRenderStudy, 400);
            setTimeout(watchChips, 400);
          }
        }
      }, 500);
    } else {
      setTimeout(waitForBoot, 250);
    }
  }

  /* Track boot start time for fallback */
  window._rfBootStart = Date.now();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(waitForBoot, 200);
    });
  } else {
    setTimeout(waitForBoot, 200);
  }
})();
