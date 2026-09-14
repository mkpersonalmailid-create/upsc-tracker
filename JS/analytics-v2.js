/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Analytics v5 (compact · 2-col grid · expandable)
   ─────────────────────────────────────────────────────────────
   ✅ Compact charts (130px) — 2 charts per row on desktop
   ✅ Expand mode with legends/stats in modal
   ✅ Info buttons with English explanations
   ✅ 4 Tabs: Overview | Progress | Subjects | Tests
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[analytics-v2] v5 loaded');

  const CAT_LABELS = {
    prelims: '🎯 GS Prelims',
    'mains-gs1': '📘 GS Mains · Paper I',
    'mains-gs2': '📗 GS Mains · Paper II',
    'mains-gs3': '📙 GS Mains · Paper III',
    'mains-gs4': '📕 GS Mains · Paper IV',
    optional: '⭐ Optional',
    essay: '✍️ Essay',
    csat: '🧮 CSAT',
  };
  const CAT_COLORS = ['#A855F7', '#EC4899', '#F97316', '#FBBF24', '#14B8A6', '#06B6D4', '#10B981', '#8B5CF6'];

  let anV2 = { tab: 'overview' };
  const CHART_REG = {};

  /* ═══════════════ HELPERS ═══════════════ */
  function escHtml(s) {
    return String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function elFrom(html) {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }
  function catLabel(c) {
    return CAT_LABELS[c] || (c ? c.replace(/-/g, ' ') : 'Other');
  }
  function catColorFor(c) {
    const idx = Object.keys(CAT_LABELS).indexOf(c);
    return CAT_COLORS[(idx < 0 ? 0 : idx) % CAT_COLORS.length];
  }
  function shortDur(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }
  function fmtDateKey(key) {
    if (!key) return '';
    const d = new Date(key + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  function daysAgoKey(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return (
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    );
  }
  function todayKeyLocal() {
    return daysAgoKey(0);
  }

  /* ═══════════════ SYLLABUS CALCULATOR ═══════════════ */
  function calcSyllabusStats() {
    const tracked = state.syllabus || [];
    const userSubjects = state.subjects || [];
    const defaultTopicKeys = new Set();
    let defaultTotal = 0;
    if (typeof SYLLABUS !== 'undefined') {
      Object.entries(SYLLABUS).forEach(([pid, paper]) => {
        (paper.subjects || []).forEach((sub) => {
          (sub.topics || []).forEach((t) => {
            defaultTotal++;
            defaultTopicKeys.add(`${sub.name}|${t}`);
          });
        });
      });
    }
    const customSubjects = userSubjects.filter((s) => {
      if (typeof SYLLABUS === 'undefined') return true;
      return !Object.values(SYLLABUS).some((p) => (p.subjects || []).some((x) => x.name === s.name));
    });
    const customSubjectNames = new Set(customSubjects.map((s) => s.name));
    let customSubjectTopicCount = 0,
      customTopicUnderDefaultCount = 0;
    tracked.forEach((t) => {
      const key = `${t.subject}|${t.topic}`;
      if (customSubjectNames.has(t.subject)) customSubjectTopicCount++;
      else if (!defaultTopicKeys.has(key)) customTopicUnderDefaultCount++;
    });
    const total = defaultTotal + customSubjectTopicCount + customTopicUnderDefaultCount;
    const statusCounts = { not_started: 0, learning: 0, completed: 0, rev1: 0, rev2: 0, rev3: 0 };
    tracked.forEach((t) => {
      const s = t.status || 'not_started';
      if (statusCounts[s] != null) statusCounts[s]++;
    });
    const explicitlyTouched = tracked.filter((t) => t.status && t.status !== 'not_started').length;
    statusCounts.not_started = Math.max(0, total - explicitlyTouched);
    const completedPct = total ? Math.round((statusCounts.completed / total) * 100) : 0;
    return {
      total,
      defaultTotal,
      customSubjectTopicCount,
      customTopicUnderDefaultCount,
      customSubjectsCount: customSubjects.length,
      ...statusCounts,
      completedPct,
      touched: explicitlyTouched,
      revTotal: statusCounts.rev1 + statusCounts.rev2 + statusCounts.rev3,
    };
  }

  /* ═══════════════ INFO / EXPAND BUTTONS ═══════════════ */
  function infoBtn(title, bodyHtml) {
    const id = 'anv2Info_' + Math.random().toString(36).slice(2, 9);
    setTimeout(() => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.onclick = (e) => {
        e.stopPropagation();
        if (typeof openModal !== 'function' || typeof modalShell !== 'function') return;
        openModal(
          modalShell({ title, body: bodyHtml, actions: '<button class="btn btn-ghost" data-close>Got it</button>' }),
        );
      };
    }, 30);
    return `<button class="anv2-info-btn" id="${id}" title="How is this calculated?">ⓘ</button>`;
  }
  function expandBtn(canvasId) {
    return `<button class="anv2-expand-btn" data-expand="${canvasId}" title="Expand chart">⛶</button>`;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('[data-expand]');
    if (!btn) return;
    const cfg = CHART_REG[btn.dataset.expand];
    if (!cfg) return;
    if (typeof openModal !== 'function' || typeof modalShell !== 'function') return;

    openModal(
      modalShell({
        title: cfg.title || 'Chart',
        subtitle: cfg.subtitle || '',
        body: `
        <div style="position:relative;width:100%;height:min(55vh,440px);min-height:280px"><canvas id="__anv2_expanded"></canvas></div>
        <div id="__anv2_expanded_legend" style="margin-top:14px;display:flex;flex-wrap:wrap;gap:12px;font-size:.85rem;line-height:1.8"></div>
      `,
        actions: '<button class="btn btn-ghost" data-close>Close</button>',
      }),
      {
        onMount() {
          setTimeout(() => {
            const cv = document.getElementById('__anv2_expanded');
            if (cv) {
              try {
                cfg.draw(cv, true);
              } catch (err) {
                console.warn('[expand]', err);
              }
            }
            const legEl = document.getElementById('__anv2_expanded_legend');
            if (legEl && cfg.legendHtml) legEl.innerHTML = cfg.legendHtml;
          }, 120);
        },
      },
    );
  });

  /* ═══════════════ INFO CONTENT ═══════════════ */
  const INFO = {
    today: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p><strong style="color:var(--text)">Today's study time</strong> = total duration of all sessions logged today.</p><p style="margin-top:10px"><strong style="color:var(--text)">Percentage</strong> = (Today's time ÷ Daily target) × 100</p></div>`,
    streak: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p><strong style="color:var(--text)">Streak</strong> = consecutive days with at least 1 minute of study.</p><p style="margin-top:10px">Skip a day → streak resets. <strong>Best</strong> = longest streak ever.</p></div>`,
    syllabus: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p><strong style="color:var(--text)">Syllabus %</strong> = (Completed ÷ Total) × 100</p><p style="margin-top:10px">Total includes default UPSC topics + custom subjects + custom topics under default subjects.</p><p style="margin-top:10px">⚠️ Rev 1/2/3 are <strong>in progress</strong>, not complete.</p></div>`,
    trend: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p><strong style="color:var(--text)">Last 7 vs previous 7 days.</strong></p><p style="margin-top:10px">Trend = ((Last 7 − Prev 7) ÷ Prev 7) × 100</p></div>`,
    dailyChart: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Daily study hours over time.</p><p style="margin-top:10px"><strong style="color:#FBBF24">Yellow dashed line</strong> = your target.</p></div>`,
    rollingAvg: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Rolling average smooths out daily fluctuations.</p><p style="margin-top:10px"><strong>7-day avg</strong> = last 7 days total ÷ 7.</p></div>`,
    deepWork: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Sessions grouped by duration. UPSC needs 90+ min deep work.</p></div>`,
    studyType: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>New Learning vs Revision vs Test. Ideal: 40/50/10.</p></div>`,
    timeOfDay: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Time spent in Morning / Afternoon / Evening / Night.</p></div>`,
    productivity: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Self-rated productivity per day (1-5 stars).</p></div>`,
    energy: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Self-rated energy per day (1-5).</p></div>`,
    insights: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Auto-generated from your data.</p></div>`,
    sylStatus: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Status count for every topic. Completed = after max_revisions done.</p></div>`,
    revision: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Due / Overdue / Upcoming / Completed revisions.</p></div>`,
    goals: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Goal progress = (Current ÷ Target) × 100</p></div>`,
    countdown: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Days remaining until Prelims & Mains. Set dates in Settings.</p></div>`,
    pace: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Projected completion at current pace.</p><p style="margin-top:10px">Pace = topics completed per week (last 7 days).</p></div>`,
    missedDays: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Days with zero study in last 30 days.</p></div>`,
    categoryDist: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Time per UPSC category. Check balance.</p></div>`,
    categoryStudyType: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>New vs Revision vs Test per category.</p></div>`,
    subjectCompare: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Time, sessions, last date per subject.</p></div>`,
    neglected: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Subjects not touched in 7+ days.</p></div>`,
    testRecords: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>All logged tests. Score % = (Score ÷ Total) × 100</p></div>`,
    testAccuracy: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Accuracy = (Correct ÷ Attempted) × 100</p></div>`,
    testError: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>Error rate = Incorrect ÷ Attempted. Attempt rate = Attempted ÷ Total.</p></div>`,
    pyq: `<div style="font-size:.85rem;line-height:1.7;color:var(--text-2)"><p>PYQ practice. Accuracy = Correct ÷ Solved.</p></div>`,
  };

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    const old = document.getElementById('anv2CSS');
    if (old) old.remove();
    const s = document.createElement('style');
    s.id = 'anv2CSS';
    s.textContent = `
      .anv2-wrap { display:flex; flex-direction:column; gap:10px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; }
      .anv2-wrap *, .anv2-wrap *::before, .anv2-wrap *::after { box-sizing:border-box; }

      .anv2-hero {
        background: linear-gradient(135deg, rgba(168,85,247,.14), rgba(236,72,153,.08), rgba(249,115,22,.05));
        border: 1px solid rgba(168,85,247,.28);
        border-radius: 14px; padding: 12px;
        position:relative; overflow:hidden;
      }
      .anv2-hero::before {
        content:''; position:absolute; top:-50%; right:-20%;
        width:280px; height:280px;
        background: radial-gradient(circle, rgba(168,85,247,.22), transparent 65%);
        pointer-events:none;
      }
      .anv2-hero-grid {
        display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap:8px; position:relative; z-index:1;
      }
      .anv2-hero-card {
        background: rgba(0,0,0,.28); border:1px solid rgba(255,255,255,.08);
        border-radius:10px; padding:10px 11px;
        display:flex; flex-direction:column; gap:2px; min-width:0;
      }
      .anv2-hero-card .lbl {
        font-size:.56rem; font-weight:800; letter-spacing:.1em;
        text-transform:uppercase; color:var(--text-3);
        display:flex; align-items:center; gap:4px;
      }
      .anv2-hero-card .val {
        font-size: clamp(1rem, 2.6vw, 1.35rem);
        font-weight: 900; letter-spacing:-.02em; line-height:1.1;
        background: linear-gradient(135deg, #fff, #c4b5fd);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      }
      .anv2-hero-card .sub { font-size:.62rem; color:var(--text-3); overflow:hidden; text-overflow:ellipsis; }
      .anv2-hero-card.accent-pink .val { background: linear-gradient(135deg, #f9a8d4, #ec4899); -webkit-background-clip: text; background-clip: text; }
      .anv2-hero-card.accent-orange .val { background: linear-gradient(135deg, #fdba74, #f97316); -webkit-background-clip: text; background-clip: text; }
      .anv2-hero-card.accent-teal .val { background: linear-gradient(135deg, #5eead4, #14b8a6); -webkit-background-clip: text; background-clip: text; }

      .anv2-info-btn {
        display:inline-flex; align-items:center; justify-content:center;
        width:16px; height:16px; border-radius:50%;
        background: rgba(168,85,247,.18); border:1px solid rgba(168,85,247,.4);
        color:#C4B5FD; font-size:.6rem; cursor:pointer;
        transition: all .2s; flex-shrink:0; padding:0; font-weight:800;
      }
      .anv2-info-btn:hover { background:rgba(168,85,247,.32); transform:scale(1.15); color:#fff; }
      .anv2-expand-btn {
        display:inline-flex; align-items:center; justify-content:center;
        width:22px; height:22px; border-radius:6px;
        background: rgba(168,85,247,.12); border:1px solid rgba(168,85,247,.35);
        color:#C4B5FD; font-size:.75rem; cursor:pointer;
        transition: all .2s; flex-shrink:0; padding:0;
      }
      .anv2-expand-btn:hover { background:rgba(168,85,247,.35); transform:scale(1.1); color:#fff; }

      .anv2-tabs {
        display:flex; gap:4px; background:var(--bg-2); border:1px solid var(--border);
        border-radius:11px; padding:3px; overflow-x:auto; scrollbar-width:none; -webkit-overflow-scrolling:touch;
      }
      .anv2-tabs::-webkit-scrollbar { display:none; }
      .anv2-tab {
        flex:1; min-width:78px; padding:8px 10px; border-radius:7px;
        font-size:.74rem; font-weight:700; color:var(--text-3);
        background: transparent; border:none; cursor:pointer; transition:all .2s;
        white-space:nowrap; display:flex; align-items:center; justify-content:center; gap:4px;
      }
      .anv2-tab:hover { color:var(--text-2); background:var(--card); }
      .anv2-tab.active {
        background: linear-gradient(135deg, #8b5cf6, #ec4899);
        color:#fff; box-shadow: 0 4px 12px rgba(168,85,247,.35);
      }

      .anv2-sec-head {
        display:flex; align-items:center; gap:8px;
        margin-bottom:10px; padding-bottom:8px;
        border-bottom:1px dashed var(--border);
      }
      .anv2-sec-icon {
        width:28px; height:28px; border-radius:8px;
        background: linear-gradient(135deg, rgba(168,85,247,.2), rgba(236,72,153,.12));
        border:1px solid rgba(168,85,247,.35);
        display:flex; align-items:center; justify-content:center;
        font-size:.85rem; flex-shrink:0;
      }
      .anv2-sec-title { font-size:.82rem; font-weight:800; letter-spacing:-.01em; color:var(--text); line-height:1.2; }
      .anv2-sec-sub { font-size:.64rem; color:var(--text-3); margin-top:1px; }

      .anv2-card {
        background: var(--card); border:1px solid var(--border);
        border-radius:12px; padding:12px;
        width:100%; max-width:100%; overflow-x:hidden;
        display:flex; flex-direction:column;
      }

      .anv2-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        width: 100%;
      }
      .anv2-grid-full { grid-column: 1 / -1; }
      @media (max-width: 900px) {
        .anv2-grid { grid-template-columns: 1fr; }
      }

      .anv2-empty { text-align:center; padding:20px 14px; color:var(--text-3); }
      .anv2-empty-icon { font-size:1.7rem; margin-bottom:6px; opacity:.7; }
      .anv2-empty-title { font-size:.82rem; font-weight:800; color:var(--text-2); margin-bottom:4px; }
      .anv2-empty-desc { font-size:.72rem; color:var(--text-3); line-height:1.5; max-width:280px; margin:0 auto 10px; }

      .anv2-chart-wrap { position:relative; width:100%; height:130px; min-width:0; max-width:100%; flex:1; }
      .anv2-chart-wrap canvas { display:block !important; width:100% !important; max-width:100% !important; }
      .anv2-chart-tall { height:160px; }
      .anv2-chart-sm { height:110px; }

      .anv2-split {
        display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap:10px; align-items:center;
      }
      .anv2-legend { display:flex; flex-direction:column; gap:5px; font-size:.72rem; min-width:0; }
      .anv2-legend-row { display:flex; align-items:center; gap:6px; }
      .anv2-legend-row .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
      .anv2-legend-row .lbl { flex:1; min-width:0; color:var(--text-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .anv2-legend-row .val { color:var(--text); font-weight:700; flex-shrink:0; font-size:.72rem; }

      .anv2-table-scroll { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
      .anv2-table { width:100%; min-width:340px; border-collapse:collapse; font-size:.72rem; }
      .anv2-table th {
        text-align:left; font-size:.6rem; font-weight:800;
        letter-spacing:.06em; text-transform:uppercase; color:var(--text-3);
        padding:6px 5px; border-bottom:1px solid var(--border); white-space:nowrap;
      }
      .anv2-table td {
        padding:7px 5px; border-bottom:1px solid var(--border);
        color:var(--text-2); white-space:nowrap;
      }
      .anv2-table tr:last-child td { border-bottom:none; }
      .anv2-table .subject-dot {
        display:inline-block; width:7px; height:7px; border-radius:50%;
        margin-right:5px; vertical-align:middle;
      }

      .anv2-tab-content { display:flex; flex-direction:column; gap:10px; width:100%; max-width:100%; }

      .anv2-kpi-grid {
        display:grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
        gap:6px;
      }
      .anv2-mini-kpi {
        background:var(--card-2); border:1px solid var(--border);
        border-radius:9px; padding:8px 10px;
        position:relative; overflow:hidden; min-width:0;
      }
      .anv2-mini-kpi::before {
        content:''; position:absolute; left:0; top:0; bottom:0;
        width:3px; background: var(--c, var(--purple));
      }
      .anv2-mini-kpi .lbl {
        font-size:.55rem; font-weight:800; letter-spacing:.06em;
        text-transform:uppercase; color:var(--text-3); margin-bottom:3px;
      }
      .anv2-mini-kpi .val {
        font-size:1rem; font-weight:900; letter-spacing:-.02em;
        line-height:1.1; color:var(--text);
      }
      .anv2-mini-kpi .sub { font-size:.6rem; color:var(--text-3); margin-top:1px; }

      .anv2-goal-row {
        padding:9px 11px; background:var(--card-2);
        border:1px solid var(--border); border-radius:9px; margin-bottom:6px;
      }
      .anv2-goal-row:last-child { margin-bottom:0; }

      .anv2-chart-actions {
        display:flex; justify-content:flex-end; margin-top:6px; gap:6px;
      }

      @media (max-width:640px) {
        .anv2-hero { padding:11px; border-radius:14px; }
        .anv2-hero-grid { gap:6px; }
        .anv2-hero-card { padding:9px 10px; }
        .anv2-hero-card .lbl { font-size:.52rem; }
        .anv2-hero-card .sub { font-size:.58rem; }
        .anv2-card { padding:10px; border-radius:11px; }
        .anv2-sec-title { font-size:.78rem; }
        .anv2-sec-icon { width:26px; height:26px; font-size:.78rem; }
        .anv2-chart-wrap { height:120px; }
        .anv2-chart-tall { height:140px; }
        .anv2-tab { font-size:.68rem; padding:7px 8px; min-width:68px; }
        .anv2-kpi-grid { grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); }
        .anv2-mini-kpi { padding:7px 9px; }
        .anv2-mini-kpi .val { font-size:.9rem; }
      }
      @media (max-width:400px) {
        .anv2-hero-grid { grid-template-columns: repeat(2, 1fr); }
        .anv2-hero-card .val { font-size:.95rem; }
      }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════ SECTION HELPERS ═══════════════ */
  function sectionHead(icon, title, subtitle, infoKey) {
    return `
      <div class="anv2-sec-head">
        <div class="anv2-sec-icon">${icon}</div>
        <div style="flex:1;min-width:0">
          <div class="anv2-sec-title">${escHtml(title)}</div>
          ${subtitle ? `<div class="anv2-sec-sub">${escHtml(subtitle)}</div>` : ''}
        </div>
        ${infoKey && INFO[infoKey] ? infoBtn(title, INFO[infoKey]) : ''}
      </div>`;
  }
  function emptyState(icon, title, desc, ctaText, ctaId) {
    return `
      <div class="anv2-empty">
        <div class="anv2-empty-icon">${icon}</div>
        <div class="anv2-empty-title">${escHtml(title)}</div>
        <div class="anv2-empty-desc">${escHtml(desc)}</div>
        ${ctaText ? `<button class="btn btn-primary btn-sm" id="${ctaId}">${escHtml(ctaText)}</button>` : ''}
      </div>`;
  }
  function miniKpi(label, value, sub, color) {
    return `
      <div class="anv2-mini-kpi" style="--c:${color}">
        <div class="lbl">${escHtml(label)}</div>
        <div class="val">${escHtml(value)}</div>
        ${sub ? `<div class="sub">${escHtml(sub)}</div>` : ''}
      </div>`;
  }
  function chartCard({ icon, title, subtitle, infoKey, canvasId, height = 130 }) {
    return `
      <div class="anv2-card">
        ${sectionHead(icon, title, subtitle, infoKey)}
        <div class="anv2-chart-wrap" style="height:${height}px"><canvas id="${canvasId}"></canvas></div>
        <div class="anv2-chart-actions">${expandBtn(canvasId)}</div>
      </div>`;
  }
  function registerChart(canvasId, title, subtitle, drawFn, legendHtml) {
    CHART_REG[canvasId] = { title, subtitle, draw: drawFn, legendHtml };
  }

  /* ═══════════════ CHART PRIMITIVES ═══════════════ */
  function drawLineWithTarget(canvas, labels, values, target) {
    if (!canvas || !canvas.parentElement || typeof window.setupCanvas !== 'function') return;
    const { ctx, w, h } = window.setupCanvas(canvas);
    if (!ctx) return;
    const c = typeof window.themeColors === 'function' ? window.themeColors() : { border: '#2A1E42', text3: '#6E5F8C' };
    const p = { t: 14, r: 10, b: 22, l: 34 };
    const cw = w - p.l - p.r,
      ch = h - p.t - p.b;
    const max = Math.max(...values, target || 0, 4) * 1.1;
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = p.t + (ch / 3) * i;
      ctx.beginPath();
      ctx.moveTo(p.l, y);
      ctx.lineTo(w - p.r, y);
      ctx.stroke();
      ctx.fillStyle = c.text3;
      ctx.font = '9px Inter,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText((max - (max / 3) * i).toFixed(1) + 'h', p.l - 5, y + 3);
    }
    if (target > 0) {
      const ty = p.t + ch - (target / max) * ch;
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.l, ty);
      ctx.lineTo(w - p.r, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 8px Inter,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Target ' + target + 'h', p.l + 3, ty - 2);
    }
    if (!values.length) return;
    const n = values.length;
    const xFor = (i) => p.l + (i / Math.max(1, n - 1)) * cw;
    const yFor = (v) => p.t + ch - (v / max) * ch;
    ctx.beginPath();
    ctx.moveTo(xFor(0), p.t + ch);
    values.forEach((v, i) => ctx.lineTo(xFor(i), yFor(v)));
    ctx.lineTo(xFor(n - 1), p.t + ch);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, p.t, 0, p.t + ch);
    g.addColorStop(0, 'rgba(168,85,247,.35)');
    g.addColorStop(1, 'rgba(168,85,247,0)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.beginPath();
    values.forEach((v, i) => (i === 0 ? ctx.moveTo(xFor(i), yFor(v)) : ctx.lineTo(xFor(i), yFor(v))));
    const lg = ctx.createLinearGradient(p.l, 0, w - p.r, 0);
    lg.addColorStop(0, '#A855F7');
    lg.addColorStop(1, '#EC4899');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = c.text3;
    ctx.font = '9px Inter,sans-serif';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.ceil(n / 5));
    labels.forEach((lab, i) => {
      if (i % step !== 0 && i !== n - 1) return;
      ctx.fillText(lab, xFor(i), h - 6);
    });
  }

  function drawLineSimple(canvas, labels, values, opts = {}) {
    if (!canvas || !canvas.parentElement || typeof window.setupCanvas !== 'function') return;
    const { ctx, w, h } = window.setupCanvas(canvas);
    if (!ctx) return;
    const c = typeof window.themeColors === 'function' ? window.themeColors() : { border: '#2A1E42', text3: '#6E5F8C' };
    const p = { t: 14, r: 10, b: 22, l: 34 };
    const cw = w - p.l - p.r,
      ch = h - p.t - p.b;
    const max = Math.max(...values, opts.minMax || 5) * 1.1;
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = p.t + (ch / 3) * i;
      ctx.beginPath();
      ctx.moveTo(p.l, y);
      ctx.lineTo(w - p.r, y);
      ctx.stroke();
      ctx.fillStyle = c.text3;
      ctx.font = '9px Inter,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText((max - (max / 3) * i).toFixed(opts.unit === 'h' ? 1 : 0) + (opts.unit || ''), p.l - 5, y + 3);
    }
    if (!values.length) return;
    const n = values.length;
    const xFor = (i) => p.l + (i / Math.max(1, n - 1)) * cw;
    const yFor = (v) => p.t + ch - (v / max) * ch;
    ctx.beginPath();
    values.forEach((v, i) => (i === 0 ? ctx.moveTo(xFor(i), yFor(v)) : ctx.lineTo(xFor(i), yFor(v))));
    ctx.strokeStyle = opts.color || '#A855F7';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = c.text3;
    ctx.font = '9px Inter,sans-serif';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.ceil(n / 5));
    labels.forEach((lab, i) => {
      if (i % step !== 0 && i !== n - 1) return;
      ctx.fillText(lab, xFor(i), h - 6);
    });
  }

  /* ═══════════════ HERO ═══════════════ */
  function renderHero() {
    const sessions = state.sessions || [];
    const todaySec = sessions.filter((s) => s.date === todayKeyLocal()).reduce((a, s) => a + (s.duration || 0), 0);
    const target = (state.settings?.daily_target || 8) * 3600;
    const todayPct = target ? Math.round((todaySec / target) * 100) : 0;
    const streak = typeof computeStreak === 'function' ? computeStreak() : 0;
    const bestStreak = typeof computeLongestStreak === 'function' ? computeLongestStreak() : 0;
    const sylStats = calcSyllabusStats();
    let last7 = 0,
      prev7 = 0;
    for (let i = 0; i < 7; i++)
      last7 += sessions.filter((s) => s.date === daysAgoKey(i)).reduce((a, s) => a + (s.duration || 0), 0);
    for (let i = 7; i < 14; i++)
      prev7 += sessions.filter((s) => s.date === daysAgoKey(i)).reduce((a, s) => a + (s.duration || 0), 0);
    let trendPct = 0,
      trendIcon = '—';
    if (prev7 > 0) {
      trendPct = Math.round(((last7 - prev7) / prev7) * 100);
      trendIcon = trendPct > 0 ? '↑' : trendPct < 0 ? '↓' : '—';
    }
    return `
      <div class="anv2-hero">
        <div class="anv2-hero-grid">
          <div class="anv2-hero-card accent-teal">
            <div class="lbl">Today ${infoBtn('Today Study', INFO.today)}</div>
            <div class="val">${shortDur(todaySec)}</div>
            <div class="sub">${todayPct}% of ${state.settings?.daily_target || 8}h</div>
          </div>
          <div class="anv2-hero-card accent-pink">
            <div class="lbl">🔥 Streak ${infoBtn('Streak', INFO.streak)}</div>
            <div class="val">${streak}d</div>
            <div class="sub">Best: ${bestStreak}d</div>
          </div>
          <div class="anv2-hero-card">
            <div class="lbl">📖 Syllabus ${infoBtn('Syllabus %', INFO.syllabus)}</div>
            <div class="val">${sylStats.completedPct}%</div>
            <div class="sub">${sylStats.completed}/${sylStats.total}</div>
          </div>
          <div class="anv2-hero-card accent-orange">
            <div class="lbl">7-Day ${infoBtn('7-Day Trend', INFO.trend)}</div>
            <div class="val">${trendIcon} ${prev7 > 0 ? Math.abs(trendPct) + '%' : '—'}</div>
            <div class="sub">${shortDur(last7)} vs ${shortDur(prev7)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderTabs() {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'progress', label: 'Progress', icon: '📖' },
      { id: 'subjects', label: 'Subjects', icon: '📚' },
      { id: 'tests', label: 'Tests', icon: '📝' },
    ];
    return `
      <div class="anv2-tabs" id="anv2Tabs">
        ${tabs.map((t) => `<button class="anv2-tab ${anV2.tab === t.id ? 'active' : ''}" data-anv2-tab="${t.id}">${t.icon} ${t.label}</button>`).join('')}
      </div>`;
  }

  /* ═══════════════ TAB: OVERVIEW ═══════════════ */
  function renderOverview() {
    const wrap = document.createElement('div');
    wrap.className = 'anv2-tab-content';
    const sessions = state.sessions || [];
    const target = state.settings?.daily_target || 8;

    const labels1 = [],
      values1 = [];
    for (let i = 29; i >= 0; i--) {
      const key = daysAgoKey(i);
      labels1.push(fmtDateKey(key));
      values1.push(sessions.filter((s) => s.date === key).reduce((a, s) => a + (s.duration || 0), 0) / 3600);
    }
    const totalDailyH = values1.reduce((a, b) => a + b, 0);
    const avgDaily = totalDailyH / 30;
    const bestDaily = Math.max(...values1);
    wrap.appendChild(
      elFrom(`
      <div class="anv2-card anv2-grid-full">
        ${sectionHead('📈', 'Daily Study Time', 'Last 30 days · target overlay', 'dailyChart')}
        <div class="anv2-chart-wrap anv2-chart-tall"><canvas id="anv2DailyChart"></canvas></div>
        <div class="anv2-chart-actions">${expandBtn('anv2DailyChart')}</div>
      </div>
    `),
    );
    registerChart(
      'anv2DailyChart',
      'Daily Study Time',
      'Last 30 days',
      (cv) => drawLineWithTarget(cv, labels1, values1, target),
      `<span style="color:var(--text-2)">Total: <strong style="color:var(--text)">${totalDailyH.toFixed(1)}h</strong></span>
       <span style="color:var(--text-2)">Avg/day: <strong style="color:var(--text)">${avgDaily.toFixed(2)}h</strong></span>
       <span style="color:var(--text-2)">Best day: <strong style="color:var(--text)">${bestDaily.toFixed(1)}h</strong></span>
       <span style="color:var(--text-2)">Target: <strong style="color:#FBBF24">${target}h</strong></span>`,
    );

    const grid = document.createElement('div');
    grid.className = 'anv2-grid';

    const roll7 = [],
      rollLabels = [];
    for (let i = 29; i >= 0; i--) {
      rollLabels.push(fmtDateKey(daysAgoKey(i)));
      let s7 = 0;
      for (let j = 0; j < 7; j++) {
        s7 += sessions.filter((s) => s.date === daysAgoKey(i + j)).reduce((a, s) => a + (s.duration || 0), 0);
      }
      roll7.push(s7 / 7 / 3600);
    }
    const avg7 = roll7[roll7.length - 1] || 0;
    grid.appendChild(
      elFrom(
        chartCard({
          icon: '📉',
          title: 'Rolling Average',
          subtitle: `7-day: ${avg7.toFixed(1)}h`,
          infoKey: 'rollingAvg',
          canvasId: 'anv2RollingChart',
          height: 130,
        }),
      ),
    );
    registerChart(
      'anv2RollingChart',
      'Rolling Average',
      '7-day smoothing',
      (cv) => drawLineSimple(cv, rollLabels, roll7, { color: '#A855F7', unit: 'h', minMax: target }),
      `<span style="color:var(--text-2)">Current 7-day avg: <strong style="color:var(--text)">${avg7.toFixed(2)}h</strong></span>
       <span style="color:var(--text-2)">Target: <strong style="color:#FBBF24">${target}h</strong></span>`,
    );

    const todBuckets = [0, 0, 0, 0];
    sessions.forEach((s) => {
      if (!s.start_time) return;
      const hr = new Date(s.start_time).getHours();
      const mins = (s.duration || 0) / 3600;
      if (hr < 12) todBuckets[0] += mins;
      else if (hr < 17) todBuckets[1] += mins;
      else if (hr < 22) todBuckets[2] += mins;
      else todBuckets[3] += mins;
    });
    grid.appendChild(
      elFrom(
        chartCard({
          icon: '⏰',
          title: 'Time of Day',
          subtitle: 'When do you study?',
          infoKey: 'timeOfDay',
          canvasId: 'anv2TodChart',
          height: 130,
        }),
      ),
    );
    registerChart(
      'anv2TodChart',
      'Time of Day',
      'Morning / Afternoon / Evening / Night',
      (cv) => {
        if (typeof drawBarChart === 'function')
          drawBarChart(cv, ['Morning', 'Afternoon', 'Evening', 'Night'], todBuckets, { unit: 'h', minMax: 4 });
      },
      ['🌅 Morning', '☀️ Afternoon', '🌆 Evening', '🌙 Night']
        .map(
          (lbl, i) =>
            `<span style="color:var(--text-2)">${lbl}: <strong style="color:var(--text)">${todBuckets[i].toFixed(1)}h</strong></span>`,
        )
        .join(''),
    );

    const buckets = [0, 0, 0, 0];
    sessions.forEach((s) => {
      const min = (s.duration || 0) / 60;
      if (min < 30) buckets[0]++;
      else if (min < 60) buckets[1]++;
      else if (min < 120) buckets[2]++;
      else buckets[3]++;
    });
    const deepEntries = [
      { name: '< 30 min', value: buckets[0], color: '#EF4444' },
      { name: '30-60 min', value: buckets[1], color: '#FBBF24' },
      { name: '1-2 hours', value: buckets[2], color: '#A855F7' },
      { name: '2+ hours', value: buckets[3], color: '#10B981' },
    ];
    grid.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🧠', 'Deep Work', 'Session length buckets', 'deepWork')}
        <div class="anv2-split">
          <div class="anv2-chart-wrap anv2-chart-sm"><canvas id="anv2DeepChart"></canvas></div>
          <div id="anv2DeepLegend" class="anv2-legend"></div>
        </div>
        <div class="anv2-chart-actions">${expandBtn('anv2DeepChart')}</div>
      </div>
    `),
    );
    registerChart(
      'anv2DeepChart',
      'Deep Work Distribution',
      'Session length buckets',
      (cv) => {
        if (typeof drawDonut === 'function') drawDonut(cv, deepEntries);
      },
      deepEntries
        .map(
          (e) =>
            `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:50%;background:${e.color}"></span><span style="color:var(--text-2)">${escHtml(e.name)}</span> · <strong style="color:var(--text)">${e.value} sessions</strong></span>`,
        )
        .join(''),
    );

    const typeTotals = { 'New Learning': 0, Revision: 0, Test: 0 };
    sessions.forEach((s) => {
      if (typeTotals[s.study_type] != null) typeTotals[s.study_type] += s.duration || 0;
    });
    const typeEntries = [
      { name: 'New Learning', value: typeTotals['New Learning'], color: '#A855F7' },
      { name: 'Revision', value: typeTotals['Revision'], color: '#FBBF24' },
      { name: 'Test', value: typeTotals['Test'], color: '#14B8A6' },
    ].filter((e) => e.value > 0);
    grid.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🎯', 'Study Type', 'New vs Revision vs Test', 'studyType')}
        <div class="anv2-split">
          <div class="anv2-chart-wrap anv2-chart-sm"><canvas id="anv2TypeChart"></canvas></div>
          <div id="anv2TypeLegend" class="anv2-legend"></div>
        </div>
        <div class="anv2-chart-actions">${expandBtn('anv2TypeChart')}</div>
      </div>
    `),
    );
    registerChart(
      'anv2TypeChart',
      'Study Type Breakdown',
      '',
      (cv) => {
        if (typeEntries.length && typeof drawDonut === 'function') drawDonut(cv, typeEntries);
      },
      typeEntries
        .map(
          (e) =>
            `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:50%;background:${e.color}"></span><span style="color:var(--text-2)">${escHtml(e.name)}</span> · <strong style="color:var(--text)">${shortDur(e.value)}</strong></span>`,
        )
        .join(''),
    );

    const prodByDay = [],
      prodLabels = [];
    for (let i = 29; i >= 0; i--) {
      const key = daysAgoKey(i);
      const daySessions = sessions.filter((s) => s.date === key);
      prodLabels.push(fmtDateKey(key));
      prodByDay.push(
        daySessions.length ? daySessions.reduce((a, s) => a + (s.productivity || 3), 0) / daySessions.length : 0,
      );
    }
    const prodAvg =
      prodByDay.filter((v) => v > 0).reduce((a, b) => a + b, 0) / (prodByDay.filter((v) => v > 0).length || 1);
    grid.appendChild(
      elFrom(
        chartCard({
          icon: '⭐',
          title: 'Productivity Trend',
          subtitle: 'Self-rated (1-5)',
          infoKey: 'productivity',
          canvasId: 'anv2ProdChart',
          height: 130,
        }),
      ),
    );
    registerChart(
      'anv2ProdChart',
      'Productivity Trend',
      '',
      (cv) => drawLineSimple(cv, prodLabels, prodByDay, { color: '#FBBF24', minMax: 5 }),
      `<span style="color:var(--text-2)">Average: <strong style="color:var(--text)">${prodAvg.toFixed(2)} ★</strong></span>`,
    );

    const energyByDay = [];
    for (let i = 29; i >= 0; i--) {
      const key = daysAgoKey(i);
      const daySessions = sessions.filter((s) => s.date === key);
      energyByDay.push(
        daySessions.length ? daySessions.reduce((a, s) => a + (s.energy || 3), 0) / daySessions.length : 0,
      );
    }
    const energyAvg =
      energyByDay.filter((v) => v > 0).reduce((a, b) => a + b, 0) / (energyByDay.filter((v) => v > 0).length || 1);
    grid.appendChild(
      elFrom(
        chartCard({
          icon: '⚡',
          title: 'Energy Trend',
          subtitle: 'Self-rated (1-5)',
          infoKey: 'energy',
          canvasId: 'anv2EnergyChart',
          height: 130,
        }),
      ),
    );
    registerChart(
      'anv2EnergyChart',
      'Energy Trend',
      '',
      (cv) => drawLineSimple(cv, prodLabels, energyByDay, { color: '#14B8A6', minMax: 5 }),
      `<span style="color:var(--text-2)">Average: <strong style="color:var(--text)">${energyAvg.toFixed(2)} ★</strong></span>`,
    );

    wrap.appendChild(grid);

    wrap.appendChild(
      elFrom(`
      <div class="anv2-card anv2-grid-full" style="background:linear-gradient(135deg,rgba(168,85,247,.09),rgba(236,72,153,.05));border-color:rgba(168,85,247,.28)">
        ${sectionHead('✨', 'Smart Insights', 'Auto-generated from your data', 'insights')}
        <div class="ai-list" id="anv2Insights"></div>
      </div>
    `),
    );

    setTimeout(() => {
      Object.keys(CHART_REG).forEach((id) => {
        const cv = document.getElementById(id);
        if (!cv || !cv.offsetParent) return;
        try {
          CHART_REG[id].draw(cv);
        } catch (e) {}
      });
      const deepLeg = document.getElementById('anv2DeepLegend');
      if (deepLeg) {
        deepLeg.innerHTML = deepEntries
          .map(
            (e) =>
              `<div class="anv2-legend-row"><span class="dot" style="background:${e.color}"></span><span class="lbl">${escHtml(e.name)}</span><span class="val">${e.value}</span></div>`,
          )
          .join('');
      }
      const typeLeg = document.getElementById('anv2TypeLegend');
      if (typeLeg) {
        typeLeg.innerHTML = typeEntries.length
          ? typeEntries
              .map(
                (e) =>
                  `<div class="anv2-legend-row"><span class="dot" style="background:${e.color}"></span><span class="lbl">${escHtml(e.name)}</span><span class="val">${shortDur(e.value)}</span></div>`,
              )
              .join('')
          : '<div style="color:var(--text-3);font-size:.72rem">No data</div>';
      }
      const insEl = document.getElementById('anv2Insights');
      if (insEl && typeof generateAIInsights === 'function') {
        const recent = sessions.slice(-90);
        const meta = {
          totalSec: recent.reduce((a, s) => a + (s.duration || 0), 0),
          daysStudied: new Set(recent.map((s) => s.date)).size,
          daysTotal: 90,
          avgSession: recent.length ? recent.reduce((a, s) => a + (s.duration || 0), 0) / recent.length : 0,
        };
        const insights = generateAIInsights(recent, meta);
        insEl.innerHTML = insights.length
          ? insights
              .map(
                (i) =>
                  `<div class="ai-item tip-${i.type || 'info'}"><span class="ai-ico">${i.icon}</span><div class="ai-text">${i.text}</div></div>`,
              )
              .join('')
          : '<div style="padding:16px;text-align:center;color:var(--text-3);font-size:.78rem">Log more sessions to unlock insights</div>';
      }
    }, 60);

    return wrap;
  }

  /* ═══════════════ TAB: PROGRESS ═══════════════ */
  function renderProgress() {
    const wrap = document.createElement('div');
    wrap.className = 'anv2-tab-content';
    const stats = calcSyllabusStats();
    const grid = document.createElement('div');
    grid.className = 'anv2-grid';

    grid.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('📖', 'Syllabus Status', `${stats.total} total · ${stats.touched} touched`, 'sylStatus')}
        <div class="anv2-kpi-grid" style="margin-bottom:8px">
          ${miniKpi('Not Started', stats.not_started, '', '#6E5F8C')}
          ${miniKpi('Learning', stats.learning, '', '#FBBF24')}
          ${miniKpi('Completed', stats.completed, '', '#10B981')}
          ${miniKpi('Rev', stats.revTotal, '', '#A855F7')}
        </div>
        <div class="anv2-chart-wrap anv2-chart-sm"><canvas id="anv2SylChart"></canvas></div>
        <div class="anv2-chart-actions">${expandBtn('anv2SylChart')}</div>
      </div>
    `),
    );
    registerChart(
      'anv2SylChart',
      'Syllabus Status',
      '',
      (cv) => {
        if (stats.total > 0 && typeof drawBarChart === 'function') {
          drawBarChart(
            cv,
            ['Not Started', 'Learning', 'Completed', 'Rev 1', 'Rev 2', 'Rev 3'],
            [stats.not_started, stats.learning, stats.completed, stats.rev1, stats.rev2, stats.rev3],
            { unit: '', minMax: 5 },
          );
        }
      },
      [
        { l: '⚪ Not Started', v: stats.not_started },
        { l: '🟡 Learning', v: stats.learning },
        { l: '✅ Completed', v: stats.completed },
        { l: '🔵 Rev 1', v: stats.rev1 },
        { l: '🔵 Rev 2', v: stats.rev2 },
        { l: '🔵 Rev 3', v: stats.rev3 },
      ]
        .map(
          (x) => `<span style="color:var(--text-2)">${x.l}: <strong style="color:var(--text)">${x.v}</strong></span>`,
        )
        .join(''),
    );

    const tracked = state.syllabus || [];
    const recent7 = tracked.filter((t) => {
      if (!t.updated_at) return false;
      const days = (new Date() - new Date(t.updated_at)) / 86400000;
      return days <= 7 && t.status === 'completed';
    }).length;
    const remaining = Math.max(0, stats.total - stats.completed);
    const pace = recent7 || 0;
    const daysToFinish = pace > 0 ? Math.ceil((remaining / pace) * 7) : null;
    grid.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🚀', 'Syllabus Pace', 'Projected completion', 'pace')}
        ${
          pace === 0
            ? `<div style="padding:14px;text-align:center;color:var(--text-3);font-size:.78rem">Complete topics to see projection</div>`
            : `<div class="anv2-kpi-grid">
              ${miniKpi('Pace', pace + '/wk', '', '#A855F7')}
              ${miniKpi('Remaining', remaining, '', '#FBBF24')}
              ${miniKpi('Projected', daysToFinish ? daysToFinish + 'd' : '—', '', '#10B981')}
            </div>`
        }
      </div>
    `),
    );

    const revs = state.revisions || [];
    const today = todayKeyLocal();
    const dueToday = revs.filter((r) => r.status === 'pending' && r.due_date === today).length;
    const overdue = revs.filter((r) => r.status === 'pending' && r.due_date < today).length;
    const upcoming = revs.filter((r) => r.status === 'pending' && r.due_date > today).length;
    const done = revs.filter((r) => r.status === 'completed').length;
    grid.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🔁', 'Revision Health', 'Consistency metric', 'revision')}
        ${
          revs.length === 0
            ? `<div style="padding:14px;text-align:center;color:var(--text-3);font-size:.78rem">No revisions scheduled</div>`
            : `<div class="anv2-kpi-grid">
              ${miniKpi('Due Today', dueToday, '', '#FBBF24')}
              ${miniKpi('Overdue', overdue, '', '#EF4444')}
              ${miniKpi('Upcoming', upcoming, '', '#A855F7')}
              ${miniKpi('Completed', done, '', '#10B981')}
            </div>`
        }
      </div>
    `),
    );

    let missed = 0;
    const firstDate = (state.sessions || [])
      .map((s) => s.date)
      .filter(Boolean)
      .sort()[0];
    const daysConsidered = firstDate
      ? Math.min(30, Math.max(1, Math.floor((new Date() - new Date(firstDate)) / 86400000) + 1))
      : 0;
    for (let i = 0; i < daysConsidered; i++) {
      const key = daysAgoKey(i);
      const sec = (state.sessions || []).filter((s) => s.date === key).reduce((a, s) => a + (s.duration || 0), 0);
      if (sec === 0) missed++;
    }
    const consistency = daysConsidered ? Math.round(((daysConsidered - missed) / daysConsidered) * 100) : 0;
    grid.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('📅', 'Consistency', 'Last 30 days', 'missedDays')}
        <div class="anv2-kpi-grid">
          ${miniKpi('Active', daysConsidered - missed, 'days', '#10B981')}
          ${miniKpi('Missed', missed, 'days', '#EF4444')}
          ${miniKpi('Rate', consistency + '%', '', '#A855F7')}
        </div>
      </div>
    `),
    );

    wrap.appendChild(grid);

    const goals = state.goals || [];
    const activeGoals = goals.filter((g) => g.current < g.target).length;
    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🎯', 'Goals Progress', `${activeGoals} active`, 'goals')}
        ${
          goals.length === 0
            ? emptyState('🎯', 'No goals set', 'Set targets to track progress.', 'Create Goal', 'anv2GoGoals')
            : `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px">${goals
                .slice(0, 8)
                .map((g) => {
                  const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100));
                  const isDone = g.current >= g.target;
                  return `
                <div class="anv2-goal-row">
                  <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:5px;flex-wrap:wrap">
                    <strong style="font-size:.76rem;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${escHtml(g.title)}</strong>
                    <span style="font-size:.66rem;color:var(--text-3);flex-shrink:0">${(g.current || 0).toFixed(1)}/${g.target}${escHtml(g.unit || 'h')}</span>
                  </div>
                  <div class="progress" style="margin-top:0;height:5px"><div class="progress-fill ${isDone ? 'green' : ''}" style="width:${pct}%"></div></div>
                </div>`;
                })
                .join('')}</div>`
        }
      </div>
    `),
    );

    const preDate = state.profile?.exam_date_prelims;
    const mainsDate = state.profile?.exam_date_mains;
    const preDays = preDate && typeof daysUntil === 'function' ? daysUntil(preDate) : null;
    const mainsDays = mainsDate && typeof daysUntil === 'function' ? daysUntil(mainsDate) : null;
    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('⏳', 'Exam Countdown', 'Prelims + Mains D-day', 'countdown')}
        ${
          !preDate && !mainsDate
            ? emptyState(
                '📅',
                'Exam dates not set',
                'Set dates in Settings to enable countdown.',
                'Set Dates',
                'anv2GoSettings',
              )
            : `<div class="countdown-hero" style="margin:0">
              <div class="countdown-card" style="padding:16px">
                <div class="cd-label">📅 Prelims</div>
                <div class="cd-days" style="font-size:2.2rem">${preDays != null ? preDays : '—'}</div>
                <div class="cd-sub">${preDate ? new Date(preDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}</div>
              </div>
              <div class="countdown-card mains" style="padding:16px">
                <div class="cd-label">📅 Mains</div>
                <div class="cd-days" style="font-size:2.2rem">${mainsDays != null ? mainsDays : '—'}</div>
                <div class="cd-sub">${mainsDate ? new Date(mainsDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}</div>
              </div>
            </div>`
        }
      </div>
    `),
    );

    setTimeout(() => {
      Object.keys(CHART_REG).forEach((id) => {
        const cv = document.getElementById(id);
        if (!cv || !cv.offsetParent) return;
        try {
          CHART_REG[id].draw(cv);
        } catch (e) {}
      });
    }, 60);

    return wrap;
  }

  /* ═══════════════ TAB: SUBJECTS ═══════════════ */
  function renderSubjects() {
    const wrap = document.createElement('div');
    wrap.className = 'anv2-tab-content';
    const sessions = state.sessions || [];
    const grid = document.createElement('div');
    grid.className = 'anv2-grid';

    const catTotals = {};
    sessions.forEach((s) => {
      const c = s.category || 'other';
      catTotals[c] = (catTotals[c] || 0) + (s.duration || 0);
    });
    const catEntries = Object.entries(catTotals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: catLabel(name), value, color: catColorFor(name) }));
    grid.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🎯', 'Category Distribution', 'Time per UPSC paper', 'categoryDist')}
        ${
          catEntries.length === 0
            ? `<div style="padding:14px;text-align:center;color:var(--text-3);font-size:.78rem">No data</div>`
            : `<div class="anv2-split">
              <div class="anv2-chart-wrap anv2-chart-sm"><canvas id="anv2CatChart"></canvas></div>
              <div id="anv2CatLegend" class="anv2-legend"></div>
            </div>
            <div class="anv2-chart-actions">${expandBtn('anv2CatChart')}</div>`
        }
      </div>
    `),
    );
    registerChart(
      'anv2CatChart',
      'Category Distribution',
      '',
      (cv) => {
        if (catEntries.length && typeof drawDonut === 'function') drawDonut(cv, catEntries);
      },
      catEntries
        .map(
          (e) =>
            `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:50%;background:${e.color}"></span><span style="color:var(--text-2)">${escHtml(e.name)}</span> · <strong style="color:var(--text)">${shortDur(e.value)}</strong></span>`,
        )
        .join(''),
    );

    const catTypeMap = {};
    sessions.forEach((s) => {
      const c = s.category || 'other';
      const t = s.study_type || 'New Learning';
      if (!catTypeMap[c]) catTypeMap[c] = { 'New Learning': 0, Revision: 0, Test: 0 };
      if (catTypeMap[c][t] != null) catTypeMap[c][t] += s.duration || 0;
    });
    const matrixRows = Object.entries(catTypeMap)
      .filter(([, v]) => v['New Learning'] + v['Revision'] + v['Test'] > 0)
      .sort(
        (a, b) =>
          b[1]['New Learning'] +
          b[1]['Revision'] +
          b[1]['Test'] -
          (a[1]['New Learning'] + a[1]['Revision'] + a[1]['Test']),
      );
    if (matrixRows.length > 0) {
      grid.appendChild(
        elFrom(`
        <div class="anv2-card">
          ${sectionHead('🔀', 'Category × Type', 'New / Rev / Test', 'categoryStudyType')}
          <div class="anv2-table-scroll">
            <table class="anv2-table">
              <thead><tr><th>Category</th><th>New</th><th>Rev</th><th>Test</th></tr></thead>
              <tbody>
                ${matrixRows
                  .map(
                    ([cat, d]) => `
                  <tr>
                    <td><strong style="font-size:.72rem">${escHtml(catLabel(cat))}</strong></td>
                    <td>${shortDur(d['New Learning'])}</td>
                    <td>${shortDur(d['Revision'])}</td>
                    <td>${shortDur(d['Test'])}</td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `),
      );
    }

    wrap.appendChild(grid);

    const subjTotals = {};
    sessions.forEach((s) => {
      const n = s.subject || 'Other';
      if (!subjTotals[n]) subjTotals[n] = { sec: 0, count: 0, last: null };
      subjTotals[n].sec += s.duration || 0;
      subjTotals[n].count++;
      if (!subjTotals[n].last || s.date > subjTotals[n].last) subjTotals[n].last = s.date;
    });
    const subjRows = Object.entries(subjTotals)
      .sort((a, b) => b[1].sec - a[1].sec)
      .slice(0, 10);

    if (subjRows.length > 0) {
      wrap.appendChild(
        elFrom(`
        <div class="anv2-card">
          ${sectionHead('📚', 'Subject Comparison', 'Top subjects by time', 'subjectCompare')}
          <div class="anv2-table-scroll">
            <table class="anv2-table">
              <thead><tr><th>Subject</th><th>Time</th><th>Sessions</th><th>Last</th></tr></thead>
              <tbody>
                ${subjRows
                  .map(
                    ([name, d]) => `
                  <tr>
                    <td><span class="subject-dot" style="background:${typeof getSubjectColor === 'function' ? getSubjectColor(name) : '#A855F7'}"></span>${escHtml(name)}</td>
                    <td><strong>${shortDur(d.sec)}</strong></td>
                    <td>${d.count}</td>
                    <td>${d.last ? fmtDateKey(d.last) : '—'}</td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `),
      );
    }

    const neglected = Object.entries(subjTotals)
      .filter(([, d]) => {
        const daysSince = d.last ? Math.floor((new Date(todayKeyLocal()) - new Date(d.last)) / 86400000) : 999;
        return daysSince >= 7;
      })
      .sort((a, b) => (a[1].last || '').localeCompare(b[1].last || ''))
      .slice(0, 5);
    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('⚠️', 'Neglected Subjects', 'Not studied in 7+ days', 'neglected')}
        ${
          neglected.length === 0
            ? `<div style="padding:12px;text-align:center;color:var(--emerald);font-size:.78rem">🎉 All subjects touched recently</div>`
            : `<div class="list">${neglected
                .map(([name, d]) => {
                  const days = d.last ? Math.floor((new Date(todayKeyLocal()) - new Date(d.last)) / 86400000) : '∞';
                  return `
                <div class="row-item" style="cursor:default;padding:10px 12px">
                  <span class="row-dot" style="background:${typeof getSubjectColor === 'function' ? getSubjectColor(name) : '#A855F7'}"></span>
                  <div class="row-info">
                    <div class="row-title" style="font-size:.78rem">${escHtml(name)}</div>
                    <div class="row-meta" style="font-size:.68rem">Last: ${d.last ? fmtDateKey(d.last) : 'never'} · ${days}d ago</div>
                  </div>
                  <span class="row-value" style="color:#F87171">${shortDur(d.sec)}</span>
                </div>`;
                })
                .join('')}</div>`
        }
      </div>
    `),
    );

    setTimeout(() => {
      Object.keys(CHART_REG).forEach((id) => {
        const cv = document.getElementById(id);
        if (!cv || !cv.offsetParent) return;
        try {
          CHART_REG[id].draw(cv);
        } catch (e) {}
      });
      const leg = document.getElementById('anv2CatLegend');
      if (leg && catEntries.length) {
        leg.innerHTML = catEntries
          .map(
            (e) => `
          <div class="anv2-legend-row">
            <span class="dot" style="background:${e.color}"></span>
            <span class="lbl">${escHtml(e.name)}</span>
            <span class="val">${shortDur(e.value)}</span>
          </div>`,
          )
          .join('');
      }
    }, 60);

    return wrap;
  }

  /* ═══════════════ TAB: TESTS ═══════════════ */
  function renderTests() {
    const wrap = document.createElement('div');
    wrap.className = 'anv2-tab-content';
    const records = state.testRecords || [];
    const TYPE_LABELS = { pyq: '📖 PYQ', mock: '📋 Mock', sectional: '✂️ Sectional', 'full-length': '📜 Full' };
    const TYPE_COLORS = { pyq: '#14B8A6', mock: '#A855F7', sectional: '#EC4899', 'full-length': '#F97316' };

    if (records.length === 0) {
      wrap.appendChild(
        elFrom(`
        <div class="anv2-card">
          ${sectionHead('📝', 'Test Records', 'Mock · Sectional · PYQ · Full', 'testRecords')}
          ${emptyState('📝', 'No tests logged', 'Log tests from the Tests page.', 'Log Test', 'anv2GoTests')}
        </div>
      `),
      );
      return wrap;
    }

    const scorePct = (r) => {
      const total = r.total_marks || r.total_questions * r.marks_per_question || 1;
      return total ? ((r.score || 0) / total) * 100 : 0;
    };
    const accuracy = (r) => {
      const att = r.attempted || 0;
      return att ? ((r.correct || 0) / att) * 100 : 0;
    };
    const errorRate = (r) => {
      const att = r.attempted || 0;
      return att ? ((r.incorrect || 0) / att) * 100 : 0;
    };

    const sorted = [...records].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const scores = sorted.map(scorePct);
    const accuracies = sorted.map(accuracy);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const latestScore = scores[scores.length - 1];
    const avgAcc = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;

    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('📝', 'Test Records', `${records.length} logged`, 'testRecords')}
        <div class="anv2-kpi-grid">
          ${miniKpi('Tests', records.length, '', '#A855F7')}
          ${miniKpi('Avg', Math.round(avgScore) + '%', '', '#EC4899')}
          ${miniKpi('Best', Math.round(bestScore) + '%', '', '#FBBF24')}
          ${miniKpi('Latest', Math.round(latestScore) + '%', '', '#10B981')}
          ${miniKpi('Accuracy', Math.round(avgAcc) + '%', '', '#14B8A6')}
        </div>
      </div>
    `),
    );

    const grid = document.createElement('div');
    grid.className = 'anv2-grid';

    grid.appendChild(
      elFrom(
        chartCard({
          icon: '📈',
          title: 'Score Trend',
          subtitle: 'Per test',
          infoKey: 'testRecords',
          canvasId: 'anv2TestScoreChart',
          height: 130,
        }),
      ),
    );
    registerChart(
      'anv2TestScoreChart',
      'Test Score Trend',
      '',
      (cv) => {
        if (sorted.length >= 2 && typeof drawLineChart === 'function') {
          drawLineChart(
            cv,
            sorted.map((r) => (r.date ? fmtDateKey(r.date) : '')),
            scores,
            { unit: '%', minMax: 100 },
          );
        }
      },
      `<span style="color:var(--text-2)">Avg: <strong style="color:var(--text)">${Math.round(avgScore)}%</strong></span>
       <span style="color:var(--text-2)">Best: <strong style="color:var(--text)">${Math.round(bestScore)}%</strong></span>
       <span style="color:var(--text-2)">Latest: <strong style="color:var(--text)">${Math.round(latestScore)}%</strong></span>`,
    );

    grid.appendChild(
      elFrom(
        chartCard({
          icon: '🎯',
          title: 'Accuracy Trend',
          subtitle: 'Correct ÷ Attempted',
          infoKey: 'testAccuracy',
          canvasId: 'anv2TestAccChart',
          height: 130,
        }),
      ),
    );
    registerChart(
      'anv2TestAccChart',
      'Accuracy Trend',
      '',
      (cv) => {
        if (sorted.length >= 2 && typeof drawLineChart === 'function') {
          drawLineChart(
            cv,
            sorted.map((r) => (r.date ? fmtDateKey(r.date) : '')),
            accuracies,
            { unit: '%', minMax: 100 },
          );
        }
      },
      `<span style="color:var(--text-2)">Average accuracy: <strong style="color:var(--text)">${Math.round(avgAcc)}%</strong></span>`,
    );

    grid.appendChild(
      elFrom(
        chartCard({
          icon: '❌',
          title: 'Error Rate',
          subtitle: 'Incorrect ÷ Attempted',
          infoKey: 'testError',
          canvasId: 'anv2TestErrChart',
          height: 130,
        }),
      ),
    );
    registerChart(
      'anv2TestErrChart',
      'Error Rate',
      '',
      (cv) => {
        if (typeof drawBarChart === 'function') {
          drawBarChart(
            cv,
            sorted.map((r) => (r.date ? fmtDateKey(r.date) : '')),
            sorted.map(errorRate),
            { unit: '%', minMax: 100 },
          );
        }
      },
      sorted
        .map(
          (r) =>
            `<span style="color:var(--text-2)">${r.date ? fmtDateKey(r.date) : '—'}: <strong style="color:#F87171">${Math.round(errorRate(r))}% error</strong></span>`,
        )
        .join(''),
    );

    const byType = {};
    records.forEach((r) => {
      const t = r.test_type || 'mock';
      if (!byType[t]) byType[t] = [];
      byType[t].push(r);
    });
    const typeCards = Object.entries(byType)
      .map(([type, list]) => {
        const avg = list.reduce((a, r) => a + scorePct(r), 0) / list.length;
        return `
        <div class="anv2-mini-kpi" style="--c:${TYPE_COLORS[type] || '#A855F7'}">
          <div class="lbl">${escHtml(TYPE_LABELS[type] || type)}</div>
          <div class="val">${list.length}<span style="font-size:.6rem;color:var(--text-3);font-weight:600"> tests</span></div>
          <div class="sub">${Math.round(avg)}% avg</div>
        </div>`;
      })
      .join('');
    grid.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('📊', 'By Test Type', 'Category breakdown', '')}
        <div class="anv2-kpi-grid">${typeCards}</div>
      </div>
    `),
    );

    wrap.appendChild(grid);

    const bySubject = {};
    records.forEach((r) => {
      if (!r.subject) return;
      if (!bySubject[r.subject]) bySubject[r.subject] = { count: 0, scoreSum: 0, corrSum: 0, attSum: 0 };
      const s = bySubject[r.subject];
      s.count++;
      s.scoreSum += scorePct(r);
      s.corrSum += r.correct || 0;
      s.attSum += r.attempted || 0;
    });
    const subjectRows = Object.entries(bySubject)
      .map(([name, d]) => ({
        name,
        count: d.count,
        avgScore: d.scoreSum / d.count,
        acc: d.attSum ? (d.corrSum / d.attSum) * 100 : 0,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
    if (subjectRows.length > 0) {
      wrap.appendChild(
        elFrom(`
        <div class="anv2-card">
          ${sectionHead('📚', 'Subject Performance', 'Avg score & accuracy', '')}
          <div class="anv2-table-scroll">
            <table class="anv2-table">
              <thead><tr><th>Subject</th><th>Tests</th><th>Avg Score</th><th>Accuracy</th></tr></thead>
              <tbody>
                ${subjectRows
                  .map(
                    (s) => `
                  <tr>
                    <td><span class="subject-dot" style="background:${typeof getSubjectColor === 'function' ? getSubjectColor(s.name) : '#A855F7'}"></span>${escHtml(s.name)}</td>
                    <td>${s.count}</td>
                    <td><strong>${Math.round(s.avgScore)}%</strong></td>
                    <td>${Math.round(s.acc)}%</td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `),
      );
    }

    const pyqRecords = records.filter((r) => r.test_type === 'pyq');
    if (pyqRecords.length > 0) {
      const totalSolved = pyqRecords.reduce((a, r) => a + (r.attempted || 0), 0);
      const totalCorrect = pyqRecords.reduce((a, r) => a + (r.correct || 0), 0);
      const totalWrong = pyqRecords.reduce((a, r) => a + (r.incorrect || 0), 0);
      const pyqAcc = totalSolved ? (totalCorrect / totalSolved) * 100 : 0;
      wrap.appendChild(
        elFrom(`
        <div class="anv2-card">
          ${sectionHead('📖', 'PYQ Coverage', 'Previous year questions', 'pyq')}
          <div class="anv2-kpi-grid">
            ${miniKpi('Solved', totalSolved, '', '#10B981')}
            ${miniKpi('Correct', totalCorrect, '', '#A855F7')}
            ${miniKpi('Wrong', totalWrong, '', '#EF4444')}
            ${miniKpi('Accuracy', Math.round(pyqAcc) + '%', '', '#FBBF24')}
          </div>
        </div>
      `),
      );
    }

    const recent = [...records].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🕐', 'Recent Tests', 'Last 5', '')}
        <div class="list">
          ${recent
            .map((r) => {
              const pct = scorePct(r);
              const typeLabel = TYPE_LABELS[r.test_type] || r.test_type || 'Test';
              return `
              <div class="row-item" style="cursor:default;padding:10px 12px">
                <span class="row-dot" style="background:${TYPE_COLORS[r.test_type] || '#A855F7'}"></span>
                <div class="row-info">
                  <div class="row-title" style="font-size:.78rem">${escHtml(r.name || 'Untitled Test')}</div>
                  <div class="row-meta" style="font-size:.68rem">${typeLabel} · ${r.date ? fmtDateKey(r.date) : ''}${r.subject ? ' · ' + escHtml(r.subject) : ''}</div>
                </div>
                <span class="row-value">${Math.round(pct)}%</span>
              </div>`;
            })
            .join('')}
        </div>
      </div>
    `),
    );

    setTimeout(() => {
      Object.keys(CHART_REG).forEach((id) => {
        const cv = document.getElementById(id);
        if (!cv || !cv.offsetParent) return;
        try {
          CHART_REG[id].draw(cv);
        } catch (e) {}
      });
    }, 60);

    return wrap;
  }

  /* ═══════════════ MAIN OVERRIDE ═══════════════ */
  function installAnalyticsV2() {
    window.renderAnalytics = function () {
      injectCSS();
      const root = document.getElementById('view-analytics');
      if (!root) return;
      root.innerHTML = '';
      Object.keys(CHART_REG).forEach((k) => delete CHART_REG[k]);

      const wrap = document.createElement('div');
      wrap.className = 'anv2-wrap';

      wrap.appendChild(elFrom(renderHero()));
      wrap.appendChild(elFrom(renderTabs()));

      let content;
      if (anV2.tab === 'overview') content = renderOverview();
      else if (anV2.tab === 'progress') content = renderProgress();
      else if (anV2.tab === 'subjects') content = renderSubjects();
      else content = renderTests();
      wrap.appendChild(content);

      root.appendChild(wrap);

      root.querySelectorAll('[data-anv2-tab]').forEach((btn) => {
        btn.onclick = () => {
          anV2.tab = btn.dataset.anv2Tab;
          window.renderAnalytics();
        };
      });
      const ctas = {
        anv2GoSyllabus: 'syllabus',
        anv2GoGoals: 'goals',
        anv2GoSettings: 'settings',
        anv2GoTests: 'tests',
      };
      Object.entries(ctas).forEach(([id, view]) => {
        const btn = document.getElementById(id);
        if (btn && typeof switchView === 'function') btn.onclick = () => switchView(view);
      });
      if (typeof attachRipples === 'function') attachRipples();
    };
    console.log('[analytics-v2] ✅ v5 installed');
  }

  let attempts = 0;
  function waitThenStart() {
    if (typeof window.renderAnalytics === 'function' && typeof window.drawLineChart === 'function') {
      installAnalyticsV2();
      try {
        if (document.querySelector('#view-analytics.active')) window.renderAnalytics();
      } catch (e) {}
    } else {
      attempts++;
      if (attempts > 200) return console.error('[analytics-v2] timeout');
      setTimeout(waitThenStart, 50);
    }
  }
  waitThenStart();
})();
