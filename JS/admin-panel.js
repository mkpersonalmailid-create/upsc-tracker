/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Admin Panel v2
   ─────────────────────────────────────────────────────────────
   6 Tabs: Overview · Users · Engagement · Revenue · Content · Support
   Admin-only · Info + Expand buttons · Mobile responsive
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[admin-panel] v2 loaded');

  let anP = { tab: 'overview' };
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
  function shortDur(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600),
      m = Math.floor((sec % 3600) / 60);
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }
  function relTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  function fmtDateShort(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function daysAgoKey(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return (
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    );
  }
  function fmtDateKey(key) {
    if (!key) return '';
    const d = new Date(key + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  /* ═══════════════ INFO BUTTON ═══════════════ */
  function infoBtn(title, bodyHtml) {
    const id = 'anpInfo_' + Math.random().toString(36).slice(2, 9);
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
    return `<button class="anp-info-btn" id="${id}" title="How is this calculated?">ⓘ</button>`;
  }
  function expandBtn(canvasId) {
    return `<button class="anp-expand-btn" data-anp-expand="${canvasId}" title="Expand chart">⛶</button>`;
  }
  function registerChart(id, title, subtitle, drawFn, legendHtml) {
    CHART_REG[id] = { title, subtitle, draw: drawFn, legendHtml };
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('[data-anp-expand]');
    if (!btn) return;
    const cfg = CHART_REG[btn.dataset.anpExpand];
    if (!cfg) return;
    if (typeof openModal !== 'function' || typeof modalShell !== 'function') return;
    openModal(
      modalShell({
        title: cfg.title || 'Chart',
        subtitle: cfg.subtitle || '',
        body: `<div style="position:relative;width:100%;height:min(55vh,440px);min-height:280px"><canvas id="__anp_expanded"></canvas></div>
             <div id="__anp_expanded_legend" style="margin-top:14px;display:flex;flex-wrap:wrap;gap:12px;font-size:.85rem;line-height:1.8"></div>`,
        actions: '<button class="btn btn-ghost" data-close>Close</button>',
      }),
      {
        onMount() {
          setTimeout(() => {
            const cv = document.getElementById('__anp_expanded');
            if (cv) {
              try {
                cfg.draw(cv, true);
              } catch (e) {}
            }
            const legEl = document.getElementById('__anp_expanded_legend');
            if (legEl && cfg.legendHtml) legEl.innerHTML = cfg.legendHtml;
          }, 120);
        },
      },
    );
  });

  /* ═══════════════ INFO CONTENT ═══════════════ */
  const INFO = {
    totalUsers: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p><strong style="color:var(--text)">Total Users</strong> = count of all registered accounts.</p></div>`,
    dau: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p><strong style="color:var(--text)">Daily Active Users</strong> = users who were seen in the last 24 hours (based on profiles.last_seen).</p></div>`,
    wau: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p><strong style="color:var(--text)">Weekly Active Users</strong> = seen in the last 7 days.</p></div>`,
    mau: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p><strong style="color:var(--text)">Monthly Active Users</strong> = seen in the last 30 days.</p></div>`,
    mrr: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p><strong style="color:var(--text)">MRR (Monthly Recurring Revenue)</strong></p><p style="margin-top:8px">= sum of all active monthly subscriptions + (yearly subscription amount ÷ 12)</p></div>`,
    thisMonthRev: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p>Total payments received in the current calendar month.</p></div>`,
    activeSubs: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p>Subscriptions with status = active and not yet expired.</p></div>`,
    openTickets: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p>Support tickets with status = open.</p></div>`,
    signupsChart: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p>New user signups per day, last 30 days.</p></div>`,
    activityChart: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p>Daily active users over the last 30 days.</p></div>`,
    revenueChart: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)"><p>Monthly revenue (in ₹) for the selected range.</p></div>`,
  };

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    const old = document.getElementById('anpCSS');
    if (old) old.remove();
    const s = document.createElement('style');
    s.id = 'anpCSS';
    s.textContent = `
      .anp-wrap { display:flex; flex-direction:column; gap:10px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; }
      .anp-wrap *, .anp-wrap *::before, .anp-wrap *::after { box-sizing:border-box; }

      /* Header */
      .anp-header {
        display:flex; align-items:center; gap:14px; flex-wrap:wrap;
        padding: 16px; border-radius: 14px;
        background: linear-gradient(135deg, rgba(168,85,247,.14), rgba(236,72,153,.08));
        border: 1px solid rgba(168,85,247,.28);
        position: relative; overflow: hidden;
      }
      .anp-header::before {
        content:''; position:absolute; top:-50%; right:-10%;
        width: 250px; height: 250px;
        background: radial-gradient(circle, rgba(168,85,247,.22), transparent 65%);
        pointer-events:none;
      }
      .anp-header-icon {
        width: 46px; height: 46px; border-radius: 12px;
        background: linear-gradient(135deg, #FBBF24, #EC4899);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.4rem; flex-shrink: 0;
        box-shadow: 0 8px 22px rgba(251,191,36,.35);
      }
      .anp-header-info { flex: 1; min-width: 180px; position: relative; z-index: 1; }
      .anp-header-title { font-size: 1.15rem; font-weight: 900; letter-spacing: -.02em; color: var(--text); }
      .anp-header-sub { font-size: .78rem; color: var(--text-2); margin-top: 3px; }
      .anp-header-actions { display: flex; gap: 8px; flex-wrap: wrap; position: relative; z-index: 1; }

      /* Tabs */
      .anp-tabs {
        display: flex; gap: 4px; background: var(--bg-2); border: 1px solid var(--border);
        border-radius: 11px; padding: 3px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch;
      }
      .anp-tabs::-webkit-scrollbar { display: none; }
      .anp-tab {
        flex: 1; min-width: 90px; padding: 9px 12px; border-radius: 7px;
        font-size: .76rem; font-weight: 700; color: var(--text-3);
        background: transparent; border: none; cursor: pointer; transition: all .2s;
        white-space: nowrap; display: flex; align-items: center; justify-content: center; gap: 4px;
      }
      .anp-tab:hover { color: var(--text-2); background: var(--card); }
      .anp-tab.active {
        background: linear-gradient(135deg, #8b5cf6, #ec4899);
        color: #fff; box-shadow: 0 4px 12px rgba(168,85,247,.35);
      }

      /* Info / Expand */
      .anp-info-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 16px; height: 16px; border-radius: 50%;
        background: rgba(168,85,247,.18); border: 1px solid rgba(168,85,247,.4);
        color: #C4B5FD; font-size: .6rem; cursor: pointer;
        transition: all .2s; flex-shrink: 0; padding: 0; font-weight: 800; margin-left: 4px;
      }
      .anp-info-btn:hover { background: rgba(168,85,247,.32); transform: scale(1.15); color: #fff; }
      .anp-expand-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 22px; height: 22px; border-radius: 6px;
        background: rgba(168,85,247,.12); border: 1px solid rgba(168,85,247,.35);
        color: #C4B5FD; font-size: .75rem; cursor: pointer;
        transition: all .2s; flex-shrink: 0; padding: 0;
      }
      .anp-expand-btn:hover { background: rgba(168,85,247,.35); transform: scale(1.1); color: #fff; }

      /* Section Head */
      .anp-sec-head {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 10px; padding-bottom: 8px;
        border-bottom: 1px dashed var(--border);
      }
      .anp-sec-icon {
        width: 28px; height: 28px; border-radius: 8px;
        background: linear-gradient(135deg, rgba(168,85,247,.2), rgba(236,72,153,.12));
        border: 1px solid rgba(168,85,247,.35);
        display: flex; align-items: center; justify-content: center;
        font-size: .85rem; flex-shrink: 0;
      }
      .anp-sec-title { font-size: .82rem; font-weight: 800; color: var(--text); line-height: 1.2; }
      .anp-sec-sub { font-size: .64rem; color: var(--text-3); margin-top: 1px; }

      /* Cards */
      .anp-card {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 12px; padding: 12px;
        width: 100%; max-width: 100%; overflow-x: hidden;
      }

      /* KPI grid */
      .anp-kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 8px;
      }
      .anp-kpi {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 12px; padding: 12px;
        position: relative; overflow: hidden; min-width: 0;
      }
      .anp-kpi::before {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0;
        width: 3px; background: var(--c, var(--purple));
      }
      .anp-kpi-lbl {
        font-size: .58rem; font-weight: 800; letter-spacing: .08em;
        text-transform: uppercase; color: var(--text-3); margin-bottom: 4px;
        display: flex; align-items: center;
      }
      .anp-kpi-val {
        font-size: clamp(1rem, 2.6vw, 1.25rem);
        font-weight: 900; letter-spacing: -.02em;
        line-height: 1.1; color: var(--text);
      }
      .anp-kpi-sub { font-size: .66rem; color: var(--text-3); margin-top: 3px; }

      /* 2-col grid */
      .anp-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
      }
      @media (max-width: 900px) { .anp-grid { grid-template-columns: 1fr; } }
      .anp-grid-full { grid-column: 1 / -1; }

      /* Chart wrap */
      .anp-chart-wrap { position: relative; width: 100%; height: 140px; }
      .anp-chart-wrap canvas { display: block !important; width: 100% !important; max-width: 100% !important; }
      .anp-chart-sm { height: 120px; }
      .anp-chart-tall { height: 170px; }
      .anp-chart-actions { display: flex; justify-content: flex-end; margin-top: 6px; gap: 6px; }

      /* Table */
      .anp-table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .anp-table { width: 100%; min-width: 560px; border-collapse: collapse; font-size: .74rem; }
      .anp-table th {
        text-align: left; font-size: .6rem; font-weight: 800;
        letter-spacing: .06em; text-transform: uppercase; color: var(--text-3);
        padding: 8px 6px; border-bottom: 1px solid var(--border); white-space: nowrap;
      }
      .anp-table td {
        padding: 10px 6px; border-bottom: 1px solid var(--border);
        color: var(--text-2); white-space: nowrap;
      }
      .anp-table tr:last-child td { border-bottom: none; }
      .anp-table tbody tr { transition: background .15s; cursor: pointer; }
      .anp-table tbody tr:hover { background: var(--card-2); }

      /* User row inside table */
      .anp-user-avatar {
        display: inline-flex; width: 26px; height: 26px; border-radius: 50%;
        align-items: center; justify-content: center; font-size: .72rem;
        font-weight: 800; color: #fff; margin-right: 8px; flex-shrink: 0;
      }

      /* Pills */
      .anp-pill {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 9px; border-radius: 20px;
        font-size: .62rem; font-weight: 800; letter-spacing: .02em;
      }
      .anp-pill.admin { background: var(--grad-2); color: #1a1a1a; }
      .anp-pill.premium { background: rgba(16,185,129,.15); color: #34d399; }
      .anp-pill.free { background: var(--card-2); color: var(--text-3); }
      .anp-pill.active { background: rgba(16,185,129,.15); color: #34d399; }
      .anp-pill.expired { background: rgba(239,68,68,.15); color: #f87171; }
      .anp-pill.open { background: rgba(168,85,247,.15); color: #C4B5FD; }
      .anp-pill.replied { background: rgba(16,185,129,.15); color: #34d399; }
      .anp-pill.closed { background: var(--card-2); color: var(--text-3); }

      /* Filter bar */
      .anp-filter {
        display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;
        align-items: center;
      }
      .anp-filter input, .anp-filter select {
        background: var(--bg-2); border: 1px solid var(--border);
        border-radius: 10px; padding: 8px 12px; font-size: .8rem;
        color: var(--text); outline: none;
      }
      .anp-filter input { flex: 1; min-width: 180px; }
      .anp-filter input:focus, .anp-filter select:focus {
        border-color: var(--purple); box-shadow: 0 0 0 3px rgba(168,85,247,.12);
      }

      /* Activity feed */
      .anp-feed {
        display: flex; flex-direction: column; gap: 6px;
        max-height: 380px; overflow-y: auto;
      }
      .anp-feed-item {
        display: flex; align-items: center; gap: 10px;
        padding: 9px 12px;
        background: var(--card-2); border: 1px solid var(--border);
        border-radius: 10px; font-size: .8rem;
      }
      .anp-feed-dot {
        width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
      }
      .anp-feed-text { flex: 1; min-width: 0; color: var(--text-2); }
      .anp-feed-time { font-size: .68rem; color: var(--text-3); flex-shrink: 0; }

      /* Empty state */
      .anp-empty { text-align: center; padding: 24px 16px; color: var(--text-3); }
      .anp-empty-icon { font-size: 1.8rem; margin-bottom: 8px; opacity: .7; }
      .anp-empty-title { font-size: .88rem; font-weight: 800; color: var(--text-2); margin-bottom: 4px; }
      .anp-empty-desc { font-size: .74rem; color: var(--text-3); line-height: 1.5; max-width: 320px; margin: 0 auto; }

      /* Mobile */
      @media (max-width: 640px) {
        .anp-header { padding: 12px; border-radius: 12px; }
        .anp-header-icon { width: 38px; height: 38px; font-size: 1.1rem; }
        .anp-header-title { font-size: 1rem; }
        .anp-tab { font-size: .7rem; padding: 8px 10px; min-width: 78px; }
        .anp-card { padding: 10px; border-radius: 11px; }
        .anp-sec-title { font-size: .78rem; }
        .anp-chart-wrap { height: 120px; }
        .anp-chart-tall { height: 145px; }
        .anp-kpi-grid { grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
        .anp-kpi { padding: 10px; }
      }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════ SMALL HELPERS ═══════════════ */
  function sectionHead(icon, title, subtitle, infoKey) {
    return `<div class="anp-sec-head">
      <div class="anp-sec-icon">${icon}</div>
      <div style="flex:1;min-width:0">
        <div class="anp-sec-title">${escHtml(title)}</div>
        ${subtitle ? `<div class="anp-sec-sub">${escHtml(subtitle)}</div>` : ''}
      </div>
      ${infoKey && INFO[infoKey] ? infoBtn(title, INFO[infoKey]) : ''}
    </div>`;
  }
  function emptyState(icon, title, desc) {
    return `<div class="anp-empty">
      <div class="anp-empty-icon">${icon}</div>
      <div class="anp-empty-title">${escHtml(title)}</div>
      <div class="anp-empty-desc">${escHtml(desc)}</div>
    </div>`;
  }
  function kpi(label, value, sub, color, infoKey) {
    return `<div class="anp-kpi" style="--c:${color}">
      <div class="anp-kpi-lbl">${escHtml(label)} ${infoKey && INFO[infoKey] ? infoBtn(label, INFO[infoKey]) : ''}</div>
      <div class="anp-kpi-val">${escHtml(value)}</div>
      ${sub ? `<div class="anp-kpi-sub">${escHtml(sub)}</div>` : ''}
    </div>`;
  }
  function chartCard(icon, title, subtitle, canvasId, height, infoKey) {
    return `<div class="anp-card">
      ${sectionHead(icon, title, subtitle, infoKey)}
      <div class="anp-chart-wrap" style="height:${height || 140}px"><canvas id="${canvasId}"></canvas></div>
      <div class="anp-chart-actions">${expandBtn(canvasId)}</div>
    </div>`;
  }

  /* ═══════════════ CHART HELPERS (reuse existing) ═══════════════ */
  function drawBar(cv, labels, values, opts) {
    if (typeof drawBarChart === 'function') drawBarChart(cv, labels, values, opts || {});
  }
  function drawLine(cv, labels, values, opts) {
    if (typeof drawLineChart === 'function') drawLineChart(cv, labels, values, opts || {});
  }
  function drawDonutLocal(cv, entries) {
    if (typeof drawDonut === 'function') drawDonut(cv, entries);
  }

  /* ═══════════════ TAB: OVERVIEW ═══════════════ */
  async function renderOverview() {
    const wrap = document.createElement('div');
    wrap.className = 'anp-wrap';
    document.body.appendChild(wrap);

    /* ── Fetch data ── */
    let profiles = [],
      payments = [],
      subs = [],
      tickets = [];
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        supa.from('profiles').select('id, name, email, is_admin, created_at, last_seen'),
        supa.from('payments').select('user_id, amount, created_at, status'),
        supa.from('subscriptions').select('user_id, plan, status, amount, expiry_date'),
        supa.from('support_tickets').select('id, status'),
      ]);
      profiles = r1.data || [];
      payments = r2.data || [];
      subs = r3.data || [];
      tickets = r4.data || [];
    } catch (e) {
      console.warn('[admin] fetch', e);
    }

    /* ── Calculate KPIs ── */
    const now = Date.now();
    const totalUsers = profiles.length;
    const dau = profiles.filter((p) => p.last_seen && now - new Date(p.last_seen).getTime() < 86400000).length;
    const wau = profiles.filter((p) => p.last_seen && now - new Date(p.last_seen).getTime() < 7 * 86400000).length;
    const mau = profiles.filter((p) => p.last_seen && now - new Date(p.last_seen).getTime() < 30 * 86400000).length;

    const activeSubsList = subs.filter(
      (s) => s.status === 'active' && (!s.expiry_date || new Date(s.expiry_date) > new Date()),
    );
    let mrr = 0;
    activeSubsList.forEach((s) => {
      if (s.plan === 'monthly' || s.plan === 'monthly_auto' || s.plan === 'monthly_once') mrr += s.amount || 9900;
      else if (s.plan === 'yearly') mrr += Math.round((s.amount || 79900) / 12);
    });

    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthRev = payments
      .filter((p) => new Date(p.created_at) >= thisMonthStart && (p.status === 'captured' || p.status === 'authorized'))
      .reduce((a, p) => a + (p.amount || 0), 0);

    const openTickets = tickets.filter((t) => t.status === 'open').length;

    /* ── KPI Row ── */
    wrap.appendChild(
      elFrom(`<div class="anp-kpi-grid">
      ${kpi('Total Users', totalUsers, 'all accounts', '#A855F7', 'totalUsers')}
      ${kpi('DAU', dau, 'active 24h', '#10B981', 'dau')}
      ${kpi('WAU', wau, 'active 7d', '#14B8A6', 'wau')}
      ${kpi('MAU', mau, 'active 30d', '#06B6D4', 'mau')}
      ${kpi('MRR', '₹' + (mrr / 100).toFixed(0), activeSubsList.length + ' active subs', '#FBBF24', 'mrr')}
      ${kpi('This Month', '₹' + (thisMonthRev / 100).toFixed(0), 'revenue', '#EC4899', 'thisMonthRev')}
      ${kpi('Active Subs', activeSubsList.length, `${subs.filter((s) => s.plan === 'yearly').length} yearly`, '#8B5CF6', 'activeSubs')}
      ${kpi('Open Tickets', openTickets, 'need reply', '#EF4444', 'openTickets')}
    </div>`),
    );

    /* ── Charts grid ── */
    const grid = document.createElement('div');
    grid.className = 'anp-grid';

    /* Signups chart (30 days) */
    const signupLabels = [],
      signupValues = [];
    for (let i = 29; i >= 0; i--) {
      const key = daysAgoKey(i);
      signupLabels.push(fmtDateKey(key));
      signupValues.push(profiles.filter((p) => (p.created_at || '').slice(0, 10) === key).length);
    }
    grid.appendChild(elFrom(chartCard('📈', 'New Signups', 'Last 30 days', 'anpSignupChart', 140, 'signupsChart')));
    registerChart(
      'anpSignupChart',
      'New Signups',
      'Last 30 days',
      (cv) => {
        drawBar(cv, signupLabels, signupValues, { unit: '', minMax: 3 });
      },
      `<span style="color:var(--text-2)">Total: <strong style="color:var(--text)">${signupValues.reduce((a, b) => a + b, 0)}</strong></span>`,
    );

    /* Activity chart (DAU trend, approximated from last_seen dates) */
    const actLabels = [],
      actValues = [];
    for (let i = 29; i >= 0; i--) {
      const key = daysAgoKey(i);
      actLabels.push(fmtDateKey(key));
      actValues.push(profiles.filter((p) => (p.last_seen || '').slice(0, 10) === key).length);
    }
    grid.appendChild(
      elFrom(chartCard('👥', 'Daily Active Users', 'Based on last_seen', 'anpActivityChart', 140, 'activityChart')),
    );
    registerChart(
      'anpActivityChart',
      'Daily Active Users',
      'Last 30 days',
      (cv) => {
        drawLine(cv, actLabels, actValues, { unit: '', minMax: 3 });
      },
      `<span style="color:var(--text-2)">Peak: <strong style="color:var(--text)">${Math.max(...actValues, 0)}</strong></span>`,
    );

    /* Revenue chart (12 months) */
    const revLabels = [],
      revValues = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const total = payments
        .filter((p) => {
          const pd = new Date(p.created_at);
          return pd >= mStart && pd <= mEnd && (p.status === 'captured' || p.status === 'authorized');
        })
        .reduce((a, p) => a + (p.amount || 0), 0);
      revValues.push(total / 100);
      revLabels.push(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
    }
    grid.appendChild(elFrom(chartCard('💰', 'Monthly Revenue', 'Last 12 months', 'anpRevChart', 140, 'revenueChart')));
    registerChart(
      'anpRevChart',
      'Monthly Revenue',
      'Last 12 months',
      (cv) => {
        drawBar(cv, revLabels, revValues, { unit: '₹', minMax: 10 });
      },
      `<span style="color:var(--text-2)">Total: <strong style="color:var(--text)">₹${revValues.reduce((a, b) => a + b, 0).toFixed(0)}</strong></span>`,
    );

    /* Plan distribution */
    const adminCount = profiles.filter((p) => p.is_admin).length;
    const premiumIds = new Set(activeSubsList.map((s) => s.user_id));
    const premiumCount = profiles.filter((p) => premiumIds.has(p.id) && !p.is_admin).length;
    const freeCount = totalUsers - adminCount - premiumCount;
    const planEntries = [
      { name: 'Admin', value: adminCount, color: '#FBBF24' },
      { name: 'Premium', value: premiumCount, color: '#10B981' },
      { name: 'Free', value: freeCount, color: '#6E5F8C' },
    ].filter((e) => e.value > 0);
    grid.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('💎', 'Plan Distribution', 'Users by plan', '')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center">
        <div class="anp-chart-wrap anp-chart-sm"><canvas id="anpPlanChart"></canvas></div>
        <div id="anpPlanLegend" style="display:flex;flex-direction:column;gap:7px;font-size:.76rem">
          ${planEntries.map((e) => `<div style="display:flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:${e.color}"></span><span style="flex:1;color:var(--text-2)">${escHtml(e.name)}</span><strong style="color:var(--text)">${e.value}</strong></div>`).join('')}
        </div>
      </div>
      <div class="anp-chart-actions">${expandBtn('anpPlanChart')}</div>
    </div>`),
    );
    registerChart(
      'anpPlanChart',
      'Plan Distribution',
      '',
      (cv) => {
        drawDonutLocal(cv, planEntries);
      },
      planEntries
        .map(
          (e) =>
            `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:50%;background:${e.color}"></span><span style="color:var(--text-2)">${escHtml(e.name)}</span> · <strong style="color:var(--text)">${e.value} users</strong></span>`,
        )
        .join(''),
    );

    wrap.appendChild(grid);

    /* ── Recent Activity Feed ── */
    const recentSignups = profiles
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 5)
      .map((p) => ({
        type: 'signup',
        icon: '👤',
        dot: '#A855F7',
        text: `<strong style="color:var(--text)">${escHtml(p.name || p.email || 'New user')}</strong> joined`,
        time: p.created_at,
      }));

    const recentPayments = payments
      .filter((p) => p.status === 'captured' || p.status === 'authorized')
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 5)
      .map((p) => {
        const prof = profiles.find((x) => x.id === p.user_id);
        return {
          type: 'payment',
          icon: '💰',
          dot: '#10B981',
          text: `<strong style="color:var(--text)">${escHtml(prof?.name || 'User')}</strong> paid <strong style="color:#34D399">₹${((p.amount || 0) / 100).toFixed(0)}</strong>`,
          time: p.created_at,
        };
      });

    const feed = [...recentSignups, ...recentPayments]
      .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
      .slice(0, 10);

    wrap.appendChild(
      elFrom(`<div class="anp-card anp-grid-full">
      ${sectionHead('🕐', 'Recent Activity', 'Last 10 events', '')}
      ${
        feed.length === 0
          ? emptyState('📭', 'No activity yet', 'Signups and payments will appear here.')
          : `<div class="anp-feed">
            ${feed
              .map(
                (f) => `
              <div class="anp-feed-item">
                <span class="anp-feed-dot" style="background:${f.dot}"></span>
                <span style="font-size:1rem;flex-shrink:0">${f.icon}</span>
                <div class="anp-feed-text">${f.text}</div>
                <div class="anp-feed-time">${relTime(f.time)}</div>
              </div>`,
              )
              .join('')}
          </div>`
      }
    </div>`),
    );

    /* ── Draw all charts after DOM ── */
    const drawAll = () => {
      Object.keys(CHART_REG).forEach((id) => {
        const cv = document.getElementById(id);
        if (!cv || !cv.parentElement) return;
        if (cv.parentElement.clientWidth < 20 || cv.parentElement.clientHeight < 20) return;
        try {
          CHART_REG[id].draw(cv);
        } catch (e) {}
      });
    };
    requestAnimationFrame(() => {
      drawAll();
      setTimeout(drawAll, 100);
      setTimeout(drawAll, 400);
    });

    return wrap;
  }

  /* ═══════════════ TAB: USERS ═══════════════ */
  let _usersCache = { profiles: [], subs: [], payments: [], sessions: [] };

  async function renderUsers() {
    const wrap = document.createElement('div');
    wrap.className = 'anp-wrap';
    document.body.appendChild(wrap);

    /* ── Fetch ── */
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        supa.from('profiles').select('*').order('created_at', { ascending: false }).limit(500),
        supa.from('subscriptions').select('*'),
        supa.from('payments').select('user_id, amount, created_at, status'),
        supa.from('study_sessions').select('user_id, duration_seconds'),
      ]);
      _usersCache.profiles = r1.data || [];
      _usersCache.subs = r2.data || [];
      _usersCache.payments = r3.data || [];
      _usersCache.sessions = r4.data || [];
    } catch (e) {
      console.warn('[admin users]', e);
    }

    /* ── Build lookup maps ── */
    const subMap = {};
    _usersCache.subs.forEach((s) => {
      subMap[s.user_id] = s;
    });
    const payMap = {};
    _usersCache.payments.forEach((p) => {
      if (!payMap[p.user_id]) payMap[p.user_id] = { total: 0, count: 0 };
      if (p.status === 'captured' || p.status === 'authorized') {
        payMap[p.user_id].total += p.amount || 0;
        payMap[p.user_id].count++;
      }
    });
    const sessionMap = {};
    _usersCache.sessions.forEach((s) => {
      if (!sessionMap[s.user_id]) sessionMap[s.user_id] = { sec: 0, count: 0 };
      sessionMap[s.user_id].sec += s.duration_seconds || 0;
      sessionMap[s.user_id].count++;
    });

    /* ── Filters UI ── */
    wrap.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('👥', 'Users Management', `${_usersCache.profiles.length} total`, '')}
      <div class="anp-filter">
        <input type="text" id="anpUserSearch" placeholder="Search by name or email…">
        <select id="anpPlanFilter">
          <option value="">All Plans</option>
          <option value="admin">Admin only</option>
          <option value="premium">Premium only</option>
          <option value="free">Free only</option>
        </select>
        <select id="anpActivityFilter">
          <option value="">All Activity</option>
          <option value="24h">Active 24h</option>
          <option value="7d">Active 7 days</option>
          <option value="30d">Active 30 days</option>
          <option value="inactive7d">Inactive 7+ days</option>
          <option value="inactive30d">Inactive 30+ days</option>
          <option value="never">Never logged in</option>
        </select>
        <button class="btn btn-secondary btn-sm" id="anpExportUsers">⬇ CSV</button>
      </div>
      <div class="anp-table-scroll">
        <table class="anp-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Joined</th>
              <th>Last Seen</th>
              <th>Study</th>
              <th>Sessions</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody id="anpUsersBody"></tbody>
        </table>
      </div>
    </div>`),
    );

    /* ── Render table rows ── */
    const tbody = document.getElementById('anpUsersBody');
    const now = Date.now();

    function renderRows() {
      const q = (document.getElementById('anpUserSearch').value || '').toLowerCase().trim();
      const planF = document.getElementById('anpPlanFilter').value;
      const actF = document.getElementById('anpActivityFilter').value;

      let list = _usersCache.profiles.slice();

      // Search
      if (q)
        list = list.filter(
          (p) => (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q),
        );

      // Plan filter
      const premiumIds = new Set(
        _usersCache.subs
          .filter((s) => s.status === 'active' && (!s.expiry_date || new Date(s.expiry_date) > new Date()))
          .map((s) => s.user_id),
      );
      if (planF === 'admin') list = list.filter((p) => p.is_admin === true);
      else if (planF === 'premium') list = list.filter((p) => premiumIds.has(p.id) && !p.is_admin);
      else if (planF === 'free') list = list.filter((p) => !premiumIds.has(p.id) && !p.is_admin);
      else if (planF === 'trial') {
        list = list.filter((p) => {
          const s = subMap[p.id];
          return (
            s?.plan === 'trial' && s?.status === 'active' && (!s.expiry_date || new Date(s.expiry_date) > new Date())
          );
        });
      }

      // Activity filter
      if (actF === '24h') list = list.filter((p) => p.last_seen && now - new Date(p.last_seen).getTime() < 86400000);
      else if (actF === '7d')
        list = list.filter((p) => p.last_seen && now - new Date(p.last_seen).getTime() < 7 * 86400000);
      else if (actF === '30d')
        list = list.filter((p) => p.last_seen && now - new Date(p.last_seen).getTime() < 30 * 86400000);
      else if (actF === 'inactive7d')
        list = list.filter((p) => !p.last_seen || now - new Date(p.last_seen).getTime() >= 7 * 86400000);
      else if (actF === 'inactive30d')
        list = list.filter((p) => !p.last_seen || now - new Date(p.last_seen).getTime() >= 30 * 86400000);
      else if (actF === 'never') list = list.filter((p) => !p.last_seen);

      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-3)">No users match filters</td></tr>`;
        return;
      }

      tbody.innerHTML = list
        .map((p) => {
          const isAdmin = p.is_admin === true;
          const isPremium = premiumIds.has(p.id);
          // ✅ Trial user alag detect karo
          const userSub = subMap[p.id];
          const isTrial =
            userSub?.plan === 'trial' &&
            userSub?.status === 'active' &&
            (!userSub.expiry_date || new Date(userSub.expiry_date) > new Date());

          let planPill;
          if (isAdmin) {
            planPill = '<span class="anp-pill admin">👑 Admin</span>';
          } else if (isTrial) {
            // Trial user — amber color
            const daysLeft = userSub.expiry_date
              ? Math.ceil((new Date(userSub.expiry_date) - new Date()) / 86400000)
              : 0;
            planPill = `<span class="anp-pill" style="background:rgba(251,191,36,.15);color:#FBBF24">⏳ Trial (${daysLeft}d)</span>`;
          } else if (isPremium) {
            planPill = '<span class="anp-pill premium">💎 Premium</span>';
          } else {
            planPill = '<span class="anp-pill free">Free</span>';
          }
          const avatarColor = isAdmin
            ? 'linear-gradient(135deg,#FBBF24,#EC4899)'
            : 'linear-gradient(135deg,#8B5CF6,#EC4899)';
          const ses = sessionMap[p.id] || { sec: 0, count: 0 };
          const pay = payMap[p.id] || { total: 0, count: 0 };

          return `<tr data-anp-user="${p.id}">
          <td>
            <div style="display:flex;align-items:center;gap:8px;min-width:180px">
              <span class="anp-user-avatar" style="background:${avatarColor}">${escHtml((p.name || 'U')[0].toUpperCase())}</span>
              <div style="min-width:0">
                <div style="font-weight:700;color:var(--text);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(p.name || '—')}</div>
                <div style="font-size:.66rem;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(p.email || '—')}</div>
              </div>
            </div>
          </td>
          <td>${planPill}</td>
          <td>${fmtDateShort(p.created_at)}</td>
          <td>${p.last_seen ? relTime(p.last_seen) : '<span style="color:var(--text-3)">Never</span>'}</td>
          <td><strong style="color:var(--text)">${shortDur(ses.sec)}</strong></td>
          <td>${ses.count}</td>
          <td>${pay.total > 0 ? `<strong style="color:#34D399">₹${(pay.total / 100).toFixed(0)}</strong>` : '<span style="color:var(--text-3)">—</span>'}</td>
        </tr>`;
        })
        .join('');

      tbody.querySelectorAll('[data-anp-user]').forEach((tr) => {
        tr.onclick = () => {
          const prof = _usersCache.profiles.find((x) => x.id === tr.dataset.anpUser);
          if (prof) openUserDetail(prof, subMap, payMap, sessionMap);
        };
      });
    }

    renderRows();

    /* ── Wire filters ── */
    document.getElementById('anpUserSearch').oninput = renderRows;
    document.getElementById('anpPlanFilter').onchange = renderRows;
    document.getElementById('anpActivityFilter').onchange = renderRows;

    /* ── Export CSV ── */
    document.getElementById('anpExportUsers').onclick = () => {
      const rows = [['Name', 'Email', 'Plan', 'Joined', 'Last Seen', 'Study (min)', 'Sessions', 'Total Paid (₹)']];
      _usersCache.profiles.forEach((p) => {
        const isAdmin = p.is_admin === true;
        const isPremium = premiumIds.has(p.id);
        const ses = sessionMap[p.id] || { sec: 0, count: 0 };
        const pay = payMap[p.id] || { total: 0, count: 0 };
        rows.push([
          p.name || '',
          p.email || '',
          isAdmin ? 'Admin' : isPremium ? 'Premium' : 'Free',
          (p.created_at || '').slice(0, 10),
          (p.last_seen || '').slice(0, 10),
          Math.round(ses.sec / 60),
          ses.count,
          (pay.total / 100).toFixed(2),
        ]);
      });
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${daysAgoKey(0)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return wrap;
  }

  /* ═══════════════ USER DETAIL MODAL ═══════════════ */
  function openUserDetail(prof, subMap, payMap, sessionMap) {
    const sub = subMap[prof.id];
    const ses = sessionMap[prof.id] || { sec: 0, count: 0 };
    const pay = payMap[prof.id] || { total: 0, count: 0 };
    const isAdmin = prof.is_admin === true;

    const body = `
      <div style="padding:14px;background:var(--card-2);border-radius:12px;display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span class="anp-user-avatar" style="width:48px;height:48px;font-size:1.2rem;background:${isAdmin ? 'linear-gradient(135deg,#FBBF24,#EC4899)' : 'linear-gradient(135deg,#8B5CF6,#EC4899)'}">${escHtml((prof.name || 'U')[0].toUpperCase())}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;font-size:1rem;color:var(--text)">${escHtml(prof.name || '—')}</div>
          <div style="font-size:.78rem;color:var(--text-3);word-break:break-all">${escHtml(prof.email || '—')}</div>
        </div>
        ${isAdmin ? '<span class="anp-pill admin">👑 Admin</span>' : sub && sub.status === 'active' ? '<span class="anp-pill premium">💎 Premium</span>' : '<span class="anp-pill free">Free</span>'}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="padding:10px 12px;background:var(--card-2);border-radius:10px;border:1px solid var(--border)">
          <div style="font-size:.6rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:4px">Joined</div>
          <div style="font-weight:700;font-size:.85rem;color:var(--text)">${fmtDateShort(prof.created_at)}</div>
        </div>
        <div style="padding:10px 12px;background:var(--card-2);border-radius:10px;border:1px solid var(--border)">
          <div style="font-size:.6rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:4px">Last Seen</div>
          <div style="font-weight:700;font-size:.85rem;color:var(--text)">${prof.last_seen ? relTime(prof.last_seen) : 'Never'}</div>
        </div>
        <div style="padding:10px 12px;background:var(--card-2);border-radius:10px;border:1px solid var(--border)">
          <div style="font-size:.6rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:4px">Study Time</div>
          <div style="font-weight:700;font-size:.85rem;color:var(--text)">${shortDur(ses.sec)}</div>
        </div>
        <div style="padding:10px 12px;background:var(--card-2);border-radius:10px;border:1px solid var(--border)">
          <div style="font-size:.6rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:4px">Sessions</div>
          <div style="font-weight:700;font-size:.85rem;color:var(--text)">${ses.count}</div>
        </div>
      </div>

      <div style="padding:12px;background:var(--card-2);border-radius:10px;border:1px solid var(--border);margin-bottom:12px">
        <div style="font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:6px">💰 Payment Info</div>
        <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--text-2);margin-bottom:4px">
          <span>Total Paid:</span>
          <strong style="color:#34D399">₹${(pay.total / 100).toFixed(0)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--text-2)">
          <span>Payments:</span>
          <strong style="color:var(--text)">${pay.count}</strong>
        </div>
        ${
          sub
            ? `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);font-size:.78rem;color:var(--text-2)">
          Plan: <strong style="color:var(--text)">${escHtml(sub.plan)}</strong> · Expires: <strong style="color:var(--text)">${sub.expiry_date ? fmtDateShort(sub.expiry_date) : '—'}</strong>
        </div>`
            : ''
        }
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-primary" id="anpSendNotif" style="justify-content:flex-start">📢 Send Notification</button>
        ${!isAdmin ? `<button class="btn btn-secondary" id="anpMakeAdmin" style="justify-content:flex-start">👑 Make Admin</button>` : `<button class="btn btn-secondary" id="anpRemoveAdmin" style="justify-content:flex-start">⬇️ Remove Admin</button>`}
        <button class="btn btn-secondary" id="anpResetPw" style="justify-content:flex-start">🔐 Send Password Reset</button>
      </div>
    `;

    openModal(
      modalShell({
        title: '👤 User Details',
        body,
        actions: '<button class="btn btn-ghost" data-close>Close</button>',
      }),
      {
        onMount() {
          document.getElementById('anpSendNotif').onclick = () => openSendNotifModal(prof);
          const makeAdmin = document.getElementById('anpMakeAdmin');
          if (makeAdmin) makeAdmin.onclick = () => toggleAdmin(prof, true);
          const removeAdmin = document.getElementById('anpRemoveAdmin');
          if (removeAdmin) removeAdmin.onclick = () => toggleAdmin(prof, false);
          document.getElementById('anpResetPw').onclick = async () => {
            try {
              const { error } = await supa.auth.resetPasswordForEmail(prof.email);
              if (error) throw error;
              toast('Password reset email sent!', 'ok');
            } catch (e) {
              toast('Failed: ' + e.message, 'err');
            }
          };
        },
      },
    );
  }

  async function toggleAdmin(prof, makeAdmin) {
    const ok = await customConfirm({
      title: makeAdmin ? 'Make Admin?' : 'Remove Admin?',
      message: makeAdmin
        ? `${prof.name || prof.email} will get full admin access.`
        : `${prof.name || prof.email} will lose admin access.`,
      confirmText: makeAdmin ? 'Make Admin' : 'Remove',
      cancelText: 'Cancel',
      icon: makeAdmin ? '👑' : '⬇️',
      type: makeAdmin ? 'warning' : 'danger',
    });
    if (!ok) return;
    try {
      const { error } = await supa.from('profiles').update({ is_admin: makeAdmin }).eq('id', prof.id);
      if (error) throw error;
      toast(makeAdmin ? '✅ Admin granted' : 'Admin removed', 'ok');
      closeModal();
      if (window.renderAdmin) window.renderAdmin();
    } catch (e) {
      toast('Failed: ' + e.message, 'err');
    }
  }

  /* ═══════════════ SEND NOTIFICATION MODAL ═══════════════ */
  function openSendNotifModal(prof) {
    openModal(
      modalShell({
        title: '📢 Send Notification',
        subtitle: `To: ${prof.name || prof.email}`,
        body: `
        <div class="field">
          <label>Title</label>
          <input type="text" id="anpNotifTitle" placeholder="e.g. Welcome!" maxlength="80">
        </div>
        <div class="field">
          <label>Message</label>
          <textarea id="anpNotifMsg" rows="4" style="min-height:100px" placeholder="Your message..." maxlength="500"></textarea>
        </div>
        <div class="field">
          <label>Type</label>
          <select id="anpNotifType">
            <option value="info">📢 Info</option>
            <option value="success">✅ Success</option>
            <option value="warning">⚠️ Warning</option>
            <option value="danger">🚨 Urgent</option>
          </select>
        </div>
      `,
        actions: `<button class="btn btn-ghost" data-close>Cancel</button>
                <button class="btn btn-primary" id="anpNotifSend">Send →</button>`,
      }),
      {
        onMount() {
          document.getElementById('anpNotifSend').onclick = async () => {
            const title = document.getElementById('anpNotifTitle').value.trim();
            const msg = document.getElementById('anpNotifMsg').value.trim();
            const type = document.getElementById('anpNotifType').value;
            if (!title || !msg) {
              toast('Title and message required', 'err');
              return;
            }
            const btn = document.getElementById('anpNotifSend');
            btn.disabled = true;
            btn.textContent = '⏳ Sending...';
            try {
              const { error } = await supa.from('user_notifications').insert({
                user_id: prof.id,
                title,
                message: msg,
                type,
                read: false,
              });
              if (error) throw error;
              closeModal();
              toast('✅ Notification sent!', 'ok');
            } catch (e) {
              toast('Failed: ' + e.message, 'err');
              btn.disabled = false;
              btn.textContent = 'Send →';
            }
          };
        },
      },
    );
  }

  /* ═══════════════ TAB: ENGAGEMENT ═══════════════ */
  async function renderEngagement() {
    const wrap = document.createElement('div');
    wrap.className = 'anp-wrap';
    document.body.appendChild(wrap);

    /* ── Fetch ── */
    let profiles = [],
      sessions = [],
      activities = [];
    try {
      const [r1, r2, r3] = await Promise.all([
        supa.from('profiles').select('id, name, email, last_seen, created_at, is_admin').limit(500),
        supa.from('study_sessions').select('user_id, duration_seconds, date').limit(5000),
        supa
          .from('user_activity')
          .select('user_id, event_type, event_data, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
      ]);
      profiles = r1.data || [];
      sessions = r2.data || [];
      activities = r3.data || [];
    } catch (e) {
      console.warn('[admin engagement]', e);
    }

    const now = Date.now();
    const dau = profiles.filter((p) => p.last_seen && now - new Date(p.last_seen).getTime() < 86400000).length;
    const wau = profiles.filter((p) => p.last_seen && now - new Date(p.last_seen).getTime() < 7 * 86400000).length;
    const mau = profiles.filter((p) => p.last_seen && now - new Date(p.last_seen).getTime() < 30 * 86400000).length;
    const stickiness = mau ? Math.round((dau / mau) * 100) : 0;

    /* ── KPI Row ── */
    wrap.appendChild(
      elFrom(`<div class="anp-kpi-grid">
      ${kpi('DAU / MAU', stickiness + '%', 'stickiness ratio', '#A855F7', '')}
      ${kpi('DAU', dau, 'last 24h', '#10B981', 'dau')}
      ${kpi('WAU', wau, 'last 7d', '#14B8A6', 'wau')}
      ${kpi('MAU', mau, 'last 30d', '#06B6D4', 'mau')}
    </div>`),
    );

    /* ── Top Users by Study Hours (This Month) ── */
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const monthSec = {};
    sessions.forEach((s) => {
      if (s.date >= monthStart) monthSec[s.user_id] = (monthSec[s.user_id] || 0) + (s.duration_seconds || 0);
    });
    const topUsers = Object.entries(monthSec)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uid, sec]) => {
        const p = profiles.find((x) => x.id === uid);
        return { name: p?.name || 'Unknown', email: p?.email || '', sec };
      });

    wrap.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('🏆', 'Top Users by Study Time', 'This month', '')}
      ${
        topUsers.length === 0
          ? emptyState('📭', 'No sessions this month', 'Users who study will appear here.')
          : `<div style="display:flex;flex-direction:column;gap:6px">
            ${topUsers
              .map((u, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card-2);border-radius:10px;border:1px solid var(--border)">
                <span style="font-size:1rem;flex-shrink:0;font-weight:800;color:var(--text-2)">${medal}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:.82rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(u.name)}</div>
                  <div style="font-size:.68rem;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(u.email)}</div>
                </div>
                <strong style="color:#34D399;font-size:.85rem">${shortDur(u.sec)}</strong>
              </div>`;
              })
              .join('')}
          </div>`
      }
    </div>`),
    );

    /* ── Inactive Users ── */
    const inactive7 = profiles.filter((p) => !p.last_seen || now - new Date(p.last_seen).getTime() >= 7 * 86400000);
    const inactive30 = profiles.filter((p) => !p.last_seen || now - new Date(p.last_seen).getTime() >= 30 * 86400000);
    const never = profiles.filter((p) => !p.last_seen);

    wrap.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('😴', 'Inactive Users', 'Users who need re-engagement', '')}
      <div class="anp-kpi-grid">
        ${kpi('7+ days', inactive7.length, 'inactive', '#FBBF24', '')}
        ${kpi('30+ days', inactive30.length, 'inactive', '#F97316', '')}
        ${kpi('Never logged in', never.length, 'no last_seen', '#EF4444', '')}
      </div>
    </div>`),
    );

    /* ── Feature adoption (from user_activity) ── */
    const featureUsage = {};
    activities.forEach((a) => {
      if (a.event_type === 'view_change' && a.event_data && a.event_data.view) {
        const v = a.event_data.view;
        featureUsage[v] = (featureUsage[v] || 0) + 1;
      }
    });
    const featureEntries = Object.entries(featureUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (featureEntries.length > 0) {
      const labels = featureEntries.map(([k]) => k);
      const values = featureEntries.map(([, v]) => v);
      wrap.appendChild(
        elFrom(`<div class="anp-card">
        ${sectionHead('📊', 'Feature Usage', 'Based on view tracking', '')}
        <div class="anp-chart-wrap" style="height:160px"><canvas id="anpFeatureChart"></canvas></div>
      </div>`),
      );
      registerChart(
        'anpFeatureChart',
        'Feature Usage',
        'Views per section',
        (cv) => {
          drawBar(cv, labels, values, { unit: '', minMax: 5 });
        },
        featureEntries
          .map(
            ([k, v]) =>
              `<span style="color:var(--text-2)">${escHtml(k)}: <strong style="color:var(--text)">${v}</strong></span>`,
          )
          .join(''),
      );
    } else {
      wrap.appendChild(
        elFrom(`<div class="anp-card">
        ${sectionHead('📊', 'Feature Usage', 'Based on view tracking', '')}
        ${emptyState('🔍', 'No activity data yet', 'As users navigate the app, this will show which sections are most used.')}
      </div>`),
      );
    }

    /* ── Draw charts ── */
    const drawAll = () => {
      Object.keys(CHART_REG).forEach((id) => {
        const cv = document.getElementById(id);
        if (!cv || !cv.parentElement) return;
        if (cv.parentElement.clientWidth < 20 || cv.parentElement.clientHeight < 20) return;
        try {
          CHART_REG[id].draw(cv);
        } catch (e) {}
      });
    };
    requestAnimationFrame(() => {
      drawAll();
      setTimeout(drawAll, 100);
      setTimeout(drawAll, 400);
    });

    return wrap;
  }

  /* ═══════════════ TAB: REVENUE ═══════════════ */
  async function renderRevenue() {
    const wrap = document.createElement('div');
    wrap.className = 'anp-wrap';
    document.body.appendChild(wrap);

    let payments = [],
      subs = [],
      profiles = [];
    try {
      const [r1, r2, r3] = await Promise.all([
        supa.from('payments').select('*').order('created_at', { ascending: false }),
        supa.from('subscriptions').select('*'),
        supa.from('profiles').select('id, name, email, is_admin'),
      ]);
      payments = r1.data || [];
      subs = r2.data || [];
      profiles = r3.data || [];
    } catch (e) {
      console.warn('[admin revenue]', e);
    }

    const profMap = {};
    profiles.forEach((p) => {
      profMap[p.id] = p;
    });

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    let totalRev = 0,
      thisMonthRev = 0,
      lastMonthRev = 0;
    payments.forEach((p) => {
      if (p.status !== 'captured' && p.status !== 'authorized') return;
      const amt = p.amount || 0;
      const d = new Date(p.created_at);
      totalRev += amt;
      if (d >= thisMonthStart) thisMonthRev += amt;
      else if (d >= lastMonthStart && d <= lastMonthEnd) lastMonthRev += amt;
    });

    const activeSubs = subs.filter((s) => s.status === 'active' && (!s.expiry_date || new Date(s.expiry_date) > now));
    let mrr = 0;
    activeSubs.forEach((s) => {
      if (['monthly', 'monthly_auto', 'monthly_once'].includes(s.plan)) mrr += s.amount || 9900;
      else if (s.plan === 'yearly') mrr += Math.round((s.amount || 79900) / 12);
    });
    const arpu = profiles.length ? totalRev / profiles.length : 0;
    const growth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

    /* ── KPI Row ── */
    wrap.appendChild(
      elFrom(`<div class="anp-kpi-grid">
      ${kpi('Total Revenue', '₹' + (totalRev / 100).toFixed(0), `${payments.filter((p) => p.status === 'captured').length} payments`, '#10B981', '')}
      ${kpi('This Month', '₹' + (thisMonthRev / 100).toFixed(0), growth !== 0 ? `${growth >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(growth))}%` : 'no prior data', '#A855F7', '')}
      ${kpi('Last Month', '₹' + (lastMonthRev / 100).toFixed(0), 'previous', '#EC4899', '')}
      ${kpi('MRR', '₹' + (mrr / 100).toFixed(0), 'recurring', '#FBBF24', 'mrr')}
      ${kpi('Active Subs', activeSubs.length, `${activeSubs.filter((s) => s.plan === 'yearly').length} yearly`, '#14B8A6', 'activeSubs')}
      ${kpi('ARPU', '₹' + (arpu / 100).toFixed(0), 'per user', '#F97316', '')}
    </div>`),
    );

    /* ── Chart grid ── */
    const grid = document.createElement('div');
    grid.className = 'anp-grid';

    /* Monthly Revenue */
    const revLabels = [],
      revValues = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const total = payments
        .filter((p) => {
          const pd = new Date(p.created_at);
          return pd >= mStart && pd <= mEnd && (p.status === 'captured' || p.status === 'authorized');
        })
        .reduce((a, p) => a + (p.amount || 0), 0);
      revValues.push(total / 100);
      revLabels.push(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
    }
    grid.appendChild(elFrom(chartCard('📈', 'Monthly Revenue', 'Last 12 months', 'anpRevMChart', 150, 'revenueChart')));
    registerChart(
      'anpRevMChart',
      'Monthly Revenue',
      'Last 12 months',
      (cv) => {
        drawBar(cv, revLabels, revValues, { unit: '₹', minMax: 10 });
      },
      `<span style="color:var(--text-2)">Total: <strong style="color:var(--text)">₹${revValues.reduce((a, b) => a + b, 0).toFixed(0)}</strong></span>`,
    );

    /* Plan Distribution */
    const planCounts = { monthly: 0, yearly: 0 };
    activeSubs.forEach((s) => {
      if (s.plan === 'yearly') planCounts.yearly++;
      else planCounts.monthly++;
    });
    const planEntries = [
      { name: 'Monthly', value: planCounts.monthly, color: '#A855F7' },
      { name: 'Yearly', value: planCounts.yearly, color: '#FBBF24' },
    ].filter((e) => e.value > 0);
    grid.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('💎', 'Active Plan Mix', 'Monthly vs Yearly', '')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center">
        <div class="anp-chart-wrap anp-chart-sm"><canvas id="anpPlanMixChart"></canvas></div>
        <div style="display:flex;flex-direction:column;gap:7px;font-size:.76rem">
          ${planEntries.map((e) => `<div style="display:flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:${e.color}"></span><span style="flex:1;color:var(--text-2)">${e.name}</span><strong style="color:var(--text)">${e.value}</strong></div>`).join('') || '<div style="color:var(--text-3)">No active subs</div>'}
        </div>
      </div>
    </div>`),
    );
    registerChart(
      'anpPlanMixChart',
      'Active Plan Mix',
      '',
      (cv) => {
        if (planEntries.length) drawDonutLocal(cv, planEntries);
      },
      planEntries
        .map(
          (e) =>
            `<span style="color:var(--text-2)">${e.name}: <strong style="color:var(--text)">${e.value}</strong></span>`,
        )
        .join(''),
    );

    wrap.appendChild(grid);

    /* ── Active Subscriptions List ── */
    wrap.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('🔔', 'Active Subscriptions', `${activeSubs.length} users`, '')}
      ${
        activeSubs.length === 0
          ? emptyState('📭', 'No active subs', 'Premium users will appear here.')
          : `<div class="anp-table-scroll">
            <table class="anp-table">
              <thead><tr><th>User</th><th>Plan</th><th>Amount</th><th>Expires</th><th>Days Left</th></tr></thead>
              <tbody>
                ${activeSubs
                  .slice(0, 30)
                  .map((s) => {
                    const p = profMap[s.user_id] || {};
                    const daysLeft = s.expiry_date ? Math.ceil((new Date(s.expiry_date) - now) / 86400000) : 0;
                    const warnColor = daysLeft <= 7 ? '#F87171' : daysLeft <= 30 ? '#FBBF24' : '#34D399';
                    return `<tr>
                    <td><strong style="color:var(--text)">${escHtml(p.name || 'Unknown')}</strong><br><span style="font-size:.66rem;color:var(--text-3)">${escHtml(p.email || '')}</span></td>
                    <td><span class="anp-pill ${s.plan === 'yearly' ? 'premium' : 'free'}">${escHtml(s.plan)}</span></td>
                    <td><strong style="color:#34D399">₹${((s.amount || 0) / 100).toFixed(0)}</strong></td>
                    <td>${s.expiry_date ? fmtDateShort(s.expiry_date) : '—'}</td>
                    <td><strong style="color:${warnColor}">${daysLeft}d</strong></td>
                  </tr>`;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>`),
    );

    /* ── All Payments ── */
    const recentPays = payments.slice(0, 50);
    wrap.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('💳', 'All Payments', `${payments.length} total · showing 50 recent`, '')}
      ${
        payments.length === 0
          ? emptyState('📭', 'No payments yet', 'Payments will appear here.')
          : `<div class="anp-table-scroll">
            <table class="anp-table">
              <thead><tr><th>Date</th><th>User</th><th>Plan</th><th>Amount</th><th>Payment ID</th><th>Status</th></tr></thead>
              <tbody>
                ${recentPays
                  .map((p) => {
                    const u = profMap[p.user_id] || {};
                    const ok = p.status === 'captured' || p.status === 'authorized';
                    return `<tr>
                    <td>${fmtDateShort(p.created_at)}</td>
                    <td><strong style="color:var(--text)">${escHtml(u.name || 'Unknown')}</strong></td>
                    <td><span class="anp-pill ${p.plan === 'yearly' ? 'premium' : 'free'}">${escHtml(p.plan || '—')}</span></td>
                    <td><strong style="color:#34D399">₹${((p.amount || 0) / 100).toFixed(0)}</strong></td>
                    <td style="font-family:var(--mono);font-size:.66rem;color:var(--text-3)">${escHtml((p.razorpay_payment_id || '—').slice(0, 20))}…</td>
                    <td><span class="anp-pill ${ok ? 'active' : 'closed'}">${escHtml(p.status || '—')}</span></td>
                  </tr>`;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top:12px">
            <button class="btn btn-secondary btn-sm" id="anpExportPays">⬇ Export CSV</button>
          </div>`
      }
    </div>`),
    );

    /* ── Export handler ── */
    const exportBtn = document.getElementById('anpExportPays');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const rows = [['Date', 'User Name', 'User Email', 'Plan', 'Amount ₹', 'Payment ID', 'Status']];
        payments.forEach((p) => {
          const u = profMap[p.user_id] || {};
          rows.push([
            (p.created_at || '').slice(0, 10),
            u.name || '',
            u.email || '',
            p.plan || '',
            ((p.amount || 0) / 100).toFixed(2),
            p.razorpay_payment_id || '',
            p.status || '',
          ]);
        });
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-${daysAgoKey(0)}.csv`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
    }

    /* ── Draw charts ── */
    const drawAll = () => {
      Object.keys(CHART_REG).forEach((id) => {
        const cv = document.getElementById(id);
        if (!cv || !cv.parentElement) return;
        if (cv.parentElement.clientWidth < 20 || cv.parentElement.clientHeight < 20) return;
        try {
          CHART_REG[id].draw(cv);
        } catch (e) {}
      });
    };
    requestAnimationFrame(() => {
      drawAll();
      setTimeout(drawAll, 100);
      setTimeout(drawAll, 400);
    });

    return wrap;
  }

  /* ═══════════════ TAB: CONTENT ═══════════════ */
  async function renderContent() {
    const wrap = document.createElement('div');
    wrap.className = 'anp-wrap';
    document.body.appendChild(wrap);

    /* ── Fetch announcements + notifications ── */
    let announcements = [],
      allNotifs = [];
    try {
      const [r1, r2] = await Promise.all([
        supa.from('site_announcements').select('*').order('updated_at', { ascending: false }).limit(50),
        supa
          .from('user_notifications')
          .select('id, user_id, title, message, type, read, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);
      announcements = r1.data || [];
      allNotifs = r2.data || [];
    } catch (e) {
      console.warn('[admin content]', e);
    }

    /* ── Announcement Manager ── */
    const active = announcements.find((a) => a.active);
    wrap.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('📢', 'Site Announcement', 'Banner shown to all users', '')}
      <div style="padding:12px;background:${active ? 'linear-gradient(135deg,rgba(16,185,129,.1),rgba(52,211,153,.05))' : 'var(--card-2)'};border:1px solid ${active ? 'rgba(16,185,129,.35)' : 'var(--border)'};border-radius:10px;margin-bottom:12px">
        ${
          active
            ? `<div style="display:flex;align-items:flex-start;gap:10px">
              <span style="font-size:1.3rem">📢</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:.72rem;font-weight:800;color:#34D399;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px">Active · ${escHtml(active.type || 'info')}</div>
                <div style="font-size:.85rem;color:var(--text);line-height:1.5">${escHtml(active.message)}</div>
              </div>
            </div>`
            : `<div style="text-align:center;color:var(--text-3);font-size:.82rem;padding:8px">No active announcement</div>`
        }
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="anpNewAnn">＋ New Announcement</button>
        ${active ? `<button class="btn btn-danger btn-sm" id="anpStopAnn">✕ Remove Active</button>` : ''}
      </div>
    </div>`),
    );

    /* ── Broadcast Notification (send to all) ── */
    wrap.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('🔔', 'Broadcast Notification', 'Send to all users at once', '')}
      <div class="anp-filter">
        <select id="anpBroadcastSegment" style="flex:1">
          <option value="all">All users</option>
          <option value="free">Free users only</option>
          <option value="premium">Premium users only</option>
          <option value="active7d">Active in last 7 days</option>
          <option value="inactive7d">Inactive 7+ days</option>
                    <option value="trial">Trial only</option>
        </select>
      </div>
      <div class="field">
        <label>Title</label>
        <input type="text" id="anpBroadcastTitle" placeholder="e.g. New feature live!" maxlength="80">
      </div>
      <div class="field">
        <label>Message</label>
        <textarea id="anpBroadcastMsg" rows="3" style="min-height:90px" placeholder="Your message to users..." maxlength="500"></textarea>
      </div>
      <div class="field">
        <label>Type</label>
        <select id="anpBroadcastType">
          <option value="info">📢 Info</option>
          <option value="success">✅ Success</option>
          <option value="warning">⚠️ Warning</option>
          <option value="danger">🚨 Urgent</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" id="anpBroadcastSend" style="margin-top:8px">📤 Broadcast Now</button>
      <div style="font-size:.72rem;color:var(--text-3);margin-top:8px;line-height:1.5">
        ⚠️ Ye sabhi selected users ko notification bhej dega. Undo nahi hoga.
      </div>
    </div>`),
    );

    /* ── Recent Sent Notifications ── */
    wrap.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('📨', 'Recent Notifications Sent', `${allNotifs.length} total`, '')}
      ${
        allNotifs.length === 0
          ? emptyState('📭', 'No notifications sent yet', 'Your broadcasts and individual sends will appear here.')
          : `<div style="display:flex;flex-direction:column;gap:6px;max-height:400px;overflow-y:auto">
            ${allNotifs
              .slice(0, 30)
              .map(
                (n) => `
              <div style="padding:10px 12px;background:var(--card-2);border:1px solid var(--border);border-radius:10px">
                <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;flex-wrap:wrap">
                  <strong style="font-size:.78rem;color:var(--text)">${escHtml(n.title || '—')}</strong>
                  <span class="anp-pill ${n.read ? 'closed' : 'open'}" style="font-size:.58rem">${n.read ? '✓ Read' : '● Unread'}</span>
                </div>
                <div style="font-size:.76rem;color:var(--text-2);line-height:1.5">${escHtml(n.message || '')}</div>
                <div style="font-size:.66rem;color:var(--text-3);margin-top:6px">${relTime(n.created_at)}</div>
              </div>`,
              )
              .join('')}
          </div>`
      }
    </div>`),
    );

    /* ── Wire buttons ── */
    const newAnnBtn = document.getElementById('anpNewAnn');
    if (newAnnBtn) newAnnBtn.onclick = () => openAnnEditor(active, false);
    const stopAnnBtn = document.getElementById('anpStopAnn');
    if (stopAnnBtn) {
      stopAnnBtn.onclick = async () => {
        try {
          await supa.from('site_announcements').update({ active: false }).eq('id', active.id);
          toast('Announcement removed', 'ok');
          if (window.renderAdmin) window.renderAdmin();
        } catch (e) {
          toast('Failed', 'err');
        }
      };
    }

    const broadcastBtn = document.getElementById('anpBroadcastSend');
    if (broadcastBtn) {
      broadcastBtn.onclick = async () => {
        const title = document.getElementById('anpBroadcastTitle').value.trim();
        const msg = document.getElementById('anpBroadcastMsg').value.trim();
        const type = document.getElementById('anpBroadcastType').value;
        const segment = document.getElementById('anpBroadcastSegment').value;
        if (!title || !msg) {
          toast('Title and message required', 'err');
          return;
        }

        const ok = await customConfirm({
          title: 'Broadcast Notification?',
          message: `Send "${title}" to ${segment} users. This cannot be undone.`,
          confirmText: 'Send Now',
          cancelText: 'Cancel',
          icon: '📤',
          type: 'warning',
        });
        if (!ok) return;

        broadcastBtn.disabled = true;
        broadcastBtn.innerHTML = '<span class="spinner"></span> Sending...';

        try {
          /* Fetch target users */
          let q = supa.from('profiles').select('id, last_seen, is_admin');
          const { data: targets } = await q;
          if (!targets || !targets.length) throw new Error('No users found');

          /* Fetch subs for premium filter */
          const { data: subsData } = await supa.from('subscriptions').select('user_id, status, expiry_date');
          const premiumIds = new Set(
            (subsData || [])
              .filter((s) => s.status === 'active' && (!s.expiry_date || new Date(s.expiry_date) > new Date()))
              .map((s) => s.user_id),
          );

          let filtered = targets;
          const now = Date.now();
          if (segment === 'free') filtered = targets.filter((u) => !premiumIds.has(u.id) && !u.is_admin);
          else if (segment === 'premium') filtered = targets.filter((u) => premiumIds.has(u.id));
          else if (segment === 'active7d')
            filtered = targets.filter((u) => u.last_seen && now - new Date(u.last_seen).getTime() < 7 * 86400000);
          else if (segment === 'inactive7d')
            filtered = targets.filter((u) => !u.last_seen || now - new Date(u.last_seen).getTime() >= 7 * 86400000);

          if (!filtered.length) throw new Error('No users match this segment');

          const rows = filtered.map((u) => ({
            user_id: u.id,
            title,
            message: msg,
            type,
            read: false,
          }));

          /* Batch insert (chunks of 100) */
          for (let i = 0; i < rows.length; i += 100) {
            const chunk = rows.slice(i, i + 100);
            const { error } = await supa.from('user_notifications').insert(chunk);
            if (error) throw error;
          }

          document.getElementById('anpBroadcastTitle').value = '';
          document.getElementById('anpBroadcastMsg').value = '';
          toast(`✅ Sent to ${filtered.length} users`, 'ok', 4000);
          if (window.renderAdmin) window.renderAdmin();
        } catch (e) {
          toast('Failed: ' + e.message, 'err');
          broadcastBtn.disabled = false;
          broadcastBtn.textContent = '📤 Broadcast Now';
        }
      };
    }

    return wrap;
  }

  /* ═══════════════ ANNOUNCEMENT EDITOR ═══════════════ */
  function openAnnEditor(current, isEdit) {
    openModal(
      modalShell({
        title: '📢 New Announcement',
        subtitle: 'Show banner to all users',
        body: `
        <div class="field">
          <label>Message</label>
          <textarea id="anpAnnMsg" rows="3" maxlength="300" style="min-height:80px" placeholder="e.g. New feature: Goal Study Mode!">${escHtml(current?.message || '')}</textarea>
        </div>
        <div class="field">
          <label>Type</label>
          <select id="anpAnnType">
            <option value="info" ${current?.type === 'info' ? 'selected' : ''}>📢 Info (purple)</option>
            <option value="success" ${current?.type === 'success' ? 'selected' : ''}>✅ Success (green)</option>
            <option value="warning" ${current?.type === 'warning' ? 'selected' : ''}>⚠️ Warning (yellow)</option>
            <option value="danger" ${current?.type === 'danger' ? 'selected' : ''}>🚨 Danger (red)</option>
          </select>
        </div>
      `,
        actions: `<button class="btn btn-ghost" data-close>Cancel</button>
                <button class="btn btn-primary" id="anpAnnSave">Publish</button>`,
      }),
      {
        onMount() {
          document.getElementById('anpAnnSave').onclick = async () => {
            const msg = document.getElementById('anpAnnMsg').value.trim();
            const type = document.getElementById('anpAnnType').value;
            if (!msg) {
              toast('Enter a message', 'err');
              return;
            }
            try {
              /* Deactivate any active */
              await supa.from('site_announcements').update({ active: false }).eq('active', true);
              /* Insert new */
              const { error } = await supa.from('site_announcements').insert({ message: msg, type, active: true });
              if (error) throw error;
              closeModal();
              toast('✅ Announcement published!', 'ok');
              if (window.renderAdmin) window.renderAdmin();
            } catch (e) {
              toast('Failed: ' + e.message, 'err');
            }
          };
        },
      },
    );
  }

  /* ═══════════════ TAB: SUPPORT ═══════════════ */
  async function renderSupport() {
    const wrap = document.createElement('div');
    wrap.className = 'anp-wrap';
    document.body.appendChild(wrap);

    let tickets = [],
      feedback = [];
    try {
      const [r1, r2] = await Promise.all([
        supa.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(100),
        supa.from('feedback').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      tickets = r1.data || [];
      feedback = r2.data || [];
      window.__anpFeedbackCache = feedback; // ✅ global cache for inline onclick
    } catch (e) {
      console.warn('[admin support]', e);
    }

    /* ── KPIs ── */
    const openCount = tickets.filter((t) => t.status === 'open').length;
    const repliedCount = tickets.filter((t) => t.status === 'replied').length;
    const closedCount = tickets.filter((t) => t.status === 'closed').length;
    const newFbCount = feedback.filter((f) => f.status === 'new').length;

    wrap.appendChild(
      elFrom(`<div class="anp-kpi-grid">
      ${kpi('Open Tickets', openCount, 'need reply', '#EF4444', 'openTickets')}
      ${kpi('Replied', repliedCount, 'waiting user', '#10B981', '')}
      ${kpi('Closed', closedCount, 'resolved', '#6E5F8C', '')}
      ${kpi('New Feedback', newFbCount, 'unread', '#FBBF24', '')}
    </div>`),
    );

    /* ── Tickets ── */
    wrap.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('🆘', 'Support Tickets', `${tickets.length} total`, '')}
      ${
        tickets.length === 0
          ? emptyState('📭', 'No tickets', 'User support requests will appear here.')
          : `<div style="display:flex;flex-direction:column;gap:8px;max-height:600px;overflow-y:auto">
            ${tickets
              .slice(0, 40)
              .map(
                (t) => `
              <div style="padding:12px 14px;background:var(--card-2);border:1px solid var(--border);border-radius:10px;cursor:pointer" data-anp-ticket="${t.id}">
                <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:flex-start;margin-bottom:6px">
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:.82rem;color:var(--text)">${escHtml(t.subject || 'No subject')}</div>
                    <div style="font-size:.68rem;color:var(--text-3);margin-top:2px">${escHtml(t.user_name || '')} · ${escHtml(t.user_email || '')} · ${relTime(t.created_at)}</div>
                  </div>
                  <span class="anp-pill ${t.status === 'replied' ? 'replied' : t.status === 'closed' ? 'closed' : 'open'}">${escHtml(t.status || 'open')}</span>
                </div>
                <div style="font-size:.76rem;color:var(--text-2);line-height:1.5;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escHtml(t.message || '')}</div>
                ${t.admin_reply ? `<div style="margin-top:8px;padding:8px 10px;background:rgba(16,185,129,.1);border-left:3px solid #34D399;border-radius:6px;font-size:.74rem;color:var(--text-2)">✓ You replied: ${escHtml(t.admin_reply.slice(0, 100))}${t.admin_reply.length > 100 ? '…' : ''}</div>` : ''}
              </div>`,
              )
              .join('')}
          </div>`
      }
    </div>`),
    );

    /* Wire ticket click */
    wrap.querySelectorAll('[data-anp-ticket]').forEach((el) => {
      el.onclick = () => {
        const t = tickets.find((x) => x.id === el.dataset.anpTicket);
        if (t) openTicketModal(t);
      };
    });
    /* Wire feedback click */
    wrap.querySelectorAll('[data-anp-feedback]').forEach((el) => {
      el.onclick = () => {
        const f = feedback.find((x) => x.id === el.dataset.anpFeedback);
        if (f) openFeedbackModal(f);
      };
    });

    /* ── Feedback ── */
    wrap.appendChild(
      elFrom(`<div class="anp-card">
      ${sectionHead('💬', 'User Feedback', `${feedback.length} total`, '')}
      ${
        feedback.length === 0
          ? emptyState('📭', 'No feedback yet', 'User feedback will appear here.')
          : `<div style="display:flex;flex-direction:column;gap:8px;max-height:500px;overflow-y:auto">
                        ${feedback
                          .slice(0, 30)
                          .map(
                            (f) => `
                            <div style="padding:12px 14px;background:var(--card-2);border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:border-color .15s" data-anp-feedback="${f.id}" onmouseover="this.style.borderColor='var(--purple)'" onmouseout="this.style.borderColor='var(--border)'" onclick="window.__anpOpenFeedback && window.__anpOpenFeedback('${f.id}')">
                <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                  <div>
                    <div style="font-weight:700;font-size:.82rem;color:var(--text)">${escHtml(f.user_name || 'User')}</div>
                    <div style="font-size:.68rem;color:var(--text-3)">${escHtml(f.user_email || '')} · ${relTime(f.created_at)}</div>
                  </div>
                  <div style="display:flex;gap:6px;align-items:center">
                    ${f.rating ? `<span style="font-size:.72rem">${'⭐'.repeat(Math.min(f.rating, 5))}</span>` : ''}
                    <span class="anp-pill ${f.status === 'new' ? 'open' : f.status === 'done' ? 'closed' : 'replied'}">${escHtml(f.status || 'new')}</span>
                  </div>
                </div>
                <div style="font-size:.76rem;color:var(--text-2);line-height:1.5">${escHtml(f.message || '')}</div>
              </div>`,
                          )
                          .join('')}
          </div>`
      }
    </div>`),
    );

    return wrap;
  }

  /* ═══════════════ TICKET MODAL ═══════════════ */
  function openTicketModal(ticket) {
    openModal(
      modalShell({
        title: '🆘 Ticket Details',
        subtitle: ticket.subject || '',
        body: `
        <div style="padding:12px;background:var(--card-2);border-radius:10px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:.72rem;color:var(--text-3);margin-bottom:8px">
            <span>👤 ${escHtml(ticket.user_name || '—')} (${escHtml(ticket.user_email || '—')})</span>
            <span>🕐 ${relTime(ticket.created_at)}</span>
          </div>
          <div style="font-size:.85rem;color:var(--text);line-height:1.6;white-space:pre-wrap">${escHtml(ticket.message || '')}</div>
        </div>
        <div class="field">
          <label>Status</label>
          <select id="anpTkStatus">
            <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
            <option value="replied" ${ticket.status === 'replied' ? 'selected' : ''}>Replied</option>
            <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </div>
        <div class="field">
          <label>Admin Reply</label>
          <textarea id="anpTkReply" rows="4" style="min-height:100px" placeholder="Type your reply…">${escHtml(ticket.admin_reply || '')}</textarea>
        </div>
      `,
        actions: `<button class="btn btn-ghost" data-close>Cancel</button>
                <button class="btn btn-primary" id="anpTkSave">Save</button>`,
      }),
      {
        onMount() {
          document.getElementById('anpTkSave').onclick = async () => {
            const status = document.getElementById('anpTkStatus').value;
            const reply = document.getElementById('anpTkReply').value.trim();
            try {
              const { error } = await supa
                .from('support_tickets')
                .update({
                  status,
                  admin_reply: reply || null,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', ticket.id);
              if (error) throw error;
              closeModal();
              toast('✅ Ticket updated', 'ok');
              if (window.renderAdmin) window.renderAdmin();
            } catch (e) {
              toast('Failed: ' + e.message, 'err');
            }
          };
        },
      },
    );
  }

  /* ═══════════════ FEEDBACK MODAL ═══════════════ */
  function openFeedbackModal(feedbackItem) {
    const moodEmoji = { 5: '😍', 4: '😊', 3: '😐', 2: '😞', 1: '😡' };
    const catLabel = { feature: '💡 Feature Idea', improvement: '✨ Improvement', other: '💭 General' };

    openModal(
      modalShell({
        title: '💬 Feedback Details',
        subtitle:
          (moodEmoji[feedbackItem.rating] || '💬') +
          ' ' +
          (catLabel[feedbackItem.category] || feedbackItem.category || ''),
        body: `
        <div style="padding:12px;background:var(--card-2);border-radius:10px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:.72rem;color:var(--text-3);margin-bottom:8px">
            <span>👤 ${escHtml(feedbackItem.user_name || '—')} (${escHtml(feedbackItem.user_email || '—')})</span>
            <span>🕐 ${relTime(feedbackItem.created_at)}</span>
          </div>
          <div style="font-size:.85rem;color:var(--text);line-height:1.6;white-space:pre-wrap">${escHtml(feedbackItem.message || '')}</div>
        </div>
        <div class="field">
          <label>Status</label>
          <select id="anpFbStatus">
            <option value="new" ${feedbackItem.status === 'new' ? 'selected' : ''}>New</option>
            <option value="read" ${feedbackItem.status === 'read' ? 'selected' : ''}>Read</option>
            <option value="replied" ${feedbackItem.status === 'replied' ? 'selected' : ''}>Replied</option>
            <option value="planned" ${feedbackItem.status === 'planned' ? 'selected' : ''}>Planned</option>
            <option value="done" ${feedbackItem.status === 'done' ? 'selected' : ''}>Done</option>
          </select>
        </div>
        <div class="field">
          <label>Admin Reply</label>
          <textarea id="anpFbReply" rows="4" style="min-height:100px" placeholder="Type your reply to the user…">${escHtml(feedbackItem.admin_reply || '')}</textarea>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:6px">User will see this reply in their Support page under "My Feedback".</div>
        </div>
      `,
        actions: `<button class="btn btn-ghost" data-close>Cancel</button>
                <button class="btn btn-primary" id="anpFbSave">Save & Reply</button>`,
      }),
      {
        onMount() {
          document.getElementById('anpFbSave').onclick = async () => {
            const status = document.getElementById('anpFbStatus').value;
            const reply = document.getElementById('anpFbReply').value.trim();
            try {
              const update = {
                status: reply ? 'replied' : status,
                admin_reply: reply || null,
                updated_at: new Date().toISOString(),
              };
              const { error } = await supa.from('feedback').update(update).eq('id', feedbackItem.id);
              if (error) throw error;
              closeModal();
              toast('✅ Reply saved', 'ok');
              if (window.renderAdmin) window.renderAdmin();
            } catch (e) {
              toast('Failed: ' + e.message, 'err');
            }
          };
        },
      },
    );
  }
  /* ═══════════════ GLOBAL OPENER (for inline onclick) ═══════════════ */
  window.__anpOpenFeedback = function (id) {
    const cache = window.__anpFeedbackCache || [];
    const f = cache.find((x) => x.id === id);
    if (f) openFeedbackModal(f);
  };

  /* ═══════════════ MAIN OVERRIDE ═══════════════ */
  function installAdminPanel() {
    window.renderAdmin = async function () {
      injectCSS();
      const root = document.getElementById('view-admin');
      if (!root) return;
      root.innerHTML = '';

      Object.keys(CHART_REG).forEach((k) => delete CHART_REG[k]);

      const wrap = document.createElement('div');
      wrap.className = 'anp-wrap';

      /* ── Header ── */
      wrap.appendChild(
        elFrom(`<div class="anp-header">
        <div class="anp-header-icon">👑</div>
        <div class="anp-header-info">
          <div class="anp-header-title">Admin Dashboard</div>
          <div class="anp-header-sub">Full backend access · Users · Engagement · Revenue · Content · Support</div>
        </div>
        <div class="anp-header-actions">
          <button class="btn btn-secondary btn-sm" id="anpRefresh">🔄 Refresh</button>
        </div>
      </div>`),
      );

      /* ── Tabs ── */
      const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'engagement', label: 'Engagement', icon: '📈' },
        { id: 'revenue', label: 'Revenue', icon: '💰' },
        { id: 'content', label: 'Content', icon: '📢' },
        { id: 'support', label: 'Support', icon: '🆘' },
      ];
      wrap.appendChild(
        elFrom(`<div class="anp-tabs" id="anpTabs">
        ${tabs.map((t) => `<button class="anp-tab ${anP.tab === t.id ? 'active' : ''}" data-anp-tab="${t.id}">${t.icon} ${t.label}</button>`).join('')}
      </div>`),
      );

      /* ── Content area ── */
      const contentArea = document.createElement('div');
      contentArea.style.cssText = 'display:flex;flex-direction:column;gap:10px';
      contentArea.innerHTML = '<div class="skel" style="height:200px"></div>';
      wrap.appendChild(contentArea);

      root.appendChild(wrap);

      /* ── Load tab content ── */
      const loadTab = async () => {
        contentArea.innerHTML = '<div class="skel" style="height:200px"></div>';
        try {
          let content;
          if (anP.tab === 'overview') content = await renderOverview();
          else if (anP.tab === 'users') content = await renderUsers();
          else if (anP.tab === 'engagement') content = await renderEngagement();
          else if (anP.tab === 'revenue') content = await renderRevenue();
          else if (anP.tab === 'content') content = await renderContent();
          else content = await renderSupport();
          contentArea.innerHTML = '';
          contentArea.appendChild(content);
        } catch (e) {
          console.error('[admin tab]', e);
          contentArea.innerHTML = `<div class="anp-card" style="color:#F87171;padding:20px;text-align:center">⚠️ Failed to load tab: ${escHtml(e.message)}</div>`;
        }
      };

      await loadTab();

      /* ── Wire tabs ── */
      root.querySelectorAll('[data-anp-tab]').forEach((btn) => {
        btn.onclick = async () => {
          anP.tab = btn.dataset.anpTab;
          root.querySelectorAll('[data-anp-tab]').forEach((b) => b.classList.toggle('active', b === btn));
          await loadTab();
        };
      });

      /* ── Refresh ── */
      const refBtn = document.getElementById('anpRefresh');
      if (refBtn) refBtn.onclick = () => window.renderAdmin();

      if (typeof attachRipples === 'function') attachRipples();
    };
    console.log('[admin-panel] ✅ renderAdmin overridden');
  }

  /* ═══════════════ INIT ═══════════════ */
  let attempts = 0;
  function waitThenStart() {
    if (
      typeof window.renderAdmin === 'function' &&
      typeof window.drawBarChart === 'function' &&
      typeof window.openModal === 'function'
    ) {
      installAdminPanel();
      try {
        if (document.querySelector('#view-admin.active') && typeof isAdminUser === 'function' && isAdminUser()) {
          window.renderAdmin();
        }
      } catch (e) {}
    } else {
      attempts++;
      if (attempts > 200) return console.error('[admin-panel] timeout');
      setTimeout(waitThenStart, 50);
    }
  }
  waitThenStart();
})();
