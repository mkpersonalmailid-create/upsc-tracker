/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Analytics v3 (PM-grade · mobile-first · transparent)
   ─────────────────────────────────────────────────────────────
   ✅ Correct syllabus calc: SYLLABUS + custom subjects + custom topics
   ✅ Completed = status === 'completed' ONLY (rev cycles in progress)
   ✅ ⓘ info buttons on every section (calculation explained)
   ✅ Mobile-first responsive (no overflow, no cut-off)
   ✅ 4 tabs: Overview | Progress | Subjects | Tests
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[analytics-v2] v3 loaded');

  /* ═══════════════ CONFIG ═══════════════ */
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

  /* ═══════════════ SYLLABUS CALCULATOR (CANONICAL) ═══════════════ */
  /* Total = SYLLABUS default topics + custom subject topics + custom topics under default subjects */
  function calcSyllabusStats() {
    const tracked = state.syllabus || [];
    const userSubjects = state.subjects || [];

    // 1. Default SYLLABUS topics
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

    // 2. Custom subjects (user created, not in SYLLABUS)
    const customSubjects = userSubjects.filter((s) => {
      if (typeof SYLLABUS === 'undefined') return true;
      return !Object.values(SYLLABUS).some((p) => (p.subjects || []).some((x) => x.name === s.name));
    });
    const customSubjectNames = new Set(customSubjects.map((s) => s.name));

    // 3. Tracked topics from state.syllabus
    //    - Custom subject topics (any tracked under custom subject)
    //    - Custom topics under default subjects (tracked but not in defaultTopicKeys)
    let customSubjectTopicCount = 0;
    let customTopicUnderDefaultCount = 0;
    tracked.forEach((t) => {
      const key = `${t.subject}|${t.topic}`;
      if (customSubjectNames.has(t.subject)) {
        customSubjectTopicCount++;
      } else if (!defaultTopicKeys.has(key)) {
        customTopicUnderDefaultCount++;
      }
    });

    const total = defaultTotal + customSubjectTopicCount + customTopicUnderDefaultCount;

    // 4. Tracked statuses (from state.syllabus)
    const statusCounts = { not_started: 0, learning: 0, completed: 0, rev1: 0, rev2: 0, rev3: 0 };
    tracked.forEach((t) => {
      const s = t.status || 'not_started';
      if (statusCounts[s] != null) statusCounts[s]++;
    });
    // Not started = total - (tracked with explicit non-not_started status)
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

  /* ═══════════════ INFO BUTTON ═══════════════ */
  function infoBtn(title, bodyHtml) {
    const id = 'anv2Info_' + Math.random().toString(36).slice(2, 9);
    setTimeout(() => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.onclick = (e) => {
        e.stopPropagation();
        if (typeof openModal !== 'function' || typeof modalShell !== 'function') return;
        openModal(
          modalShell({
            title: title,
            body: bodyHtml,
            actions: '<button class="btn btn-ghost" data-close>Got it</button>',
          }),
        );
      };
    }, 30);
    return `<button class="anv2-info-btn" id="${id}" title="How is this calculated?">ⓘ</button>`;
  }

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    if (document.getElementById('anv2CSS')) {
      const old = document.getElementById('anv2CSS');
      old.remove();
    }
    const s = document.createElement('style');
    s.id = 'anv2CSS';
    s.textContent = `
      .anv2-wrap { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
      .anv2-wrap *, .anv2-wrap *::before, .anv2-wrap *::after { box-sizing: border-box; }

      /* ═══ Hero ═══ */
      .anv2-hero {
        background: linear-gradient(135deg, rgba(168,85,247,.14), rgba(236,72,153,.08), rgba(249,115,22,.05));
        border: 1px solid rgba(168,85,247,.28);
        border-radius: 18px;
        padding: 16px;
        position: relative;
        overflow: hidden;
      }
      .anv2-hero::before {
        content: ''; position: absolute; top: -50%; right: -20%;
        width: 300px; height: 300px;
        background: radial-gradient(circle, rgba(168,85,247,.24), transparent 65%);
        pointer-events: none;
      }
      .anv2-hero-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
        position: relative; z-index: 1;
      }
      .anv2-hero-card {
        background: rgba(0,0,0,.28);
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 12px;
        padding: 12px;
        display: flex; flex-direction: column; gap: 3px;
        min-width: 0;
        position: relative;
      }
      .anv2-hero-card .lbl {
        font-size: .6rem; font-weight: 800; letter-spacing: .1em;
        text-transform: uppercase; color: var(--text-3);
        display: flex; align-items: center; gap: 5px;
      }
      .anv2-hero-card .val {
        font-size: clamp(1.15rem, 3.5vw, 1.5rem);
        font-weight: 900; letter-spacing: -.02em; line-height: 1.1;
        background: linear-gradient(135deg, #fff, #c4b5fd);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .anv2-hero-card .sub {
        font-size: .68rem; color: var(--text-3);
        overflow: hidden; text-overflow: ellipsis;
      }
      .anv2-hero-card.accent-pink .val { background: linear-gradient(135deg, #f9a8d4, #ec4899); -webkit-background-clip: text; background-clip: text; }
      .anv2-hero-card.accent-orange .val { background: linear-gradient(135deg, #fdba74, #f97316); -webkit-background-clip: text; background-clip: text; }
      .anv2-hero-card.accent-teal .val { background: linear-gradient(135deg, #5eead4, #14b8a6); -webkit-background-clip: text; background-clip: text; }

      /* ═══ Info button ═══ */
      .anv2-info-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 20px; height: 20px; border-radius: 50%;
        background: rgba(168,85,247,.18); border: 1px solid rgba(168,85,247,.4);
        color: #C4B5FD; font-size: .7rem; cursor: pointer;
        transition: all .2s; flex-shrink: 0; margin-left: auto; padding: 0;
        font-weight: 800;
      }
      .anv2-info-btn:hover { background: rgba(168,85,247,.32); transform: scale(1.1); color: #fff; }

      /* ═══ Tabs ═══ */
      .anv2-tabs {
        display: flex; gap: 5px;
        background: var(--bg-2); border: 1px solid var(--border);
        border-radius: 12px; padding: 4px;
        overflow-x: auto; scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      .anv2-tabs::-webkit-scrollbar { display: none; }
      .anv2-tab {
        flex: 1; min-width: 82px;
        padding: 9px 10px; border-radius: 8px;
        font-size: .76rem; font-weight: 700;
        color: var(--text-3); background: transparent;
        border: none; cursor: pointer; transition: all .2s;
        white-space: nowrap; display: flex;
        align-items: center; justify-content: center; gap: 4px;
      }
      .anv2-tab:hover { color: var(--text-2); background: var(--card); }
      .anv2-tab.active {
        background: linear-gradient(135deg, #8b5cf6, #ec4899);
        color: #fff; box-shadow: 0 6px 18px rgba(168,85,247,.35);
      }

      /* ═══ Section head ═══ */
      .anv2-sec-head {
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 12px; padding-bottom: 10px;
        border-bottom: 1px dashed var(--border);
      }
      .anv2-sec-icon {
        width: 34px; height: 34px; border-radius: 10px;
        background: linear-gradient(135deg, rgba(168,85,247,.2), rgba(236,72,153,.12));
        border: 1px solid rgba(168,85,247,.35);
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem; flex-shrink: 0;
      }
      .anv2-sec-title {
        font-size: .92rem; font-weight: 800;
        letter-spacing: -.01em; color: var(--text);
      }
      .anv2-sec-sub {
        font-size: .7rem; color: var(--text-3); margin-top: 2px;
      }

      /* ═══ Cards ═══ */
      .anv2-card {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 14px; padding: 14px;
        width: 100%; max-width: 100%; overflow-x: hidden;
      }
      .anv2-card + .anv2-card { margin-top: 12px; }

      /* ═══ Empty state ═══ */
      .anv2-empty { text-align: center; padding: 26px 16px; color: var(--text-3); }
      .anv2-empty-icon { font-size: 2rem; margin-bottom: 8px; opacity: .7; }
      .anv2-empty-title { font-size: .9rem; font-weight: 800; color: var(--text-2); margin-bottom: 5px; }
      .anv2-empty-desc { font-size: .78rem; color: var(--text-3); line-height: 1.55; max-width: 320px; margin: 0 auto 12px; }

      /* ═══ Chart wrapper (mobile safe) ═══ */
      .anv2-chart-wrap {
        position: relative; width: 100%; height: 200px;
        min-width: 0; max-width: 100%;
      }
      .anv2-chart-wrap canvas {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .anv2-chart-sm { height: 160px; }

      /* ═══ Donut + legend grid (mobile safe) ═══ */
      .anv2-split {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 14px;
        align-items: center;
      }
      .anv2-legend {
        display: flex; flex-direction: column; gap: 7px;
        font-size: .78rem; min-width: 0;
      }
      .anv2-legend-row {
        display: flex; align-items: center; gap: 8px;
      }
      .anv2-legend-row .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
      .anv2-legend-row .lbl { flex: 1; min-width: 0; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .anv2-legend-row .val { color: var(--text); font-weight: 700; flex-shrink: 0; }

      /* ═══ Table (mobile scroll) ═══ */
      .anv2-table-scroll {
        width: 100%; overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
      }
      .anv2-table {
        width: 100%; min-width: 380px;
        border-collapse: collapse; font-size: .78rem;
      }
      .anv2-table th {
        text-align: left; font-size: .64rem; font-weight: 800;
        letter-spacing: .06em; text-transform: uppercase; color: var(--text-3);
        padding: 8px 6px; border-bottom: 1px solid var(--border);
        white-space: nowrap;
      }
      .anv2-table td {
        padding: 10px 6px; border-bottom: 1px solid var(--border);
        color: var(--text-2); white-space: nowrap;
      }
      .anv2-table tr:last-child td { border-bottom: none; }
      .anv2-table .subject-dot {
        display: inline-block; width: 8px; height: 8px;
        border-radius: 50%; margin-right: 6px; vertical-align: middle;
      }

      /* ═══ Tab content ═══ */
      .anv2-tab-content { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 100%; }
      .anv2-kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
      }
      .anv2-mini-kpi {
        background: var(--card-2); border: 1px solid var(--border);
        border-radius: 10px; padding: 10px 12px;
        position: relative; overflow: hidden;
        min-width: 0;
      }
      .anv2-mini-kpi::before {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0;
        width: 3px; background: var(--c, var(--purple));
      }
      .anv2-mini-kpi .lbl {
        font-size: .6rem; font-weight: 800; letter-spacing: .06em;
        text-transform: uppercase; color: var(--text-3); margin-bottom: 4px;
      }
      .anv2-mini-kpi .val {
        font-size: 1.15rem; font-weight: 900; letter-spacing: -.02em;
        line-height: 1.1; color: var(--text);
      }
      .anv2-mini-kpi .sub { font-size: .65rem; color: var(--text-3); margin-top: 2px; }

      /* ═══ Goal row ═══ */
      .anv2-goal-row {
        padding: 11px 12px; background: var(--card-2);
        border: 1px solid var(--border); border-radius: 10px;
        margin-bottom: 8px;
      }
      .anv2-goal-row:last-child { margin-bottom: 0; }

      /* ═══ Mobile ═══ */
      @media (max-width: 640px) {
        .anv2-hero { padding: 14px; border-radius: 16px; }
        .anv2-hero-grid { gap: 8px; }
        .anv2-hero-card { padding: 10px; }
        .anv2-hero-card .lbl { font-size: .55rem; }
        .anv2-hero-card .sub { font-size: .62rem; }
        .anv2-card { padding: 12px; border-radius: 12px; }
        .anv2-sec-title { font-size: .85rem; }
        .anv2-sec-icon { width: 30px; height: 30px; font-size: .9rem; }
        .anv2-chart-wrap { height: 170px; }
        .anv2-chart-sm { height: 140px; }
        .anv2-tab { font-size: .72rem; padding: 8px 8px; min-width: 72px; }
        .anv2-kpi-grid { grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); }
        .anv2-mini-kpi { padding: 9px 10px; }
        .anv2-mini-kpi .val { font-size: 1rem; }
      }
      @media (max-width: 400px) {
        .anv2-hero-grid { grid-template-columns: repeat(2, 1fr); }
        .anv2-hero-card .val { font-size: 1.05rem; }
      }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════ INFO CONTENT ═══════════════ */
  const INFO = {
    today: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p><strong style="color:var(--text)">Today's study time</strong> = total duration of all sessions logged today.</p>
        <p style="margin-top:10px"><strong style="color:var(--text)">Target</strong> = your daily target from Settings (default 8h).</p>
        <p style="margin-top:10px"><strong style="color:var(--text)">Percentage</strong> = (Today's time ÷ Target) × 100</p>
      </div>`,
    streak: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p><strong style="color:var(--text)">Streak</strong> = consecutive days (including today) with at least 1 minute of study.</p>
        <p style="margin-top:10px">Aaj study nahi kiya toh streak kal se toota hua mana jayega. Best = longest streak ever.</p>
      </div>`,
    syllabus: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p><strong style="color:var(--text)">Syllabus %</strong> = (Completed topics ÷ Total topics) × 100</p>
        <p style="margin-top:10px"><strong style="color:var(--text)">Total topics</strong> me shamil hain:</p>
        <ul style="margin:8px 0 0 18px;line-height:1.9">
          <li>UPSC standard syllabus ke saare topics</li>
          <li>Aapke banaye custom subjects ke saare topics</li>
          <li>Default subjects ke andar add kiye gaye custom topics</li>
        </ul>
        <p style="margin-top:10px"><strong style="color:var(--text)">Completed</strong> = sirf wo topics jinka status <code style="background:rgba(255,255,255,.08);padding:2px 6px;border-radius:4px">completed</code> hai.</p>
        <p style="margin-top:8px">⚠️ Rev 1/2/3 wale topics <strong>in-progress</strong> mane jate hain — complete nahi, kyunki revision cycle chal raha hai.</p>
      </div>`,
    trend: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p><strong style="color:var(--text)">Last 7 days vs previous 7 days</strong> ka comparison.</p>
        <p style="margin-top:10px"><strong style="color:var(--text)">Trend</strong> = ((Last 7 − Prev 7) ÷ Prev 7) × 100</p>
        <p style="margin-top:10px">Agar previous week me 0h tha → trend calculate nahi hota (— dikhega).</p>
      </div>`,
    dailyChart: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Har din ka total study time (hours me).</p>
        <p style="margin-top:10px"><strong style="color:#FBBF24">Yellow dashed line</strong> = aapka daily target (Settings se).</p>
        <p style="margin-top:10px">Line target ke upar = target achieved. Neeche = pending.</p>
      </div>`,
    deepWork: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Saare sessions ko duration ke hisaab se 4 buckets me baanta:</p>
        <ul style="margin:8px 0 0 18px;line-height:1.9">
          <li>&lt; 30 min — chhota (mind warm-up)</li>
          <li>30-60 min — medium</li>
          <li>1-2 hours — deep work ✅</li>
          <li>2+ hours — marathon 🎯</li>
        </ul>
        <p style="margin-top:10px">UPSC me deep work (90+ min) best hota hai — kyunki syllabus comprehensive hai.</p>
      </div>`,
    studyType: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Sessions ko study type se group kiya:</p>
        <ul style="margin:8px 0 0 18px;line-height:1.9">
          <li><strong>New Learning</strong> — pehli baar padha</li>
          <li><strong>Revision</strong> — dobara padha (retention ke liye)</li>
          <li><strong>Test</strong> — mock / practice</li>
        </ul>
        <p style="margin-top:10px">Ideal ratio: 40% New, 50% Revision, 10% Test.</p>
      </div>`,
    insights: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Aapke recent sessions se auto-generated insights — patterns, warnings, aur recommendations.</p>
        <p style="margin-top:10px">Ye smart analysis hai jo aapke study behavior ko samajh ke tips deta hai.</p>
      </div>`,
    sylStatus: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Har topic ka current status count:</p>
        <ul style="margin:8px 0 0 18px;line-height:1.9">
          <li>⚪ <strong>Not Started</strong> — abhi tak touch nahi kiya</li>
          <li>🟡 <strong>Learning</strong> — first reading chal rahi hai</li>
          <li>✅ <strong>Completed</strong> — final (revision ke baad)</li>
          <li>🔵 <strong>Rev 1/2/3</strong> — revision cycles chal rahe</li>
        </ul>
        <p style="margin-top:10px">Topic "Completed" ho jata hai jab max_revisions (Settings me) complete ho jayein.</p>
      </div>`,
    revision: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <ul style="margin:0 0 0 18px;line-height:1.9">
          <li><strong>Due Today</strong> — aaj revision karna hai</li>
          <li><strong>Overdue</strong> — due date nikal gayi, abhi pending</li>
          <li><strong>Upcoming</strong> — future me aane wali</li>
          <li><strong>Completed</strong> — ho gayi</li>
        </ul>
        <p style="margin-top:10px">UPSC me revision &gt; learning — isliye ye metric critical hai.</p>
      </div>`,
    goals: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Goal progress = (Current value ÷ Target value) × 100</p>
        <p style="margin-top:10px">Study session log karte waqt agar goal se link kiya tha, toh us session ka time auto-add hota hai goal me.</p>
      </div>`,
    countdown: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Prelims aur Mains exam dates se aaj tak kitne din bache hain.</p>
        <p style="margin-top:10px">Dates Settings page me set karo — tabhi countdown aur smart planning features active honge.</p>
      </div>`,
    categoryDist: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Har category (GS Prelims, GS Mains I/II/III/IV, Optional, Essay, CSAT) me total time spent.</p>
        <p style="margin-top:10px">Ye balance check karne ke liye hai — agar Optional ya Essay neglected hai toh upar wale subjects pe zyada time ja raha hai.</p>
      </div>`,
    subjectCompare: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Har subject ka total study time, sessions count, aur last studied date.</p>
        <p style="margin-top:10px">Top 10 subjects by time. Ye pehchanne ke liye ki aap consistently kis subject pe kaam kar rahe ho aur konsa neglect ho raha hai.</p>
      </div>`,
    neglected: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Wo subjects jinhe 7+ din se touch nahi kiya.</p>
        <p style="margin-top:10px">UPSC me breadth important hai — ek subject ko 2 hafte ignore karna costly hota hai. Ye list upar wale subjects ko revisit karne ka reminder hai.</p>
      </div>`,
    mockTests: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Mock tests ka score trend aur accuracy.</p>
        <p style="margin-top:10px"><strong>Score %</strong> = (Score ÷ Total marks) × 100</p>
        <p style="margin-top:8px">Trend rising = improvement. Falling = strategy revisit karo.</p>
      </div>`,
    pyq: `
      <div style="font-size:.85rem;line-height:1.7;color:var(--text-2)">
        <p>Previous Year Questions practice ka data.</p>
        <p style="margin-top:10px"><strong>Accuracy</strong> = (Correct ÷ Solved) × 100</p>
        <p style="margin-top:8px">PYQ practice UPSC ke liye most important — question pattern samajhne ke liye.</p>
      </div>`,
  };

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

  /* ═══════════════ CHART: LINE WITH TARGET ═══════════════ */
  function drawLineWithTarget(canvas, labels, values, target) {
    if (!canvas || !canvas.parentElement || typeof window.setupCanvas !== 'function') return;
    const { ctx, w, h } = window.setupCanvas(canvas);
    if (!ctx) return;
    const c = typeof window.themeColors === 'function' ? window.themeColors() : { border: '#2A1E42', text3: '#6E5F8C' };
    const p = { t: 20, r: 14, b: 30, l: 42 };
    const cw = w - p.l - p.r,
      ch = h - p.t - p.b;
    const max = Math.max(...values, target || 0, 4) * 1.1;

    ctx.strokeStyle = c.border;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = p.t + (ch / 4) * i;
      ctx.beginPath();
      ctx.moveTo(p.l, y);
      ctx.lineTo(w - p.r, y);
      ctx.stroke();
      ctx.fillStyle = c.text3;
      ctx.font = '10px Inter,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText((max - (max / 4) * i).toFixed(1) + 'h', p.l - 6, y + 3);
    }

    if (target > 0) {
      const ty = p.t + ch - (target / max) * ch;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.l, ty);
      ctx.lineTo(w - p.r, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 9px Inter,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Target ' + target + 'h', p.l + 3, ty - 3);
    }

    if (!values.length) return;
    const n = values.length;
    const xFor = (i) => p.l + (i / Math.max(1, n - 1)) * cw;
    const yFor = (v) => p.t + ch - (v / max) * ch;

    // area
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

    // line
    ctx.beginPath();
    values.forEach((v, i) => (i === 0 ? ctx.moveTo(xFor(i), yFor(v)) : ctx.lineTo(xFor(i), yFor(v))));
    const lg = ctx.createLinearGradient(p.l, 0, w - p.r, 0);
    lg.addColorStop(0, '#A855F7');
    lg.addColorStop(1, '#EC4899');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // x-axis
    ctx.fillStyle = c.text3;
    ctx.font = '10px Inter,sans-serif';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.ceil(n / 6));
    labels.forEach((lab, i) => {
      if (i % step !== 0 && i !== n - 1) return;
      ctx.fillText(lab, xFor(i), h - 8);
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
            <div class="sub">${todayPct}% of ${state.settings?.daily_target || 8}h target</div>
          </div>
          <div class="anv2-hero-card accent-pink">
            <div class="lbl">🔥 Streak ${infoBtn('Streak', INFO.streak)}</div>
            <div class="val">${streak}d</div>
            <div class="sub">Best: ${bestStreak}d</div>
          </div>
          <div class="anv2-hero-card">
            <div class="lbl">📖 Syllabus ${infoBtn('Syllabus %', INFO.syllabus)}</div>
            <div class="val">${sylStats.completedPct}%</div>
            <div class="sub">${sylStats.completed}/${sylStats.total} completed</div>
          </div>
          <div class="anv2-hero-card accent-orange">
            <div class="lbl">7-Day Trend ${infoBtn('7-Day Trend', INFO.trend)}</div>
            <div class="val">${trendIcon} ${prev7 > 0 ? Math.abs(trendPct) + '%' : '—'}</div>
            <div class="sub">${shortDur(last7)} vs ${shortDur(prev7)}</div>
          </div>
        </div>
      </div>
    `;
  }

  /* ═══════════════ TABS ═══════════════ */
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

    // Daily trend chart
    const labels = [],
      values = [];
    for (let i = 29; i >= 0; i--) {
      const key = daysAgoKey(i);
      labels.push(fmtDateKey(key));
      const sec = (state.sessions || []).filter((s) => s.date === key).reduce((a, s) => a + (s.duration || 0), 0);
      values.push(sec / 3600);
    }

    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('📈', 'Daily Study Time', 'Last 30 days · target line overlay', 'dailyChart')}
        <div class="anv2-chart-wrap"><canvas id="anv2DailyChart"></canvas></div>
      </div>
    `),
    );

    // Deep work
    const buckets = [0, 0, 0, 0];
    (state.sessions || []).forEach((s) => {
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

    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🧠', 'Deep Work Distribution', 'Session length breakdown', 'deepWork')}
        <div class="anv2-split">
          <div class="anv2-chart-wrap anv2-chart-sm"><canvas id="anv2DeepChart"></canvas></div>
          <div id="anv2DeepLegend" class="anv2-legend"></div>
        </div>
      </div>
    `),
    );

    // Study type
    const typeTotals = { 'New Learning': 0, Revision: 0, Test: 0 };
    (state.sessions || []).forEach((s) => {
      if (typeTotals[s.study_type] != null) typeTotals[s.study_type] += s.duration || 0;
    });
    const typeEntries = [
      { name: '📖 New Learning', value: typeTotals['New Learning'], color: '#A855F7' },
      { name: '🔁 Revision', value: typeTotals['Revision'], color: '#FBBF24' },
      { name: '📝 Test', value: typeTotals['Test'], color: '#14B8A6' },
    ].filter((e) => e.value > 0);

    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🎯', 'Study Type Breakdown', 'New Learning vs Revision vs Test', 'studyType')}
        <div class="anv2-split">
          <div class="anv2-chart-wrap anv2-chart-sm"><canvas id="anv2TypeChart"></canvas></div>
          <div id="anv2TypeLegend" class="anv2-legend"></div>
        </div>
      </div>
    `),
    );

    // Insights
    wrap.appendChild(
      elFrom(`
      <div class="anv2-card" style="background:linear-gradient(135deg,rgba(168,85,247,.09),rgba(236,72,153,.05));border-color:rgba(168,85,247,.28)">
        ${sectionHead('✨', 'Smart Insights', 'Auto-generated from your data', 'insights')}
        <div class="ai-list" id="anv2Insights"></div>
      </div>
    `),
    );

    setTimeout(() => {
      const cv = document.getElementById('anv2DailyChart');
      if (cv) drawLineWithTarget(cv, labels, values, state.settings?.daily_target || 8);

      const dwc = document.getElementById('anv2DeepChart');
      if (dwc && typeof drawDonut === 'function') {
        drawDonut(dwc, deepEntries);
        const leg = document.getElementById('anv2DeepLegend');
        if (leg) {
          leg.innerHTML = deepEntries
            .map(
              (e) => `
            <div class="anv2-legend-row">
              <span class="dot" style="background:${e.color}"></span>
              <span class="lbl">${escHtml(e.name)}</span>
              <span class="val">${e.value}</span>
            </div>`,
            )
            .join('');
        }
      }

      const tc = document.getElementById('anv2TypeChart');
      if (tc) {
        if (typeEntries.length && typeof drawDonut === 'function') {
          drawDonut(tc, typeEntries);
        } else if (typeof window.setupCanvas === 'function') {
          const { ctx, w, h } = window.setupCanvas(tc);
          if (ctx) {
            ctx.fillStyle = '#6E5F8C';
            ctx.font = '13px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No data', w / 2, h / 2);
          }
        }
        const leg = document.getElementById('anv2TypeLegend');
        if (leg) {
          leg.innerHTML = typeEntries.length
            ? typeEntries
                .map(
                  (e) => `
              <div class="anv2-legend-row">
                <span class="dot" style="background:${e.color}"></span>
                <span class="lbl">${escHtml(e.name)}</span>
                <span class="val">${shortDur(e.value)}</span>
              </div>`,
                )
                .join('')
            : '<div style="color:var(--text-3);font-size:.78rem">No data yet</div>';
        }
      }

      const insEl = document.getElementById('anv2Insights');
      if (insEl && typeof generateAIInsights === 'function') {
        const recent = (state.sessions || []).slice(-90);
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
          : '<div style="padding:20px;text-align:center;color:var(--text-3);font-size:.82rem">Log more sessions to unlock insights</div>';
      }
    }, 40);

    return wrap;
  }

  /* ═══════════════ TAB: PROGRESS ═══════════════ */
  function renderProgress() {
    const wrap = document.createElement('div');
    wrap.className = 'anv2-tab-content';

    const stats = calcSyllabusStats();

    // Syllabus status
    const sylCardHtml =
      stats.total === 0
        ? `<div class="anv2-card">${sectionHead('📖', 'Syllabus Status', '', 'sylStatus')}${emptyState('📖', 'No syllabus tracked', 'Open the Syllabus page and mark topics to see progress.', 'Go to Syllabus', 'anv2GoSyllabus')}</div>`
        : `
        <div class="anv2-card">
          ${sectionHead('📖', 'Syllabus Status', `${stats.total} total topics · ${stats.touched} touched`, 'sylStatus')}
          <div class="anv2-kpi-grid" style="margin-bottom:12px">
            ${miniKpi('Not Started', stats.not_started, '', '#6E5F8C')}
            ${miniKpi('Learning', stats.learning, '', '#FBBF24')}
            ${miniKpi('Completed', stats.completed, '', '#10B981')}
            ${miniKpi('Rev (any)', stats.revTotal, '', '#A855F7')}
          </div>
          <div class="anv2-chart-wrap anv2-chart-sm"><canvas id="anv2SylChart"></canvas></div>
          <div style="margin-top:12px;padding:10px 12px;background:rgba(168,85,247,.08);border-radius:10px;font-size:.72rem;line-height:1.6;color:var(--text-2)">
            <strong style="color:#C4B5FD">📊 Breakdown:</strong>
            ${stats.defaultTotal} default UPSC topics
            ${stats.customSubjectsCount ? ` + ${stats.customSubjectTopicCount} custom-subject topics (${stats.customSubjectsCount} subjects)` : ''}
            ${stats.customTopicUnderDefaultCount ? ` + ${stats.customTopicUnderDefaultCount} custom topics under default subjects` : ''}
            = <strong style="color:var(--text)">${stats.total} total</strong>
          </div>
        </div>`;
    wrap.appendChild(elFrom(sylCardHtml));

    // Revision health
    const revs = state.revisions || [];
    const today = todayKeyLocal();
    const dueToday = revs.filter((r) => r.status === 'pending' && r.due_date === today).length;
    const overdue = revs.filter((r) => r.status === 'pending' && r.due_date < today).length;
    const upcoming = revs.filter((r) => r.status === 'pending' && r.due_date > today).length;
    const done = revs.filter((r) => r.status === 'completed').length;

    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🔁', 'Revision Health', 'UPSC me revision > learning', 'revision')}
        ${
          revs.length === 0
            ? emptyState(
                '🔁',
                'No revisions scheduled',
                'Complete a study session with "Revision" type to auto-schedule cycles.',
                '',
                '',
              )
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

    // Goals
    const goals = state.goals || [];
    const activeGoals = goals.filter((g) => g.current < g.target).length;
    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🎯', 'Goals Progress', `${activeGoals} active`, 'goals')}
        ${
          goals.length === 0
            ? emptyState(
                '🎯',
                'No goals set',
                'Set daily/weekly targets to track your progress.',
                'Create Goal',
                'anv2GoGoals',
              )
            : `<div>${goals
                .slice(0, 8)
                .map((g) => {
                  const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100));
                  const isDone = g.current >= g.target;
                  return `
                <div class="anv2-goal-row">
                  <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                    <strong style="font-size:.82rem;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${escHtml(g.title)}</strong>
                    <span style="font-size:.72rem;color:var(--text-3);flex-shrink:0">${(g.current || 0).toFixed(1)} / ${g.target} ${escHtml(g.unit || 'h')}</span>
                  </div>
                  <div class="progress" style="margin-top:0"><div class="progress-fill ${isDone ? 'green' : ''}" style="width:${pct}%"></div></div>
                </div>`;
                })
                .join('')}</div>`
        }
      </div>
    `),
    );

    // Countdown
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
                'Set your Prelims & Mains dates in Settings to enable countdown.',
                'Set Dates',
                'anv2GoSettings',
              )
            : `<div class="countdown-hero">
              <div class="countdown-card">
                <div class="cd-label">📅 Prelims</div>
                <div class="cd-days">${preDays != null ? preDays : '—'}</div>
                <div class="cd-sub">${preDate ? new Date(preDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set'}</div>
              </div>
              <div class="countdown-card mains">
                <div class="cd-label">📅 Mains</div>
                <div class="cd-days">${mainsDays != null ? mainsDays : '—'}</div>
                <div class="cd-sub">${mainsDate ? new Date(mainsDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set'}</div>
              </div>
            </div>`
        }
      </div>
    `),
    );

    setTimeout(() => {
      const cv = document.getElementById('anv2SylChart');
      if (cv && stats.total > 0 && typeof drawBarChart === 'function') {
        drawBarChart(
          cv,
          ['Not Started', 'Learning', 'Completed', 'Rev 1', 'Rev 2', 'Rev 3'],
          [stats.not_started, stats.learning, stats.completed, stats.rev1, stats.rev2, stats.rev3],
          { unit: '', minMax: 5 },
        );
      }
    }, 40);

    return wrap;
  }

  /* ═══════════════ TAB: SUBJECTS ═══════════════ */
  function renderSubjects() {
    const wrap = document.createElement('div');
    wrap.className = 'anv2-tab-content';
    const sessions = state.sessions || [];

    // Category distribution
    const catTotals = {};
    sessions.forEach((s) => {
      const c = s.category || 'other';
      catTotals[c] = (catTotals[c] || 0) + (s.duration || 0);
    });
    const catEntries = Object.entries(catTotals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: catLabel(name), value, color: catColorFor(name) }));

    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('🎯', 'Category Distribution', 'Time spent per UPSC paper', 'categoryDist')}
        ${
          catEntries.length === 0
            ? emptyState('🎯', 'No sessions yet', 'Log a study session to see category breakdown.', '', '')
            : `<div class="anv2-split">
              <div class="anv2-chart-wrap anv2-chart-sm"><canvas id="anv2CatChart"></canvas></div>
              <div id="anv2CatLegend" class="anv2-legend"></div>
            </div>`
        }
      </div>
    `),
    );

    // Subject comparison
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

    wrap.appendChild(
      elFrom(`
      <div class="anv2-card">
        ${sectionHead('📚', 'Subject Comparison', 'Top subjects by time spent', 'subjectCompare')}
        ${
          subjRows.length === 0
            ? emptyState('📚', 'No subject data', 'Log sessions with different subjects.', '', '')
            : `<div class="anv2-table-scroll">
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
            </div>`
        }
      </div>
    `),
    );

    // Neglected
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
            ? `<div style="padding:14px;text-align:center;color:var(--emerald);font-size:.82rem">🎉 All subjects touched recently</div>`
            : `<div class="list">${neglected
                .map(([name, d]) => {
                  const days = d.last ? Math.floor((new Date(todayKeyLocal()) - new Date(d.last)) / 86400000) : '∞';
                  return `
                <div class="row-item" style="cursor:default">
                  <span class="row-dot" style="background:${typeof getSubjectColor === 'function' ? getSubjectColor(name) : '#A855F7'}"></span>
                  <div class="row-info">
                    <div class="row-title">${escHtml(name)}</div>
                    <div class="row-meta">Last: ${d.last ? fmtDateKey(d.last) : 'never'} · ${days}d ago</div>
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
      const cv = document.getElementById('anv2CatChart');
      const leg = document.getElementById('anv2CatLegend');
      if (cv && catEntries.length && typeof drawDonut === 'function') {
        drawDonut(cv, catEntries);
        if (leg) {
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
      }
    }, 40);

    return wrap;
  }

  /* ═══════════════ TAB: TESTS ═══════════════ */
  function renderTests() {
    const wrap = document.createElement('div');
    wrap.className = 'anv2-tab-content';

    // Detect unified test records structure (may be testRecords OR mocks + pyqs)
    const testRecords = state.testRecords || state.tests || state.mocks || [];
    const pyqs = state.pyqs || [];

    // ═══ Test records section ═══
    if (testRecords.length === 0) {
      wrap.appendChild(
        elFrom(`
        <div class="anv2-card">
          ${sectionHead('📝', 'Test Records', 'Mock · Sectional · PYQ · Full-Length', 'mockTests')}
          ${emptyState('📝', 'No tests logged', 'Log tests from the Tests page to see score trends and accuracy.', 'Log Test', 'anv2GoTests')}
        </div>
      `),
      );
    } else {
      // Group by type if type field exists
      const byType = {};
      testRecords.forEach((t) => {
        const type = t.type || t.test_type || 'mock';
        if (!byType[type]) byType[type] = [];
        byType[type].push(t);
      });

      // Overall stats
      const scores = testRecords.map((m) => {
        const total = m.total_marks || m.total || 100;
        const score = m.score || 0;
        return total ? (score / total) * 100 : 0;
      });
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const best = scores.length ? Math.max(...scores) : 0;
      const latest = scores.length ? scores[scores.length - 1] : 0;

      wrap.appendChild(
        elFrom(`
        <div class="anv2-card">
          ${sectionHead('📝', 'Test Records', `${testRecords.length} tests logged`, 'mockTests')}
          <div class="anv2-kpi-grid" style="margin-bottom:12px">
            ${miniKpi('Tests', testRecords.length, '', '#A855F7')}
            ${miniKpi('Avg %', Math.round(avg) + '%', '', '#EC4899')}
            ${miniKpi('Best %', Math.round(best) + '%', '', '#FBBF24')}
            ${miniKpi('Latest %', Math.round(latest) + '%', '', '#10B981')}
          </div>
          <div class="anv2-chart-wrap anv2-chart-sm"><canvas id="anv2TestChart"></canvas></div>
        </div>
      `),
      );

      // Type breakdown
      const typeCards = Object.entries(byType)
        .map(([type, list]) => {
          const tAvg = list.length
            ? list.reduce((a, m) => a + ((m.score || 0) / (m.total_marks || m.total || 100)) * 100, 0) / list.length
            : 0;
          return miniKpi(
            type.charAt(0).toUpperCase() + type.slice(1),
            list.length + ' tests',
            Math.round(tAvg) + '% avg',
            '#A855F7',
          );
        })
        .join('');

      if (typeCards) {
        wrap.appendChild(
          elFrom(`
          <div class="anv2-card">
            ${sectionHead('🎯', 'By Test Type', 'Breakdown by category', '')}
            <div class="anv2-kpi-grid">${typeCards}</div>
          </div>
        `),
        );
      }

      setTimeout(() => {
        const cv = document.getElementById('anv2TestChart');
        if (cv && testRecords.length >= 2 && typeof drawLineChart === 'function') {
          const sorted = [...testRecords].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
          const labels = sorted.map((m) => (m.date ? fmtDateKey(m.date) : ''));
          const values = sorted.map((m) => {
            const total = m.total_marks || m.total || 100;
            return total ? ((m.score || 0) / total) * 100 : 0;
          });
          drawLineChart(cv, labels, values, { unit: '%', minMax: 100 });
        }
      }, 40);
    }

    // ═══ PYQ section (only if pyqs array exists separately) ═══
    if (pyqs.length > 0) {
      const totalSolved = pyqs.reduce((a, p) => a + (p.solved || 0), 0);
      const totalCorrect = pyqs.reduce((a, p) => a + (p.correct || 0), 0);
      const accuracy = totalSolved ? Math.round((totalCorrect / totalSolved) * 100) : 0;

      wrap.appendChild(
        elFrom(`
        <div class="anv2-card">
          ${sectionHead('📖', 'PYQ Coverage', 'Previous year questions', 'pyq')}
          <div class="anv2-kpi-grid">
            ${miniKpi('Solved', totalSolved, '', '#10B981')}
            ${miniKpi('Accuracy', accuracy + '%', '', '#A855F7')}
            ${miniKpi('Entries', pyqs.length, '', '#EC4899')}
          </div>
        </div>
      `),
      );
    }

    return wrap;
  }

  /* ═══════════════ MAIN OVERRIDE ═══════════════ */
  function installAnalyticsV2() {
    window.renderAnalytics = function () {
      injectCSS();
      const root = document.getElementById('view-analytics');
      if (!root) return;

      root.innerHTML = '';

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
    console.log('[analytics-v2] ✅ renderAnalytics overridden');
  }

  /* ═══════════════ INIT ═══════════════ */
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
