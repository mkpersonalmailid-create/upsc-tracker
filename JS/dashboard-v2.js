/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Dashboard v2 (clean · correct data · expandable)
   ─────────────────────────────────────────────────────────────
   ✅ Fixed data calc (syllabus from SYLLABUS total)
   ✅ Countdown hero (Prelims + Mains)
   ✅ 6 KPIs with ⓘ info buttons (English formulas)
   ✅ Charts with ⛶ expand popup
   ✅ Recent Sessions
   ✅ Smart upsell for free users
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[dashboard-v2] loaded');

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
  function fmtDateKey(key) {
    if (!key) return '';
    const d = new Date(key + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  function fmtDateLong(key) {
    if (!key) return '';
    const d = new Date(key + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ═══════════════ SYLLABUS CALC ═══════════════ */
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
    const completed = tracked.filter((t) => t.status === 'completed').length;
    const pct = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pct };
  }

  /* ═══════════════ INFO CONTENT ═══════════════ */
  const INFO = {
    today: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)">
      <p><strong style="color:var(--text)">Today's study time</strong></p>
      <p style="margin-top:8px"><code style="background:rgba(168,85,247,.15);padding:2px 8px;border-radius:5px;color:#C4B5FD">Sum of durations of all sessions logged today</code></p>
      <p style="margin-top:12px"><strong style="color:var(--text)">Percentage shown</strong></p>
      <p style="margin-top:8px"><code style="background:rgba(168,85,247,.15);padding:2px 8px;border-radius:5px;color:#C4B5FD">(Today's time ÷ Daily target) × 100</code></p>
      <p style="margin-top:12px">Daily target is set in Settings (default 8h).</p>
    </div>`,

    streak: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)">
      <p><strong style="color:var(--text)">Streak</strong> = number of consecutive days (including today) with at least 1 minute of study.</p>
      <p style="margin-top:12px">If you skip a day, the streak resets from the day after.</p>
      <p style="margin-top:12px"><strong style="color:var(--text)">Best</strong> = your longest streak ever recorded.</p>
    </div>`,

    week: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)">
      <p><strong style="color:var(--text)">This week</strong> = total study time over the last 7 days (including today).</p>
      <p style="margin-top:12px"><strong style="color:var(--text)">Target</strong> = your weekly target from Settings (default 50h).</p>
    </div>`,

    month: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)">
      <p><strong style="color:var(--text)">This month</strong> = total study time over the last 30 days.</p>
      <p style="margin-top:12px"><strong style="color:var(--text)">Target</strong> = your monthly target from Settings (default 200h).</p>
    </div>`,

    syllabus: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)">
      <p><strong style="color:var(--text)">Syllabus %</strong></p>
      <p style="margin-top:8px"><code style="background:rgba(168,85,247,.15);padding:2px 8px;border-radius:5px;color:#C4B5FD">(Completed topics ÷ Total topics) × 100</code></p>
      <p style="margin-top:12px"><strong style="color:var(--text)">Total includes:</strong></p>
      <ul style="margin:8px 0 0 18px;line-height:1.9">
        <li>All default UPSC syllabus topics</li>
        <li>All topics under your custom subjects</li>
        <li>Custom topics added under default subjects</li>
      </ul>
      <p style="margin-top:12px"><strong style="color:var(--text)">Completed</strong> = only topics with status <code style="background:rgba(255,255,255,.08);padding:2px 6px;border-radius:4px">completed</code>.</p>
      <p style="margin-top:8px">⚠️ Topics in Rev 1/2/3 are <strong>in progress</strong>, not complete.</p>
    </div>`,

    total: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)">
      <p><strong style="color:var(--text)">Total study time</strong> = sum of all session durations ever logged.</p>
      <p style="margin-top:12px">Also shows total number of sessions logged.</p>
    </div>`,

    studyChart: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)">
      <p><strong style="color:var(--text)">Daily study hours</strong> over the last 30 days.</p>
      <p style="margin-top:12px"><strong style="color:#FBBF24">Yellow dashed line</strong> = your daily target.</p>
      <p style="margin-top:12px">Line above target = target achieved. Below = pending.</p>
    </div>`,

    categoryChart: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)">
      <p><strong style="color:var(--text)">Category Distribution</strong></p>
      <p style="margin-top:8px">Total time spent in each UPSC paper category:</p>
      <ul style="margin:8px 0 0 18px;line-height:1.9">
        <li>🎯 GS Prelims</li>
        <li>📘 GS Mains · Paper I / II / III / IV</li>
        <li>⭐ Optional · ✍️ Essay · 🧮 CSAT</li>
      </ul>
      <p style="margin-top:12px">Use this to check balance — if Optional or Essay is neglected, too much time is going elsewhere.</p>
    </div>`,

    countdown: `<div style="font-size:.85rem;line-height:1.75;color:var(--text-2)">
      <p><strong style="color:var(--text)">Days remaining</strong> from today until your Prelims and Mains exam dates.</p>
      <p style="margin-top:12px">Set your dates on the Settings page to activate the countdown.</p>
    </div>`,
  };

  /* ═══════════════ INFO BUTTON ═══════════════ */
  function infoBtn(title, bodyHtml) {
    const id = 'dashv2Info_' + Math.random().toString(36).slice(2, 9);
    setTimeout(() => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.onclick = (e) => {
        e.stopPropagation();
        if (typeof openModal !== 'function' || typeof modalShell !== 'function') return;
        openModal(
          modalShell({
            title,
            body: bodyHtml,
            actions: '<button class="btn btn-ghost" data-close>Got it</button>',
          }),
        );
      };
    }, 30);
    return `<button class="dashv2-info-btn" id="${id}" title="How is this calculated?">ⓘ</button>`;
  }

  /* ═══════════════ EXPAND BUTTON ═══════════════ */
  function expandBtn(canvasId) {
    return `<button class="dashv2-expand-btn" data-expand="${canvasId}" title="Expand chart">⛶</button>`;
  }

  /* Expand modal handler */
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
        <div style="position:relative;width:100%;height:min(55vh,440px);min-height:280px"><canvas id="__dashv2_expanded"></canvas></div>
        <div id="__dashv2_expanded_legend" style="margin-top:14px;display:flex;flex-wrap:wrap;gap:12px;font-size:.85rem;line-height:1.8"></div>
      `,
        actions: '<button class="btn btn-ghost" data-close>Close</button>',
      }),
      {
        onMount() {
          setTimeout(() => {
            const cv = document.getElementById('__dashv2_expanded');
            if (cv) {
              try {
                cfg.draw(cv, true);
              } catch (err) {
                console.warn('[expand]', err);
              }
            }
            const legEl = document.getElementById('__dashv2_expanded_legend');
            if (legEl && cfg.legendHtml) legEl.innerHTML = cfg.legendHtml;
          }, 120);
        },
      },
    );
  });

  function registerChart(canvasId, title, subtitle, drawFn, legendHtml) {
    CHART_REG[canvasId] = { title, subtitle, draw: drawFn, legendHtml };
  }

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    const old = document.getElementById('dashv2CSS');
    if (old) old.remove();
    const s = document.createElement('style');
    s.id = 'dashv2CSS';
    s.textContent = `
      .dashv2-wrap { display:flex; flex-direction:column; gap:10px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; }
      .dashv2-wrap *, .dashv2-wrap *::before, .dashv2-wrap *::after { box-sizing:border-box; }

      /* Info button */
      .dashv2-info-btn {
        display:inline-flex; align-items:center; justify-content:center;
        width:16px; height:16px; border-radius:50%;
        background: rgba(168,85,247,.18); border:1px solid rgba(168,85,247,.4);
        color:#C4B5FD; font-size:.6rem; cursor:pointer;
        transition: all .2s; flex-shrink:0; padding:0; font-weight:800;
        margin-left:5px;
      }
      .dashv2-info-btn:hover { background:rgba(168,85,247,.32); transform:scale(1.15); color:#fff; }

      /* Expand button */
      .dashv2-expand-btn {
        display:inline-flex; align-items:center; justify-content:center;
        width:22px; height:22px; border-radius:6px;
        background: rgba(168,85,247,.12); border:1px solid rgba(168,85,247,.35);
        color:#C4B5FD; font-size:.75rem; cursor:pointer;
        transition: all .2s; flex-shrink:0; padding:0;
      }
      .dashv2-expand-btn:hover { background:rgba(168,85,247,.35); transform:scale(1.1); color:#fff; }

      .dashv2-chart-actions { display:flex; justify-content:flex-end; margin-top:6px; gap:6px; }

      /* Countdown */
      .dashv2-cd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      @media (max-width: 640px) { .dashv2-cd-grid { grid-template-columns: 1fr; } }

      .dashv2-cd-card {
        border-radius: 16px; padding: 18px;
        position: relative; overflow: hidden; min-height: 120px;
      }
      .dashv2-cd-card.prelims {
        background: linear-gradient(135deg, rgba(168,85,247,.18), rgba(139,92,246,.08));
        border: 1px solid rgba(168,85,247,.35);
      }
      .dashv2-cd-card.mains {
        background: linear-gradient(135deg, rgba(249,115,22,.18), rgba(251,191,36,.08));
        border: 1px solid rgba(249,115,22,.35);
      }
      .dashv2-cd-card::before {
        content: ''; position: absolute; top: -40%; right: -15%;
        width: 200px; height: 200px;
        background: radial-gradient(circle, rgba(168,85,247,.25), transparent 65%);
        pointer-events: none;
      }
      .dashv2-cd-card.mains::before {
        background: radial-gradient(circle, rgba(249,115,22,.25), transparent 65%);
      }
      .dashv2-cd-label {
        font-size: .68rem; font-weight: 800; letter-spacing: .12em;
        text-transform: uppercase; color: var(--text-2);
        margin-bottom: 6px; position: relative; z-index: 1;
        display: flex; align-items: center;
      }
      .dashv2-cd-days {
        font-size: clamp(2.4rem, 6vw, 3.4rem);
        font-weight: 900; line-height: 1; letter-spacing: -.04em;
        background: linear-gradient(135deg, #A855F7, #EC4899);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        position: relative; z-index: 1;
      }
      .dashv2-cd-card.mains .dashv2-cd-days {
        background: linear-gradient(135deg, #F97316, #FBBF24);
        -webkit-background-clip: text; background-clip: text;
      }
      .dashv2-cd-sub {
        font-size: .78rem; color: var(--text-2);
        margin-top: 8px; font-weight: 600;
        position: relative; z-index: 1;
      }

      /* KPI */
      .dashv2-kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
      }
      .dashv2-kpi {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 12px; padding: 12px;
        position: relative; overflow: hidden; min-width: 0;
      }
      .dashv2-kpi::before {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0;
        width: 3px; background: var(--c, var(--purple));
      }
      .dashv2-kpi-lbl {
        font-size: .58rem; font-weight: 800; letter-spacing: .08em;
        text-transform: uppercase; color: var(--text-3);
        margin-bottom: 4px;
        display: flex; align-items: center;
      }
      .dashv2-kpi-val {
        font-size: clamp(1rem, 2.6vw, 1.25rem);
        font-weight: 900; letter-spacing: -.02em;
        line-height: 1.1; color: var(--text);
      }
      .dashv2-kpi-sub {
        font-size: .66rem; color: var(--text-3); margin-top: 3px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }

      /* Grid */
      .dashv2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      @media (max-width: 900px) { .dashv2-grid { grid-template-columns: 1fr; } }

      /* Card */
      .dashv2-card {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 12px; padding: 12px;
        width: 100%; max-width: 100%; overflow-x: hidden;
      }
      .dashv2-sec-head {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 10px; padding-bottom: 8px;
        border-bottom: 1px dashed var(--border);
      }
      .dashv2-sec-icon {
        width: 28px; height: 28px; border-radius: 8px;
        background: linear-gradient(135deg, rgba(168,85,247,.2), rgba(236,72,153,.12));
        border: 1px solid rgba(168,85,247,.35);
        display: flex; align-items: center; justify-content: center;
        font-size: .85rem; flex-shrink: 0;
      }
      .dashv2-sec-title { font-size: .82rem; font-weight: 800; color: var(--text); line-height: 1.2; }
      .dashv2-sec-sub { font-size: .64rem; color: var(--text-3); margin-top: 1px; }

      .dashv2-chart-wrap { position: relative; width: 100%; height: 140px; }
      .dashv2-chart-wrap canvas { display: block !important; width: 100% !important; max-width: 100% !important; }
      .dashv2-chart-tall { height: 170px; }

      .dashv2-legend { display: flex; flex-direction: column; gap: 6px; font-size: .74rem; min-width: 0; }
      .dashv2-legend-row { display: flex; align-items: center; gap: 6px; }
      .dashv2-legend-row .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
      .dashv2-legend-row .lbl { flex: 1; min-width: 0; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dashv2-legend-row .val { color: var(--text); font-weight: 700; flex-shrink: 0; }

      .dashv2-split {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px; align-items: center;
      }

      /* Recent */
      .dashv2-row {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 12px;
        background: var(--card-2); border: 1px solid var(--border);
        border-radius: 10px; margin-bottom: 6px;
      }
      .dashv2-row:last-child { margin-bottom: 0; }
      .dashv2-row-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
      .dashv2-row-body { flex: 1; min-width: 0; }
      .dashv2-row-title { font-weight: 700; font-size: .8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .dashv2-row-meta { font-size: .68rem; color: var(--text-3); margin-top: 2px; }
      .dashv2-row-val {
        font-weight: 800; font-size: .82rem; flex-shrink: 0;
        background: linear-gradient(135deg, #A855F7, #EC4899);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      }

      /* Upsell */
      .dashv2-upsell {
        background: linear-gradient(135deg, rgba(251,191,36,.12), rgba(236,72,153,.06));
        border: 1px solid rgba(251,191,36,.35);
        border-radius: 14px; padding: 16px;
        display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
      }
      .dashv2-upsell-icon {
        width: 42px; height: 42px; border-radius: 12px;
        background: linear-gradient(135deg, #FBBF24, #EC4899);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.3rem; flex-shrink: 0;
      }

      .dashv2-empty { text-align: center; padding: 24px 16px; color: var(--text-3); }
      .dashv2-empty-icon { font-size: 1.8rem; margin-bottom: 8px; opacity: .7; }
      .dashv2-empty-title { font-size: .85rem; font-weight: 800; color: var(--text-2); margin-bottom: 4px; }
      .dashv2-empty-desc { font-size: .74rem; color: var(--text-3); line-height: 1.5; max-width: 280px; margin: 0 auto 10px; }

      @media (max-width: 640px) {
        .dashv2-cd-card { padding: 14px; min-height: 105px; }
        .dashv2-cd-label { font-size: .6rem; }
        .dashv2-cd-sub { font-size: .72rem; }
        .dashv2-kpi { padding: 10px; }
        .dashv2-kpi-lbl { font-size: .54rem; }
        .dashv2-kpi-sub { font-size: .62rem; }
        .dashv2-card { padding: 10px; border-radius: 11px; }
        .dashv2-chart-wrap { height: 120px; }
        .dashv2-chart-tall { height: 145px; }
        .dashv2-sec-title { font-size: .78rem; }
      }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════ COUNTDOWN ═══════════════ */
  function renderCountdown() {
    const preDate = state.profile?.exam_date_prelims;
    const mainsDate = state.profile?.exam_date_mains;
    const preDays = preDate && typeof daysUntil === 'function' ? daysUntil(preDate) : null;
    const mainsDays = mainsDate && typeof daysUntil === 'function' ? daysUntil(mainsDate) : null;

    const wrap = document.createElement('div');
    wrap.className = 'dashv2-cd-grid';

    if (!preDate && !mainsDate) {
      wrap.innerHTML = `
        <div class="dashv2-cd-card prelims" style="grid-column:1/-1">
          <div class="dashv2-cd-label">📅 Exam Countdown ${infoBtn('Exam Countdown', INFO.countdown)}</div>
          <div style="font-size:.92rem;color:var(--text-2);line-height:1.6;margin-top:6px;position:relative;z-index:1">
            Set your Prelims & Mains exam dates to see the countdown here.
          </div>
          <div style="margin-top:10px;position:relative;z-index:1">
            <button class="btn btn-primary btn-sm" onclick="switchView('settings')">Set Exam Dates</button>
          </div>
        </div>`;
      return wrap;
    }

    wrap.innerHTML = `
      <div class="dashv2-cd-card prelims">
        <div class="dashv2-cd-label">🎯 Prelims Countdown ${infoBtn('Prelims Countdown', INFO.countdown)}</div>
        <div class="dashv2-cd-days">${preDays != null ? preDays : '—'}</div>
        <div class="dashv2-cd-sub">${preDate ? fmtDateLong(preDate) + ' · days left' : 'Not set'}</div>
      </div>
      <div class="dashv2-cd-card mains">
        <div class="dashv2-cd-label">📝 Mains Countdown ${infoBtn('Mains Countdown', INFO.countdown)}</div>
        <div class="dashv2-cd-days">${mainsDays != null ? mainsDays : '—'}</div>
        <div class="dashv2-cd-sub">${mainsDate ? fmtDateLong(mainsDate) + ' · days left' : 'Not set'}</div>
      </div>`;
    return wrap;
  }

  /* ═══════════════ KPI ROW ═══════════════ */
  function renderKpis() {
    const sessions = state.sessions || [];
    const settings = state.settings || {};

    const todaySec = sessions.filter((s) => s.date === todayKeyLocal()).reduce((a, s) => a + (s.duration || 0), 0);
    const target = (settings.daily_target || 8) * 3600;
    const todayPct = target ? Math.round((todaySec / target) * 100) : 0;

    let weekSec = 0;
    for (let i = 0; i < 7; i++) {
      weekSec += sessions.filter((s) => s.date === daysAgoKey(i)).reduce((a, s) => a + (s.duration || 0), 0);
    }

    let monthSec = 0;
    for (let i = 0; i < 30; i++) {
      monthSec += sessions.filter((s) => s.date === daysAgoKey(i)).reduce((a, s) => a + (s.duration || 0), 0);
    }

    const streak = typeof computeStreak === 'function' ? computeStreak() : 0;
    const bestStreak = typeof computeLongestStreak === 'function' ? computeLongestStreak() : 0;

    const sylStats = calcSyllabusStats();
    const totalSec = sessions.reduce((a, s) => a + (s.duration || 0), 0);

    const kpis = [
      { lbl: 'Today', val: shortDur(todaySec), sub: `${todayPct}% of target`, color: '#14B8A6', info: INFO.today },
      { lbl: '🔥 Streak', val: streak + 'd', sub: `Best: ${bestStreak}d`, color: '#EC4899', info: INFO.streak },
      {
        lbl: 'This Week',
        val: shortDur(weekSec),
        sub: `Target ${settings.weekly_target || 50}h`,
        color: '#A855F7',
        info: INFO.week,
      },
      {
        lbl: 'This Month',
        val: shortDur(monthSec),
        sub: `Target ${settings.monthly_target || 200}h`,
        color: '#F97316',
        info: INFO.month,
      },
      {
        lbl: '📖 Syllabus',
        val: sylStats.pct + '%',
        sub: `${sylStats.completed}/${sylStats.total} topics`,
        color: '#10B981',
        info: INFO.syllabus,
      },
      {
        lbl: 'Total Hours',
        val: (totalSec / 3600).toFixed(1) + 'h',
        sub: `${sessions.length} sessions`,
        color: '#8B5CF6',
        info: INFO.total,
      },
    ];

    const wrap = document.createElement('div');
    wrap.className = 'dashv2-kpi-grid';
    wrap.innerHTML = kpis
      .map(
        (k) => `
      <div class="dashv2-kpi" style="--c:${k.color}">
        <div class="dashv2-kpi-lbl">${escHtml(k.lbl)} ${infoBtn(k.lbl, k.info)}</div>
        <div class="dashv2-kpi-val">${escHtml(k.val)}</div>
        <div class="dashv2-kpi-sub">${escHtml(k.sub)}</div>
      </div>`,
      )
      .join('');
    return wrap;
  }

  /* ═══════════════ STUDY CHART ═══════════════ */
  function renderStudyChart() {
    return elFrom(`
      <div class="dashv2-card">
        <div class="dashv2-sec-head">
          <div class="dashv2-sec-icon">📈</div>
          <div style="flex:1;min-width:0">
            <div class="dashv2-sec-title">Study Time ${infoBtn('Study Time', INFO.studyChart)}</div>
            <div class="dashv2-sec-sub">Last 30 days · target overlay</div>
          </div>
        </div>
        <div class="dashv2-chart-wrap dashv2-chart-tall"><canvas id="dashv2StudyChart"></canvas></div>
        <div class="dashv2-chart-actions">${expandBtn('dashv2StudyChart')}</div>
      </div>
    `);
  }

  function drawStudyChart() {
    const cv = document.getElementById('dashv2StudyChart');
    if (!cv || typeof window.setupCanvas !== 'function') return;
    const sessions = state.sessions || [];
    const target = state.settings?.daily_target || 8;

    const labels = [],
      values = [];
    for (let i = 29; i >= 0; i--) {
      const key = daysAgoKey(i);
      labels.push(fmtDateKey(key));
      values.push(sessions.filter((s) => s.date === key).reduce((a, s) => a + (s.duration || 0), 0) / 3600);
    }
    const totalH = values.reduce((a, b) => a + b, 0);
    const avgH = totalH / 30;
    const bestH = Math.max(...values);

    const { ctx, w, h } = window.setupCanvas(cv);
    if (!ctx) return;
    const c = typeof window.themeColors === 'function' ? window.themeColors() : { border: '#2A1E42', text3: '#6E5F8C' };
    const p = { t: 16, r: 12, b: 24, l: 36 };
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

    if (values.length) {
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

    // Register for expand
    registerChart(
      'dashv2StudyChart',
      'Study Time',
      'Last 30 days · target overlay',
      (c2) => {
        // Redraw using same logic on expand canvas
        drawStudyChartTo(c2);
      },
      `<span style="color:var(--text-2)">Total: <strong style="color:var(--text)">${totalH.toFixed(1)}h</strong></span>
       <span style="color:var(--text-2)">Avg/day: <strong style="color:var(--text)">${avgH.toFixed(2)}h</strong></span>
       <span style="color:var(--text-2)">Best day: <strong style="color:var(--text)">${bestH.toFixed(1)}h</strong></span>
       <span style="color:var(--text-2)">Target: <strong style="color:#FBBF24">${target}h</strong></span>`,
    );
  }

  function drawStudyChartTo(cv) {
    if (!cv || typeof window.setupCanvas !== 'function') return;
    const sessions = state.sessions || [];
    const target = state.settings?.daily_target || 8;
    const labels = [],
      values = [];
    for (let i = 29; i >= 0; i--) {
      const key = daysAgoKey(i);
      labels.push(fmtDateKey(key));
      values.push(sessions.filter((s) => s.date === key).reduce((a, s) => a + (s.duration || 0), 0) / 3600);
    }
    const { ctx, w, h } = window.setupCanvas(cv);
    if (!ctx) return;
    const c = typeof window.themeColors === 'function' ? window.themeColors() : { border: '#2A1E42', text3: '#6E5F8C' };
    const p = { t: 16, r: 12, b: 24, l: 36 };
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
      ctx.font = '11px Inter,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText((max - (max / 3) * i).toFixed(1) + 'h', p.l - 5, y + 3);
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
      ctx.font = 'bold 10px Inter,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Target ' + target + 'h', p.l + 4, ty - 3);
    }
    if (values.length) {
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
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.fillStyle = c.text3;
      ctx.font = '11px Inter,sans-serif';
      ctx.textAlign = 'center';
      const step = Math.max(1, Math.ceil(n / 6));
      labels.forEach((lab, i) => {
        if (i % step !== 0 && i !== n - 1) return;
        ctx.fillText(lab, xFor(i), h - 8);
      });
    }
  }

  /* ═══════════════ CATEGORY DONUT ═══════════════ */
  function renderCategoryChart() {
    const sessions = state.sessions || [];
    const catTotals = {};
    sessions.forEach((s) => {
      const c = s.category || 'other';
      catTotals[c] = (catTotals[c] || 0) + (s.duration || 0);
    });
    const catEntries = Object.entries(catTotals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name: catLabel(name), value, color: catColorFor(name) }));

    if (!catEntries.length) {
      return elFrom(`
        <div class="dashv2-card">
          <div class="dashv2-sec-head">
            <div class="dashv2-sec-icon">🎯</div>
            <div style="flex:1"><div class="dashv2-sec-title">Category Distribution ${infoBtn('Category Distribution', INFO.categoryChart)}</div></div>
          </div>
          <div class="dashv2-empty" style="padding:20px">
            <div class="dashv2-empty-desc">Log a study session to see category breakdown</div>
          </div>
        </div>
      `);
    }

    const legendHtml = catEntries
      .map(
        (e) => `
      <div class="dashv2-legend-row">
        <span class="dot" style="background:${e.color}"></span>
        <span class="lbl">${escHtml(e.name)}</span>
        <span class="val">${shortDur(e.value)}</span>
      </div>`,
      )
      .join('');

    const card = elFrom(`
      <div class="dashv2-card">
        <div class="dashv2-sec-head">
          <div class="dashv2-sec-icon">🎯</div>
          <div style="flex:1"><div class="dashv2-sec-title">Category Distribution ${infoBtn('Category Distribution', INFO.categoryChart)}</div></div>
        </div>
        <div class="dashv2-split">
          <div class="dashv2-chart-wrap"><canvas id="dashv2CatChart"></canvas></div>
          <div id="dashv2CatLegend" class="dashv2-legend">${legendHtml}</div>
        </div>
        <div class="dashv2-chart-actions">${expandBtn('dashv2CatChart')}</div>
      </div>
    `);

    registerChart(
      'dashv2CatChart',
      'Category Distribution',
      'Time per UPSC paper',
      (cv) => {
        if (typeof drawDonut === 'function') drawDonut(cv, catEntries);
      },
      catEntries
        .map(
          (e) =>
            `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:50%;background:${e.color}"></span><span style="color:var(--text-2)">${escHtml(e.name)}</span> · <strong style="color:var(--text)">${shortDur(e.value)}</strong></span>`,
        )
        .join(''),
    );

    setTimeout(() => {
      const cv = document.getElementById('dashv2CatChart');
      if (cv && typeof drawDonut === 'function') drawDonut(cv, catEntries);
    }, 60);

    return card;
  }

  /* ═══════════════ RECENT SESSIONS ═══════════════ */
  function renderRecent() {
    const sessions = state.sessions || [];
    const recent = [...sessions].sort((a, b) => (b.start_time || 0) - (a.start_time || 0)).slice(0, 6);

    if (!recent.length) {
      return elFrom(`
        <div class="dashv2-card">
          <div class="dashv2-sec-head">
            <div class="dashv2-sec-icon">🕐</div>
            <div style="flex:1"><div class="dashv2-sec-title">Recent Sessions</div></div>
          </div>
          <div class="dashv2-empty">
            <div class="dashv2-empty-icon">⏱</div>
            <div class="dashv2-empty-title">No sessions yet</div>
            <div class="dashv2-empty-desc">Start your first study session from the Study tab</div>
            <button class="btn btn-primary btn-sm" onclick="switchView('study')">Start Session</button>
          </div>
        </div>
      `);
    }

    return elFrom(`
      <div class="dashv2-card">
        <div class="dashv2-sec-head">
          <div class="dashv2-sec-icon">🕐</div>
          <div style="flex:1"><div class="dashv2-sec-title">Recent Sessions</div><div class="dashv2-sec-sub">Last 6 sessions</div></div>
          <button class="btn btn-ghost btn-sm" onclick="switchView('history')" style="font-size:.72rem">View all →</button>
        </div>
        <div>
          ${recent
            .map((s) => {
              const color = typeof getSubjectColor === 'function' ? getSubjectColor(s.subject) : '#A855F7';
              const relDate = typeof fmtRelDate === 'function' ? fmtRelDate(s.date) : s.date;
              return `
              <div class="dashv2-row">
                <span class="dashv2-row-dot" style="background:${color}"></span>
                <div class="dashv2-row-body">
                  <div class="dashv2-row-title">${escHtml(s.subject)}${s.topic ? ' · ' + escHtml(s.topic.slice(0, 60)) : ''}</div>
                  <div class="dashv2-row-meta">${escHtml(relDate)} · ${escHtml(s.study_type || 'Study')}</div>
                </div>
                <span class="dashv2-row-val">${shortDur(s.duration)}</span>
              </div>`;
            })
            .join('')}
        </div>
      </div>
    `);
  }

  /* ═══════════════ UPSELL ═══════════════ */
  function renderUpsell() {
    const isAdmin = typeof isAdminUser === 'function' && isAdminUser();
    const isPrem = typeof isPremiumUser === 'function' && isPremiumUser();
    if (isAdmin || isPrem) return null;

    return elFrom(`
      <div class="dashv2-upsell">
        <div class="dashv2-upsell-icon">💎</div>
        <div style="flex:1;min-width:180px">
          <div style="font-size:.92rem;font-weight:800;color:var(--text);margin-bottom:3px">Unlock Advanced Analytics</div>
          <div style="font-size:.78rem;color:var(--text-2);line-height:1.5">
            Deep insights, syllabus pace, revision health, test analysis, and more — starting at ₹99/month.
          </div>
        </div>
        <button class="btn btn-premium btn-sm" onclick="switchView('premium')" style="flex-shrink:0">Upgrade →</button>
      </div>
    `);
  }

  /* ═══════════════ MAIN OVERRIDE ═══════════════ */
  function installDashboardV2() {
    window.renderDashboard = function () {
      injectCSS();
      const root = document.getElementById('view-dashboard');
      if (!root) return;
      root.innerHTML = '';

      // Clear chart registry per render
      Object.keys(CHART_REG).forEach((k) => delete CHART_REG[k]);

      const wrap = document.createElement('div');
      wrap.className = 'dashv2-wrap';

      wrap.appendChild(renderCountdown());
      wrap.appendChild(renderKpis());

      const grid = document.createElement('div');
      grid.className = 'dashv2-grid';
      grid.appendChild(renderStudyChart());
      grid.appendChild(renderCategoryChart());
      wrap.appendChild(grid);

      wrap.appendChild(renderRecent());

      const upsell = renderUpsell();
      if (upsell) wrap.appendChild(upsell);

      root.appendChild(wrap);

      // Draw charts with retry (DOM settle)
      const drawAll = () => {
        try {
          drawStudyChart();
        } catch (e) {
          console.warn('[dash] study', e);
        }
        try {
          const cv = document.getElementById('dashv2CatChart');
          if (cv && CHART_REG['dashv2CatChart']) CHART_REG['dashv2CatChart'].draw(cv);
        } catch (e) {}
      };
      requestAnimationFrame(() => {
        drawAll();
        setTimeout(drawAll, 100);
        setTimeout(drawAll, 400);
      });

      if (typeof attachRipples === 'function') attachRipples();
    };
    console.log('[dashboard-v2] ✅ installed with info + expand');
  }

  let attempts = 0;
  function waitThenStart() {
    if (
      typeof window.renderDashboard === 'function' &&
      typeof window.drawDonut === 'function' &&
      typeof window.switchView === 'function'
    ) {
      installDashboardV2();
      try {
        if (document.querySelector('#view-dashboard.active')) window.renderDashboard();
      } catch (e) {}
    } else {
      attempts++;
      if (attempts > 200) return console.error('[dashboard-v2] timeout');
      setTimeout(waitThenStart, 50);
    }
  }
  waitThenStart();
})();
