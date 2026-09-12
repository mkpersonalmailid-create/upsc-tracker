/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Revision Extras v6 (FINAL)
   ─────────────────────────────────────────────────────────────
   ✅ "By Rev Level" view — Revision 1/2/3... → Broad Categories → Topics
   ✅ Dual-source merge (syllabus + revisions history)
   ✅ Dropdown expand/collapse + summary chips
   ✅ Schedule modal: Category → Subject → Topic (like Manual Log)
   ✅ Custom subject SUPPORTED (shows in Subject dropdown)
   ✅ Custom topics SUPPORTED (pulled from state.syllabus)
   ✅ Fixed Study Type = Revision
   ✅ On "✓ Done" → syllabus status auto-updates
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[revision-extras] v6 loaded');

  /* ═══════════════ CONSTANTS ═══════════════ */
  const BROAD_CATS = [
    { id: 'prelims', label: '🎯 GS Prelims', color: '#A855F7' },
    { id: 'mains', label: '📚 GS Mains', color: '#F97316' },
    { id: 'optional', label: '⭐ Optional', color: '#14B8A6' },
    { id: 'essay', label: '✍️ Essay', color: '#EC4899' },
    { id: 'csat', label: '🧮 CSAT', color: '#06B6D4' },
    { id: 'other', label: '📦 Other', color: '#6E5F8C' },
  ];

  const REV_COLORS = ['#A855F7', '#EC4899', '#F97316', '#FBBF24', '#14B8A6', '#10B981', '#6366F1'];

  const CATEGORY_OPTIONS = [
    { id: 'prelims', label: '🎯 GS Prelims' },
    { id: 'mains-gs1', label: '📘 GS Mains · Paper I' },
    { id: 'mains-gs2', label: '📗 GS Mains · Paper II' },
    { id: 'mains-gs3', label: '📙 GS Mains · Paper III' },
    { id: 'mains-gs4', label: '📕 GS Mains · Paper IV' },
    { id: 'optional', label: '⭐ Optional' },
    { id: 'essay', label: '✍️ Essay' },
    { id: 'csat', label: '🧮 CSAT' },
  ];

  /* ═══════════════ STATE ═══════════════ */
  let revViewMode = localStorage.getItem('upsc_rev_view') || 'schedule';
  let expandedRevLevels = (() => {
    try {
      return JSON.parse(localStorage.getItem('upsc_rev_expanded') || '{}');
    } catch (e) {
      return {};
    }
  })();

  function saveExpanded() {
    try {
      localStorage.setItem('upsc_rev_expanded', JSON.stringify(expandedRevLevels));
    } catch (e) {}
  }

  /* ═══════════════ HELPERS ═══════════════ */
  function getBroadCategory(paper, category) {
    const p = (paper || '').toString();
    if (p.startsWith('prelims')) return 'prelims';
    if (p.startsWith('mains-gs')) return 'mains';
    if (p === 'mains-essay') return 'essay';

    const c = (category || '').toString().toLowerCase();
    if (c.includes('prelim')) return 'prelims';
    if (c.includes('mains')) return 'mains';
    if (c === 'optional') return 'optional';
    if (c === 'essay') return 'essay';
    if (c === 'csat') return 'csat';
    return 'other';
  }

  function escapeHTML(str) {
    return String(str || '').replace(
      /[&<>"']/g,
      (ch) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[ch],
    );
  }

  function safeUUID() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function dateKey(d) {
    const x = new Date(d);
    const p = (n) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  /* ═══════════════ DUAL-SOURCE MERGE ═══════════════ */
  function getTopicsForRevLevel(revNum) {
    const revStatus = `rev${revNum}`;
    const map = new Map();

    state.syllabus.forEach((t) => {
      if (t.status === revStatus) {
        const key = `${t.subject}|${t.topic}`;
        map.set(key, {
          subject: t.subject,
          topic: t.topic,
          paper: t.paper,
          category: t.category,
          source: 'current',
        });
      }
    });

    state.revisions.forEach((r) => {
      if (r.revision_number === revNum && r.status === 'completed') {
        const key = `${r.subject}|${r.topic}`;
        if (!map.has(key)) {
          const syl = state.syllabus.find((s) => s.subject === r.subject && s.topic === r.topic);
          map.set(key, {
            subject: r.subject,
            topic: r.topic,
            paper: syl?.paper || r.paper || '',
            category: syl?.category || r.category || '',
            source: 'history',
          });
        }
      }
    });

    return [...map.values()];
  }

  /* ═══════════════ CSS INJECTION ═══════════════ */
  function injectCSS() {
    if (document.getElementById('revExtrasCSS')) return;
    const style = document.createElement('style');
    style.id = 'revExtrasCSS';
    style.textContent = `
      .rev-view-toggle {
        display: inline-flex;
        gap: 4px;
        background: var(--card-2);
        padding: 4px;
        border-radius: 11px;
        border: 1px solid var(--border);
        margin-bottom: 16px;
      }
      .rev-view-toggle button {
        padding: 8px 18px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--text-2);
        transition: all 0.2s;
        white-space: nowrap;
        cursor: pointer;
        background: transparent;
        border: none;
      }
      .rev-view-toggle button:hover { color: var(--text); }
      .rev-view-toggle button.active {
        background: var(--grad-1);
        color: #fff;
        box-shadow: 0 4px 12px rgba(168,85,247,0.35);
      }

      .rev-summary-strip {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .rev-summary-chip {
        flex: 1;
        min-width: 100px;
        padding: 12px 14px;
        background: var(--card-2);
        border: 1px solid var(--border);
        border-radius: 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
      }
      .rev-summary-chip:hover {
        border-color: var(--border-2);
        transform: translateY(-2px);
      }
      .rev-summary-chip .lbl {
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-3);
      }
      .rev-summary-chip .val {
        font-size: 1.35rem;
        font-weight: 900;
        margin-top: 4px;
        letter-spacing: -0.02em;
      }

      .rev-level-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        overflow: hidden;
        margin-bottom: 12px;
        transition: border-color 0.25s, box-shadow 0.25s;
      }
      .rev-level-card:hover { border-color: var(--border-2); }

      .rev-level-head {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 18px;
        background: var(--card-2);
        cursor: pointer;
        user-select: none;
        transition: background 0.2s;
      }
      .rev-level-head:hover { background: var(--card); }

      .rev-level-arrow {
        width: 24px; height: 24px;
        border-radius: 7px;
        background: var(--bg);
        display: flex; align-items: center; justify-content: center;
        font-size: 0.7rem;
        color: var(--text-2);
        transition: transform 0.3s cubic-bezier(0.32,0.72,0,1);
        flex-shrink: 0;
      }
      .rev-level-head.open .rev-level-arrow { transform: rotate(90deg); }

      .rev-level-badge {
        width: 42px; height: 42px;
        border-radius: 11px;
        display: flex; align-items: center; justify-content: center;
        font-weight: 900;
        font-size: 0.82rem;
        color: #fff;
        flex-shrink: 0;
        letter-spacing: -0.02em;
        box-shadow: 0 6px 16px rgba(0,0,0,0.3);
      }

      .rev-level-info { flex: 1; min-width: 0; }
      .rev-level-title {
        font-weight: 800;
        font-size: 1rem;
        letter-spacing: -0.01em;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .rev-level-sub {
        font-size: 0.72rem;
        color: var(--text-3);
        margin-top: 2px;
      }

      .rev-level-count {
        font-size: 0.72rem;
        font-weight: 800;
        padding: 5px 13px;
        background: rgba(168,85,247,0.15);
        color: #C4B5FD;
        border-radius: 20px;
        flex-shrink: 0;
        white-space: nowrap;
      }

      .rev-level-body {
        padding: 16px 18px;
        display: none;
      }
      .rev-level-head.open + .rev-level-body {
        display: block;
        animation: fadeIn 0.3s;
      }

      .rev-cat-group { margin-bottom: 16px; }
      .rev-cat-group:last-child { margin-bottom: 0; }

      .rev-cat-head {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 13px;
        background: var(--card-2);
        border-radius: 9px;
        margin-bottom: 8px;
        font-size: 0.83rem;
        font-weight: 800;
      }
      .rev-cat-dot {
        width: 9px; height: 9px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .rev-cat-count {
        margin-left: auto;
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--text-3);
        background: var(--card);
        padding: 3px 10px;
        border-radius: 20px;
      }

      .rev-topic-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 13px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 9px;
        margin-bottom: 5px;
        font-size: 0.83rem;
        transition: all 0.18s;
      }
      .rev-topic-item:hover {
        border-color: var(--border-2);
        transform: translateX(3px);
      }
      .rev-topic-name {
        flex: 1;
        line-height: 1.45;
        font-weight: 600;
        word-break: break-word;
      }
      .rev-topic-subject {
        font-size: 0.68rem;
        color: var(--text-3);
        font-weight: 800;
        padding: 3px 9px;
        background: var(--card-2);
        border-radius: 20px;
        flex-shrink: 0;
        white-space: nowrap;
        align-self: flex-start;
      }

      .rev-empty-state {
        text-align: center;
        padding: 28px 20px;
        color: var(--text-3);
      }
      .rev-empty-state .em {
        font-size: 2.2rem;
        margin-bottom: 10px;
        opacity: 0.55;
      }

      .rev-custom-hint {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 12px 14px;
        background: linear-gradient(135deg, rgba(168,85,247,0.09), rgba(236,72,153,0.05));
        border: 1px solid rgba(168,85,247,0.28);
        border-radius: 10px;
        font-size: 0.78rem;
        color: #C4B5FD;
        line-height: 1.55;
      }
      .rev-custom-hint .hint-ico {
        font-size: 1.1rem;
        flex-shrink: 0;
        margin-top: 1px;
      }
      .rev-custom-hint strong { color: #E9D5FF; font-weight: 800; }

      .rev-fixed-type {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: rgba(168,85,247,0.1);
        border: 1px solid rgba(168,85,247,0.3);
        border-radius: 12px;
        font-size: 0.85rem;
        color: #C4B5FD;
      }
      .rev-fixed-type .type-ico {
        font-size: 1.3rem;
        flex-shrink: 0;
      }
      .rev-fixed-type strong { color: #E9D5FF; }

      @media (max-width: 700px) {
        .rev-view-toggle { width: 100%; justify-content: stretch; }
        .rev-view-toggle button { flex: 1; padding: 8px 10px; font-size: 0.76rem; }
        .rev-level-head { padding: 13px 14px; gap: 10px; }
        .rev-level-badge { width: 36px; height: 36px; font-size: 0.72rem; }
        .rev-level-title { font-size: 0.9rem; }
        .rev-level-body { padding: 12px 14px; }
        .rev-topic-item { flex-wrap: wrap; }
        .rev-topic-subject { font-size: 0.62rem; }
        .rev-summary-chip { min-width: 76px; padding: 10px; }
        .rev-summary-chip .val { font-size: 1.15rem; }
        .rev-summary-chip .lbl { font-size: 0.55rem; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════ RENDER "BY REV LEVEL" ═══════════════ */
  function renderRevLevelView() {
    const maxRevs = Math.max(1, parseInt(state.settings.max_revisions, 10) || 3);
    const container = document.getElementById('revisionsList');
    if (!container) return;

    const revCounts = [];
    let totalInRevs = 0;

    for (let i = 1; i <= maxRevs; i++) {
      const c = getTopicsForRevLevel(i).length;
      revCounts.push({ num: i, count: c, color: REV_COLORS[(i - 1) % REV_COLORS.length] });
      totalInRevs += c;
    }

    let html = '';

    if (totalInRevs > 0) {
      html += `<div class="rev-summary-strip">
        ${revCounts
          .map(
            (r) => `
          <div class="rev-summary-chip" data-jump-to="rev${r.num}">
            <div class="lbl">Revision ${r.num}${r.num === maxRevs ? ' (Final)' : ''}</div>
            <div class="val" style="color:${r.color}">${r.count}</div>
          </div>
        `,
          )
          .join('')}
      </div>`;
    }

    for (let i = 1; i <= maxRevs; i++) {
      const revStatus = `rev${i}`;
      const topics = getTopicsForRevLevel(i);

      const grouped = {};
      topics.forEach((t) => {
        const broad = getBroadCategory(t.paper, t.category);
        if (!grouped[broad]) grouped[broad] = [];
        grouped[broad].push(t);
      });

      Object.values(grouped).forEach((arr) => arr.sort((a, b) => (a.topic || '').localeCompare(b.topic || '')));

      const isOpen = expandedRevLevels[revStatus] !== false;
      const color = REV_COLORS[(i - 1) % REV_COLORS.length];
      const totalCount = topics.length;
      const catCount = Object.keys(grouped).length;
      const isFinal = i === maxRevs;

      html += `
        <div class="rev-level-card" id="rev-card-${revStatus}">
          <div class="rev-level-head ${isOpen ? 'open' : ''}" data-rev-toggle="${revStatus}">
            <span class="rev-level-arrow">▶</span>
            <div class="rev-level-badge" style="background:linear-gradient(135deg,${color},${color}bb)">R${i}</div>
            <div class="rev-level-info">
              <div class="rev-level-title">
                Revision ${i}
                ${isFinal ? '<span style="font-size:.62rem;color:#FBBF24;font-weight:900;letter-spacing:.06em;background:rgba(251,191,36,.12);padding:2px 8px;border-radius:20px">FINAL</span>' : ''}
              </div>
              <div class="rev-level-sub">
                ${
                  totalCount === 0
                    ? 'No topics in this revision block yet'
                    : `${catCount} categor${catCount !== 1 ? 'ies' : 'y'} · click to ${isOpen ? 'collapse' : 'expand'}`
                }
              </div>
            </div>
            <span class="rev-level-count">${totalCount} topic${totalCount !== 1 ? 's' : ''}</span>
          </div>
          <div class="rev-level-body">
            ${
              totalCount === 0
                ? `<div class="rev-empty-state">
                    <div class="em">📭</div>
                    <div style="font-weight:700;color:var(--text-2);margin-bottom:6px">No topics in this revision block yet</div>
                    <div style="font-size:.76rem;line-height:1.6">
                      Log a study session → Study Type = <strong style="color:var(--text-2)">Revision</strong> → choose <strong style="color:var(--text-2)">Revision ${i}</strong>
                    </div>
                  </div>`
                : BROAD_CATS.filter((c) => grouped[c.id] && grouped[c.id].length)
                    .map((cat) => {
                      const catTopics = grouped[cat.id];
                      return `
                        <div class="rev-cat-group">
                          <div class="rev-cat-head">
                            <span class="rev-cat-dot" style="background:${cat.color}"></span>
                            <span>${cat.label}</span>
                            <span class="rev-cat-count">${catTopics.length}</span>
                          </div>
                          ${catTopics
                            .map(
                              (t) => `
                            <div class="rev-topic-item">
                              <span class="rev-topic-name">${escapeHTML(t.topic || t.subject)}</span>
                              ${
                                t.source === 'history'
                                  ? '<span class="rev-topic-subject" style="background:rgba(16,185,129,.15);color:#34D399">✓ Done</span>'
                                  : ''
                              }
                              <span class="rev-topic-subject">${escapeHTML(t.subject)}</span>
                            </div>
                          `,
                            )
                            .join('')}
                        </div>
                      `;
                    })
                    .join('')
            }
          </div>
        </div>
      `;
    }

    if (totalInRevs === 0) {
      html = `
        <div class="rev-empty-state" style="padding:60px 24px;background:var(--card);border-radius:16px;border:1px dashed var(--border-2)">
          <div class="em" style="font-size:3rem">📚</div>
          <div style="font-weight:800;font-size:1.15rem;color:var(--text);margin-bottom:8px">
            No Revisions Yet
          </div>
          <div style="font-size:.86rem;color:var(--text-2);line-height:1.7;max-width:460px;margin:0 auto">
            Log a study session with <strong style="color:#C4B5FD">🔁 Revision</strong> type and pick
            <strong style="color:#C4B5FD">Revision 1 / 2 / 3</strong>. The topic will appear here grouped by category.
          </div>
          <button class="btn btn-primary" style="margin-top:20px" onclick="switchView('study')">
            ⏱ Start Study Session
          </button>
        </div>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('[data-rev-toggle]').forEach((head) => {
      head.onclick = () => {
        const key = head.dataset.revToggle;
        head.classList.toggle('open');
        expandedRevLevels[key] = head.classList.contains('open');
        saveExpanded();

        const sub = head.querySelector('.rev-level-sub');
        if (sub) {
          const catGroups = head.nextElementSibling?.querySelectorAll('.rev-cat-group')?.length || 0;
          if (catGroups > 0) {
            sub.textContent = `${catGroups} categor${catGroups !== 1 ? 'ies' : 'y'} · click to ${head.classList.contains('open') ? 'collapse' : 'expand'}`;
          }
        }
      };
    });

    container.querySelectorAll('[data-jump-to]').forEach((chip) => {
      chip.onclick = () => {
        const target = document.getElementById(`rev-card-${chip.dataset.jumpTo}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const head = target.querySelector('.rev-level-head');
          if (head && !head.classList.contains('open')) head.click();
        }
      };
    });

    if (typeof attachRipples === 'function') attachRipples();
  }

  /* ═══════════════ PATCH renderRevisions ═══════════════ */
  function patchRenderRevisions() {
    const _orig = window.renderRevisions;
    if (typeof _orig !== 'function') {
      console.warn('[revision-extras] renderRevisions not found');
      return;
    }

    window.renderRevisions = function () {
      injectCSS();

      const view = document.querySelector('#view-revision');
      if (!view) {
        _orig.call(this);
        return;
      }

      const card = view.querySelector('.card');
      const cardHeader = card ? card.querySelector('.card-header') : null;

      let toggle = document.getElementById('revViewToggle');
      if (!toggle) {
        toggle = document.createElement('div');
        toggle.id = 'revViewToggle';
        toggle.className = 'rev-view-toggle';
        toggle.innerHTML = `
          <button data-mode="schedule">📅 Schedule</button>
          <button data-mode="revlevel">📚 By Rev Level</button>
        `;

        if (cardHeader) cardHeader.insertAdjacentElement('afterend', toggle);
        else if (card) card.insertBefore(toggle, card.firstChild);

        toggle.querySelectorAll('[data-mode]').forEach((btn) => {
          btn.onclick = () => {
            revViewMode = btn.dataset.mode;
            try {
              localStorage.setItem('upsc_rev_view', revViewMode);
            } catch (e) {}
            window.renderRevisions();
          };
        });
      }

      toggle.querySelectorAll('[data-mode]').forEach((b) => {
        b.classList.toggle('active', b.dataset.mode === revViewMode);
      });

      const kpiGrid = document.getElementById('revisionKpis');
      const tabs = document.getElementById('revFilterTabs');

      if (revViewMode === 'revlevel') {
        if (kpiGrid) kpiGrid.style.display = 'none';
        if (tabs) tabs.style.display = 'none';
        renderRevLevelView();
      } else {
        if (kpiGrid) kpiGrid.style.display = '';
        if (tabs) tabs.style.display = '';
        _orig.call(this);
      }
    };

    try {
      renderRevisions = window.renderRevisions;
    } catch (e) {}

    console.log('[revision-extras] patched: renderRevisions');
  }

  /* ═══════════════════════════════════════════════════════════════
     Schedule Revision modal — Category → Subject → Topic
     v6: Custom subjects AND custom topics supported
     ═══════════════════════════════════════════════════════════════ */
  function openEnhancedScheduleRevisionModal() {
    const maxRevs = Math.max(1, parseInt(state.settings.max_revisions, 10) || 3);

    let revOpts = '';
    for (let i = 1; i <= maxRevs; i++) {
      revOpts += `<option value="${i}">Revision ${i}${i === maxRevs ? ' (Final)' : ''}</option>`;
    }

    const catOpts = CATEGORY_OPTIONS.map((c) => `<option value="${c.id}">${c.label}</option>`).join('');

    const body = `
      <div class="field">
        <label>Category</label>
        <select id="rvCategory">
          <option value="">— Select a category —</option>
          ${catOpts}
        </select>
      </div>

      <div class="field">
        <label>Subject</label>
        <select id="rvSubject" disabled>
          <option value="">— Select a category first —</option>
        </select>
      </div>

      <div class="field">
        <label>Topic</label>
        <select id="rvTopic" disabled>
          <option value="">— Select a subject first —</option>
        </select>
      </div>

      <div class="rev-custom-hint">
        <span class="hint-ico">💡</span>
        <div>
          Want to add a <strong>custom topic</strong>? Please add a <strong>custom subject</strong> first
          (from <strong>Subjects</strong> page), then add the custom topic in that subject — it will automatically
          appear in this dropdown.
        </div>
      </div>

      <div class="rev-fixed-type">
        <span class="type-ico">🔁</span>
        <div>Study Type: <strong>Revision</strong> (fixed)</div>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>Original Date</label>
          <input type="date" id="rvOriginal" value="${todayKey()}">
        </div>
        <div class="field">
          <label>Due Date</label>
          <input type="date" id="rvDue" value="${dateKey(addDays(new Date(), 1))}">
        </div>
      </div>

      <div class="field">
        <label>Revision Number</label>
        <select id="rvNum">${revOpts}</select>
        <div style="font-size:.72rem;color:var(--text-3);margin-top:6px;line-height:1.5">
          Rev ${maxRevs} complete hone par topic auto-<strong>Completed</strong> mark ho jayega
        </div>
      </div>
    `;

    openModal(
      modalShell({
        title: '📅 Schedule Revision',
        subtitle: 'Pick category, subject, and topic',
        body,
        actions: `<button class="btn btn-secondary" data-close>Cancel</button>
          <button class="btn btn-primary" id="rvSave">Schedule</button>`,
      }),
      {
        onMount() {
          const catSel = document.getElementById('rvCategory');
          const subjSel = document.getElementById('rvSubject');
          const topicSel = document.getElementById('rvTopic');

          /* ── Category change → populate subjects ── */
          catSel.onchange = () => {
            const cat = catSel.value;

            if (!cat) {
              subjSel.innerHTML = '<option value="">— Select a category first —</option>';
              subjSel.disabled = true;
              topicSel.innerHTML = '<option value="">— Select a subject first —</option>';
              topicSel.disabled = true;
              return;
            }

            /* getSubjectsForCategory is patched by subjects-extras.js
               to include custom subjects from CAT_MAP */
            const subjects = (typeof getSubjectsForCategory === 'function' ? getSubjectsForCategory(cat) : []) || [];

            if (!subjects.length) {
              subjSel.innerHTML = '<option value="">— No subjects in this category —</option>';
              subjSel.disabled = true;
            } else {
              subjSel.innerHTML =
                '<option value="">— Select a subject —</option>' +
                subjects.map((s) => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');
              subjSel.disabled = false;
            }

            topicSel.innerHTML = '<option value="">— Select a subject first —</option>';
            topicSel.disabled = true;
          };

          /* ── Subject change → populate topics (v6: ALSO from syllabus) ── */
          subjSel.onchange = () => {
            const cat = catSel.value;
            const subj = subjSel.value;

            if (!subj) {
              topicSel.innerHTML = '<option value="">— Select a subject first —</option>';
              topicSel.disabled = true;
              return;
            }

            /* 1. Default topics from SYLLABUS object (via patched helper) */
            const defaultTopics =
              (typeof getTopicsForCategorySubject === 'function' ? getTopicsForCategorySubject(cat, subj) : []) || [];

            /* 2. Custom topics from state.syllabus — for BOTH:
                  (a) custom subjects added via Subjects page
                  (b) custom topics added to default subjects */
            const customTopics = (state.syllabus || [])
              .filter((s) => s.subject === subj && s.topic)
              .map((s) => s.topic);

            /* 3. Merge — unique only */
            const topics = [...new Set([...defaultTopics, ...customTopics])];

            if (!topics.length) {
              topicSel.innerHTML = '<option value="">— No topics yet —</option>';
              topicSel.disabled = true;
            } else {
              topicSel.innerHTML =
                '<option value="">— Select a topic —</option>' +
                topics.map((t) => `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');
              topicSel.disabled = false;
            }
          };

          setTimeout(() => catSel.focus(), 80);

          /* ── Save ── */
          document.getElementById('rvSave').onclick = async () => {
            const category = catSel.value;
            const subject = subjSel.value;
            const topic = topicSel.value;
            const originalDate = document.getElementById('rvOriginal').value;
            const dueDate = document.getElementById('rvDue').value;
            const revNum = parseInt(document.getElementById('rvNum').value, 10) || 1;

            if (!category) {
              toast('Please select a category', 'err');
              return;
            }
            if (!subject) {
              toast('Please select a subject', 'err');
              return;
            }
            if (!topic) {
              toast('Please select a topic', 'err');
              return;
            }
            if (!originalDate || !dueDate) {
              toast('Please pick both dates', 'err');
              return;
            }

            /* Resolve paper id */
            let paperId = category;
            if (typeof SYLLABUS === 'object' && SYLLABUS) {
              for (const [pid, paper] of Object.entries(SYLLABUS)) {
                if ((paper.subjects || []).some((s) => s.name === subject)) {
                  if (paper.category === category || category === 'mains') {
                    paperId = pid;
                    break;
                  }
                }
              }
            }

            const r = {
              id: safeUUID(),
              subject,
              topic,
              original_date: originalDate,
              due_date: dueDate,
              revision_number: revNum,
              status: 'pending',
              paper: paperId,
              category,
            };

            state.revisions.push(r);
            if (typeof saveLocal === 'function') saveLocal();

            if (typeof supa !== 'undefined' && supa && state.user) {
              try {
                await supa.from('revisions').insert({ ...r, user_id: state.user.id });
              } catch (e) {
                console.warn('revision insert error:', e);
              }
            }

            if (typeof closeModal === 'function') closeModal();
            if (typeof renderRevisions === 'function') renderRevisions();
            if (typeof updateBadges === 'function') updateBadges();
            if (typeof confetti === 'function') confetti();
            if (typeof toast === 'function') {
              toast(`✅ Revision ${revNum} scheduled: ${topic}`, 'ok', 3500);
            }
          };
        },
      },
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     Override Schedule Revision button
     ═══════════════════════════════════════════════════════════════ */
  function patchAddRevisionBtn() {
    const btn = document.getElementById('addRevisionBtn');
    if (!btn) {
      setTimeout(patchAddRevisionBtn, 300);
      return;
    }

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = openEnhancedScheduleRevisionModal;

    console.log('[revision-extras] patched: addRevisionBtn');
  }

  /* ═══════════════════════════════════════════════════════════════
     completeRevision — also update syllabus status
     ═══════════════════════════════════════════════════════════════ */
  function patchCompleteRevision() {
    const _orig = window.completeRevision;

    window.completeRevision = async function (id) {
      const r = state.revisions.find((x) => x.id === id);
      if (!r) return;

      const maxRevs = Math.max(1, parseInt(state.settings.max_revisions, 10) || 3);
      const revNum = parseInt(r.revision_number, 10) || 1;
      const newStatus = revNum >= maxRevs ? 'completed' : `rev${revNum}`;

      let existing = state.syllabus.find((s) => s.subject === r.subject && s.topic === r.topic);

      if (!existing) {
        existing = state.syllabus.find((s) => s.subject === r.subject && (!s.topic || s.topic === r.subject));
      }

      if (existing) {
        existing.status = newStatus;
        if (typeof window.syncSyllabus === 'function') {
          try {
            await window.syncSyllabus(existing);
          } catch (e) {}
        }
      } else {
        let paperId = r.paper;
        let cat = r.category;

        if (!paperId && typeof SYLLABUS === 'object' && SYLLABUS) {
          for (const [pid, paper] of Object.entries(SYLLABUS)) {
            if ((paper.subjects || []).some((s) => s.name === r.subject)) {
              paperId = pid;
              cat = cat || paper.category;
              break;
            }
          }
        }

        const newEntry = {
          id: safeUUID(),
          paper: paperId || 'prelims-gs1',
          subject: r.subject,
          topic: r.topic || r.subject,
          status: newStatus,
          category: cat || 'Prelims',
        };

        state.syllabus.push(newEntry);
        if (typeof window.syncSyllabus === 'function') {
          try {
            await window.syncSyllabus(newEntry);
          } catch (e) {}
        }
      }

      if (typeof _orig === 'function') {
        try {
          await _orig.call(this, id);
        } catch (e) {
          console.warn('orig completeRevision err', e);
        }
      }
    };

    try {
      completeRevision = window.completeRevision;
    } catch (e) {}

    console.log('[revision-extras] patched: completeRevision');
  }

  /* ═══════════════ INIT ═══════════════ */
  let attempts = 0;
  function waitThenStart() {
    const ready =
      typeof renderRevisions === 'function' &&
      typeof state === 'object' &&
      state !== null &&
      document.getElementById('view-revision');

    if (ready) {
      patchRenderRevisions();
      patchAddRevisionBtn();
      patchCompleteRevision();
      console.log('[revision-extras] ✅ patched all');
    } else {
      attempts++;
      if (attempts > 200) {
        console.error('[revision-extras] timeout');
        return;
      }
      setTimeout(waitThenStart, 50);
    }
  }

  waitThenStart();
})();
