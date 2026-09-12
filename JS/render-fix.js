/* ═══════════════════════════════════════════════════════════════
   RENDER FIX v2 — Bulletproof chips rendering
   ─────────────────────────────────────────────────────────────
   ✅ MutationObserver on #categoryChips — reacts instantly when empty
   ✅ Faster interval (500ms instead of 2s)
   ✅ Multiple retry attempts on boot
   ✅ Handles view switches
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[render-fix] v2 loaded');

  var lastRenderAt = 0;
  var RENDER_THROTTLE = 150; // don't re-render more than once per 150ms

  function forceRenderStudy() {
    try {
      if (typeof state === 'undefined' || !state) return;
      if (state.view !== 'study') return;

      var now = Date.now();
      if (now - lastRenderAt < RENDER_THROTTLE) return;

      var chipsEl = document.getElementById('categoryChips');
      var subjEl = document.getElementById('subjectSelector');
      var topicEl = document.getElementById('topicSelect');

      if (!chipsEl) return;

      var chipsEmpty = chipsEl.children.length === 0;
      var subjectEmpty = subjEl && subjEl.children.length === 0;

      if (chipsEmpty || subjectEmpty) {
        lastRenderAt = now;
        console.log(
          '[render-fix] Re-rendering — chips:',
          chipsEl.children.length,
          '| subjects:',
          subjEl ? subjEl.children.length : 'n/a',
        );

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
      }
    } catch (e) {
      console.warn('[render-fix] error:', e);
    }
  }

  /* ═══ Observe #categoryChips — if it goes empty, immediately re-render ═══ */
  function watchChips() {
    var chipsEl = document.getElementById('categoryChips');
    if (!chipsEl) {
      setTimeout(watchChips, 200);
      return;
    }

    if (chipsEl._renderFixWatching) return;
    chipsEl._renderFixWatching = true;

    var obs = new MutationObserver(function () {
      if (chipsEl.children.length === 0) {
        // Only re-render if we're on study view
        if (typeof state !== 'undefined' && state && state.view === 'study') {
          setTimeout(forceRenderStudy, 30);
        }
      }
    });
    obs.observe(chipsEl, { childList: true, subtree: false });
    console.log('[render-fix] watching #categoryChips');
  }

  /* ═══ Wait for user login, then render at many delays ═══ */
  var waitUser = setInterval(function () {
    if (typeof state !== 'undefined' && state && state.user) {
      clearInterval(waitUser);

      /* Aggressive initial retries */
      [30, 80, 150, 300, 600, 1000, 1800, 3000, 5000, 8000].forEach(function (t) {
        setTimeout(forceRenderStudy, t);
      });

      /* Fast watcher — every 500ms */
      setInterval(function () {
        if (state.view === 'study') forceRenderStudy();
      }, 500);

      /* Watch the chips container */
      watchChips();
    }
  }, 200);

  /* ═══ Hook into view switches to study ═══ */
  var lastView = null;
  setInterval(function () {
    if (typeof state === 'undefined' || !state) return;
    if (state.view !== lastView) {
      lastView = state.view;
      if (state.view === 'study') {
        setTimeout(forceRenderStudy, 50);
        setTimeout(forceRenderStudy, 300);
        setTimeout(forceRenderStudy, 800);
        setTimeout(forceRenderStudy, 1500);
      }
    }
  }, 300);

  /* ═══ Also try watching immediately on load ═══ */
  setTimeout(watchChips, 500);
  setTimeout(watchChips, 2000);
})();
