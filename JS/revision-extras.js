/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Revision Extras v2 (FINAL)
   ─────────────────────────────────────────────────────────────
   ✅ "By Rev Level" view — Rev 1/2/3 → Broad Categories → Topics
   ✅ Dual-source merge:
        • state.syllabus (jinka current status = rev1/rev2/rev3)
        • state.revisions (jinki entry completed hai — Rev 3 = max case)
   ✅ Expand/collapse persisted to localStorage
   ✅ Works with max_revisions setting (1 to 10)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[revision-extras] v2 loaded');

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

  /* ═══════════════ DUAL-SOURCE MERGE ═══════════════ */
  /**
   * Ek Rev level (e.g. rev1) ke liye saare topics nikaalo — 2 sources se:
   *  1. state.syllabus jinka CURRENT status = `rev${N}`
   *  2. state.revisions jinki `revision_number = N` aur `status = 'completed'`
   *     (Ye catch karta hai jab Rev 3 = maxRevs ho aur syllabus status 'completed' ho jaye)
   */
  function getTopicsForRevLevel(revNum) {
    const revStatus = `rev${revNum}`;
    const map = new Map(); // key: subject|topic → { subject, topic, paper, category, source }

    // Source 1: Syllabus with current rev status
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

    // Source 2: Completed revisions history (catch maxRevs case)
    state.revisions.forEach((r) => {
      if (r.revision_number === revNum && r.status === 'completed') {
        const key = `${r.subject}|${r.topic}`;
        if (!map.has(key)) {
          const syl = state.syllabus.find((s) => s.subject === r.subject && s.topic === r.topic);
          map.set(key, {
            subject: r.subject,
            topic: r.topic,
            paper: syl?.paper || '',
            category: syl?.category || '',
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
      /* ═══ View Toggle ═══ */
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

      /* ═══ Summary Strip ═══ */
      .rev-summary-strip {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .rev-summary-chip {
        flex: 1;
        min-width: 90px;
        padding: 12px 14px;
        background: var(--card-2);
        border: 1px solid var(--border);
        border-radius: 12px;
        text-align: center;
      }
      .rev-summary-chip .lbl {
        font-size: 0.62rem;
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

      /* ═══ Rev Level Card ═══ */
      .rev-level-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        overflow: hidden;
        margin-bottom: 12px;
        transition: border-color 0.2s;
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
        font-size: 0.88rem;
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

      /* ═══ Category Group ═══ */
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

      /* ═══ Topic Item ═══ */
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

      /* ═══ Empty State ═══ */
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

      /* ═══ Mobile ═══ */
      @media (max-width: 700px) {
        .rev-view-toggle { width: 100%; justify-content: stretch; }
        .rev-view-toggle button { flex: 1; padding: 8px 10px; font-size: 0.76rem; }
        .rev-level-head { padding: 13px 14px; gap: 10px; }
        .rev-level-badge { width: 36px; height: 36px; font-size: 0.78rem; }
        .rev-level-title { font-size: 0.9rem; }
        .rev-level-body { padding: 12px 14px; }
        .rev-topic-item { flex-wrap: wrap; }
        .rev-topic-subject { font-size: 0.62rem; }
        .rev-summary-chip { min-width: 70px; padding: 10px; }
        .rev-summary-chip .val { font-size: 1.15rem; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════ RENDER "BY REV LEVEL" VIEW ═══════════════ */
  function renderRevLevelView() {
    const maxRevs = Math.max(1, parseInt(state.settings.max_revisions, 10) || 3);
    const container = document.getElementById('revisionsList');
    if (!container) return;

    const revCounts = [];
    let totalInRevs = 0;

    for (let i = 1; i <= maxRevs; i++) {
      const c = getTopicsForRevLevel(i).length;
      revCounts.push({
        num: i,
        count: c,
        color: REV_COLORS[(i - 1) % REV_COLORS.length],
      });
      totalInRevs += c;
    }

    let html = '';

    /* Summary strip (top) */
    if (totalInRevs > 0) {
      html += `<div class="rev-summary-strip">
        ${revCounts
          .map(
            (r) => `
          <div class="rev-summary-chip">
            <div class="lbl">Rev ${r.num}${r.num === maxRevs ? ' (Final)' : ''}</div>
            <div class="val" style="color:${r.color}">${r.count}</div>
          </div>
        `,
          )
          .join('')}
      </div>`;
    }

    /* Each Rev level card */
    for (let i = 1; i <= maxRevs; i++) {
      const revStatus = `rev${i}`;
      const topics = getTopicsForRevLevel(i);

      /* Group by broad category */
      const grouped = {};
      topics.forEach((t) => {
        const broad = getBroadCategory(t.paper, t.category);
        if (!grouped[broad]) grouped[broad] = [];
        grouped[broad].push(t);
      });

      /* Sort topics alphabetically within each category */
      Object.values(grouped).forEach((arr) => arr.sort((a, b) => (a.topic || '').localeCompare(b.topic || '')));

      const isOpen = expandedRevLevels[revStatus] !== false;
      const color = REV_COLORS[(i - 1) % REV_COLORS.length];
      const totalCount = topics.length;
      const catCount = Object.keys(grouped).length;
      const isFinal = i === maxRevs;

      html += `
        <div class="rev-level-card">
          <div class="rev-level-head ${isOpen ? 'open' : ''}" data-rev-toggle="${revStatus}">
            <span class="rev-level-arrow">▶</span>
            <div class="rev-level-badge" style="background:linear-gradient(135deg,${color},${color}bb)">R${i}</div>
            <div class="rev-level-info">
              <div class="rev-level-title">
                Revision ${i}
                ${isFinal ? '<span style="font-size:.62rem;color:#FBBF24;font-weight:900;margin-left:8px;letter-spacing:.06em">FINAL</span>' : ''}
              </div>
              <div class="rev-level-sub">
                ${
                  totalCount === 0
                    ? 'Koi topic abhi is rev me nahi'
                    : `${catCount} categor${catCount !== 1 ? 'ies' : 'y'} · click to expand`
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
                    <div style="font-weight:700;color:var(--text-2)">Abhi koi topic Rev ${i} me nahi hai</div>
                    <div style="font-size:.75rem;margin-top:6px;line-height:1.6">
                      Study session log karo → Study Type = <strong style="color:var(--text-2)">Revision</strong> → Rev ${i} select karo
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

    /* Global empty state — kuch bhi nahi */
    if (totalInRevs === 0) {
      html = `
        <div class="rev-empty-state" style="padding:60px 24px;background:var(--card);border-radius:16px;border:1px dashed var(--border-2)">
          <div class="em" style="font-size:3rem">📚</div>
          <div style="font-weight:800;font-size:1.15rem;color:var(--text);margin-bottom:8px">
            Koi Revision Nahi Hui Abhi
          </div>
          <div style="font-size:.86rem;color:var(--text-2);line-height:1.7;max-width:440px;margin:0 auto">
            Jab aap koi session log karo aur <strong style="color:#C4B5FD">🔁 Revision</strong> type select karke
            <strong style="color:#C4B5FD">Rev 1 / Rev 2 / Rev 3</strong> choose karo, toh woh topic yahan
            category-wise dikhega.
          </div>
          <button class="btn btn-primary" style="margin-top:20px" onclick="switchView('study')">
            ⏱ Start Study Session
          </button>
        </div>
      `;
    }

    container.innerHTML = html;

    /* Wire expand/collapse toggles */
    container.querySelectorAll('[data-rev-toggle]').forEach((head) => {
      head.onclick = () => {
        const key = head.dataset.revToggle;
        head.classList.toggle('open');
        expandedRevLevels[key] = head.classList.contains('open');
        saveExpanded();
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

      /* Create / ensure view toggle exists */
      let toggle = document.getElementById('revViewToggle');
      if (!toggle) {
        toggle = document.createElement('div');
        toggle.id = 'revViewToggle';
        toggle.className = 'rev-view-toggle';
        toggle.innerHTML = `
          <button data-mode="schedule">📅 Schedule</button>
          <button data-mode="revlevel">📚 By Rev Level</button>
        `;

        if (cardHeader) {
          cardHeader.insertAdjacentElement('afterend', toggle);
        } else if (card) {
          card.insertBefore(toggle, card.firstChild);
        }

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

      /* Active toggle state */
      toggle.querySelectorAll('[data-mode]').forEach((b) => {
        b.classList.toggle('active', b.dataset.mode === revViewMode);
      });

      const kpiGrid = document.getElementById('revisionKpis');
      const tabs = document.getElementById('revFilterTabs');

      if (revViewMode === 'revlevel') {
        /* Hide schedule-only UI */
        if (kpiGrid) kpiGrid.style.display = 'none';
        if (tabs) tabs.style.display = 'none';
        renderRevLevelView();
      } else {
        /* Show schedule UI and call original */
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
      console.log('[revision-extras] ✅ patched');
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
