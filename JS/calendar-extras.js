/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Calendar Extras v1
   P1: Summary bar, Filters, Heat legend, Rest days, Right-click menu
   P2: Week view, Enhanced day detail
   P3: Revision markers, Goal deadline markers
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[calendar-extras] v1 loaded');

  /* ═══════════════ CONFIG ═══════════════ */
  const HEAT_LEVELS = [
    { lvl: 0, label: '0h', color: 'transparent' },
    { lvl: 1, label: '<3h', color: 'rgba(168,85,247,0.12)' },
    { lvl: 2, label: '3-5h', color: 'rgba(168,85,247,0.24)' },
    { lvl: 3, label: '5-8h', color: 'rgba(168,85,247,0.38)' },
    { lvl: 4, label: '8h+', color: 'linear-gradient(135deg,rgba(168,85,247,0.5),rgba(236,72,153,0.4))' },
  ];

  const CAT_LABELS = {
    prelims: '🎯 GS Prelims',
    mains: '📚 GS Mains',
    'mains-gs1': '📘 GS Mains · I',
    'mains-gs2': '📗 GS Mains · II',
    'mains-gs3': '📙 GS Mains · III',
    'mains-gs4': '📕 GS Mains · IV',
    optional: '⭐ Optional',
    essay: '✍️ Essay',
    csat: '🧮 CSAT',
  };

  /* ═══════════════ STATE ═══════════════ */
  let myCalMonth = new Date();
  let myWeekStart = null;
  let currentView = localStorage.getItem('upsc_cal_view') || 'month';

  const FILTERS = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('upsc_cal_filters') || '{}');
      return {
        subject: saved.subject || '',
        category: saved.category || '',
        type: saved.type || '',
        minHours: saved.minHours || 0,
      };
    } catch (e) {
      return { subject: '', category: '', type: '', minHours: 0 };
    }
  })();

  function saveFilters() {
    try {
      localStorage.setItem('upsc_cal_filters', JSON.stringify(FILTERS));
    } catch (e) {}
  }

  /* ═══════════════ REST DAYS ═══════════════ */
  function getRestDays() {
    try {
      return JSON.parse(localStorage.getItem('upsc_rest_days') || '[]');
    } catch (e) {
      return [];
    }
  }
  function saveRestDays(arr) {
    try {
      localStorage.setItem('upsc_rest_days', JSON.stringify(arr));
    } catch (e) {}
  }
  function isRestDay(key) {
    return getRestDays().includes(key);
  }
  function toggleRestDay(key) {
    const arr = getRestDays();
    const i = arr.indexOf(key);
    if (i === -1) arr.push(key);
    else arr.splice(i, 1);
    saveRestDays(arr);
  }

  /* ═══════════════ HELPERS ═══════════════ */
  function dateKey(d) {
    const x = new Date(d);
    const p = (n) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  function parseDate(k) {
    return new Date(k + 'T00:00:00');
  }
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function startOfWeek(d) {
    const x = startOfDay(d);
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    return x;
  }
  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  function fmtDuration(sec, style) {
    sec = Math.max(0, Math.floor(sec || 0));
    const hr = Math.floor(sec / 3600);
    const mn = Math.floor((sec % 3600) / 60);
    if (style === 'clock') {
      const p = (n) => String(n).padStart(2, '0');
      return `${p(hr)}:${p(mn)}:${p(sec % 60)}`;
    }
    if (style === 'long') {
      const parts = [];
      if (hr) parts.push(`${hr}h`);
      if (mn || !hr) parts.push(`${mn}m`);
      return parts.join(' ');
    }
    return hr ? `${hr}h ${mn}m` : `${mn}m`;
  }
  function fmtDate(key) {
    const d = typeof key === 'string' ? parseDate(key) : new Date(key);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function todayKey() {
    return dateKey(new Date());
  }
  function getSubjectColor(name) {
    const colors = [
      '#A855F7',
      '#EC4899',
      '#F97316',
      '#FBBF24',
      '#14B8A6',
      '#06B6D4',
      '#10B981',
      '#8B5CF6',
      '#6366F1',
      '#EF4444',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
    return colors[Math.abs(hash) % colors.length];
  }

  /* ═══════════════ FILTERS ═══════════════ */
  function sessionMatchesFilters(s) {
    if (FILTERS.subject && s.subject !== FILTERS.subject) return false;
    if (FILTERS.category && s.category !== FILTERS.category) return false;
    if (FILTERS.type && s.study_type !== FILTERS.type) return false;
    return true;
  }

  function getFilteredSessions() {
    return state.sessions.filter(sessionMatchesFilters);
  }

  function secondsOnDateFiltered(key) {
    const list = getFilteredSessions().filter((s) => s.date === key);
    const total = list.reduce((a, x) => a + (x.duration || 0), 0);
    if (FILTERS.minHours > 0 && total < FILTERS.minHours * 3600) return 0;
    return total;
  }

  function isFilterActive() {
    return FILTERS.subject || FILTERS.category || FILTERS.type || FILTERS.minHours > 0;
  }

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    if (document.getElementById('calExtrasCSS')) return;
    const style = document.createElement('style');
    style.id = 'calExtrasCSS';
    style.textContent = `
      /* Summary bar */
      .cal-summary-bar {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.06));
        border: 1px solid rgba(168,85,247,0.25);
        border-radius: 14px;
        margin-bottom: 14px;
        flex-wrap: wrap;
      }
      .cal-summary-stat {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-right: 14px;
        border-right: 1px solid var(--border);
      }
      .cal-summary-stat:last-child { border-right: none; padding-right: 0; }
      .cal-summary-icon {
        width: 32px; height: 32px;
        border-radius: 9px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem;
        background: rgba(168,85,247,0.15);
      }
      .cal-summary-val {
        font-weight: 900;
        font-size: 0.95rem;
        letter-spacing: -0.02em;
        line-height: 1.1;
      }
      .cal-summary-lbl {
        font-size: 0.65rem;
        color: var(--text-3);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      /* Filters bar */
      .cal-filters-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: var(--card-2);
        border: 1px solid var(--border);
        border-radius: 12px;
        margin-bottom: 14px;
        flex-wrap: wrap;
      }
      .cal-filter-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-2);
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }
      .cal-filter-chip:hover {
        border-color: var(--purple);
        color: var(--text);
      }
      .cal-filter-chip.active {
        background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.1));
        border-color: var(--purple);
        color: #fff;
      }
      .cal-filter-clear {
        padding: 6px 12px;
        background: rgba(239,68,68,0.1);
        border: 1px solid rgba(239,68,68,0.3);
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        color: #FCA5A5;
        cursor: pointer;
        margin-left: auto;
      }
      .cal-filter-clear:hover {
        background: rgba(239,68,68,0.2);
      }

      /* Legend */
      .cal-legend {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 12px;
        margin-top: 14px;
        font-size: 0.72rem;
        color: var(--text-3);
        flex-wrap: wrap;
      }
      .cal-legend-swatch {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .cal-legend-box {
        width: 18px;
        height: 18px;
        border-radius: 5px;
        border: 1px solid var(--border);
      }

      /* Rest day */
      .cal-day.rest-day {
        background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1)) !important;
        border-color: rgba(59,130,246,0.4) !important;
      }
      .cal-day.rest-day::after {
        content: '💤';
        position: absolute;
        top: 6px;
        right: 6px;
        font-size: 0.7rem;
        opacity: 0.8;
      }

      /* Marker dots */
      .cal-day-markers {
        display: flex;
        gap: 3px;
        margin-top: 3px;
        position: absolute;
        bottom: 6px;
        left: 8px;
      }
      .cal-day-marker {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        box-shadow: 0 0 4px currentColor;
      }

      /* Right-click menu */
      .cal-ctx-menu {
        position: fixed;
        background: var(--card);
        border: 1px solid var(--border-2);
        border-radius: 12px;
        padding: 6px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.5);
        z-index: 9999;
        min-width: 200px;
        animation: fadeIn 0.15s;
      }
      .cal-ctx-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 14px;
        border-radius: 8px;
        font-size: 0.83rem;
        font-weight: 600;
        color: var(--text-2);
        cursor: pointer;
        transition: all 0.15s;
      }
      .cal-ctx-item:hover {
        background: var(--card-2);
        color: var(--text);
      }
      .cal-ctx-item.danger:hover {
        background: rgba(239,68,68,0.1);
        color: #FCA5A5;
      }

      /* Week view */
      .cal-week-view {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 10px;
        margin-top: 14px;
      }
      .cal-week-col {
        background: var(--card-2);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .cal-week-col.today {
        border-color: var(--pink);
        background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(168,85,247,0.06));
      }
      .cal-week-head {
        text-align: center;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border);
      }
      .cal-week-dow {
        font-size: 0.66rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-3);
      }
      .cal-week-num {
        font-size: 1.2rem;
        font-weight: 900;
        margin-top: 2px;
      }
      .cal-week-total {
        font-size: 0.72rem;
        font-weight: 800;
        color: var(--purple);
        margin-top: 3px;
      }
      .cal-week-sessions {
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 1;
        overflow-y: auto;
        max-height: 320px;
      }
      .cal-week-session {
        padding: 6px 8px;
        border-radius: 7px;
        font-size: 0.7rem;
        font-weight: 700;
        cursor: pointer;
        border-left: 3px solid;
        background: var(--card);
        transition: transform 0.15s;
        line-height: 1.3;
      }
      .cal-week-session:hover {
        transform: translateX(2px);
      }
      .cal-week-time {
        font-size: 0.62rem;
        color: var(--text-3);
        font-weight: 600;
        margin-top: 2px;
      }

      @media (max-width: 900px) {
        .cal-week-view {
          grid-template-columns: repeat(2, 1fr);
        }
        .cal-week-sessions {
          max-height: 200px;
        }
      }
      @media (max-width: 600px) {
        .cal-summary-bar {
          padding: 10px 12px;
          gap: 10px;
        }
        .cal-summary-stat {
          padding-right: 10px;
        }
        .cal-summary-icon {
          width: 26px; height: 26px;
          font-size: 0.85rem;
        }
        .cal-summary-val { font-size: 0.85rem; }
        .cal-summary-lbl { font-size: 0.58rem; }
        .cal-filters-bar {
          padding: 8px;
        }
        .cal-filter-chip {
          font-size: 0.72rem;
          padding: 5px 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════ SUMMARY BAR ═══════════════ */
  function renderSummaryBar() {
    const wrap = document.querySelector('#view-calendar .cal-wrap');
    if (!wrap) return;

    // Remove existing
    const old = document.getElementById('calSummaryBar');
    if (old) old.remove();

    // Compute stats for current month
    const y = myCalMonth.getFullYear();
    const m = myCalMonth.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstKey = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const filtered = getFilteredSessions();
    const monthSessions = filtered.filter((s) => s.date >= firstKey && s.date <= lastKey);
    const totalSec = monthSessions.reduce((a, x) => a + (x.duration || 0), 0);
    const activeDays = new Set(monthSessions.map((s) => s.date)).size;
    const avgSec = activeDays ? totalSec / activeDays : 0;

    // Streak
    const today = startOfDay(new Date());
    let streak = 0;
    for (let i = 0; i < 400; i++) {
      const k = dateKey(addDays(today, -i));
      const has = state.sessions.some((x) => x.date === k && x.duration > 0);
      if (has) streak++;
      else if (i === 0) continue;
      else break;
    }

    const bar = document.createElement('div');
    bar.id = 'calSummaryBar';
    bar.className = 'cal-summary-bar';
    bar.innerHTML = `
      <div class="cal-summary-stat">
        <div class="cal-summary-icon">⏱</div>
        <div>
          <div class="cal-summary-val">${fmtDuration(totalSec, 'short')}</div>
          <div class="cal-summary-lbl">This Month</div>
        </div>
      </div>
      <div class="cal-summary-stat">
        <div class="cal-summary-icon">📅</div>
        <div>
          <div class="cal-summary-val">${activeDays}/${daysInMonth}</div>
          <div class="cal-summary-lbl">Active Days</div>
        </div>
      </div>
      <div class="cal-summary-stat">
        <div class="cal-summary-icon">📊</div>
        <div>
          <div class="cal-summary-val">${fmtDuration(avgSec, 'short')}</div>
          <div class="cal-summary-lbl">Avg / Active Day</div>
        </div>
      </div>
      <div class="cal-summary-stat">
        <div class="cal-summary-icon">🔥</div>
        <div>
          <div class="cal-summary-val">${streak} days</div>
          <div class="cal-summary-lbl">Streak</div>
        </div>
      </div>
    `;

    const head = wrap.querySelector('.cal-head');
    if (head) head.insertAdjacentElement('afterend', bar);
  }

  /* ═══════════════ FILTERS BAR ═══════════════ */
  function renderFiltersBar() {
    const wrap = document.querySelector('#view-calendar .cal-wrap');
    if (!wrap) return;

    const old = document.getElementById('calFiltersBar');
    if (old) old.remove();

    // Collect unique values
    const subjects = [...new Set(state.sessions.map((s) => s.subject).filter(Boolean))].sort();
    const categories = [...new Set(state.sessions.map((s) => s.category).filter(Boolean))].sort();
    const types = [...new Set(state.sessions.map((s) => s.study_type).filter(Boolean))].sort();

    const bar = document.createElement('div');
    bar.id = 'calFiltersBar';
    bar.className = 'cal-filters-bar';

    const renderChip = (label, key, value, isActive) => {
      return `<button class="cal-filter-chip ${isActive ? 'active' : ''}" data-filter="${key}" data-value="${value}">
        ${label}${isActive ? ' ✕' : ''}
      </button>`;
    };

    let html = '';

    // Subject filter
    if (subjects.length) {
      if (FILTERS.subject) {
        html += renderChip(`📚 ${FILTERS.subject}`, 'subject', FILTERS.subject, true);
      } else {
        html += `<select class="cal-filter-chip" id="calFilterSubject" style="padding-right:24px;cursor:pointer">
          <option value="">📚 All Subjects</option>
          ${subjects.map((s) => `<option value="${s}">${s}</option>`).join('')}
        </select>`;
      }
    }

    // Category filter
    if (categories.length) {
      if (FILTERS.category) {
        html += renderChip(
          `🎯 ${CAT_LABELS[FILTERS.category] || FILTERS.category}`,
          'category',
          FILTERS.category,
          true,
        );
      } else {
        html += `<select class="cal-filter-chip" id="calFilterCategory" style="padding-right:24px;cursor:pointer">
          <option value="">🎯 All Categories</option>
          ${categories.map((c) => `<option value="${c}">${CAT_LABELS[c] || c}</option>`).join('')}
        </select>`;
      }
    }

    // Type filter
    if (types.length) {
      if (FILTERS.type) {
        html += renderChip(`📝 ${FILTERS.type}`, 'type', FILTERS.type, true);
      } else {
        html += `<select class="cal-filter-chip" id="calFilterType" style="padding-right:24px;cursor:pointer">
          <option value="">📝 All Types</option>
          ${types.map((t) => `<option value="${t}">${t}</option>`).join('')}
        </select>`;
      }
    }

    // Min hours
    if (FILTERS.minHours > 0) {
      html += renderChip(`⏱ ${FILTERS.minHours}h+`, 'minHours', FILTERS.minHours, true);
    } else {
      html += `<select class="cal-filter-chip" id="calFilterMinHours" style="padding-right:24px;cursor:pointer">
        <option value="0">⏱ Any Duration</option>
        <option value="1">1h+</option>
        <option value="2">2h+</option>
        <option value="3">3h+</option>
        <option value="5">5h+</option>
        <option value="8">8h+</option>
      </select>`;
    }

    // Clear button
    if (isFilterActive()) {
      html += `<button class="cal-filter-clear" id="calClearFilters">✕ Clear Filters</button>`;
    }

    bar.innerHTML = html;

    const head = wrap.querySelector('.cal-head');
    const summaryBar = document.getElementById('calSummaryBar');
    if (summaryBar) summaryBar.insertAdjacentElement('afterend', bar);
    else if (head) head.insertAdjacentElement('afterend', bar);

    // Wire events
    const selSubject = document.getElementById('calFilterSubject');
    const selCategory = document.getElementById('calFilterCategory');
    const selType = document.getElementById('calFilterType');
    const selMinHours = document.getElementById('calFilterMinHours');

    if (selSubject) {
      selSubject.value = FILTERS.subject;
      selSubject.onchange = () => {
        FILTERS.subject = selSubject.value;
        saveFilters();
        renderCalendar();
      };
    }
    if (selCategory) {
      selCategory.value = FILTERS.category;
      selCategory.onchange = () => {
        FILTERS.category = selCategory.value;
        saveFilters();
        renderCalendar();
      };
    }
    if (selType) {
      selType.value = FILTERS.type;
      selType.onchange = () => {
        FILTERS.type = selType.value;
        saveFilters();
        renderCalendar();
      };
    }
    if (selMinHours) {
      selMinHours.value = String(FILTERS.minHours);
      selMinHours.onchange = () => {
        FILTERS.minHours = parseFloat(selMinHours.value) || 0;
        saveFilters();
        renderCalendar();
      };
    }

    // Chips (active filters) — click to remove
    bar.querySelectorAll('[data-filter]').forEach((chip) => {
      chip.onclick = () => {
        const k = chip.dataset.filter;
        if (k === 'minHours') FILTERS[k] = 0;
        else FILTERS[k] = '';
        saveFilters();
        renderCalendar();
      };
    });

    const clearBtn = document.getElementById('calClearFilters');
    if (clearBtn) {
      clearBtn.onclick = () => {
        FILTERS.subject = '';
        FILTERS.category = '';
        FILTERS.type = '';
        FILTERS.minHours = 0;
        saveFilters();
        renderCalendar();
      };
    }
  }

  /* ═══════════════ LEGEND ═══════════════ */
  function renderLegend() {
    const wrap = document.querySelector('#view-calendar .cal-wrap');
    if (!wrap) return;

    const old = document.getElementById('calLegend');
    if (old) old.remove();

    const legend = document.createElement('div');
    legend.id = 'calLegend';
    legend.className = 'cal-legend';
    legend.innerHTML = `
      <span style="font-weight:800;margin-right:6px">Heat Map:</span>
      ${HEAT_LEVELS.map(
        (h) => `
        <span class="cal-legend-swatch">
          <span class="cal-legend-box" style="background:${h.color.startsWith('linear') ? h.color : h.color}"></span>
          <span>${h.label}</span>
        </span>
      `,
      ).join('')}
      <span style="margin-left:auto;font-size:.7rem">💡 Right-click any day for more actions</span>
    `;

    // Insert after cal-grid or week-view
    const weekView = document.getElementById('calWeekView');
    const grid = document.getElementById('calGrid');
    const target = weekView && weekView.style.display !== 'none' ? weekView : grid;
    if (target) target.insertAdjacentElement('afterend', legend);
  }

  /* ═══════════════ MARKER HELPERS ═══════════════ */
  function getRevisionsDueOn(key) {
    return state.revisions.filter((r) => r.status === 'pending' && r.due_date === key);
  }
  function getGoalsDueOn(key) {
    return state.goals.filter((g) => {
      if (!g.deadline) return false;
      const d = g.deadline.slice(0, 10);
      return d === key && g.current < g.target;
    });
  }
  function getMockScheduledOn(key) {
    return (state.mocks || []).filter((m) => m.date === key && m.scheduled);
  }

  function buildMarkersHTML(key) {
    const revs = getRevisionsDueOn(key);
    const goals = getGoalsDueOn(key);
    let html = '';
    if (revs.length) {
      html += `<span class="cal-day-marker" style="background:#A855F7;color:#A855F7" title="${revs.length} revision(s) due"></span>`;
    }
    if (goals.length) {
      html += `<span class="cal-day-marker" style="background:#FBBF24;color:#FBBF24" title="${goals.length} goal(s) due"></span>`;
    }
    return html ? `<div class="cal-day-markers">${html}</div>` : '';
  }

  /* ═══════════════ MONTH VIEW ═══════════════ */
  function renderMonthView() {
    const titleEl = document.getElementById('calTitle');
    if (titleEl) titleEl.textContent = myCalMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const y = myCalMonth.getFullYear();
    const m = myCalMonth.getMonth();
    const firstDay = new Date(y, m, 1);
    const startDay = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const grid = document.getElementById('calGrid');
    if (!grid) return;

    const dows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let html = dows.map((d) => `<div class="cal-dow">${d}</div>`).join('');

    const prevEnd = new Date(y, m, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) html += renderMonthDay(new Date(y, m - 1, prevEnd - i), true);
    for (let d = 1; d <= daysInMonth; d++) html += renderMonthDay(new Date(y, m, d), false);
    const remaining = (7 - ((startDay + daysInMonth) % 7)) % 7;
    for (let i = 1; i <= remaining; i++) html += renderMonthDay(new Date(y, m + 1, i), true);

    grid.innerHTML = html;
    grid.style.display = 'grid';

    // Hide week view
    const wv = document.getElementById('calWeekView');
    if (wv) wv.remove();

    wireDayClicks(grid);
  }

  function renderMonthDay(dt, otherMonth) {
    const key = dateKey(dt);
    const sec = secondsOnDateFiltered(key);
    const hrs = sec / 3600;
    const level = hrs >= 8 ? 4 : hrs >= 5 ? 3 : hrs >= 3 ? 2 : hrs >= 1 ? 1 : 0;
    const isToday = key === todayKey();
    const rest = isRestDay(key);
    const sessions = state.sessions.filter((s) => s.date === key);
    const dots = [...new Set(sessions.map((s) => s.subject))]
      .slice(0, 4)
      .map((subj) => `<span class="cal-day-dot" style="background:${getSubjectColor(subj)}"></span>`)
      .join('');
    const markersHTML = buildMarkersHTML(key);

    return `<div class="cal-day ${otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${rest ? 'rest-day' : ''}" 
              data-l="${level}" data-cal-day="${key}" style="position:relative">
      <div class="cal-day-num">${dt.getDate()}</div>
      <div class="cal-day-dots">${dots}</div>
      ${sec ? `<div class="cal-day-time">${fmtDuration(sec)}</div>` : ''}
      ${markersHTML}
    </div>`;
  }

  function wireDayClicks(grid) {
    grid.querySelectorAll('[data-cal-day]').forEach((el) => {
      el.onclick = () => window.openDayDetail(el.dataset.calDay);
      el.oncontextmenu = (e) => {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY, el.dataset.calDay);
      };
    });
    if (typeof attachRipples === 'function') attachRipples();
  }

  /* ═══════════════ WEEK VIEW ═══════════════ */
  function renderWeekView() {
    if (!myWeekStart) myWeekStart = startOfWeek(new Date());

    const weekEnd = addDays(myWeekStart, 6);
    const titleEl = document.getElementById('calTitle');
    if (titleEl) {
      titleEl.textContent = `${myWeekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }

    const grid = document.getElementById('calGrid');
    if (grid) grid.style.display = 'none';

    // Remove old
    const old = document.getElementById('calWeekView');
    if (old) old.remove();

    const wrap = document.querySelector('#view-calendar .cal-wrap');
    if (!wrap) return;

    const dows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayK = todayKey();

    const colsHTML = [];
    for (let i = 0; i < 7; i++) {
      const dt = addDays(myWeekStart, i);
      const key = dateKey(dt);
      const isToday = key === todayK;
      const rest = isRestDay(key);
      const sessions = getFilteredSessions()
        .filter((s) => s.date === key)
        .sort((a, b) => (a.start_time || 0) - (b.start_time || 0));
      const totalSec = sessions.reduce((a, x) => a + (x.duration || 0), 0);

      const sessionsHTML = sessions
        .map((s) => {
          const color = getSubjectColor(s.subject);
          const timeStr = s.start_time
            ? new Date(s.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '';
          return `<div class="cal-week-session" style="border-left-color:${color}" data-session-id="${s.id}" title="${s.subject}${s.topic ? ' · ' + s.topic : ''}">
            <div>${s.subject.slice(0, 20)}${s.subject.length > 20 ? '…' : ''}</div>
            <div class="cal-week-time">${timeStr} · ${fmtDuration(s.duration)}</div>
          </div>`;
        })
        .join('');

      colsHTML.push(`
        <div class="cal-week-col ${isToday ? 'today' : ''} ${rest ? 'rest-day' : ''}" style="position:relative">
          <div class="cal-week-head">
            <div class="cal-week-dow">${dows[i]}</div>
            <div class="cal-week-num">${dt.getDate()}</div>
            <div class="cal-week-total">${totalSec ? fmtDuration(totalSec) : '—'}</div>
          </div>
          <div class="cal-week-sessions">
            ${sessionsHTML || '<div style="text-align:center;font-size:.7rem;color:var(--text-3);padding:10px 0">—</div>'}
          </div>
        </div>
      `);
    }

    const wv = document.createElement('div');
    wv.id = 'calWeekView';
    wv.className = 'cal-week-view';
    wv.innerHTML = colsHTML.join('');

    grid.insertAdjacentElement('afterend', wv);

    // Session clicks
    wv.querySelectorAll('[data-session-id]').forEach((el) => {
      el.onclick = () => {
        const s = state.sessions.find((x) => x.id === el.dataset.sessionId);
        if (s) showSessionDetail(s);
      };
    });

    // Day header clicks
    wv.querySelectorAll('.cal-week-col').forEach((col, i) => {
      const dt = addDays(myWeekStart, i);
      col.querySelector('.cal-week-head').onclick = () => window.openDayDetail(dateKey(dt));
    });
  }

  /* ═══════════════ CONTEXT MENU ═══════════════ */
  function showContextMenu(x, y, key) {
    // Remove existing
    document.querySelectorAll('.cal-ctx-menu').forEach((el) => el.remove());

    const menu = document.createElement('div');
    menu.className = 'cal-ctx-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    const isRest = isRestDay(key);
    const sec = secondsOnDateFiltered(key);

    menu.innerHTML = `
      <div class="cal-ctx-item" data-action="view">
        <span>👁</span><span>View Day Details</span>
      </div>
      <div class="cal-ctx-item" data-action="add-session">
        <span>⏱</span><span>Log Session</span>
      </div>
      <div class="cal-ctx-item" data-action="rest">
        <span>💤</span><span>${isRest ? 'Remove Rest Day' : 'Mark as Rest Day'}</span>
      </div>
      <div class="cal-ctx-item" data-action="copy">
        <span>📋</span><span>Copy Stats</span>
      </div>
    `;

    document.body.appendChild(menu);

    // Adjust if off-screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = window.innerWidth - rect.width - 10 + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = window.innerHeight - rect.height - 10 + 'px';

    menu.querySelectorAll('[data-action]').forEach((item) => {
      item.onclick = () => {
        const action = item.dataset.action;
        menu.remove();
        if (action === 'view') window.openDayDetail(key);
        else if (action === 'add-session') {
          if (typeof openManualLogModal === 'function') openManualLogModal();
        } else if (action === 'rest') {
          toggleRestDay(key);
          renderCalendar();
        } else if (action === 'copy') {
          const sessions = getFilteredSessions().filter((s) => s.date === key);
          const txt = `📅 ${fmtDate(key)}\n⏱ Total: ${fmtDuration(sec, 'long')}\n📚 Sessions: ${sessions.length}`;
          navigator.clipboard.writeText(txt).then(() => {
            if (typeof toast === 'function') toast('Stats copied!', 'ok');
          });
        }
      };
    });

    // Close on outside click
    const closeHandler = (e) => {
      if (!e.target.closest('.cal-ctx-menu')) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('scroll', closeHandler, true);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
      document.addEventListener('scroll', closeHandler, true);
    }, 50);
  }

  /* ═══════════════ SESSION DETAIL POPUP ═══════════════ */
  function showSessionDetail(s) {
    if (typeof openModal !== 'function' || typeof modalShell !== 'function') return;
    const color = getSubjectColor(s.subject);
    const timeStr = s.start_time
      ? new Date(s.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : '—';

    const body = `
      <div style="padding:16px;background:var(--card-2);border-radius:12px;border-left:4px solid ${color}">
        <div style="font-size:.72rem;font-weight:800;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em">Session Detail</div>
        <div style="font-weight:900;font-size:1.1rem;margin-top:4px">${escapeHTML(s.subject)}</div>
        ${s.topic ? `<div style="font-size:.82rem;color:var(--text-2);margin-top:6px">${escapeHTML(s.topic)}</div>` : ''}
        <div style="display:flex;gap:16px;margin-top:14px;flex-wrap:wrap">
          <div><div style="font-size:.65rem;color:var(--text-3);font-weight:800;text-transform:uppercase">Time</div><div style="font-weight:800">${timeStr}</div></div>
          <div><div style="font-size:.65rem;color:var(--text-3);font-weight:800;text-transform:uppercase">Duration</div><div style="font-weight:800;color:var(--purple)">${fmtDuration(s.duration, 'long')}</div></div>
          <div><div style="font-size:.65rem;color:var(--text-3);font-weight:800;text-transform:uppercase">Type</div><div style="font-weight:800">${escapeHTML(s.study_type || '—')}</div></div>
        </div>
        ${s.notes ? `<div style="margin-top:14px;padding:10px 12px;background:var(--card);border-radius:10px;font-size:.83rem;color:var(--text-2);line-height:1.5">${escapeHTML(s.notes)}</div>` : ''}
      </div>`;

    openModal(
      modalShell({
        title: '📖 Session',
        subtitle: fmtDate(s.date),
        body,
        actions: `<button class="btn btn-secondary" data-close>Close</button>`,
      }),
    );
  }

  function escapeHTML(str) {
    return String(str || '').replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    );
  }

  /* ═══════════════ DAY DETAIL (Enhanced) ═══════════════ */
  function patchOpenDayDetail() {
    const _orig = window.openDayDetail;
    window.openDayDetail = function (key) {
      if (!key) return;

      const sessions = getFilteredSessions()
        .filter((s) => s.date === key)
        .sort((a, b) => (a.start_time || 0) - (b.start_time || 0));
      const totalSec = sessions.reduce((a, x) => a + (x.duration || 0), 0);
      const rest = isRestDay(key);
      const revs = getRevisionsDueOn(key);
      const goals = getGoalsDueOn(key);

      // Subject breakdown
      const bySubject = {};
      sessions.forEach((s) => {
        bySubject[s.subject] = (bySubject[s.subject] || 0) + (s.duration || 0);
      });
      const subjEntries = Object.entries(bySubject).sort((a, b) => b[1] - a[1]);

      const subjHTML = subjEntries.length
        ? subjEntries
            .map(([subj, sec]) => {
              const pct = totalSec ? Math.round((sec / totalSec) * 100) : 0;
              const color = getSubjectColor(subj);
              return `<div style="margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:4px">
                <strong>${escapeHTML(subj)}</strong>
                <span style="color:var(--text-3)">${fmtDuration(sec)} · ${pct}%</span>
              </div>
              <div style="height:5px;background:var(--card-2);border-radius:20px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${color};border-radius:20px"></div>
              </div>
            </div>`;
            })
            .join('')
        : '<div style="text-align:center;color:var(--text-3);font-size:.85rem;padding:10px">No sessions this day</div>';

      const sessionsHTML = sessions.length
        ? sessions
            .map((s) => {
              const color = getSubjectColor(s.subject);
              const timeStr = s.start_time
                ? new Date(s.start_time).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                : '';
              return `<div class="row-item" style="cursor:pointer;padding:11px 13px;margin-bottom:6px" data-sid="${s.id}">
              <span class="row-dot" style="background:${color}"></span>
              <div class="row-info">
                <div class="row-title" style="font-size:.85rem">${escapeHTML(s.subject)}${s.topic ? ' · ' + escapeHTML(s.topic.slice(0, 50)) : ''}</div>
                <div class="row-meta">${timeStr} · ${escapeHTML(s.study_type || '')}</div>
              </div>
              <span class="row-value">${fmtDuration(s.duration)}</span>
            </div>`;
            })
            .join('')
        : '<div class="empty" style="padding:20px"><p>No sessions</p></div>';

      const body = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          <div style="padding:12px;background:var(--card-2);border-radius:10px;text-align:center">
            <div style="font-size:.65rem;color:var(--text-3);font-weight:800;text-transform:uppercase;letter-spacing:.08em">Total</div>
            <div style="font-size:1.4rem;font-weight:900;background:var(--grad-1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${fmtDuration(totalSec, 'long')}</div>
          </div>
          <div style="padding:12px;background:var(--card-2);border-radius:10px;text-align:center">
            <div style="font-size:.65rem;color:var(--text-3);font-weight:800;text-transform:uppercase;letter-spacing:.08em">Sessions</div>
            <div style="font-size:1.4rem;font-weight:900">${sessions.length}</div>
          </div>
        </div>

        ${rest ? '<div style="padding:10px 12px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:10px;font-size:.82rem;color:#93C5FD;text-align:center;margin-bottom:14px">💤 Marked as Rest Day</div>' : ''}

        ${
          revs.length
            ? `
          <div style="padding:12px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.3);border-radius:10px;margin-bottom:14px">
            <div style="font-size:.72rem;font-weight:800;color:#C4B5FD;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">📖 Revision Due (${revs.length})</div>
            ${revs.map((r) => `<div style="font-size:.82rem;padding:4px 0">• ${escapeHTML(r.topic || r.subject)}</div>`).join('')}
          </div>
        `
            : ''
        }

        ${
          goals.length
            ? `
          <div style="padding:12px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.3);border-radius:10px;margin-bottom:14px">
            <div style="font-size:.72rem;font-weight:800;color:#FBBF24;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">🎯 Goals Due (${goals.length})</div>
            ${goals.map((g) => `<div style="font-size:.82rem;padding:4px 0">• ${escapeHTML(g.title)}</div>`).join('')}
          </div>
        `
            : ''
        }

        ${
          subjEntries.length
            ? `
          <div style="margin-bottom:14px">
            <div style="font-size:.72rem;font-weight:800;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Subject Breakdown</div>
            ${subjHTML}
          </div>
        `
            : ''
        }

        <div>
          <div style="font-size:.72rem;font-weight:800;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Timeline</div>
          ${sessionsHTML}
        </div>`;

      openModal(
        modalShell({
          title: fmtDate(key, { weekday: true }),
          body,
          actions: `
            <button class="btn btn-secondary" data-close>Close</button>
            ${rest ? `<button class="btn btn-primary" id="calCtxRemoveRest">✕ Remove Rest Day</button>` : `<button class="btn btn-primary" id="calCtxAddRest">💤 Mark Rest Day</button>`}
          `,
        }),
        {
          onMount() {
            const addRest = document.getElementById('calCtxAddRest');
            const remRest = document.getElementById('calCtxRemoveRest');
            if (addRest) {
              addRest.onclick = () => {
                toggleRestDay(key);
                if (typeof closeModal === 'function') closeModal();
                renderCalendar();
              };
            }
            if (remRest) {
              remRest.onclick = () => {
                toggleRestDay(key);
                if (typeof closeModal === 'function') closeModal();
                renderCalendar();
              };
            }

            // Session clicks
            document.querySelectorAll('[data-sid]').forEach((el) => {
              el.onclick = () => {
                const s = state.sessions.find((x) => x.id === el.dataset.sid);
                if (s) {
                  if (typeof closeModal === 'function') closeModal();
                  setTimeout(() => showSessionDetail(s), 150);
                }
              };
            });
          },
        },
      );
    };
    try {
      openDayDetail = window.openDayDetail;
    } catch (e) {}
    console.log('[calendar-extras] patched: openDayDetail');
  }

  /* ═══════════════ VIEW TOGGLE BUTTON ═══════════════ */
  function addViewToggle() {
    const head = document.querySelector('#view-calendar .cal-head');
    if (!head) return;

    const old = document.getElementById('calViewToggle');
    if (old) old.remove();

    const wrap = document.createElement('div');
    wrap.id = 'calViewToggle';
    wrap.style.cssText =
      'display:flex;gap:4px;background:var(--card-2);padding:4px;border-radius:10px;border:1px solid var(--border)';
    wrap.innerHTML = `
      <button class="chart-tab ${currentView === 'month' ? 'active' : ''}" data-view="month" style="padding:6px 14px;font-size:.78rem;border-radius:7px">📅 Month</button>
      <button class="chart-tab ${currentView === 'week' ? 'active' : ''}" data-view="week" style="padding:6px 14px;font-size:.78rem;border-radius:7px">📊 Week</button>
    `;

    const addBtn = document.getElementById('calAddBtn');
    if (addBtn) addBtn.insertAdjacentElement('beforebegin', wrap);
    else head.appendChild(wrap);

    wrap.querySelectorAll('[data-view]').forEach((b) => {
      b.onclick = () => {
        currentView = b.dataset.view;
        localStorage.setItem('upsc_cal_view', currentView);
        wrap
          .querySelectorAll('[data-view]')
          .forEach((x) => x.classList.toggle('active', x.dataset.view === currentView));
        renderCalendar();
      };
    });
  }

  /* ═══════════════ NAV WIRING ═══════════════ */
  function wireNav() {
    const prev = document.getElementById('calPrev');
    const next = document.getElementById('calNext');
    const today = document.getElementById('calToday');

    if (prev) {
      prev.onclick = () => {
        if (currentView === 'week') {
          myWeekStart = addDays(myWeekStart || startOfWeek(new Date()), -7);
        } else {
          myCalMonth.setMonth(myCalMonth.getMonth() - 1);
        }
        renderCalendar();
      };
    }
    if (next) {
      next.onclick = () => {
        if (currentView === 'week') {
          myWeekStart = addDays(myWeekStart || startOfWeek(new Date()), 7);
        } else {
          myCalMonth.setMonth(myCalMonth.getMonth() + 1);
        }
        renderCalendar();
      };
    }
    if (today) {
      today.onclick = () => {
        myCalMonth = new Date();
        myWeekStart = startOfWeek(new Date());
        renderCalendar();
      };
    }
  }

  /* ═══════════════ MAIN RENDER OVERRIDE ═══════════════ */
  function patchRenderCalendar() {
    window.renderCalendar = function () {
      console.log('[calendar-extras] renderCalendar, view =', currentView);
      injectCSS();
      wireNav();
      addViewToggle();
      renderSummaryBar();
      renderFiltersBar();
      if (currentView === 'week') {
        renderWeekView();
      } else {
        renderMonthView();
      }
      renderLegend();
      if (typeof attachRipples === 'function') attachRipples();
    };
    try {
      renderCalendar = window.renderCalendar;
    } catch (e) {}
    console.log('[calendar-extras] patched: renderCalendar');
  }

  /* ═══════════════ INIT ═══════════════ */
  function appReady() {
    try {
      return (
        typeof renderCalendar === 'function' &&
        typeof state === 'object' &&
        state !== null &&
        document.querySelector('#view-calendar')
      );
    } catch (e) {
      return false;
    }
  }

  let attempts = 0;
  function waitThenStart() {
    if (appReady()) {
      patchRenderCalendar();
      patchOpenDayDetail();
      console.log('[calendar-extras] ✅ patched all');
    } else {
      attempts++;
      if (attempts > 200) {
        console.error('[calendar-extras] timeout');
        return;
      }
      setTimeout(waitThenStart, 50);
    }
  }

  waitThenStart();
})();
