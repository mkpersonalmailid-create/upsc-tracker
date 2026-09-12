/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Subjects Extras (Phase 1) — v3 BULLETPROOF
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[subjects-extras] v3 loaded');

  const CAT_MAP = {};
  let patched = false;

  /* ═══════════ WAIT FOR APP ═══════════ */
  let attempts = 0;

  function appReady() {
    try {
      return (
        typeof getSubjectsForCategory === 'function' &&
        typeof openModal === 'function' &&
        typeof state === 'object' &&
        state !== null
      );
    } catch (e) {
      return false;
    }
  }

  function waitThenStart() {
    if (appReady()) {
      start();
      return;
    }
    attempts++;
    if (attempts > 200) {
      console.error('[subjects-extras] Timeout waiting for app');
      return;
    }
    setTimeout(waitThenStart, 50);
  }

  function start() {
    console.log('[subjects-extras] app ready — patching');

    // Patch 1: getSubjectsForCategory
    patchGetSubjects();

    // Patch 2: Add Subject Button — MULTIPLE METHODS
    patchAddSubjectButton();

    // Load user's custom categories from DB
    pollForUser();

    if (supa && supa.auth && supa.auth.onAuthStateChange) {
      supa.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) setTimeout(loadCustomCategories, 1000);
      });
    }

    console.log('[subjects-extras] ✅ patched');
  }

  /* ═══════════ PATCH 1: getSubjectsForCategory ═══════════ */
  function patchGetSubjects() {
    if (patched) return;
    patched = true;

    const _orig = getSubjectsForCategory;

    window.getSubjectsForCategory = function (cat) {
      const base = (_orig.call(this, cat) || []).slice();
      if (!cat) return base;

      const custom = Object.entries(CAT_MAP)
        .filter(([_, c]) => c === cat)
        .map(([n]) => n);

      return [...new Set([...base, ...custom])];
    };

    // Also try direct assignment (in case window is different scope)
    try {
      getSubjectsForCategory = window.getSubjectsForCategory;
    } catch (e) {}

    console.log('[subjects-extras] patched: getSubjectsForCategory');
  }

  /* ═══════════ PATCH 2: Add Subject Button ═══════════ */
  function patchAddSubjectButton() {
    const oldBtn = document.getElementById('addSubjectBtn');

    if (!oldBtn) {
      setTimeout(patchAddSubjectButton, 300);
      return;
    }

    // METHOD A: Clone to remove ALL existing listeners
    try {
      const newBtn = oldBtn.cloneNode(true);
      newBtn.onclick = null; // Clear cloned onclick
      oldBtn.parentNode.replaceChild(newBtn, oldBtn);
      newBtn.onclick = openNewSubjectModal;
      console.log('[subjects-extras] patched: addSubjectBtn (clone)');
    } catch (e) {
      console.warn('[subjects-extras] clone failed:', e);
    }

    // METHOD B: Capture-phase listener (bulletproof backup)
    document.addEventListener(
      'click',
      function (e) {
        const btn = e.target.closest && e.target.closest('#addSubjectBtn');
        if (btn) {
          e.preventDefault();
          e.stopImmediatePropagation();
          openNewSubjectModal();
        }
      },
      true,
    ); // capture phase — runs BEFORE any onclick

    console.log('[subjects-extras] patched: addSubjectBtn (capture listener)');
  }

  /* ═══════════ NEW SUBJECT MODAL ═══════════ */
  function openNewSubjectModal() {
    // Prevent double-open
    if (document.querySelector('#modalRoot.active')) return;

    const COLORS = ['#A855F7', '#EC4899', '#F97316', '#FBBF24', '#14B8A6', '#10B981', '#6366F1', '#EF4444'];
    const CATS = [
      { id: 'prelims', label: '🎯 GS Prelims' },
      { id: 'mains', label: '📚 GS Mains' },
      { id: 'optional', label: '⭐ Optional' },
      { id: 'essay', label: '✍️ Essay' },
      { id: 'csat', label: '🧮 CSAT' },
    ];

    const body = `
      <div class="field">
        <label>Subject Name</label>
        <input type="text" id="newSubjName" placeholder="e.g. Answer Writing Practice" maxlength="60" autocomplete="off">
      </div>
      <div class="field">
        <label>Category</label>
        <select id="newSubjCategory">
          ${CATS.map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}
        </select>
        <div style="font-size:.72rem;color:var(--text-3);margin-top:6px">
          Ye subject is category ke selector me dikhega (Study page, Manual Log, Pomodoro).
        </div>
      </div>
      <div class="field">
        <label>Color</label>
        <div id="newSubjColors" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
          ${COLORS.map(
            (c, i) =>
              `<button type="button" class="color-swatch" data-color="${c}" 
                style="width:36px;height:36px;border-radius:50%;background:${c};
                border:3px solid ${i === 0 ? 'var(--text)' : 'transparent'};cursor:pointer"></button>`,
          ).join('')}
        </div>
      </div>`;

    openModal(
      modalShell({
        title: '✨ New Custom Subject',
        subtitle: 'Category choose karo taaki selectors me dikhe',
        body,
        actions: `<button class="btn btn-secondary" data-close>Cancel</button>
          <button class="btn btn-primary" id="saveNewSubj">Create Subject</button>`,
      }),
      {
        onMount() {
          let selectedColor = COLORS[0];

          const colorsDiv = document.getElementById('newSubjColors');
          if (colorsDiv) {
            colorsDiv.querySelectorAll('.color-swatch').forEach((sw) => {
              sw.onclick = () => {
                selectedColor = sw.dataset.color;
                colorsDiv.querySelectorAll('.color-swatch').forEach((b) => {
                  b.style.borderColor = b.dataset.color === selectedColor ? 'var(--text)' : 'transparent';
                });
              };
            });
          }

          setTimeout(() => {
            const inp = document.getElementById('newSubjName');
            if (inp) inp.focus();
          }, 100);

          document.getElementById('saveNewSubj').onclick = async () => {
            const name = document.getElementById('newSubjName').value.trim();
            const category = document.getElementById('newSubjCategory').value;

            if (!name || name.length < 2) {
              toast('Enter a name (2+ chars)', 'err');
              return;
            }
            if (state.subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
              toast('Subject already exists', 'err');
              return;
            }

            const subj = { id: uuid(), name, color: selectedColor, category, archived: false };
            state.subjects.push(subj);
            CAT_MAP[name] = category;

            if (supa && state.user) {
              try {
                await supa.from('subjects').insert({
                  id: subj.id,
                  user_id: state.user.id,
                  name: subj.name,
                  color: subj.color,
                  category: subj.category,
                  archived: false,
                });
              } catch (e) {
                console.warn('[subjects-extras] insert error:', e);
                toast('Cloud save failed — check console', 'warn', 4000);
              }
            }

            closeModal();
            toast(`✅ "${name}" created`, 'ok');
            if (state.view === 'subjects' && typeof renderSubjects === 'function') {
              renderSubjects();
            }
          };
        },
      },
    );
  }

  /* ═══════════ LOAD CATEGORIES FROM DB ═══════════ */
  function pollForUser() {
    if (state.user) {
      loadCustomCategories();
      return;
    }
    setTimeout(pollForUser, 500);
  }

  async function loadCustomCategories() {
    if (!supa || !state.user) return;

    try {
      const { data, error } = await supa.from('subjects').select('name, category').eq('user_id', state.user.id);

      if (error) {
        console.warn('[subjects-extras] DB error:', error.message);
        return;
      }

      if (data?.length) {
        data.forEach((s) => {
          if (s.category) CAT_MAP[s.name] = s.category;
        });
      }
      console.log('[subjects-extras] loaded categories for', Object.keys(CAT_MAP).length, 'subjects');
    } catch (e) {
      console.warn('[subjects-extras] load error:', e);
    }
  }

  /* ═══════════ START ═══════════ */
  waitThenStart();
})();
