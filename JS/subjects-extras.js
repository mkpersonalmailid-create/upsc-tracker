/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Subjects Extras (Phase 1)
   - Custom subjects ko Study/Manual Log/Pomodoro me dikhata hai
   - Apni category mapping alag maintain karta hai
   Loaded AFTER inline script in app.html
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[subjects-extras] script loaded');

  /* ═══════════════════════════════════════════════════════════
     LOCAL MAP — subject name → category
     Ye DB se load hoga, aur DB me save bhi karega
     ═══════════════════════════════════════════════════════════ */
  const CAT_MAP = {};

  /* ═══════════════════════════════════════════════════════════
     WAIT for main app to be ready
     ═══════════════════════════════════════════════════════════ */
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
      console.error('[subjects-extras] Timed out — main app never became ready');
      return;
    }
    setTimeout(waitThenStart, 50);
  }

  function start() {
    console.log('[subjects-extras] main app ready — patching');
    patchGetSubjects();
    patchAddSubjectButton();
    wireLoginListener();
    console.log('[subjects-extras] ✅ patched');
  }

  /* ═══════════════════════════════════════════════════════════
     PATCH 1 — getSubjectsForCategory
     Custom subjects ko inject karo jinka category match kare
     ═══════════════════════════════════════════════════════════ */
  function patchGetSubjects() {
    const _orig = getSubjectsForCategory;

    getSubjectsForCategory = function (cat) {
      const base = (_orig.call(this, cat) || []).slice();
      if (!cat) return base;

      const custom = Object.entries(CAT_MAP)
        .filter(([_, c]) => c === cat)
        .map(([n]) => n);

      const result = [...new Set([...base, ...custom])];
      console.log('[subjects-extras] getSubjectsForCategory("' + cat + '") →', result.length, 'items');
      return result;
    };

    console.log('[subjects-extras] patched: getSubjectsForCategory');
  }

  /* ═══════════════════════════════════════════════════════════
     PATCH 2 — Add Subject button
     Modal with: Name + Category + Color
     ═══════════════════════════════════════════════════════════ */
  function patchAddSubjectButton() {
    const btn = document.getElementById('addSubjectBtn');
    if (!btn) {
      setTimeout(patchAddSubjectButton, 300);
      return;
    }

    btn.onclick = openNewSubjectModal;
    console.log('[subjects-extras] patched: addSubjectBtn');
  }

  function openNewSubjectModal() {
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

          document
            .getElementById('newSubjColors')
            .querySelectorAll('.color-swatch')
            .forEach((sw) => {
              sw.onclick = () => {
                selectedColor = sw.dataset.color;
                document
                  .getElementById('newSubjColors')
                  .querySelectorAll('.color-swatch')
                  .forEach((b) => {
                    b.style.borderColor = b.dataset.color === selectedColor ? 'var(--text)' : 'transparent';
                  });
              };
            });

          setTimeout(() => document.getElementById('newSubjName').focus(), 100);

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
            if (state.view === 'subjects') renderSubjects();
          };
        },
      },
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LOAD categories on login (from DB)
     ═══════════════════════════════════════════════════════════ */
  function wireLoginListener() {
    // If already logged in, load now
    pollForUser();

    // Also listen for future logins
    if (supa && supa.auth && supa.auth.onAuthStateChange) {
      supa.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setTimeout(loadCustomCategories, 1000);
        }
      });
    }
  }

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
      console.log('[subjects-extras] loaded categories for', Object.keys(CAT_MAP).length, 'custom subjects');
    } catch (e) {
      console.warn('[subjects-extras] load error:', e);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     START
     ═══════════════════════════════════════════════════════════ */
  waitThenStart();
})();
