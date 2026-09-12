/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Subjects Extras v8 (FINAL)
   - Phase 1: Custom subjects category selector me dikhana
   - Phase 2: Edit, Delete (custom), Hide (default), Restore
   - Phase 3: Syllabus me custom subjects section + topics add
   - Phase 4: Syllabus section collapsible + direct delete button
   - Phase 5: Study page numbered step labels
   - Phase 6: GS Mains split into Paper I/II/III/IV
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[subjects-extras] v8 loaded (FINAL — GS Mains split)');

  const CAT_MAP = {};

  /* ═══════════ HELPER: Check if subject is from SYLLABUS ═══════════ */
  function isDefaultSubject(name) {
    return Object.values(SYLLABUS).some((p) => p.subjects.some((sub) => sub.name === name));
  }

  /* ═══════════ CSS INJECTION ═══════════ */
  function injectCSS() {
    if (document.getElementById('subjExtrasCSS')) return;
    const style = document.createElement('style');
    style.id = 'subjExtrasCSS';
    style.textContent = `
      /* ═══ Subject Cards ═══ */
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
      #customSubjSylSection {
        animation: fadeIn 0.3s;
      }

      /* ═══ Study Page — Numbered Step Labels ═══ */
      .what-studying {
        padding: 22px !important;
      }
      .what-studying .what-title {
        padding-bottom: 14px;
        border-bottom: 1px solid var(--border);
        margin-bottom: 8px !important;
        font-size: 1.05rem !important;
      }
      .step-label {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 18px;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px dashed var(--border);
        animation: fadeIn 0.25s;
      }
      .step-num {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, #8B5CF6, #EC4899);
        color: #fff;
        font-size: 0.72rem;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 10px rgba(168, 85, 247, 0.35);
      }
      .step-emoji {
        font-size: 0.95rem;
      }
      .step-title {
        font-size: 0.78rem;
        font-weight: 800;
        color: var(--text);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .step-sub {
        font-size: 0.72rem;
        color: var(--text-3);
        font-weight: 500;
        margin-left: auto;
      }
      @media (max-width: 600px) {
        .step-sub { display: none; }
      }
      .what-studying .category-chips,
      .what-studying .subject-selector {
        margin-bottom: 4px !important;
      }
      .what-studying .topic-picker {
        margin-top: 0 !important;
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

            const isDefault = isDefaultSubject(name);
            const isCustom = state.subjects.some((s) => s.name === name) && !isDefault;

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

  /* ═══════════ PATCH 4: renderSyllabus ═══════════ */
  function patchRenderSyllabus() {
    const _orig = renderSyllabus;
    window.renderSyllabus = function () {
      _orig.call(this);

      const tree = document.getElementById('syllabusTree');
      if (!tree) return;

      const old = document.getElementById('customSubjSylSection');
      if (old) old.remove();

      const customSubjects = state.subjects.filter((s) => !isDefaultSubject(s.name) && !s.archived);
      if (!customSubjects.length) return;

      const isCollapsed = localStorage.getItem('customSylCollapsed') !== '0';

      const CAT_LABEL = {
        prelims: '🎯 GS Prelims',
        mains: '📚 GS Mains',
        'mains-gs1': '📘 GS Mains · Paper I',
        'mains-gs2': '📗 GS Mains · Paper II',
        'mains-gs3': '📙 GS Mains · Paper III',
        'mains-gs4': '📕 GS Mains · Paper IV',
        optional: '⭐ Optional',
        essay: '✍️ Essay',
        csat: '🧮 CSAT',
      };

      const section = document.createElement('div');
      section.id = 'customSubjSylSection';
      section.style.cssText =
        'margin-top:20px;padding:16px;background:var(--card);border:1px dashed var(--border-2);border-radius:14px';

      section.innerHTML = `
      <div id="customSylHeader" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${isCollapsed ? '0' : '14px'};flex-wrap:wrap;gap:10px;cursor:pointer;user-select:none">
        <div style="font-weight:800;font-size:1rem;display:flex;align-items:center;gap:10px">
          <span style="transform:rotate(${isCollapsed ? '0' : '90deg'});transition:transform .25s;display:inline-block" id="customSylArrow">▶</span>
          <span>✨ My Custom Subjects (${customSubjects.length})</span>
        </div>
        <div style="font-size:.75rem;color:var(--text-3)" id="customSylHint">
          ${isCollapsed ? 'Click to expand' : 'Click to collapse'}
        </div>
      </div>
      <div id="customSylBody" style="display:${isCollapsed ? 'none' : 'flex'};flex-direction:column;gap:14px">
        ${customSubjects
          .map((subj) => {
            const topics = state.syllabus.filter((t) => t.subject === subj.name);
            const catLabel = CAT_LABEL[subj.category] || subj.category || 'Prelims';

            return `
            <div style="padding:12px 14px;background:var(--card-2);border-radius:10px;border-left:3px solid ${subj.color || '#A855F7'}">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;flex-wrap:wrap">
                <div style="min-width:0;flex:1">
                  <div style="font-weight:800;font-size:.92rem">${esc(subj.name)}</div>
                  <div style="font-size:.72rem;color:var(--text-3);margin-top:3px">${catLabel} · ${topics.length} topic${topics.length !== 1 ? 's' : ''}</div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0">
                  <button class="btn btn-primary btn-sm" data-add-custom-topic="${esc(subj.name)}" style="padding:6px 12px;font-size:.75rem">
                    ＋ Add Topic
                  </button>
                  <button class="btn btn-danger btn-sm" data-del-custom-subj="${esc(subj.name)}" style="padding:6px 10px;font-size:.75rem" title="Delete this custom subject">
                    🗑️
                  </button>
                </div>
              </div>
              ${
                topics.length > 0
                  ? `
                <div style="display:flex;flex-direction:column;gap:6px">
                  ${topics
                    .map(
                      (t) => `
                    <div class="syl-topic" style="padding:8px 10px">
                      <span class="syl-topic-status ts-${t.status || 'not_started'}" data-cust-syl-toggle="${t.id}">${(t.status || 'not_started').replace(/_/g, ' ')}</span>
                      <span class="syl-topic-name">${esc(t.topic)}</span>
                      <div class="syl-topic-actions">
                        <button class="icon-mini" title="Delete" data-cust-syl-del="${t.id}" style="color:var(--red)">✕</button>
                      </div>
                    </div>
                  `,
                    )
                    .join('')}
                </div>
              `
                  : `
                <div style="font-size:.78rem;color:var(--text-3);font-style:italic;text-align:center;padding:12px">
                  No topics yet — click "＋ Add Topic" to start
                </div>
              `
              }
            </div>`;
          })
          .join('')}
      </div>`;

      tree.appendChild(section);

      section.querySelector('#customSylHeader').onclick = () => {
        const body = document.getElementById('customSylBody');
        const arrow = document.getElementById('customSylArrow');
        const hint = document.getElementById('customSylHint');
        const nowCollapsed = body.style.display === 'none';
        body.style.display = nowCollapsed ? 'flex' : 'none';
        arrow.style.transform = nowCollapsed ? 'rotate(90deg)' : 'rotate(0deg)';
        hint.textContent = nowCollapsed ? 'Click to collapse' : 'Click to expand';
        localStorage.setItem('customSylCollapsed', nowCollapsed ? '0' : '1');
      };

      section.querySelectorAll('[data-add-custom-topic]').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          openAddTopicToCustomSubject(btn.dataset.addCustomTopic);
        };
      });

      section.querySelectorAll('[data-del-custom-subj]').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          confirmDeleteOrHide(btn.dataset.delCustomSubj, true);
        };
      });

      section.querySelectorAll('[data-cust-syl-toggle]').forEach((el) => {
        el.onclick = (e) => {
          e.stopPropagation();
          const s = state.syllabus.find((x) => x.id === el.dataset.custSylToggle);
          if (!s) return;
          const order = ['not_started', 'learning', 'completed', 'rev1', 'rev2', 'rev3'];
          const next = order[(order.indexOf(s.status) + 1) % order.length];
          s.status = next;
          if (typeof syncSyllabus === 'function') syncSyllabus(s);
          saveLocal();
          window.renderSyllabus();
        };
      });

      section.querySelectorAll('[data-cust-syl-del]').forEach((el) => {
        el.onclick = async (e) => {
          e.stopPropagation();
          const ok = await customConfirm({
            title: 'Delete Topic?',
            message: 'This topic will be removed from your custom subject.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            icon: '🗑️',
            type: 'danger',
          });
          if (!ok) return;
          state.syllabus = state.syllabus.filter((x) => x.id !== el.dataset.custSylDel);
          saveLocal();
          if (supa && state.user) {
            try {
              await supa.from('syllabus_topics').delete().eq('id', el.dataset.custSylDel);
            } catch (e) {}
          }
          window.renderSyllabus();
        };
      });

      if (typeof attachRipples === 'function') attachRipples();
    };

    try {
      renderSyllabus = window.renderSyllabus;
    } catch (e) {}
    console.log('[subjects-extras] patched: renderSyllabus');
  }

  /* ═══════════ PATCH 5: renderStudy (Organized Layout) ═══════════ */
  function addStudyLabels() {
    const section = document.querySelector('.what-studying');
    if (!section) return;

    const catChips = document.getElementById('categoryChips');
    const subjSel = document.getElementById('subjectSelector');
    const topicPicker = section.querySelector('.topic-picker');

    // ✅ IDEMPOTENT: agar saare 3 labels already present hain toh skip karo
    const existingLabels = section.querySelectorAll('.step-label');
    const neededCount = [catChips, subjSel, topicPicker].filter(Boolean).length;

    if (existingLabels.length === neededCount) {
      // Verify labels still attached to correct parents (not stale)
      const stillValid = [...existingLabels].every((lbl) => {
        const next = lbl.nextElementSibling;
        return next === catChips || next === subjSel || next === topicPicker;
      });
      if (stillValid) return; // ✅ already correct, no flicker
    }

    // Sirf tab rebuild karo jab actually missing ho
    existingLabels.forEach((el) => el.remove());

    const labels = [
      { el: catChips, num: 1, emoji: '📂', title: 'Category', sub: 'What are you studying?' },
      { el: subjSel, num: 2, emoji: '📚', title: 'Subject', sub: 'Pick the specific subject' },
      { el: topicPicker, num: 3, emoji: '📖', title: 'Topic', sub: 'Optional — select a topic' },
    ];

    labels.forEach(({ el, num, emoji, title, sub }) => {
      if (!el) return;
      const div = document.createElement('div');
      div.className = 'step-label';
      div.innerHTML = `<span class="step-num">${num}</span> <span class="step-emoji">${emoji}</span> <span class="step-title">${title}</span> <span class="step-sub">${sub}</span>`;
      el.parentNode.insertBefore(div, el);
    });

    if (typeof attachRipples === 'function') attachRipples();
  }
  /* ═══════════ PATCH 6: GS Mains Split into Paper I/II/III/IV ═══════════ */

  // ═══ Category chips — split GS Mains ═══
  function patchRenderCategoryChips() {
    window.renderCategoryChips = function () {
      const container = document.getElementById('categoryChips');
      if (!container) return;
      const optional = state.profile.optional_subject || 'Optional';
      const cats = [
        { id: 'prelims', label: '🎯 GS Prelims', cls: 'c-prelims' },
        { id: 'mains-gs1', label: '📘 GS Mains · Paper I', cls: 'c-mains' },
        { id: 'mains-gs2', label: '📗 GS Mains · Paper II', cls: 'c-mains' },
        { id: 'mains-gs3', label: '📙 GS Mains · Paper III', cls: 'c-mains' },
        { id: 'mains-gs4', label: '📕 GS Mains · Paper IV', cls: 'c-mains' },
        {
          id: 'optional',
          label: `⭐ Optional: ${optional.length > 20 ? optional.slice(0, 20) + '…' : optional}`,
          cls: 'c-optional',
        },
        { id: 'essay', label: '✍️ Essay', cls: 'c-essay' },
        { id: 'csat', label: '🧮 CSAT', cls: 'c-csat' },
      ];

      // ✅ DIFF SIGNATURE — agar same hai toh skip
      const sig = cats
        .map((c) => c.id + '|' + c.label + '|' + c.cls + '|' + (state.draft.category === c.id))
        .join('##');

      if (container.dataset.sig === sig && container.children.length === cats.length) {
        return; // ✅ no change, skip re-render → NO FLICKER
      }
      container.dataset.sig = sig;

      container.innerHTML = cats
        .map(
          (c) =>
            `<button class="cat-chip ${c.cls} ${state.draft.category === c.id ? 'selected' : ''}" data-cat="${c.id}">${esc(c.label)}</button>`,
        )
        .join('');

      container.querySelectorAll('[data-cat]').forEach((b) => {
        b.onclick = () => {
          state.draft.category = b.dataset.cat;
          state.draft.subject = null;
          state.draft.topic = null;
          if (typeof clearSelectionWarning === 'function') clearSelectionWarning();
          window.renderCategoryChips();
          if (typeof renderSubjectSelector === 'function') renderSubjectSelector();
          if (typeof renderTopicSelect === 'function') renderTopicSelect();
        };
      });
    };
    try {
      renderCategoryChips = window.renderCategoryChips;
    } catch (e) {}
    console.log('[subjects-extras] patched: renderCategoryChips (GS split)');
  }

  // ═══ getSubjectsForCategory — handle new categories ═══
  function patchGetSubjectsForMainsSplit() {
    const _orig = window.getSubjectsForCategory;

    window.getSubjectsForCategory = function (cat) {
      if (!cat) return [];

      // New GS Mains papers
      if (cat === 'mains-gs1') return SYLLABUS['mains-gs1'].subjects.map((s) => s.name);
      if (cat === 'mains-gs2') return SYLLABUS['mains-gs2'].subjects.map((s) => s.name);
      if (cat === 'mains-gs3') return SYLLABUS['mains-gs3'].subjects.map((s) => s.name);
      if (cat === 'mains-gs4') return SYLLABUS['mains-gs4'].subjects.map((s) => s.name);

      // For legacy 'mains' and other cats — use original wrapper
      const base = _orig.call(this, cat) || [];

      const custom = Object.entries(CAT_MAP)
        .filter(([_, c]) => c === cat)
        .map(([n]) => n);

      // Also: legacy 'mains' custom subjects appear in all 4 GS papers
      const legacyMains = cat.startsWith('mains-gs')
        ? Object.entries(CAT_MAP)
            .filter(([_, c]) => c === 'mains')
            .map(([n]) => n)
        : [];

      return [...new Set([...base, ...custom, ...legacyMains])];
    };
    try {
      getSubjectsForCategory = window.getSubjectsForCategory;
    } catch (e) {}
    console.log('[subjects-extras] patched: getSubjectsForCategory (mains split)');
  }

  // ═══ getTopicsForCategorySubject — handle new categories ═══
  function patchGetTopicsForMainsSplit() {
    window.getTopicsForCategorySubject = function (cat, subj) {
      if (!cat || !subj) return [];

      if (cat === 'optional') {
        return [`${subj} — Paper I Topics`, `${subj} — Paper II Topics`, 'Custom topic (add in syllabus)'];
      }
      if (cat === 'essay') {
        return SYLLABUS['mains-essay'].subjects.find((s) => s.name === subj)?.topics || [];
      }

      let papers = [];
      if (cat === 'prelims') papers = ['prelims-gs1', 'prelims-csat'];
      else if (cat === 'mains') papers = ['mains-gs1', 'mains-gs2', 'mains-gs3', 'mains-gs4'];
      else if (cat === 'mains-gs1') papers = ['mains-gs1'];
      else if (cat === 'mains-gs2') papers = ['mains-gs2'];
      else if (cat === 'mains-gs3') papers = ['mains-gs3'];
      else if (cat === 'mains-gs4') papers = ['mains-gs4'];
      else if (cat === 'csat') papers = ['prelims-csat'];

      const topics = [];
      papers.forEach((p) => {
        const s = SYLLABUS[p]?.subjects.find((x) => x.name === subj);
        if (s) topics.push(...s.topics);
      });
      return topics;
    };
    try {
      getTopicsForCategorySubject = window.getTopicsForCategorySubject;
    } catch (e) {}
    console.log('[subjects-extras] patched: getTopicsForCategorySubject (mains split)');
  }

  // ═══ Migrate legacy draft.category='mains' to 'mains-gs1' ═══
  function migrateLegacyMains() {
    if (state.draft && state.draft.category === 'mains') {
      state.draft.category = 'mains-gs1';
      state.draft.subject = null;
      state.draft.topic = null;
    }
  }

  /* ═══════════ ADD TOPIC TO CUSTOM SUBJECT ═══════════ */
  function openAddTopicToCustomSubject(subjectName) {
    const subj = state.subjects.find((s) => s.name === subjectName);
    if (!subj) {
      toast('Subject not found', 'err');
      return;
    }

    const body = `
      <div style="padding:12px 14px;background:var(--card-2);border-radius:10px;margin-bottom:10px">
        <div style="font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3)">Custom Subject</div>
        <div style="font-weight:800;font-size:.95rem;margin-top:4px">${esc(subj.name)}</div>
      </div>
      <div class="field">
        <label>Topic Name</label>
        <input type="text" id="newCustTopicName" placeholder="e.g. Chapter 1: Introduction" maxlength="200" autocomplete="off">
        <div style="font-size:.72rem;color:var(--text-3);margin-top:6px">
          Add a specific topic you want to track.
        </div>
      </div>
      <div class="field">
        <label>Initial Status</label>
        <select id="newCustTopicStatus">
          <option value="not_started">⚪ Not Started</option>
          <option value="learning">🟡 Learning</option>
          <option value="completed">✅ Completed</option>
        </select>
      </div>`;

    openModal(
      modalShell({
        title: '✨ Add Topic',
        subtitle: 'to ' + subj.name,
        body,
        actions: `<button class="btn btn-secondary" data-close>Cancel</button>
          <button class="btn btn-primary" id="saveCustTopic">Add Topic</button>`,
      }),
      {
        onMount() {
          setTimeout(() => document.getElementById('newCustTopicName').focus(), 100);

          document.getElementById('saveCustTopic').onclick = async () => {
            const topicName = document.getElementById('newCustTopicName').value.trim();
            const status = document.getElementById('newCustTopicStatus').value;

            if (!topicName || topicName.length < 2) {
              toast('Enter a topic name (2+ chars)', 'err');
              return;
            }

            if (state.syllabus.some((t) => t.subject === subj.name && t.topic === topicName)) {
              toast('This topic already exists', 'err');
              return;
            }

            const entry = {
              id: uuid(),
              paper: subj.category || 'prelims',
              subject: subj.name,
              topic: topicName,
              status: status,
              category: subj.category || 'Prelims',
            };

            state.syllabus.push(entry);

            if (supa && state.user) {
              try {
                await supa.from('syllabus_topics').upsert(
                  {
                    id: entry.id,
                    user_id: state.user.id,
                    paper: entry.paper,
                    subject: entry.subject,
                    topic: entry.topic,
                    status: entry.status,
                    category: entry.category,
                  },
                  { onConflict: 'id' },
                );
              } catch (e) {
                console.warn('[subjects-extras] topic insert error:', e);
                toast('Cloud save failed', 'warn', 4000);
              }
            }

            closeModal();
            toast(`✅ Topic added!`, 'ok');
            window.renderSyllabus();
          };
        },
      },
    );
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

  /* ═══════════ SHARED CATS ARRAY (for modals) ═══════════ */
  const SUBJECT_CATS = [
    { id: 'prelims', label: '🎯 GS Prelims' },
    { id: 'mains-gs1', label: '📘 GS Mains · Paper I' },
    { id: 'mains-gs2', label: '📗 GS Mains · Paper II' },
    { id: 'mains-gs3', label: '📙 GS Mains · Paper III' },
    { id: 'mains-gs4', label: '📕 GS Mains · Paper IV' },
    { id: 'optional', label: '⭐ Optional' },
    { id: 'essay', label: '✍️ Essay' },
    { id: 'csat', label: '🧮 CSAT' },
  ];

  /* ═══════════ NEW SUBJECT MODAL ═══════════ */
  function openNewSubjectModal() {
    if (document.querySelector('#modalRoot.active')) return;

    const COLORS = ['#A855F7', '#EC4899', '#F97316', '#FBBF24', '#14B8A6', '#10B981', '#6366F1', '#EF4444'];

    const body = `
      <div class="field">
        <label>Subject Name</label>
        <input type="text" id="newSubjName" placeholder="e.g. Answer Writing Practice" maxlength="60" autocomplete="off">
      </div>
      <div class="field">
        <label>Category</label>
        <select id="newSubjCategory">
          ${SUBJECT_CATS.map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}
        </select>
        <div style="font-size:.72rem;color:var(--text-3);margin-top:6px">
          Ye subject is category ke selector me dikhega (Study / Manual Log / Pomodoro / Syllabus).
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
            if (isDefaultSubject(name)) {
              toast('This name is already a default subject. Choose another.', 'err', 4000);
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

  /* ═══════════ EDIT SUBJECT MODAL ═══════════ */
  function openEditSubjectModal(oldName) {
    const subj = state.subjects.find((s) => s.name === oldName);
    if (!subj) {
      toast('Subject not found', 'err');
      return;
    }

    const COLORS = ['#A855F7', '#EC4899', '#F97316', '#FBBF24', '#14B8A6', '#10B981', '#6366F1', '#EF4444'];

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
          ${SUBJECT_CATS.map((c) => `<option value="${c.id}" ${c.id === currentCat ? 'selected' : ''}>${c.label}</option>`).join('')}
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

            subj.name = newName;
            subj.color = selectedColor;
            subj.category = newCat;

            if (nameChanged) delete CAT_MAP[oldName];
            CAT_MAP[newName] = newCat;

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
            if (state.view === 'syllabus') window.renderSyllabus();
            if (typeof renderAll === 'function') renderAll();
          };
        },
      },
    );
  }

  /* ═══════════ DELETE (custom) / HIDE (default) ═══════════ */
  async function confirmDeleteOrHide(name, isCustom) {
    const actuallyCustom = isCustom && !isDefaultSubject(name);

    if (actuallyCustom) {
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
      if (state.view === 'syllabus') window.renderSyllabus();
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

  /* ═══════════ LOAD CATEGORIES FROM DB + DUPLICATE CLEANUP ═══════════ */
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
      const { data, error } = await supa.from('subjects').select('id, name, category').eq('user_id', state.user.id);
      if (error) {
        console.warn('[subjects-extras] DB error:', error.message);
        return;
      }
      if (data?.length) {
        for (const s of data) {
          if (isDefaultSubject(s.name)) {
            console.warn('[subjects-extras] removing duplicate of default subject:', s.name);
            try {
              await supa.from('subjects').delete().eq('id', s.id);
            } catch (e) {}
            state.subjects = state.subjects.filter((x) => x.name !== s.name);
            continue;
          }
          if (s.category) CAT_MAP[s.name] = s.category;
        }
      }
      console.log('[subjects-extras] loaded categories for', Object.keys(CAT_MAP).length, 'custom subjects');

      if (state.view === 'syllabus') window.renderSyllabus();
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
      patchRenderSyllabus();
      patchStudyView();
      patchRenderCategoryChips();
      patchGetSubjectsForMainsSplit();
      patchGetTopicsForMainsSplit();
      migrateLegacyMains();
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
