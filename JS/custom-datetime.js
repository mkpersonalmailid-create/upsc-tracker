/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Custom Date & Time Picker v1
   ─────────────────────────────────────────────────────────────
   ✅ Replaces native date/time inputs with custom UI
   ✅ Matches website design (Inter font, purple gradient, rounded)
   ✅ Dark + Light theme support
   ✅ Works with existing code (value sync + change events)
   ✅ Handles dynamically added inputs (MutationObserver)
   ✅ Custom calendar (not native popup)
   ✅ Custom iOS-style time wheel
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[custom-datetime] v1 loaded');

  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DOWS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  /* ═══════════════ Helpers ═══════════════ */
  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function escHtml(s) {
    return String(s || '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  function formatDateDisplay(val) {
    if (!val) return 'Select date';
    const [y, m, d] = val.split('-').map(Number);
    if (!y || !m || !d) return 'Select date';
    return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
  }

  function formatTimeDisplay(val) {
    if (!val) return 'Select time';
    const [h, m] = val.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return 'Select time';
    const ap = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${pad(hr)}:${pad(m)} ${ap}`;
  }

  function toDateKey(y, m, d) {
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    if (document.getElementById('cdtCSS')) return;
    const style = document.createElement('style');
    style.id = 'cdtCSS';
    style.textContent = `
      .cdt-wrap {
        position: relative;
        width: 100%;
        font-family: inherit;
      }
      .cdt-wrap > input.cdt-native-hidden {
        position: absolute !important;
        width: 1px !important; height: 1px !important;
        padding: 0 !important; margin: -1px !important;
        overflow: hidden !important; clip: rect(0,0,0,0) !important;
        border: 0 !important; opacity: 0 !important;
        pointer-events: none !important;
      }

      .cdt-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 14px;
        background: var(--bg-2);
        border: 1.5px solid var(--border);
        border-radius: 11px;
        font-size: 0.9rem;
        color: var(--text);
        font-family: inherit;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.32,0.72,0,1);
        min-height: 44px;
      }
      .cdt-trigger:hover {
        border-color: var(--border-2);
        background: var(--card);
      }
      .cdt-wrap.cdt-open .cdt-trigger,
      .cdt-trigger:focus-visible {
        outline: none;
        border-color: var(--purple);
        box-shadow: 0 0 0 4px rgba(168,85,247,0.15);
        background: var(--card);
      }
      .cdt-value {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--text);
        font-weight: 600;
      }
      .cdt-value.cdt-placeholder {
        color: var(--text-3);
        font-weight: 400;
      }
      .cdt-icon {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        color: var(--purple);
      }

      /* ═══ Panel ═══ */
      .cdt-panel {
        position: fixed;
        z-index: 99999;
        background: linear-gradient(180deg, var(--card), var(--card-2));
        border: 1.5px solid var(--border-2);
        border-radius: 16px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 60px rgba(168,85,247,0.2);
        padding: 16px;
        opacity: 0;
        transform: translateY(-6px) scale(0.98);
        pointer-events: none;
        transition: opacity 0.2s cubic-bezier(0.32,0.72,0,1), transform 0.2s cubic-bezier(0.32,0.72,0,1);
        font-family: inherit;
        color: var(--text);
      }
      .cdt-panel.cdt-open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      /* ═══ Calendar ═══ */
      .cdt-cal {
        width: 300px;
      }
      .cdt-cal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
        gap: 8px;
      }
      .cdt-cal-title {
        flex: 1;
        text-align: center;
        font-weight: 800;
        font-size: 0.95rem;
        letter-spacing: -0.01em;
        color: var(--text);
      }
      .cdt-nav {
        width: 32px;
        height: 32px;
        border-radius: 9px;
        background: var(--card-2);
        border: 1px solid var(--border);
        color: var(--text-2);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9rem;
        flex-shrink: 0;
      }
      .cdt-nav:hover {
        background: var(--grad-1);
        color: #fff;
        border-color: transparent;
        transform: scale(1.05);
      }
      .cdt-cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }
      .cdt-dow {
        text-align: center;
        font-size: 0.68rem;
        font-weight: 800;
        color: var(--text-3);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 6px 0 10px;
      }
      .cdt-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 9px;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-2);
        cursor: pointer;
        transition: all 0.15s;
        position: relative;
        background: transparent;
        border: none;
        font-family: inherit;
      }
      .cdt-day:hover {
        background: var(--card-2);
        color: var(--text);
      }
      .cdt-day.other {
        color: var(--text-3);
        opacity: 0.4;
      }
      .cdt-day.today {
        color: var(--pink);
        font-weight: 900;
      }
      .cdt-day.today::after {
        content: '';
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--pink);
      }
      .cdt-day.selected {
        background: var(--grad-1);
        color: #fff;
        font-weight: 900;
        box-shadow: 0 4px 14px rgba(168,85,247,0.4);
      }
      .cdt-day.selected.today::after {
        background: #fff;
      }
      .cdt-cal-foot {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--border);
      }
      .cdt-cal-foot button {
        padding: 7px 14px;
        border-radius: 9px;
        font-size: 0.78rem;
        font-weight: 800;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid var(--border);
        background: var(--card-2);
        color: var(--text-2);
      }
      .cdt-cal-foot button:hover {
        background: var(--card);
        color: var(--text);
        border-color: var(--border-2);
      }
      .cdt-cal-foot button.primary {
        background: var(--grad-1);
        color: #fff;
        border-color: transparent;
      }
      .cdt-cal-foot button.primary:hover {
        filter: brightness(1.1);
      }

      /* ═══ Time Picker ═══ */
      .cdt-time {
        width: 260px;
      }
      .cdt-time-head {
        text-align: center;
        font-weight: 800;
        font-size: 0.78rem;
        color: var(--text-3);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 12px;
      }
      .cdt-time-cols {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 6px;
        position: relative;
      }
      .cdt-time-cols::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 8px;
        right: 8px;
        height: 36px;
        transform: translateY(-50%);
        background: linear-gradient(135deg, rgba(139,92,246,0.18), rgba(236,72,153,0.1));
        border: 1px solid rgba(168,85,247,0.3);
        border-radius: 10px;
        pointer-events: none;
        z-index: 0;
      }
      .cdt-time-col {
        height: 200px;
        overflow-y: auto;
        scroll-snap-type: y mandatory;
        scrollbar-width: none;
        padding: 82px 0;
        position: relative;
        z-index: 1;
      }
      .cdt-time-col::-webkit-scrollbar { display: none; }
      .cdt-time-item {
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-3);
        scroll-snap-align: center;
        cursor: pointer;
        transition: color 0.15s, transform 0.15s;
        font-family: 'JetBrains Mono', monospace;
      }
      .cdt-time-item.active {
        color: var(--text);
        font-weight: 900;
        transform: scale(1.05);
      }
      .cdt-time-item:hover {
        color: var(--text-2);
      }
      .cdt-time-foot {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--border);
      }
      .cdt-time-foot button {
        padding: 8px 18px;
        border-radius: 10px;
        font-size: 0.82rem;
        font-weight: 800;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid var(--border);
        background: var(--card-2);
        color: var(--text-2);
      }
      .cdt-time-foot button:hover {
        background: var(--card);
        color: var(--text);
        border-color: var(--border-2);
      }
      .cdt-time-foot button.primary {
        background: var(--grad-1);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 6px 20px rgba(168,85,247,0.4);
      }
      .cdt-time-foot button.primary:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
      }

      /* ═══ Scroll lock ═══ */
      body.cdt-scroll-locked #content { overflow: hidden !important; }
      body.cdt-scroll-locked { overflow: hidden !important; }

      /* ═══ Light theme ═══ */
      html[data-theme='light'] .cdt-trigger { background: #fff; border-color: #e5dbf5; }
      html[data-theme='light'] .cdt-trigger:hover { background: #f8f4ff; border-color: #c9b8e8; }
      html[data-theme='light'] .cdt-panel {
        background: #fff;
        border-color: #c9b8e8;
        box-shadow: 0 24px 60px rgba(139,92,246,0.18), 0 0 40px rgba(139,92,246,0.1);
      }
      html[data-theme='light'] .cdt-nav { background: #f3edfb; border-color: #e5dbf5; }
      html[data-theme='light'] .cdt-day:hover { background: #f3edfb; }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════ Scroll Lock ═══════════════ */
  function lockScroll() {
    document.body.classList.add('cdt-scroll-locked');
    const c = document.getElementById('content');
    if (c) {
      c.dataset.cdtPrev = c.style.overflow || '';
      c.style.overflow = 'hidden';
    }
  }
  function unlockScroll() {
    document.body.classList.remove('cdt-scroll-locked');
    const c = document.getElementById('content');
    if (c) {
      c.style.overflow = c.dataset.cdtPrev || '';
      delete c.dataset.cdtPrev;
    }
  }

  /* ═══════════════ Date Picker ═══════════════ */
  function convertDateInput(input) {
    if (input.dataset.cdtInit === '1') return;
    if (input.type !== 'date') return;
    input.dataset.cdtInit = '1';

    const wrap = document.createElement('div');
    wrap.className = 'cdt-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.classList.add('cdt-native-hidden');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cdt-trigger';
    trigger.innerHTML = `
      <span class="cdt-value"></span>
      <svg class="cdt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    `;
    wrap.appendChild(trigger);

    const valueEl = trigger.querySelector('.cdt-value');

    function updateTrigger() {
      if (input.value) {
        valueEl.textContent = formatDateDisplay(input.value);
        valueEl.classList.remove('cdt-placeholder');
      } else {
        valueEl.textContent = 'Select date';
        valueEl.classList.add('cdt-placeholder');
      }
    }
    updateTrigger();

    const panel = document.createElement('div');
    panel.className = 'cdt-panel';
    document.body.appendChild(panel);

    let isOpen = false;
    let viewDate = new Date();

    function parseCurrent() {
      if (input.value) {
        const [y, m, d] = input.value.split('-').map(Number);
        if (y && m && d) return { y, m, d };
      }
      return null;
    }

    function buildCalendar() {
      const y = viewDate.getFullYear();
      const m = viewDate.getMonth() + 1;
      const cur = parseCurrent();
      const today = new Date();
      const todayKey = toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

      const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(y, m, 0).getDate();
      const prevMonthDays = new Date(y, m - 1, 0).getDate();

      let cells = '';
      for (let i = 0; i < firstDow; i++) {
        const d = prevMonthDays - firstDow + i + 1;
        const pm = m === 1 ? 12 : m - 1;
        const py = m === 1 ? y - 1 : y;
        cells += `<button type="button" class="cdt-day other" data-key="${toDateKey(py, pm, d)}" data-other="1">${d}</button>`;
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const key = toDateKey(y, m, d);
        const classes = ['cdt-day'];
        if (key === todayKey) classes.push('today');
        if (cur && key === toDateKey(cur.y, cur.m, cur.d)) classes.push('selected');
        cells += `<button type="button" class="${classes.join(' ')}" data-key="${key}">${d}</button>`;
      }
      const total = firstDow + daysInMonth;
      const remaining = (7 - (total % 7)) % 7;
      for (let i = 1; i <= remaining; i++) {
        const nm = m === 12 ? 1 : m + 1;
        const ny = m === 12 ? y + 1 : y;
        cells += `<button type="button" class="cdt-day other" data-key="${toDateKey(ny, nm, i)}" data-other="1">${i}</button>`;
      }

      panel.innerHTML = `
        <div class="cdt-cal">
          <div class="cdt-cal-head">
            <button type="button" class="cdt-nav" data-nav="-1">‹</button>
            <div class="cdt-cal-title">${MONTHS[m - 1]} ${y}</div>
            <button type="button" class="cdt-nav" data-nav="1">›</button>
          </div>
          <div class="cdt-cal-grid">
            ${DOWS.map((d) => `<div class="cdt-dow">${d}</div>`).join('')}
            ${cells}
          </div>
          <div class="cdt-cal-foot">
            <button type="button" data-action="clear">Clear</button>
            <button type="button" data-action="today" class="primary">Today</button>
          </div>
        </div>
      `;

      panel.querySelectorAll('[data-nav]').forEach((btn) => {
        btn.onclick = () => {
          viewDate.setMonth(viewDate.getMonth() + parseInt(btn.dataset.nav, 10));
          buildCalendar();
        };
      });

      panel.querySelectorAll('[data-key]').forEach((btn) => {
        btn.onclick = () => {
          input.value = btn.dataset.key;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
          updateTrigger();
          close();
        };
      });

      const clearBtn = panel.querySelector('[data-action="clear"]');
      if (clearBtn) {
        clearBtn.onclick = () => {
          input.value = '';
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
          updateTrigger();
          close();
        };
      }
      const todayBtn = panel.querySelector('[data-action="today"]');
      if (todayBtn) {
        todayBtn.onclick = () => {
          const t = new Date();
          const key = toDateKey(t.getFullYear(), t.getMonth() + 1, t.getDate());
          input.value = key;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
          updateTrigger();
          close();
        };
      }
    }

    function position() {
      const r = trigger.getBoundingClientRect();
      const pw = 332;
      const ph = 400;
      panel.style.width = pw + 'px';
      let left = r.left;
      if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
      if (left < 12) left = 12;
      panel.style.left = left + 'px';
      if (window.innerHeight - r.bottom < ph + 20 && r.top > window.innerHeight - r.bottom) {
        panel.style.top = 'auto';
        panel.style.bottom = window.innerHeight - r.top + 6 + 'px';
      } else {
        panel.style.top = r.bottom + 6 + 'px';
        panel.style.bottom = 'auto';
      }
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      const cur = parseCurrent();
      viewDate = cur ? new Date(cur.y, cur.m - 1, 1) : new Date();
      buildCalendar();
      wrap.classList.add('cdt-open');
      panel.classList.add('cdt-open');
      position();
      lockScroll();
    }
    function close() {
      if (!isOpen) return;
      isOpen = false;
      wrap.classList.remove('cdt-open');
      panel.classList.remove('cdt-open');
      unlockScroll();
    }

    trigger.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      isOpen ? close() : open();
    };

    document.addEventListener(
      'click',
      (e) => {
        if (!isOpen) return;
        if (wrap.contains(e.target) || panel.contains(e.target)) return;
        close();
      },
      true,
    );

    document.addEventListener('keydown', (e) => {
      if (isOpen && e.key === 'Escape') {
        close();
        trigger.focus();
      }
    });

    const obs = new MutationObserver(updateTrigger);
    obs.observe(input, { attributes: true, attributeFilter: ['value'] });

    setInterval(() => {
      if (input.value !== valueEl.dataset.last) {
        valueEl.dataset.last = input.value;
        updateTrigger();
      }
    }, 300);
  }

  /* ═══════════════ Time Picker ═══════════════ */
  function convertTimeInput(input) {
    if (input.dataset.cdtInit === '1') return;
    if (input.type !== 'time') return;
    input.dataset.cdtInit = '1';

    const wrap = document.createElement('div');
    wrap.className = 'cdt-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.classList.add('cdt-native-hidden');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cdt-trigger';
    trigger.innerHTML = `
      <span class="cdt-value"></span>
      <svg class="cdt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    `;
    wrap.appendChild(trigger);
    const valueEl = trigger.querySelector('.cdt-value');

    function updateTrigger() {
      if (input.value) {
        valueEl.textContent = formatTimeDisplay(input.value);
        valueEl.classList.remove('cdt-placeholder');
      } else {
        valueEl.textContent = 'Select time';
        valueEl.classList.add('cdt-placeholder');
      }
    }
    updateTrigger();

    const panel = document.createElement('div');
    panel.className = 'cdt-panel';
    document.body.appendChild(panel);

    let isOpen = false;
    let h24 = 0,
      mm = 0;

    function parseVal() {
      if (input.value) {
        const [h, m] = input.value.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          h24 = h;
          mm = m;
          return;
        }
      }
      const n = new Date();
      h24 = n.getHours();
      mm = Math.round(n.getMinutes() / 5) * 5;
      if (mm >= 60) {
        mm = 0;
        h24 = (h24 + 1) % 24;
      }
    }

    function buildTime() {
      const hours12 = [];
      for (let i = 1; i <= 12; i++) hours12.push(i);
      const minutes = [];
      for (let i = 0; i < 60; i += 5) minutes.push(i);
      const ampm = ['AM', 'PM'];

      const curH12 = h24 % 12 || 12;
      const curAP = h24 >= 12 ? 'PM' : 'AM';

      panel.innerHTML = `
        <div class="cdt-time">
          <div class="cdt-time-head">Select Time</div>
          <div class="cdt-time-cols">
            <div class="cdt-time-col" data-col="h">
              ${hours12.map((v) => `<div class="cdt-time-item ${v === curH12 ? 'active' : ''}" data-h="${v}">${pad(v)}</div>`).join('')}
            </div>
            <div class="cdt-time-col" data-col="m">
              ${minutes.map((v) => `<div class="cdt-time-item ${v === mm ? 'active' : ''}" data-m="${v}">${pad(v)}</div>`).join('')}
            </div>
            <div class="cdt-time-col" data-col="ap">
              ${ampm.map((v) => `<div class="cdt-time-item ${v === curAP ? 'active' : ''}" data-ap="${v}">${v}</div>`).join('')}
            </div>
          </div>
          <div class="cdt-time-foot">
            <button type="button" data-action="cancel">Cancel</button>
            <button type="button" data-action="set" class="primary">Set</button>
          </div>
        </div>
      `;

      // Scroll to active
      panel.querySelectorAll('.cdt-time-col').forEach((col) => {
        const active = col.querySelector('.cdt-time-item.active');
        if (active) {
          const scroll = active.offsetTop - col.clientHeight / 2 + active.offsetHeight / 2;
          col.scrollTop = scroll;
        }
      });

      // Click handlers
      panel.querySelectorAll('.cdt-time-item').forEach((el) => {
        el.onclick = () => {
          const col = el.parentElement.dataset.col;
          el.parentElement.querySelectorAll('.cdt-time-item').forEach((x) => x.classList.remove('active'));
          el.classList.add('active');
          // Smooth scroll to center
          const target = el.offsetTop - el.parentElement.clientHeight / 2 + el.offsetHeight / 2;
          el.parentElement.scrollTo({ top: target, behavior: 'smooth' });
        };
      });

      // Cancel
      panel.querySelector('[data-action="cancel"]').onclick = () => close();

      // Set
      panel.querySelector('[data-action="set"]').onclick = () => {
        const hEl = panel.querySelector('[data-col="h"] .cdt-time-item.active');
        const mEl = panel.querySelector('[data-col="m"] .cdt-time-item.active');
        const apEl = panel.querySelector('[data-col="ap"] .cdt-time-item.active');
        if (!hEl || !mEl || !apEl) {
          close();
          return;
        }

        let h = parseInt(hEl.dataset.h, 10);
        const m = parseInt(mEl.dataset.m, 10);
        const ap = apEl.dataset.ap;
        if (ap === 'AM') {
          if (h === 12) h = 0;
        } else {
          if (h !== 12) h += 12;
        }

        input.value = `${pad(h)}:${pad(m)}`;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        updateTrigger();
        close();
      };
    }

    function position() {
      const r = trigger.getBoundingClientRect();
      const pw = 292;
      const ph = 340;
      panel.style.width = pw + 'px';
      let left = r.left;
      if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
      if (left < 12) left = 12;
      panel.style.left = left + 'px';
      if (window.innerHeight - r.bottom < ph + 20 && r.top > window.innerHeight - r.bottom) {
        panel.style.top = 'auto';
        panel.style.bottom = window.innerHeight - r.top + 6 + 'px';
      } else {
        panel.style.top = r.bottom + 6 + 'px';
        panel.style.bottom = 'auto';
      }
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      parseVal();
      buildTime();
      wrap.classList.add('cdt-open');
      panel.classList.add('cdt-open');
      position();
      lockScroll();
    }
    function close() {
      if (!isOpen) return;
      isOpen = false;
      wrap.classList.remove('cdt-open');
      panel.classList.remove('cdt-open');
      unlockScroll();
    }

    trigger.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      isOpen ? close() : open();
    };

    document.addEventListener(
      'click',
      (e) => {
        if (!isOpen) return;
        if (wrap.contains(e.target) || panel.contains(e.target)) return;
        close();
      },
      true,
    );

    document.addEventListener('keydown', (e) => {
      if (isOpen && e.key === 'Escape') {
        close();
        trigger.focus();
      }
    });

    setInterval(() => {
      if (input.value !== valueEl.dataset.last) {
        valueEl.dataset.last = input.value;
        updateTrigger();
      }
    }, 300);
  }

  /* ═══════════════ Scan & Convert ═══════════════ */
  function convertAll() {
    document.querySelectorAll('input[type="date"]').forEach((i) => {
      try {
        convertDateInput(i);
      } catch (e) {
        console.warn(e);
      }
    });
    document.querySelectorAll('input[type="time"]').forEach((i) => {
      try {
        convertTimeInput(i);
      } catch (e) {
        console.warn(e);
      }
    });
  }

  const pageObs = new MutationObserver((muts) => {
    let dirty = false;
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'INPUT' && (node.type === 'date' || node.type === 'time')) {
          dirty = true;
          break;
        }
        if (node.querySelector && node.querySelector('input[type="date"],input[type="time"]')) {
          dirty = true;
          break;
        }
      }
      if (dirty) break;
    }
    if (dirty) setTimeout(convertAll, 30);
  });

  function init() {
    if (!document.body) return setTimeout(init, 50);
    injectCSS();
    convertAll();
    pageObs.observe(document.body, { childList: true, subtree: true });
    setInterval(convertAll, 900);
    console.log('[custom-datetime] ✅ initialized');
  }
  init();

  window.cdtRefresh = convertAll;
})();
