/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Analytics v2 (PM-grade redesign)
   ─────────────────────────────────────────────────────────────
   ✅ Hero Score Card — Consistency + Syllabus + Streak
   ✅ 4 Tabs: Overview | Progress | Subjects | Tests
   ✅ Empty states for missing data (graceful)
   ✅ Reuses existing canvas helpers + theme variables
   ✅ Overrides window.renderAnalytics
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[analytics-v2] loaded');

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
  const SUBJECT_COLORS = [
    '#A855F7',
    '#EC4899',
    '#F97316',
    '#FBBF24',
    '#14B8A6',
    '#06B6D4',
    '#10B981',
    '#6366F1',
    '#EF4444',
    '#8B5CF6',
  ];

  /* ═══════════════ LOCAL STATE ═══════════════ */
  let anV2 = { tab: 'overview', range: 30 };

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

  /* ═══════════════ SECTION WRAPPERS ═══════════════ */
  function sectionHead(icon, title, subtitle) {
    return `
      <div class="anv2-sec-head">
        <div class="anv2-sec-icon">${icon}</div>
        <div style="flex:1;min-width:0">
          <div class="anv2-sec-title">${escHtml(title)}</div>
          ${subtitle ? `<div class="anv2-sec-sub">${escHtml(subtitle)}</div>` : ''}
        </div>
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
  function kpiCard(label, value, sub, icon, color) {
    return `
      <div class="kpi" style="--c:${color};--cb:color-mix(in srgb, ${color} 15%, transparent)">
        <div class="kpi-top"><div class="kpi-icon">${icon}</div></div>
        <div class="kpi-label">${escHtml(label)}</div>
        <div class="kpi-value">${escHtml(value)}</div>
        ${sub ? `<div class="kpi-sub">${escHtml(sub)}</div>` : ''}
      </div>`;
  }

  /* ═══════════════ CSS INJECTION ═══════════════ */
  function injectCSS() {
    if (document.getElementById('anv2CSS')) return;
    const s = document.createElement('style');
    s.id = 'anv2CSS';
    s.textContent = `
      /* ═══ v2 Analytics Layout ═══ */
      .anv2-wrap { display: flex; flex-direction: column; gap: 18px; }
      .anv2-hero {
        background: linear-gradient(135deg, rgba(168,85,247,.14), rgba(236,72,153,.08), rgba(249,115,22,.05));
        border: 1px solid rgba(168,85,247,.28);
        border-radius: 20px;
        padding: 22px;
        position: relative;
        overflow: hidden;
      }
      .anv2-hero::before {
        content: '';
        position: absolute;
        top: -50%; right: -10%;
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(168,85,247,.28), transparent 60%);
        pointer-events: none;
      }
      .anv2-hero-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 14px;
        position: relative;
        z-index: 1;
      }
      .anv2-hero-card {
        background: rgba(0,0,0,.28);
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 14px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .anv2-hero-card .lbl {
        font-size: .62rem;
        font-weight: 800;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: var(--text-3);
      }
      .anv2-hero-card .val {
        font-size: 1.5rem;
        font-weight: 900;
        letter-spacing: -.02em;
        line-height: 1.1;
        background: linear-gradient(135deg, #fff, #c4b5fd);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .anv2-hero-card .sub {
        font-size: .7rem;
        color: var(--text-3);
      }
      .anv2-hero-card.accent-pink .val { background: linear-gradient(135deg, #f9a8d4, #ec4899); -webkit-background-clip: text; background-clip: text; }
      .anv2-hero-card.accent-orange .val { background: linear-gradient(135deg, #fdba74, #f97316); -webkit-background-clip: text; background-clip: text; }
      .anv2-hero-card.accent-teal .val { background: linear-gradient(135deg, #5eead4, #14b8a6); -webkit-background-clip: text; background-clip: text; }

      /* ═══ Tabs ═══ */
      .anv2-tabs {
        display: flex;
        gap: 6px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 5px;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .anv2-tabs::-webkit-scrollbar { display: none; }
      .anv2-tab {
        flex: 1;
        min-width: 90px;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: .82rem;
        font-weight: 700;
        color: var(--text-3);
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all .2s;
        white-space: nowrap;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .anv2-tab:hover { color: var(--text-2); background: var(--card); }
      .anv2-tab.active {
        background: linear-gradient(135deg, #8b5cf6, #ec4899);
        color: #fff;
        box-shadow: 0 6px 18px rgba(168,85,247,.35);
      }

      /* ═══ Section header ═══ */
      .anv2-sec-head {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
        padding-bottom: 12px;
        border-bottom: 1px dashed var(--border);
      }
      .anv2-sec-icon {
        width: 38px;
        height: 38px;
        border-radius: 11px;
        background: linear-gradient(135deg, rgba(168,85,247,.2), rgba(236,72,153,.12));
        border: 1px solid rgba(168,85,247,.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        flex-shrink: 0;
      }
      .anv2-sec-title {
        font-size: 1rem;
        font-weight: 800;
        letter-spacing: -.01em;
        color: var(--text);
      }
      .anv2-sec-sub {
        font-size: .74rem;
        color: var(--text-3);
        margin-top: 2px;
      }

      /* ═══ Cards ═══ */
      .anv2-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 18px;
      }
      .anv2-card + .anv2-card { margin-top: 14px; }

      /* ═══ Empty state ═══ */
      .anv2-empty {
        text-align: center;
        padding: 32px 20px;
        color: var(--text-3);
      }
      .anv2-empty-icon {
        font-size: 2.4rem;
        margin-bottom: 10px;
        opacity: .7;
      }
      .anv2-empty-title {
        font-size: .95rem;
        font-weight: 800;
        color: var(--text-2);
        margin-bottom: 6px;
      }
      .anv2-empty-desc {
        font-size: .82rem;
        color: var(--text-3);
        line-height: 1.6;
        max-width: 340px;
        margin: 0 auto 14px;
      }

      /* ═══ Heatmap ═══ */
      .anv2-heatmap {
        overflow-x: auto;
        padding-bottom: 6px;
      }
      .anv2-heatmap-grid {
        display: grid;
        gap: 3px;
        min-width: fit-content;
      }
      .anv2-hm-cell {
        width: 12px; height: 12px;
        border-radius: 3px;
        background: var(--card-2);
      }
      .anv2-hm-lbl {
        font-size: .6rem;
        color: var(--text-3);
        display: flex;
        align-items: center;
        padding-right: 6px;
        white-space: nowrap;
        font-weight: 700;
      }
      .anv2-hm-month {
        font-size: .58rem;
        color: var(--text-3);
        font-weight: 700;
        text-align: left;
      }

      /* ═══ Tab content spacing ═══ */
      .anv2-tab-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        animation: fadeIn .25s ease;
      }

      /* ═══ Progress ring wrapper ═══ */
      .anv2-ring-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      /* ═══ Comparison table ═══ */
      .anv2-table {
        width: 100%;
        border-collapse: collapse;
        font-size: .82rem;
      }
      .anv2-table th {
        text-align: left;
        font-size: .68rem;
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--text-3);
        padding: 8px 6px;
        border-bottom: 1px solid var(--border);
      }
      .anv2-table td {
        padding: 10px 6px;
        border-bottom: 1px solid var(--border);
        color: var(--text-2);
      }
      .anv2-table tr:last-child td { border-bottom: none; }
      .anv2-table .subject-dot {
        display: inline-block;
        width: 8px; height: 8px;
        border-radius: 50%;
        margin-right: 6px;
        vertical-align: middle;
      }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════ CHART HELPERS ═══════════════ */
  function drawLineWithTarget(canvas, labels, values, target, opts = {}) {
    const { ctx, w, h } = window.setupCanvas ? window.setupCanvas(canvas) : { ctx: null };
    if (!ctx) return;
    const c = window.themeColors ? window.themeColors() : { border: '#2A1E42', text3: '#6E5F8C' };
    const p = { t: 20, r: 16, b: 32, l: 48 };
    const cw = w - p.l - p.r,
      ch = h - p.t - p.b;
    const max = Math.max(...values, target || 0, opts.minMax || 4) * 1.1;

    // grid + y-axis labels
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = p.t + (ch / 4) * i;
      ctx.beginPath();
      ctx.moveTo(p.l, y);
      ctx.lineTo(w - p.r, y);
      ctx.stroke();
      ctx.fillStyle = c.text3;
      ctx.font = '11px Inter,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText((max - (max / 4) * i).toFixed(1) + 'h', p.l - 8, y + 4);
    }

    // target line
    if (target > 0) {
      const ty = p.t + ch - (target / max) * ch;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.l, ty);
      ctx.lineTo(w - p.r, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 10px Inter,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Target ' + target + 'h', p.l + 4, ty - 4);
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
    ctx.font = '11px Inter,sans-serif';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.ceil(n / 7));
    labels.forEach((lab, i) => {
      if (i % step !== 0 && i !== n - 1) return;
      ctx.fillText(lab, xFor(i), h - 10);
    });
  }

  /* ═══════════════ SECTION: HERO ═══════════════ */
  function renderHero() {
    const sessions = state.sessions || [];
    const todaySec = sessions.filter((s) => s.date === todayKeyLocal()).reduce((a, s) => a + (s.duration || 0), 0);
    const target = (state.settings?.daily_target || 8) * 3600;
    const streak = typeof computeStreak === 'function' ? computeStreak() : 0;
    const bestStreak = typeof computeLongestStreak === 'function' ? computeLongestStreak() : 0;

    // Syllabus %
    const syl = state.syllabus || [];
    const sylTotal = syl.length;
    const sylDone = syl.filter((s) => s.status === 'completed' || (s.status || '').startsWith('rev')).length;
    const sylPct = sylTotal ? Math.round((sylDone / sylTotal) * 100) : 0;

    // Last 7 vs previous 7
    let last7 = 0,
      prev7 = 0;
    for (let i = 0; i < 7; i++)
      last7 += sessions.filter((s) => s.date === daysAgoKey(i)).reduce((a, s) => a + (s.duration || 0), 0);
    for (let i = 7; i < 14; i++)
      prev7 += sessions.filter((s) => s.date === daysAgoKey(i)).reduce((a, s) => a + (s.duration || 0), 0);
    let trendPct = 0,
      trendIcon = '—',
      trendColor = '#6E5F8C';
    if (prev7 > 0) {
      trendPct = Math.round(((last7 - prev7) / prev7) * 100);
      if (trendPct > 0) {
        trendIcon = '↑';
        trendColor = '#34D399';
      } else if (trendPct < 0) {
        trendIcon = '↓';
        trendColor = '#F87171';
      }
    }

    const todayPct = target ? Math.round((todaySec / target) * 100) : 0;

    return `
      <div class="anv2-hero">
        <div class="anv2-hero-grid">
          <div class="anv2-hero-card accent-teal">
            <div class="lbl">Today</div>
            <div class="val">${shortDur(todaySec)}</div>
            <div class="sub">${todayPct}% of ${state.settings?.daily_target || 8}h target</div>
          </div>
          <div class="anv2-hero-card accent-pink">
            <div class="lbl">🔥 Streak</div>
            <div class="val">${streak}d</div>
            <div class="sub">Best: ${bestStreak}d</div>
          </div>
          <div class="anv2-hero-card">
            <div class="lbl">📖 Syllabus</div>
            <div class="val">${sylPct}%</div>
            <div class="sub">${sylDone}/${sylTotal} topics</div>
          </div>
          <div class="anv2-hero-card accent-orange">
            <div class="lbl">Last 7 Days</div>
            <div class="val" style="color:${trendColor};-webkit-text-fill-color:${trendColor}">${trendIcon} ${Math.abs(trendPct)}%</div>
            <div class="sub">${shortDur(last7)} vs ${shortDur(prev7)}</div>
          </div>
        </div>
      </div>
    `;
  }

  /* ═══════════════ SECTION: TABS ═══════════════ */
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

    // ═══ Study time trend with target line ═══
    const range = anV2.range;
    const labels = [];
    const values = [];
    const target = state.settings?.daily_target || 8;
    for (let i = range - 1; i >= 0; i--) {
      const key = daysAgoKey(i);
      labels.push(fmtDateKey(key));
      const sec = (state.sessions || []).filter((s) => s.date === key).reduce((a, s) => a + (s.duration || 0), 0);
      values.push(sec / 3600);
    }

    const card1 = elFrom(`
      <div class="anv2-card">
        ${sectionHead('📈', 'Daily Study Time', `Last ${range} days · target line overlay`)}
        <div class="chart-wrap" style="height:220px"><canvas id="anv2DailyChart"></canvas></div>
      </div>
    `);
    wrap.appendChild(card1);

    // ═══ Deep Work Distribution (pie) ═══
    const buckets = [0, 0, 0, 0]; // <30, 30-60, 1-2h, 2h+
    (state.sessions || []).forEach((s) => {
      const min = (s.duration || 0) / 60;
      if (min < 30) buckets[0]++;
      else if (min < 60) buckets[1]++;
      else if (min < 120) buckets[2]++;
      else buckets[3]++;
    });
    const deepWorkEntries = [
      { name: '< 30 min', value: buckets[0], color: '#EF4444' },
      { name: '30-60 min', value: buckets[1], color: '#FBBF24' },
      { name: '1-2 hours', value: buckets[2], color: '#A855F7' },
      { name: '2+ hours', value: buckets[3], color: '#10B981' },
    ];

    // ═══ Study type breakdown ═══
    const typeTotals = { 'New Learning': 0, Revision: 0, Test: 0 };
    (state.sessions || []).forEach((s) => {
      if (typeTotals[s.study_type] != null) typeTotals[s.study_type] += s.duration || 0;
    });
    const typeEntries = [
      { name: '📖 New Learning', value: typeTotals['New Learning'], color: '#A855F7' },
      { name: '🔁 Revision', value: typeTotals['Revision'], color: '#FBBF24' },
      { name: '📝 Test', value: typeTotals['Test'], color: '#14B8A6' },
    ].filter((e) => e.value > 0);

    const card2 = elFrom(`
      <div class="anv2-card">
        ${sectionHead('🧠', 'Deep Work Distribution', 'Session length breakdown — UPSC needs deep work, not short bursts')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center" id="anv2DeepWorkGrid">
          <div class="chart-wrap chart-wrap-sm"><canvas id="anv2DeepChart"></canvas></div>
          <div id="anv2DeepLegend" style="display:flex;flex-direction:column;gap:8px;font-size:.82rem"></div>
        </div>
      </div>
    `);
    wrap.appendChild(card2);

    const card3 = elFrom(`
      <div class="anv2-card">
        ${sectionHead('🎯', 'Study Type Breakdown', 'New Learning vs Revision vs Test')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center">
          <div class="chart-wrap chart-wrap-sm"><canvas id="anv2TypeChart"></canvas></div>
          <div id="anv2TypeLegend" style="display:flex;flex-direction:column;gap:8px;font-size:.82rem"></div>
        </div>
      </div>
    `);
    wrap.appendChild(card3);

    // ═══ Smart Insights ═══
    const insightsCard = elFrom(`
      <div class="ai-card">
        <span class="ai-badge">✨ Smart Insights</span>
        <div class="ai-list" id="anv2Insights"></div>
      </div>
    `);
    wrap.appendChild(insightsCard);

    // ═══ Mount: draw charts after DOM insertion ═══
    setTimeout(() => {
      // Daily chart with target
      const cv = document.getElementById('anv2DailyChart');
      if (cv && typeof drawLineWithTarget === 'function') {
        drawLineWithTarget(cv, labels, values, target);
      }

      // Deep work pie + legend
      const dwc = document.getElementById('anv2DeepChart');
      if (dwc && typeof drawDonut === 'function') {
        drawDonut(dwc, deepWorkEntries);
        const leg = document.getElementById('anv2DeepLegend');
        if (leg) {
          const total = deepWorkEntries.reduce((a, e) => a + e.value, 0);
          leg.innerHTML = deepWorkEntries
            .map(
              (e) => `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:10px;height:10px;border-radius:50%;background:${e.color};flex-shrink:0"></span>
              <span style="flex:1;color:var(--text-2)">${escHtml(e.name)}</span>
              <strong style="color:var(--text)">${e.value}</strong>
            </div>
          `,
            )
            .join('');
        }
      }

      // Type donut + legend
      const tc = document.getElementById('anv2TypeChart');
      if (tc && typeof drawDonut === 'function') {
        if (typeEntries.length) {
          drawDonut(tc, typeEntries);
        } else {
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
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:10px;height:10px;border-radius:50%;background:${e.color};flex-shrink:0"></span>
              <span style="flex:1;color:var(--text-2)">${escHtml(e.name)}</span>
              <strong style="color:var(--text)">${shortDur(e.value)}</strong>
            </div>
          `,
                )
                .join('')
            : '<div style="color:var(--text-3);font-size:.8rem">No data yet</div>';
        }
      }

      // Insights
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
        insEl.innerHTML = insights
          .map(
            (i) =>
              `<div class="ai-item tip-${i.type || 'info'}"><span class="ai-ico">${i.icon}</span><div class="ai-text">${i.text}</div></div>`,
          )
          .join('');
      } else if (insEl) {
        insEl.innerHTML =
          '<div style="padding:20px;text-align:center;color:var(--text-3);font-size:.85rem">Log more sessions to unlock insights</div>';
      }
    }, 30);

    return wrap;
  }

  /* ═══════════════ TAB: PROGRESS ═══════════════ */
  function renderProgress() {
    const wrap = document.createElement('div');
    wrap.className = 'anv2-tab-content';

    // ═══ Syllabus Status breakdown ═══
    const syl = state.syllabus || [];
    const statusCounts = {
      not_started: 0,
      learning: 0,
      completed: 0,
      rev1: 0,
      rev2: 0,
      rev3: 0,
    };
    syl.forEach((t) => {
      const s = t.status || 'not_started';
      if (statusCounts[s] != null) statusCounts[s]++;
    });

    const sylCard = elFrom(`
      <div class="anv2-card">
        ${sectionHead('📖', 'Syllabus Status', `${syl.length} topics tracked`)}
        ${
          syl.length === 0
            ? emptyState(
                '📖',
                'No topics tracked yet',
                'Open the Syllabus page and start marking topics as Learning / Completed to see progress here.',
                'Go to Syllabus',
                'anv2GoSyllabus',
              )
            : `
            <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px">
              ${kpiCard('Not Started', statusCounts.not_started, '', '⚪', '#6E5F8C')}
              ${kpiCard('Learning', statusCounts.learning, '', '🟡', '#FBBF24')}
              ${kpiCard('Completed', statusCounts.completed, '', '✅', '#10B981')}
              ${kpiCard('Rev 1+2+3', statusCounts.rev1 + statusCounts.rev2 + statusCounts.rev3, '', '🔵', '#A855F7')}
            </div>
            <div class="chart-wrap chart-wrap-sm"><canvas id="anv2SylChart"></canvas></div>
          `
        }
      </div>
    `);
    wrap.appendChild(sylCard);

    // ═══ Revision health ═══
    const revs = state.revisions || [];
    const today = todayKeyLocal();
    const dueToday = revs.filter((r) => r.status === 'pending' && r.due_date === today).length;
    const overdue = revs.filter((r) => r.status === 'pending' && r.due_date < today).length;
    const upcoming = revs.filter((r) => r.status === 'pending' && r.due_date > today).length;
    const done = revs.filter((r) => r.status === 'completed').length;

    const revCard = elFrom(`
      <div class="anv2-card">
        ${sectionHead('🔁', 'Revision Health', 'UPSC me revision > learning')}
        ${
          revs.length === 0
            ? emptyState(
                '🔁',
                'No revisions scheduled',
                'Complete a study session with "Revision" type to auto-schedule revision cycles.',
                '',
                '',
              )
            : `
            <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">
              ${kpiCard('Due Today', dueToday, '', '⏰', '#FBBF24')}
              ${kpiCard('Overdue', overdue, '', '⚠️', '#EF4444')}
              ${kpiCard('Upcoming', upcoming, '', '📅', '#A855F7')}
              ${kpiCard('Completed', done, '', '✅', '#10B981')}
            </div>
          `
        }
      </div>
    `);
    wrap.appendChild(revCard);

    // ═══ Goals progress ═══
    const goals = state.goals || [];
    const goalsCard = elFrom(`
      <div class="anv2-card">
        ${sectionHead('🎯', 'Goals Progress', `${goals.filter((g) => g.current < g.target).length} active`)}
        ${
          goals.length === 0
            ? emptyState(
                '🎯',
                'No goals set',
                'Set daily/weekly targets to track your progress against them.',
                'Create Goal',
                'anv2GoGoals',
              )
            : `<div class="list">${goals
                .slice(0, 6)
                .map((g) => {
                  const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100));
                  const isDone = g.current >= g.target;
                  return `
                <div class="item-row" style="padding:12px 14px">
                  <div class="item-body">
                    <div class="item-title">${escHtml(g.title)}</div>
                    <div class="item-meta"><span>${(g.current || 0).toFixed(1)} / ${g.target} ${escHtml(g.unit || 'h')}</span></div>
                    <div class="progress" style="margin-top:8px"><div class="progress-fill ${isDone ? 'green' : ''}" style="width:${pct}%"></div></div>
                  </div>
                </div>`;
                })
                .join('')}</div>`
        }
      </div>
    `);
    wrap.appendChild(goalsCard);

    // ═══ Countdown ═══
    const preDate = state.profile?.exam_date_prelims;
    const mainsDate = state.profile?.exam_date_mains;
    const preDays = preDate && typeof daysUntil === 'function' ? daysUntil(preDate) : null;
    const mainsDays = mainsDate && typeof daysUntil === 'function' ? daysUntil(mainsDate) : null;

    const cdCard = elFrom(`
      <div class="anv2-card">
        ${sectionHead('⏳', 'Exam Countdown', 'Prelims + Mains D-day')}
        ${
          !preDate && !mainsDate
            ? emptyState(
                '📅',
                'Exam dates not set',
                'Set your Prelims & Mains dates in Settings to enable countdown & smart recommendations.',
                'Set Dates',
                'anv2GoSettings',
              )
            : `
            <div class="countdown-hero">
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
            </div>
          `
        }
      </div>
    `);
    wrap.appendChild(cdCard);

    // ═══ Draw syllabus chart ═══
    setTimeout(() => {
      const cv = document.getElementById('anv2SylChart');
      if (cv && syl.length && typeof drawBarChart === 'function') {
        drawBarChart(
          cv,
          ['Not Started', 'Learning', 'Completed', 'Rev 1', 'Rev 2', 'Rev 3'],
          [
            statusCounts.not_started,
            statusCounts.learning,
            statusCounts.completed,
            statusCounts.rev1,
            statusCounts.rev2,
            statusCounts.rev3,
          ],
          { unit: '', minMax: 5 },
        );
      }
    }, 30);

    return wrap;
  }

  /* ═══════════════ TAB: SUBJECTS ═══════════════ */
  function renderSubjects() {
    const wrap = document.createElement('div');
    wrap.className = 'anv2-tab-content';
    const sessions = state.sessions || [];

    // ═══ Category distribution ═══
    const catTotals = {};
    sessions.forEach((s) => {
      const c = s.category || 'other';
      catTotals[c] = (catTotals[c] || 0) + (s.duration || 0);
    });
    const catEntries = Object.entries(catTotals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: catLabel(name), value, color: catColorFor(name) }));

    const catCard = elFrom(`
      <div class="anv2-card">
        ${sectionHead('🎯', 'Category Distribution', 'Time spent per UPSC paper')}
        ${
          catEntries.length === 0
            ? emptyState('🎯', 'No sessions yet', 'Log a study session to see category breakdown.', '', '')
            : `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center">
              <div class="chart-wrap chart-wrap-sm"><canvas id="anv2CatChart"></canvas></div>
              <div id="anv2CatLegend" style="display:flex;flex-direction:column;gap:8px;font-size:.82rem"></div>
            </div>
          `
        }
      </div>
    `);
    wrap.appendChild(catCard);

    // ═══ Subject deep dive table ═══
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

    const subjCard = elFrom(`
      <div class="anv2-card">
        ${sectionHead('📚', 'Subject Comparison', 'Top subjects by time spent')}
        ${
          subjRows.length === 0
            ? emptyState('📚', 'No subject data', 'Log sessions with different subjects to compare.', '', '')
            : `
            <table class="anv2-table">
              <thead><tr>
                <th>Subject</th><th>Time</th><th>Sessions</th><th>Last</th>
              </tr></thead>
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
          `
        }
      </div>
    `);
    wrap.appendChild(subjCard);

    // ═══ Neglected subjects ═══
    const neglected = Object.entries(subjTotals)
      .filter(([, d]) => {
        const daysSince = d.last ? Math.floor((new Date(todayKeyLocal()) - new Date(d.last)) / 86400000) : 999;
        return daysSince >= 7;
      })
      .sort((a, b) => (a[1].last || '').localeCompare(b[1].last || ''))
      .slice(0, 5);

    const negCard = elFrom(`
      <div class="anv2-card">
        ${sectionHead('⚠️', 'Neglected Subjects', 'Not studied in 7+ days')}
        ${
          neglected.length === 0
            ? `<div style="padding:16px;text-align:center;color:var(--emerald);font-size:.85rem">🎉 All subjects touched recently</div>`
            : `<div class="list">${neglected
                .map(([name, d]) => {
                  const days = d.last ? Math.floor((new Date(todayKeyLocal()) - new Date(d.last)) / 86400000) : '∞';
                  return `
                <div class="row-item" style="cursor:default">
                  <span class="row-dot" style="background:${typeof getSubjectColor === 'function' ? getSubjectColor(name) : '#A855F7'}"></span>
                  <div class="row-info">
                    <div class="row-title">${escHtml(name)}</div>
                    <div class="row-meta">Last studied: ${d.last ? fmtDateKey(d.last) : 'never'} · ${days} days ago</div>
                  </div>
                  <span class="row-value" style="color:#F87171">${shortDur(d.sec)}</span>
                </div>`;
                })
                .join('')}</div>`
        }
      </div>
    `);
    wrap.appendChild(negCard);

    // ═══ Draw category donut ═══
    setTimeout(() => {
      const cv = document.getElementById('anv2CatChart');
      const leg = document.getElementById('anv2CatLegend');
      if (cv && catEntries.length && typeof drawDonut === 'function') {
        drawDonut(cv, catEntries);
        if (leg) {
          leg.innerHTML = catEntries
            .map(
              (e) => `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:10px;height:10px;border-radius:50%;background:${e.color};flex-shrink:0"></span>
              <span style="flex:1;color:var(--text-2)">${escHtml(e.name)}</span>
              <strong style="color:var(--text)">${shortDur(e.value)}</strong>
            </div>
          `,
            )
            .join('');
        }
      }
    }, 30);

    return wrap;
  }

  /* ═══════════════ TAB: TESTS ═══════════════ */
  function renderTests() {
    const wrap = document.createElement('div');
    wrap.className = 'anv2-tab-content';
    const mocks = state.mocks || [];
    const pyqs = state.pyqs || [];

    // ═══ Mock tests ═══
    const mockCard = elFrom(`
      <div class="anv2-card">
        ${sectionHead('📝', 'Mock Tests', 'Score trend & accuracy')}
        ${
          mocks.length === 0
            ? emptyState(
                '📝',
                'No mock tests logged',
                'Log your mock tests from the Tests page to see score trends and accuracy analysis.',
                'Log Test',
                'anv2GoTests',
              )
            : (() => {
                const sorted = [...mocks].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
                const scores = sorted.map((m) => ((m.score || 0) / (m.total_marks || 1)) * 100);
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                const best = Math.max(...scores);
                const latest = scores[scores.length - 1];
                return `
                <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px">
                  ${kpiCard('Tests', mocks.length, '', '📋', '#A855F7')}
                  ${kpiCard('Avg %', Math.round(avg) + '%', '', '📊', '#EC4899')}
                  ${kpiCard('Best %', Math.round(best) + '%', '', '🏆', '#FBBF24')}
                  ${kpiCard('Latest %', Math.round(latest) + '%', '', '🎯', '#10B981')}
                </div>
                <div class="chart-wrap chart-wrap-sm"><canvas id="anv2MockChart"></canvas></div>
              `;
              })()
        }
      </div>
    `);
    wrap.appendChild(mockCard);

    // ═══ PYQ coverage ═══
    const pyqCard = elFrom(`
      <div class="anv2-card">
        ${sectionHead('📖', 'PYQ Coverage', 'Previous year questions solved')}
        ${
          pyqs.length === 0
            ? emptyState(
                '📖',
                'No PYQs tracked',
                'Log PYQ practice from the Tests page to track your coverage year-wise.',
                'Log PYQ',
                'anv2GoTests',
              )
            : (() => {
                const totalSolved = pyqs.reduce((a, p) => a + (p.solved || 0), 0);
                const totalCorrect = pyqs.reduce((a, p) => a + (p.correct || 0), 0);
                const accuracy = totalSolved ? Math.round((totalCorrect / totalSolved) * 100) : 0;
                return `
                <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">
                  ${kpiCard('Solved', totalSolved, '', '✅', '#10B981')}
                  ${kpiCard('Accuracy', accuracy + '%', '', '🎯', '#A855F7')}
                  ${kpiCard('Entries', pyqs.length, '', '📚', '#EC4899')}
                </div>
              `;
              })()
        }
      </div>
    `);
    wrap.appendChild(pyqCard);

    // ═══ Draw mock chart ═══
    setTimeout(() => {
      const cv = document.getElementById('anv2MockChart');
      if (cv && mocks.length >= 2 && typeof drawLineChart === 'function') {
        const sorted = [...mocks].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        const labels = sorted.map((m) => (m.date ? fmtDateKey(m.date) : ''));
        const values = sorted.map((m) => ((m.score || 0) / (m.total_marks || 1)) * 100);
        drawLineChart(cv, labels, values, { unit: '%', minMax: 100 });
      }
    }, 30);

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

      // Hero (always visible)
      wrap.appendChild(elFrom(renderHero()));
      // Tabs
      wrap.appendChild(elFrom(renderTabs()));

      // Tab content
      let content;
      if (anV2.tab === 'overview') content = renderOverview();
      else if (anV2.tab === 'progress') content = renderProgress();
      else if (anV2.tab === 'subjects') content = renderSubjects();
      else content = renderTests();
      wrap.appendChild(content);

      root.appendChild(wrap);

      // Wire tab clicks
      root.querySelectorAll('[data-anv2-tab]').forEach((btn) => {
        btn.onclick = () => {
          anV2.tab = btn.dataset.anv2Tab;
          window.renderAnalytics();
        };
      });

      // Wire empty state CTAs
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
      // Also try to re-render if analytics is the current view
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
