/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Subjects Extras (Phase 1 + 2)
   Phase 1: Custom subjects category selector me dikhana
   Phase 2: Edit, Delete (custom), Hide (default), Restore
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[subjects-extras] v4 loaded (Phase 1 + 2)');

  const CAT_MAP = {};

  /* ═══════════ CSS INJECTION ═══════════ */
  function injectCSS() {
    if (document.getElementById('subjExtrasCSS')) return;
    const style = document.createElement('style');
    style.id = 'subjExtrasCSS';
    style.textContent = `
      .subject-card { position: relative; }
      .subject-card-actions {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 4px;
        opacity: 0.5;
        transition: opacity 0.2s;
      }
      .subject-card:hover .subject-card-actions { opacity: 1; }
      @media (hover: none) { .subject-card-actions { opacity: 1; } }
      .subject-card-actions .icon-mini {
        width: 28px; height: 28px;
        background: var(--bg-2);
        border: 1px solid var(--border);
      }
      .subject-card-actions .icon-mini:hover {
        transform: scale(1.12);
        border-color: var(--purple);
      }
      .color-swatch:hover { transform: scale(1.15); }
      .hidden-subs-section {
        grid-column: 1/-1;
        margin-top: 20px;
        padding: 16px;
        background: var(--card-2);
        border: 1px dashed var(--border-2);
        border-radius: 14px;
      }
      .hidden-sub-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 600;
      }
      .hidden-sub-chip button {
        color: var(--emerald);
        font-weight: 900;
        font-size: 1rem;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0 4px;
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════ ENSURE hidden_subjects ARRAY ═══════════ */
  function ensureHiddenArray() {
    if (!Array.isArray(state.settings.hidden_subjects)) {
      state.settings.hidden_subjects = [];
    }
  }

  /* ═══════════ SAVE SETTINGS TO SUPABASE ═══════════ */
  async function saveSettingsToCloud() {
    if (!supa || !state.user) return;
    try {
      await supa
        .from('user_settings')
        .upsert({ user_id: state.user.id, settings: state.settings }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('[subjects-extras] settings save error:', e);
    }
  }

  /* ═══════════ PATCH 1: getSubjectsForCategory ═══════════ */
  function patchGetSubjects() {
    const _orig = getSubjectsForCategory;
    window.getSubjectsForCategory = function (cat) {
      const base = (_orig.call(this, cat) || []).slice();
      if (!cat) return base;
      const custom = Object.entries(CAT_MAP)
        .filter(([_, c]) => c === cat)
        .map(([n]) => n);
      return [...new Set([...base, ...custom])];
    };
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
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openNewSubjectModal();
    };
    document.addEventListener(
      'click',
      (e) => {
        if (e.target.closest && e.target.closest('#addSubjectBtn')) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (!document.querySelector('#modalRoot.active')) openNewSubjectModal();
        }
      },
      true,
    );
    console.log('[subjects-extras] patched: addSubjectBtn');
  }

  /* ═══════════ PATCH 3: renderSubjects ═══════════ */
  function patchRenderSubjects() {
    window.renderSubjects = function () {
      ensureHiddenArray();

      const totals = subjectTotals();
      const allSubs = new Set();
      Object.values(SYLLABUS).forEach((p) => p.subjects.forEach((s) => allSubs.add(s.name)));
      state.subjects.forEach((s) => allSubs.add(s.name));

      const hidden = state.settings.hidden_subjects || [];
      const visibleSubs = [...allSubs].filter((name) => !hidden.includes(name));

      const grid = document.getElementById('subjectsGrid');
      if (!grid) return;

      if (!visibleSubs.length) {
        grid.innerHTML = `
          <div class="empty" style="grid-column:1/-1">
            <div class="em">📚</div>
            <h4>No subjects visible</h4>
            <p>Add a custom subject or restore hidden ones below.</p>
          </div>`;
      } else {
        grid.innerHTML = visibleSubs
          .map((name) => {
            const sec = totals[name] || 0;
            const sessions = state.sessions.filter((x) => x.subject === name).length;
            const syl = state.syllabus.filter((t) => t.subject === name);

            const c = {
              not_started: syl.filter((t) => !t.status || t.status === 'not_started').length,
              learning: syl.filter((t) => t.status === 'learning').length,
              completed: syl.filter((t) => t.status === 'completed').length,
              rev1: syl.filter((t) => t.status === 'rev1').length,
              rev2: syl.filter((t) => t.status === 'rev2').length,
              rev3: syl.filter((t) => t.status === 'rev3').length,
            };

            const badges = [];
            if (c.not_started > 0)
              badges.push(`<span class="pill ts-not_started" title="${c.not_started} topics">⚪ Not Started</span>`);
            if (c.learning > 0)
              badges.push(`<span class="pill ts-learning" title="${c.learning} topics">🟡 Learning</span>`);
            if (c.completed > 0)
              badges.push(`<span class="pill ts-completed" title="${c.completed} topics">✅ Completed</span>`);
            if (c.rev1 > 0) badges.push(`<span class="pill ts-rev1" title="${c.rev1} topics">🔵 Rev 1</span>`);
            if (c.rev2 > 0) badges.push(`<span class="pill ts-rev2" title="${c.rev2} topics">🔵 Rev 2</span>`);
            if (c.rev3 > 0) badges.push(`<span class="pill ts-rev3" title="${c.rev3} topics">🔵 Rev 3</span>`);

            const isCustom = state.subjects.some((s) => s.name === name);

            return `<div class="card subject-card" style="border-left:4px solid ${getSubjectColor(name)}">
              <div class="subject-card-actions">
                <button class="icon-mini" title="${isCustom ? 'Edit' : 'Rename not allowed'}" 
                  data-subj-edit="${esc(name)}" data-is-custom="${isCustom}">✏️</button>
                <button class="icon-mini" title="${isCustom ? 'Delete' : 'Hide'}" 
                  data-subj-del="${esc(name)}" data-is-custom="${isCustom}" style="color:var(--red)">✕</button>
              </div>
              <div style="font-weight:800;font-size:1rem;margin-bottom:10px;padding-right:70px">${esc(name)}</div>
              <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--text-3);margin-bottom:4px"><span>Time</span><strong style="color:var(--text)">${fmtDuration(sec)}</strong></div>
              <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--text-3);margin-bottom:10px"><span>Sessions</span><strong style="color:var(--text)">${sessions}</strong></div>
              ${
                syl.length > 0
                  ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${badges.join('')}</div>`
                  : `<div style="font-size:.75rem;color:var(--text-3);font-style:italic">Not tracked yet</div>`
              }
            </div>`;
          })
          .join('');
      }

      // Wire Edit buttons
      grid.querySelectorAll('[data-subj-edit]').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const name = btn.dataset.subjEdit;
          const isCustom = btn.dataset.isCustom === 'true';
          if (!isCustom) {
            toast('Default subjects cannot be renamed. You can hide them instead.', 'info', 4000);
            return;
          }
          openEditSubjectModal(name);
        };
      });

      // Wire Delete/Hide buttons
      grid.querySelectorAll('[data-subj-del]').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const name = btn.dataset.subjDel;
          const isCustom = btn.dataset.isCustom === 'true';
          confirmDeleteOrHide(name, isCustom);
        };
      });

      renderHiddenSection(grid);
      if (typeof attachRipples === 'function') attachRipples();
    };

    try {
      renderSubjects = window.renderSubjects;
    } catch (e) {}
    console.log('[subjects-extras] patched: renderSubjects');
  }

  /* ═══════════ HIDDEN SUBJECTS SECTION ═══════════ */
  function renderHiddenSection(grid) {
    const existing = document.getElementById('hiddenSubsSection');
    if (existing) existing.remove();

    const hidden = state.settings.hidden_subjects || [];
    if (!hidden.length) return;

    const section = document.createElement('div');
    section.id = 'hiddenSubsSection';
    section.className = 'hidden-subs-section';
    section.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:10px">
        <div style="font-weight:800;font-size:.92rem;display:flex;align-items:center;gap:8px">
          <span>👁️</span><span>Hidden Subjects (${hidden.length})</span>
        </div>
        <button class="btn btn-secondary btn-sm" id="restoreAllSubsBtn" style="padding:6px 14px;font-size:.75rem">Restore All</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${hidden
          .map(
            (name) => `
          <span class="hidden-sub-chip">
            <span>${esc(name)}</span>
            <button title="Restore" data-restore="${esc(name)}">↺</button>
          </span>`,
          )
          .join('')}
      </div>`;
    grid.appendChild(section);

    section.querySelectorAll('[data-restore]').forEach((btn) => {
      btn.onclick = () => restoreSubject(btn.dataset.restore);
    });
    section.querySelector('#restoreAllSubsBtn').onclick = restoreAllSubjects;
  }

  /* ═══════════ NEW SUBJECT MODAL ═══════════ */
  function openNewSubjectModal() {
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
          Ye subject is category ke selector me dikhega (Study / Manual Log / Pomodoro).
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
          colorsDiv.querySelectorAll('.color-swatch').forEach((sw) => {
            sw.onclick = () => {
              selectedColor = sw.dataset.color;
              colorsDiv.querySelectorAll('.color-swatch').forEach((b) => {
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
            if (state.view === 'subjects') window.renderSubjects();
          };
        },
      },
    );
  }

  /* ═══════════ EDIT SUBJECT MODAL (custom only) ═══════════ */
  function openEditSubjectModal(oldName) {
    const subj = state.subjects.find((s) => s.name === oldName);
    if (!subj) {
      toast('Subject not found', 'err');
      return;
    }

    const COLORS = ['#A855F7', '#EC4899', '#F97316', '#FBBF24', '#14B8A6', '#10B981', '#6366F1', '#EF4444'];
    const CATS = [
      { id: 'prelims', label: '🎯 GS Prelims' },
      { id: 'mains', label: '📚 GS Mains' },
      { id: 'optional', label: '⭐ Optional' },
      { id: 'essay', label: '✍️ Essay' },
      { id: 'csat', label: '🧮 CSAT' },
    ];

    const currentColor = subj.color || getSubjectColor(oldName);
    const currentCat = subj.category || CAT_MAP[oldName] || 'prelims';

    const body = `
      <div class="field">
        <label>Subject Name</label>
        <input type="text" id="editSubjName" value="${esc(oldName)}" maxlength="60" autocomplete="off">
      </div>
      <div class="field">
        <label>Category</label>
        <select id="editSubjCategory">
          ${CATS.map((c) => `<option value="${c.id}" ${c.id === currentCat ? 'selected' : ''}>${c.label}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Color</label>
        <div id="editSubjColors" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
          ${COLORS.map(
            (c) => `<button type="button" class="color-swatch" data-color="${c}" 
              style="width:36px;height:36px;border-radius:50%;background:${c};
              border:3px solid ${c === currentColor ? 'var(--text)' : 'transparent'};cursor:pointer"></button>`,
          ).join('')}
        </div>
      </div>`;

    openModal(
      modalShell({
        title: '✏️ Edit Subject',
        subtitle: 'Rename, change category, or change color',
        body,
        actions: `<button class="btn btn-secondary" data-close>Cancel</button>
          <button class="btn btn-primary" id="saveSubjEdit">Save Changes</button>`,
      }),
      {
        onMount() {
          let selectedColor = currentColor;

          const colorsDiv = document.getElementById('editSubjColors');
          colorsDiv.querySelectorAll('.color-swatch').forEach((sw) => {
            sw.onclick = () => {
              selectedColor = sw.dataset.color;
              colorsDiv.querySelectorAll('.color-swatch').forEach((b) => {
                b.style.borderColor = b.dataset.color === selectedColor ? 'var(--text)' : 'transparent';
              });
            };
          });

          document.getElementById('saveSubjEdit').onclick = async () => {
            const newName = document.getElementById('editSubjName').value.trim();
            const newCat = document.getElementById('editSubjCategory').value;

            if (!newName || newName.length < 2) {
              toast('Enter a valid name (2+ chars)', 'err');
              return;
            }
            if (newName !== oldName && state.subjects.some((s) => s.name.toLowerCase() === newName.toLowerCase())) {
              toast('Another subject with this name exists', 'err');
              return;
            }

            const nameChanged = newName !== oldName;
            const catChanged = newCat !== currentCat;

            // Update local subject
            subj.name = newName;
            subj.color = selectedColor;
            subj.category = newCat;

            // Update CAT_MAP
            if (nameChanged) delete CAT_MAP[oldName];
            CAT_MAP[newName] = newCat;

            // Cascade rename in local state
            if (nameChanged) {
              state.sessions.forEach((s) => {
                if (s.subject === oldName) s.subject = newName;
                if (s.paper === oldName) s.paper = newName;
              });
              state.syllabus.forEach((t) => {
                if (t.subject === oldName) t.subject = newName;
              });
              state.goals.forEach((g) => {
                if (g.subject === oldName) g.subject = newName;
              });
              state.tasks.forEach((t) => {
                if (t.subject === oldName) t.subject = newName;
              });
              state.revisions.forEach((r) => {
                if (r.subject === oldName) r.subject = newName;
              });
            }

            // Sync to Supabase
            if (supa && state.user) {
              try {
                await supa
                  .from('subjects')
                  .update({ name: newName, color: selectedColor, category: newCat })
                  .eq('id', subj.id);

                if (nameChanged) {
                  await supa
                    .from('study_sessions')
                    .update({ subject: newName, paper: newName })
                    .eq('user_id', state.user.id)
                    .eq('subject', oldName);
                  await supa
                    .from('syllabus_topics')
                    .update({ subject: newName })
                    .eq('user_id', state.user.id)
                    .eq('subject', oldName);
                  await supa
                    .from('tasks')
                    .update({ subject: newName })
                    .eq('user_id', state.user.id)
                    .eq('subject', oldName);
                  await supa
                    .from('revisions')
                    .update({ subject: newName })
                    .eq('user_id', state.user.id)
                    .eq('subject', oldName);
                }
              } catch (e) {
                console.warn('[subjects-extras] edit sync error:', e);
                toast('Some cloud updates failed', 'warn', 4000);
              }
            }

            closeModal();
            toast(`✅ Subject updated!`, 'ok');
            if (state.view === 'subjects') window.renderSubjects();
            if (typeof renderAll === 'function') renderAll();
          };
        },
      },
    );
  }

  /* ═══════════ DELETE (custom) / HIDE (default) ═══════════ */
  async function confirmDeleteOrHide(name, isCustom) {
    if (isCustom) {
      const ok = await customConfirm({
        title: 'Delete Subject?',
        message: `"${name}" will be permanently deleted. Sessions and syllabus entries will remain in your history but the subject name will become orphaned.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        icon: '🗑️',
        type: 'danger',
      });
      if (!ok) return;

      const subj = state.subjects.find((s) => s.name === name);
      state.subjects = state.subjects.filter((s) => s.name !== name);
      delete CAT_MAP[name];

      if (supa && state.user && subj) {
        try {
          await supa.from('subjects').delete().eq('id', subj.id);
        } catch (e) {
          console.warn('[subjects-extras] delete error:', e);
        }
      }

      toast(`Deleted "${name}"`, 'ok');
      if (state.view === 'subjects') window.renderSubjects();
      if (typeof renderAll === 'function') renderAll();
    } else {
      const ok = await customConfirm({
        title: 'Hide Subject?',
        message: `"${name}" will be hidden from your Subjects page. You can restore it anytime from the "Hidden Subjects" section below.`,
        confirmText: 'Hide',
        cancelText: 'Cancel',
        icon: '👁️',
        type: 'warning',
      });
      if (!ok) return;

      ensureHiddenArray();
      if (!state.settings.hidden_subjects.includes(name)) {
        state.settings.hidden_subjects.push(name);
      }
      await saveSettingsToCloud();

      toast(`Hid "${name}" — restore from bottom section`, 'info', 4000);
      if (state.view === 'subjects') window.renderSubjects();
    }
  }

  /* ═══════════ RESTORE ═══════════ */
  async function restoreSubject(name) {
    ensureHiddenArray();
    state.settings.hidden_subjects = state.settings.hidden_subjects.filter((n) => n !== name);
    await saveSettingsToCloud();
    toast(`Restored "${name}"`, 'ok');
    if (state.view === 'subjects') window.renderSubjects();
  }

  async function restoreAllSubjects() {
    state.settings.hidden_subjects = [];
    await saveSettingsToCloud();
    toast('All subjects restored', 'ok');
    if (state.view === 'subjects') window.renderSubjects();
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

  /* ═══════════ INIT ═══════════ */
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

  let attempts = 0;
  function waitThenStart() {
    if (appReady()) {
      injectCSS();
      ensureHiddenArray();
      patchGetSubjects();
      patchAddSubjectButton();
      patchRenderSubjects();
      pollForUser();
      if (supa && supa.auth && supa.auth.onAuthStateChange) {
        supa.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) setTimeout(loadCustomCategories, 1000);
        });
      }
      console.log('[subjects-extras] ✅ patched all');
    } else {
      attempts++;
      if (attempts > 200) {
        console.error('[subjects-extras] timeout');
        return;
      }
      setTimeout(waitThenStart, 50);
    }
  }

  waitThenStart();
})();
