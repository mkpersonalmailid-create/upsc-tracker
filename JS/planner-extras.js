/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Planner Extras v3 (FULL UI)
   ─────────────────────────────────────────────────────────────
   ✅ Stats strip — Total / Completed / Pending / Progress
   ✅ Progress bar for selected day
   ✅ Overdue section — past pending blocks
   ✅ Upcoming section — future dated blocks (grouped by date)
   ✅ Quick nav chips — Today / Tomorrow / Next days
   ✅ Better block cards with time chip + duration
   ✅ Persist to Supabase (toggle/delete/add)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[planner-extras] v3 loaded');

  /* ═══════════════ HELPERS ═══════════════ */
  function escHtml(str) {
    return String(str || '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  function safeUUID() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'pln-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function dateKey(d) {
    const x = new Date(d);
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function parseDate(k) {
    return new Date(k + 'T00:00:00');
  }

  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function diffDays(a, b) {
    const A = new Date(a);
    A.setHours(0, 0, 0, 0);
    const B = new Date(b);
    B.setHours(0, 0, 0, 0);
    return Math.round((A - B) / 86400000);
  }

  function fmtRelativeDate(key) {
    if (!key) return '';
    const today = todayKey();
    const diff = diffDays(parseDate(key), parseDate(today));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return `${Math.abs(diff)} days ago`;
    if (diff < 7) return `In ${diff} days`;
    // Fallback to date
    const d = parseDate(key);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
  }

  function fmtDateShort(key) {
    const d = parseDate(key);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtMinutes(mins) {
    mins = Math.max(0, Math.floor(mins || 0));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }

  function fmtTime12(t) {
    if (!t) return '—';
    const [hh, mm] = String(t).split(':').map(Number);
    if (isNaN(hh)) return t;
    const ap = hh >= 12 ? 'PM' : 'AM';
    const hr = hh % 12 || 12;
    return `${hr}:${String(mm || 0).padStart(2, '0')} ${ap}`;
  }

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    if (document.getElementById('plannerExtrasCSS')) return;
    const style = document.createElement('style');
    style.id = 'plannerExtrasCSS';
    style.textContent = `
      /* ═══ Stats strip ═══ */
      .pl-stats-strip {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }
      .pl-stat-card {
        background: var(--card-2);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px 14px;
        position: relative;
        overflow: hidden;
        transition: all .2s;
      }
      .pl-stat-card:hover {
        border-color: var(--border-2);
        transform: translateY(-2px);
      }
      .pl-stat-card::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: var(--c, var(--purple));
      }
      .pl-stat-lbl {
        font-size: .62rem;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: var(--text-3);
        margin-bottom: 4px;
      }
      .pl-stat-val {
        font-size: 1.35rem;
        font-weight: 900;
        letter-spacing: -.02em;
        line-height: 1.1;
        color: var(--text);
      }
      .pl-stat-sub {
        font-size: .68rem;
        color: var(--text-3);
        margin-top: 3px;
        font-weight: 600;
      }

      /* ═══ Quick nav ═══ */
      .pl-quicknav {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        margin-bottom: 14px;
        padding-bottom: 4px;
        scrollbar-width: none;
      }
      .pl-quicknav::-webkit-scrollbar { display: none; }
      .pl-qn-chip {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 68px;
        padding: 8px 12px;
        border-radius: 11px;
        background: var(--card-2);
        border: 1.5px solid var(--border);
        cursor: pointer;
        transition: all .2s;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .pl-qn-chip:hover {
        border-color: var(--purple);
        transform: translateY(-2px);
      }
      .pl-qn-chip.active {
        background: linear-gradient(135deg, rgba(168,85,247,.25), rgba(236,72,153,.15));
        border-color: var(--purple);
        box-shadow: 0 4px 14px rgba(168,85,247,.35);
      }
      .pl-qn-day {
        font-size: .62rem;
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--text-3);
      }
      .pl-qn-chip.active .pl-qn-day { color: #C4B5FD; }
      .pl-qn-num {
        font-size: 1rem;
        font-weight: 900;
        color: var(--text);
        margin-top: 2px;
      }
      .pl-qn-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--amber);
        margin-top: 4px;
        box-shadow: 0 0 6px var(--amber);
      }
      .pl-qn-dot.hidden { display: none; }

      /* ═══ Progress bar ═══ */
      .pl-progress-wrap {
        background: var(--card-2);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 16px;
      }
      .pl-progress-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .pl-progress-title {
        font-size: .72rem;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: var(--text-3);
      }
      .pl-progress-pct {
        font-size: .85rem;
        font-weight: 900;
        color: var(--purple);
      }
      .pl-progress-bar {
        height: 8px;
        background: var(--bg);
        border-radius: 20px;
        overflow: hidden;
        position: relative;
      }
      .pl-progress-fill {
        height: 100%;
        border-radius: 20px;
        background: linear-gradient(90deg, #8B5CF6, #EC4899);
        transition: width .5s cubic-bezier(.4,0,.2,1);
        position: relative;
      }
      .pl-progress-fill::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent);
        animation: plShimmer 2s infinite;
      }
      @keyframes plShimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      /* ═══ Section header ═══ */
      .pl-section-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        margin-top: 20px;
        padding-bottom: 8px;
        border-bottom: 1px dashed var(--border);
      }
      .pl-section-head:first-of-type { margin-top: 0; }
      .pl-section-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .pl-section-title {
        font-size: .78rem;
        font-weight: 800;
        letter-spacing: .05em;
        text-transform: uppercase;
        color: var(--text-2);
        flex: 1;
      }
      .pl-section-count {
        font-size: .68rem;
        font-weight: 800;
        padding: 2px 10px;
        border-radius: 20px;
        background: var(--card-2);
        color: var(--text-3);
      }

      /* ═══ Date group header (for Overdue & Upcoming) ═══ */
      .pl-date-group {
        margin-bottom: 14px;
      }
      .pl-date-group-head {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: var(--bg-2);
        border-radius: 9px;
        margin-bottom: 8px;
        font-size: .8rem;
      }
      .pl-date-group-rel {
        font-weight: 800;
        color: var(--text);
      }
      .pl-date-group-date {
        font-size: .72rem;
        color: var(--text-3);
        font-weight: 600;
      }
      .pl-date-group-count {
        margin-left: auto;
        font-size: .68rem;
        font-weight: 800;
        padding: 2px 10px;
        border-radius: 20px;
        background: var(--card-2);
        color: var(--text-3);
      }

      /* ═══ Block card ═══ */
      .pl-block {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        background: var(--card-2);
        border: 1px solid var(--border);
        border-radius: 12px;
        margin-bottom: 8px;
        transition: all .2s;
        position: relative;
        overflow: hidden;
      }
      .pl-block:hover {
        border-color: var(--border-2);
        transform: translateX(3px);
      }
      .pl-block.done { opacity: .6; }
      .pl-block.done .pl-block-title {
        text-decoration: line-through;
        color: var(--text-3);
      }
      .pl-block.overdue {
        background: linear-gradient(135deg, rgba(239,68,68,.06), rgba(239,68,68,.02));
        border-color: rgba(239,68,68,.3);
      }
      .pl-block.upcoming {
        background: linear-gradient(135deg, rgba(99,102,241,.06), rgba(99,102,241,.02));
        border-color: rgba(99,102,241,.3);
      }
      .pl-block::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: var(--bc, var(--purple));
      }
      .pl-block-check {
        width: 24px;
        height: 24px;
        border-radius: 8px;
        border: 2px solid var(--border-2);
        background: var(--bg);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        cursor: pointer;
        transition: all .2s;
        font-size: .8rem;
        color: transparent;
        font-weight: 900;
      }
      .pl-block-check:hover { border-color: var(--purple); }
      .pl-block.done .pl-block-check {
        background: linear-gradient(135deg, #10B981, #34D399);
        border-color: transparent;
        color: #fff;
      }
      .pl-block-body { flex: 1; min-width: 0; }
      .pl-block-title {
        font-weight: 800;
        font-size: .92rem;
        color: var(--text);
        margin-bottom: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pl-block-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pl-time-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: 20px;
        font-size: .68rem;
        font-weight: 700;
        background: rgba(168,85,247,.12);
        color: #C4B5FD;
        white-space: nowrap;
      }
      .pl-dur-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: 20px;
        font-size: .68rem;
        font-weight: 700;
        background: rgba(20,184,166,.12);
        color: #5EEAD4;
        white-space: nowrap;
      }
      .pl-overdue-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: 20px;
        font-size: .68rem;
        font-weight: 800;
        background: rgba(239,68,68,.15);
        color: #FCA5A5;
        white-space: nowrap;
      }
      .pl-block-del {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-3);
        font-size: .85rem;
        transition: all .2s;
        flex-shrink: 0;
        background: transparent;
        border: none;
        cursor: pointer;
      }
      .pl-block-del:hover {
        background: rgba(239,68,68,.12);
        color: #FCA5A5;
      }

      /* ═══ Empty state ═══ */
      .pl-empty {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-3);
      }
      .pl-empty-icon {
        font-size: 2.6rem;
        margin-bottom: 12px;
        opacity: .6;
      }
      .pl-empty-title {
        font-size: .95rem;
        font-weight: 800;
        color: var(--text-2);
        margin-bottom: 6px;
      }
      .pl-empty-sub {
        font-size: .82rem;
        color: var(--text-3);
        line-height: 1.6;
        margin-bottom: 16px;
      }
      .pl-empty-mini {
        text-align: center;
        padding: 20px;
        color: var(--text-3);
        font-size: .82rem;
        font-style: italic;
      }

      @media (max-width: 600px) {
        .pl-stat-card { padding: 10px 12px; }
        .pl-stat-val { font-size: 1.15rem; }
        .pl-block { padding: 12px 12px; gap: 10px; }
        .pl-block-title { font-size: .85rem; }
        .pl-qn-chip { min-width: 58px; padding: 7px 10px; }
        .pl-qn-num { font-size: .92rem; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════ LOAD PLANS FROM DB ═══════════════ */
  async function loadPlansFromDB() {
    if (!supa || !state.user) return;
    try {
      const { data, error } = await supa
        .from('plans')
        .select('*')
        .eq('user_id', state.user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data?.length) {
        state.plans = data.map((x) => ({
          id: x.id,
          date: x.date,
          start: x.start_time || '09:00',
          end: x.end_time || '11:00',
          subject: x.subject || 'Study',
          target_minutes: x.target_minutes || 60,
          completed: !!x.completed,
        }));
      } else {
        state.plans = state.plans || [];
      }
      console.log('[planner-extras] loaded', state.plans.length, 'plans');
    } catch (e) {
      console.warn('[planner-extras] load error:', e);
    }
  }

  /* ═══════════════ STATS STRIP ═══════════════ */
  function buildStatsStrip(blocks) {
    const total = blocks.length;
    const completed = blocks.filter((b) => b.completed).length;
    const pending = total - completed;
    const totalMinutes = blocks.reduce((a, b) => a + (b.target_minutes || 0), 0);
    const doneMinutes = blocks.filter((b) => b.completed).reduce((a, b) => a + (b.target_minutes || 0), 0);
    const pct = total ? Math.round((completed / total) * 100) : 0;

    const cards = [
      { label: 'Total Blocks', value: total, sub: `${fmtMinutes(totalMinutes)} planned`, color: 'var(--purple)' },
      { label: 'Completed', value: completed, sub: `${fmtMinutes(doneMinutes)} done`, color: 'var(--emerald)' },
      {
        label: 'Pending',
        value: pending,
        sub: `${fmtMinutes(totalMinutes - doneMinutes)} left`,
        color: 'var(--amber)',
      },
      { label: 'Progress', value: pct + '%', sub: `${completed}/${total} blocks`, color: 'var(--pink)' },
    ];

    const strip = document.createElement('div');
    strip.className = 'pl-stats-strip';
    strip.innerHTML = cards
      .map(
        (c) => `
      <div class="pl-stat-card" style="--c:${c.color}">
        <div class="pl-stat-lbl">${c.label}</div>
        <div class="pl-stat-val">${c.value}</div>
        <div class="pl-stat-sub">${c.sub}</div>
      </div>`,
      )
      .join('');
    return strip;
  }

  /* ═══════════════ PROGRESS BAR ═══════════════ */
  function buildProgressBar(blocks) {
    const total = blocks.length;
    const completed = blocks.filter((b) => b.completed).length;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    const wrap = document.createElement('div');
    wrap.className = 'pl-progress-wrap';
    wrap.innerHTML = `
      <div class="pl-progress-head">
        <span class="pl-progress-title">Day Progress</span>
        <span class="pl-progress-pct">${pct}%</span>
      </div>
      <div class="pl-progress-bar">
        <div class="pl-progress-fill" style="width:${pct}%"></div>
      </div>
    `;
    return wrap;
  }

  /* ═══════════════ SECTION HEAD ═══════════════ */
  function buildSectionHead(label, count, color) {
    const head = document.createElement('div');
    head.className = 'pl-section-head';
    head.innerHTML = `
      <span class="pl-section-dot" style="background:${color}"></span>
      <span class="pl-section-title">${label}</span>
      <span class="pl-section-count">${count}</span>
    `;
    return head;
  }

  /* ═══════════════ BLOCK CARD ═══════════════ */
  function buildBlock(p, opts = {}) {
    const isOverdue = opts.overdue && !p.completed;
    const isUpcoming = opts.upcoming && !p.completed;

    let color = 'var(--purple)';
    if (p.completed) color = 'var(--emerald)';
    else if (isOverdue) color = 'var(--red)';
    else if (isUpcoming) color = 'var(--indigo)';

    const classes = ['pl-block'];
    if (p.completed) classes.push('done');
    if (isOverdue) classes.push('overdue');
    if (isUpcoming) classes.push('upcoming');

    const overdueChip = isOverdue ? `<span class="pl-overdue-chip">⚠ ${fmtRelativeDate(p.date)}</span>` : '';

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="${classes.join(' ')}" style="--bc:${color}">
        <button class="pl-block-check" data-plan-toggle="${p.id}" title="${p.completed ? 'Mark incomplete' : 'Mark complete'}">✓</button>
        <div class="pl-block-body">
          <div class="pl-block-title">${escHtml(p.subject)}</div>
          <div class="pl-block-meta">
            <span class="pl-time-chip">🕐 ${fmtTime12(p.start)} – ${fmtTime12(p.end)}</span>
            <span class="pl-dur-chip">⏱ ${fmtMinutes(p.target_minutes)}</span>
            ${overdueChip}
          </div>
        </div>
        <button class="pl-block-del" data-plan-del="${p.id}" title="Delete">✕</button>
      </div>`;
    return wrapper.firstElementChild;
  }

  /* ═══════════════ QUICK NAV ═══════════════ */
  function buildQuickNav(selectedKey) {
    const today = new Date();
    const allPlans = state.plans || [];
    const chips = [];

    // Show: Today, +1, +2, +3, +4, +5, +6 days
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i);
      const key = dateKey(d);
      const hasBlocks = allPlans.some((p) => p.date === key);
      const dow = i === 0 ? 'TODAY' : d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();
      const num = d.getDate();
      chips.push({ key, dow, num, hasBlocks, isActive: key === selectedKey });
    }

    const strip = document.createElement('div');
    strip.className = 'pl-quicknav';
    strip.innerHTML = chips
      .map(
        (c) => `
      <button class="pl-qn-chip ${c.isActive ? 'active' : ''}" data-qn-date="${c.key}">
        <span class="pl-qn-day">${c.dow}</span>
        <span class="pl-qn-num">${c.num}</span>
        <span class="pl-qn-dot ${c.hasBlocks ? '' : 'hidden'}"></span>
      </button>`,
      )
      .join('');

    return strip;
  }

  /* ═══════════════ RENDER BLOCKS BY DATE GROUP ═══════════════ */
  function buildDateGroups(plans, opts = {}) {
    // Group by date
    const groups = {};
    plans.forEach((p) => {
      if (!groups[p.date]) groups[p.date] = [];
      groups[p.date].push(p);
    });

    // Sort dates
    const sortedDates = Object.keys(groups).sort();
    if (opts.reverse) sortedDates.reverse();

    const frag = document.createDocumentFragment();

    sortedDates.forEach((dateKeyStr) => {
      const groupBlocks = groups[dateKeyStr];
      groupBlocks.sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')));

      const group = document.createElement('div');
      group.className = 'pl-date-group';

      const head = document.createElement('div');
      head.className = 'pl-date-group-head';
      head.innerHTML = `
        <span class="pl-date-group-rel">${fmtRelativeDate(dateKeyStr)}</span>
        <span class="pl-date-group-date">${fmtDateShort(dateKeyStr)}</span>
        <span class="pl-date-group-count">${groupBlocks.length}</span>
      `;
      group.appendChild(head);

      groupBlocks.forEach((p) => {
        group.appendChild(buildBlock(p, opts));
      });

      frag.appendChild(group);
    });

    return frag;
  }

  /* ═══════════════ WIRE TOGGLE & DELETE ═══════════════ */
  function wireBlockActions(el) {
    el.querySelectorAll('[data-plan-toggle]').forEach((b) => {
      b.onclick = async (e) => {
        e.stopPropagation();
        const p = state.plans.find((x) => x.id === b.dataset.planToggle);
        if (!p) return;
        p.completed = !p.completed;

        if (supa && state.user) {
          try {
            await supa.from('plans').update({ completed: p.completed }).eq('id', p.id).eq('user_id', state.user.id);
          } catch (err) {
            console.warn('[planner-extras] toggle error:', err);
          }
        }
        window.renderPlanner();
      };
    });

    el.querySelectorAll('[data-plan-del]').forEach((b) => {
      b.onclick = async (e) => {
        e.stopPropagation();
        const id = b.dataset.planDel;
        const plan = state.plans.find((x) => x.id === id);
        const name = plan ? plan.subject : 'this block';

        const ok =
          typeof customConfirm === 'function'
            ? await customConfirm({
                title: 'Delete Block?',
                message: `"${name}" will be removed from your planner.`,
                confirmText: 'Delete',
                cancelText: 'Cancel',
                icon: '🗑️',
                type: 'danger',
              })
            : confirm('Delete this block?');

        if (!ok) return;

        state.plans = state.plans.filter((x) => x.id !== id);

        if (supa && state.user) {
          try {
            await supa.from('plans').delete().eq('id', id).eq('user_id', state.user.id);
          } catch (err) {
            console.warn('[planner-extras] delete error:', err);
          }
        }
        window.renderPlanner();
      };
    });

    el.querySelectorAll('[data-qn-date]').forEach((b) => {
      b.onclick = () => {
        const dateInput = document.getElementById('planDate');
        if (dateInput) {
          dateInput.value = b.dataset.qnDate;
          window.renderPlanner();
        }
      };
    });
  }

  /* ═══════════════ PATCH renderPlanner ═══════════════ */
  function patchRenderPlanner() {
    const _orig = window.renderPlanner;
    if (typeof _orig !== 'function') return;

    window.renderPlanner = function () {
      injectCSS();

      const dateInput = document.getElementById('planDate');
      if (dateInput && !dateInput.value) dateInput.value = todayKey();

      const selectedKey = dateInput ? dateInput.value : todayKey();
      const today = todayKey();

      const allPlans = state.plans || [];

      // ═══ Categorize plans ═══
      const selectedDateBlocks = allPlans
        .filter((p) => p.date === selectedKey)
        .sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')));

      const overdue = allPlans
        .filter((p) => !p.completed && p.date < today)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

      const upcoming = allPlans
        .filter((p) => !p.completed && p.date > today)
        .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

      const el = document.getElementById('planList');
      if (!el) return;

      el.innerHTML = '';

      /* ═══════════════════════════════════════════
         SECTION 1 — QUICK NAV
         ═══════════════════════════════════════════ */
      el.appendChild(buildQuickNav(selectedKey));

      /* ═══════════════════════════════════════════
         SECTION 2 — SELECTED DATE VIEW
         ═══════════════════════════════════════════ */
      const isToday = selectedKey === today;
      const selectedLabel = isToday ? "Today's Plan" : `Plan for ${fmtRelativeDate(selectedKey)}`;

      const selectedHead = buildSectionHead(
        `📌 ${selectedLabel}`,
        selectedDateBlocks.length,
        isToday ? 'var(--pink)' : 'var(--purple)',
      );
      el.appendChild(selectedHead);

      if (!selectedDateBlocks.length) {
        const emptyMini = document.createElement('div');
        emptyMini.className = 'pl-empty-mini';
        emptyMini.textContent = 'No blocks planned for this day.';
        el.appendChild(emptyMini);
      } else {
        // Stats + progress (only for selected date)
        el.appendChild(buildStatsStrip(selectedDateBlocks));
        el.appendChild(buildProgressBar(selectedDateBlocks));

        const pending = selectedDateBlocks.filter((b) => !b.completed);
        const done = selectedDateBlocks.filter((b) => b.completed);

        if (pending.length) {
          const subHead = buildSectionHead('Pending', pending.length, 'var(--amber)');
          subHead.style.marginTop = '12px';
          el.appendChild(subHead);
          pending.forEach((p) => el.appendChild(buildBlock(p)));
        }

        if (done.length) {
          const subHead = buildSectionHead('Completed', done.length, 'var(--emerald)');
          subHead.style.marginTop = '12px';
          el.appendChild(subHead);
          done.forEach((p) => el.appendChild(buildBlock(p)));
        }
      }

      /* ═══════════════════════════════════════════
         SECTION 3 — OVERDUE
         ═══════════════════════════════════════════ */
      if (overdue.length) {
        const head = buildSectionHead('⏰ Overdue', overdue.length, 'var(--red)');
        head.style.marginTop = '24px';
        el.appendChild(head);
        el.appendChild(buildDateGroups(overdue, { overdue: true, reverse: true }));
      }

      /* ═══════════════════════════════════════════
         SECTION 4 — UPCOMING
         ═══════════════════════════════════════════ */
      if (upcoming.length) {
        const head = buildSectionHead('📅 Upcoming', upcoming.length, 'var(--indigo)');
        head.style.marginTop = '24px';
        el.appendChild(head);
        el.appendChild(buildDateGroups(upcoming, { upcoming: true }));
      }

      /* ═══════════════════════════════════════════
         SECTION 5 — IF NOTHING AT ALL
         ═══════════════════════════════════════════ */
      if (!allPlans.length) {
        el.innerHTML = '';
        el.appendChild(buildQuickNav(selectedKey));

        const empty = document.createElement('div');
        empty.className = 'pl-empty';
        empty.innerHTML = `
          <div class="pl-empty-icon">📅</div>
          <div class="pl-empty-title">No plans yet</div>
          <div class="pl-empty-sub">Plan your study sessions ahead — set subjects, times, and target minutes.</div>
          <button class="btn btn-primary" id="plEmptyAddBtn">＋ Add First Block</button>
        `;
        el.appendChild(empty);

        const addBtn = document.getElementById('plEmptyAddBtn');
        if (addBtn) addBtn.onclick = () => addPlanBlock(selectedKey);
      }

      wireBlockActions(el);
      if (typeof attachRipples === 'function') attachRipples();
    };

    try {
      renderPlanner = window.renderPlanner;
    } catch (e) {}
    console.log('[planner-extras] patched: renderPlanner');
  }

  /* ═══════════════ PATCH addPlanBlock ═══════════════ */
  function patchAddPlanBlock() {
    const _orig = window.addPlanBlock;
    if (typeof _orig !== 'function') return;

    window.addPlanBlock = function (dateKeyStr) {
      _orig.call(this, dateKeyStr);

      setTimeout(() => {
        const saveBtn = document.getElementById('pbSave');
        if (!saveBtn) return;

        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);

        newBtn.onclick = async () => {
          const p = {
            id: safeUUID(),
            date: document.getElementById('pbDate').value,
            start: document.getElementById('pbStart').value,
            end: document.getElementById('pbEnd').value,
            subject: document.getElementById('pbSubject').value || 'Study',
            target_minutes: parseInt(document.getElementById('pbTarget').value, 10) || 60,
            completed: false,
          };

          state.plans.push(p);

          if (supa && state.user) {
            try {
              const { error } = await supa.from('plans').upsert(
                {
                  id: p.id,
                  user_id: state.user.id,
                  date: p.date,
                  start_time: p.start,
                  end_time: p.end,
                  subject: p.subject,
                  target_minutes: p.target_minutes,
                  completed: p.completed,
                },
                { onConflict: 'id' },
              );
              if (error) throw error;
              if (typeof toast === 'function') toast('✅ Block saved!', 'ok');
            } catch (e) {
              console.warn('[planner-extras] insert error:', e);
              if (typeof toast === 'function') toast('⚠️ Cloud save failed', 'warn', 3500);
            }
          }

          if (typeof closeModal === 'function') closeModal();
          if (typeof renderPlanner === 'function') renderPlanner();
        };
      }, 50);
    };

    try {
      addPlanBlock = window.addPlanBlock;
    } catch (e) {}
    console.log('[planner-extras] patched: addPlanBlock');
  }

  /* ═══════════════ INIT ═══════════════ */
  let attempts = 0;
  function waitThenStart() {
    const ready =
      typeof renderPlanner === 'function' &&
      typeof state === 'object' &&
      state !== null &&
      document.getElementById('view-planner');

    if (ready) {
      injectCSS();
      patchAddPlanBlock();
      patchRenderPlanner();

      const checkUser = setInterval(() => {
        if (state.user && supa) {
          clearInterval(checkUser);
          loadPlansFromDB().then(() => {
            if (state.view === 'planner' && typeof renderPlanner === 'function') renderPlanner();
          });
        }
      }, 500);

      console.log('[planner-extras] ✅ v3 patched all');
    } else {
      attempts++;
      if (attempts > 200) {
        console.error('[planner-extras] timeout');
        return;
      }
      setTimeout(waitThenStart, 50);
    }
  }

  waitThenStart();
})();
