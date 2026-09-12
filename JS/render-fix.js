/* ═══════════════════════════════════════════════════════════════
   RENDER FIX — Bulletproof chips rendering
   ─────────────────────────────────────────────────────────────
   Ensures categoryChips, subjectSelector, topicSelect are always
   rendered — regardless of timing/race conditions with patches
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[render-fix] loaded');

  function forceRenderStudy() {
    try {
      if (typeof state === 'undefined' || !state) return;
      if (state.view !== 'study') return;

      var chipsEl = document.getElementById('categoryChips');
      var subjEl = document.getElementById('subjectSelector');
      var topicEl = document.getElementById('topicSelect');

      if (!chipsEl) return;

      var count = chipsEl.children.length;
      if (count === 0) {
        console.log('[render-fix] Chips empty — forcing render');

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

  /* Wait for user login, then render at many delays */
  var waitUser = setInterval(function () {
    if (typeof state !== 'undefined' && state && state.user) {
      clearInterval(waitUser);

      /* Initial renders — many retries */
      [50, 150, 300, 600, 1000, 1800, 3000, 5000].forEach(function (t) {
        setTimeout(forceRenderStudy, t);
      });

      /* Continuous watcher — every 2 sec, ensure chips are never empty */
      setInterval(function () {
        if (state.view === 'study') forceRenderStudy();
      }, 2000);
    }
  }, 300);

  /* Hook into view switches to study */
  var lastView = null;
  setInterval(function () {
    if (typeof state === 'undefined' || !state) return;
    if (state.view !== lastView) {
      lastView = state.view;
      if (state.view === 'study') {
        setTimeout(forceRenderStudy, 100);
        setTimeout(forceRenderStudy, 500);
        setTimeout(forceRenderStudy, 1500);
      }
    }
  }, 400);
})();
