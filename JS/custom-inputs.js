/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Custom Inputs v1
   ─────────────────────────────────────────────────────────────
   ✅ Styles native <input type="date"> and <input type="time">
   ✅ Replaces calendar/clock icons with purple SVG
   ✅ Purple accent color for date/time picker popup (dates, times)
   ✅ Dark + Light theme support
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[custom-inputs] v1 loaded');

  function injectCSS() {
    if (document.getElementById('ciInputsCSS')) return;
    const style = document.createElement('style');
    style.id = 'ciInputsCSS';
    style.textContent = `
      /* ═══ Base — Date/Time Inputs ═══ */
      input[type="date"],
      input[type="time"],
      input[type="datetime-local"],
      input[type="month"],
      input[type="week"] {
        color-scheme: dark;
        accent-color: #A855F7;
        font-family: inherit;
        position: relative;
        padding-right: 36px !important;
      }
      html[data-theme='light'] input[type="date"],
      html[data-theme='light'] input[type="time"],
      html[data-theme='light'] input[type="datetime-local"],
      html[data-theme='light'] input[type="month"],
      html[data-theme='light'] input[type="week"] {
        color-scheme: light;
      }

      /* ═══ Calendar Icon (purple SVG) ═══ */
      input[type="date"]::-webkit-calendar-picker-indicator,
      input[type="datetime-local"]::-webkit-calendar-picker-indicator,
      input[type="month"]::-webkit-calendar-picker-indicator,
      input[type="week"]::-webkit-calendar-picker-indicator {
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23A855F7' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg>");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 17px 17px;
        width: 20px;
        height: 20px;
        padding: 0;
        margin-left: 6px;
        cursor: pointer;
        opacity: 0.9;
        transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
        border-radius: 6px;
        flex-shrink: 0;
      }
      input[type="date"]::-webkit-calendar-picker-indicator:hover,
      input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover,
      input[type="month"]::-webkit-calendar-picker-indicator:hover,
      input[type="week"]::-webkit-calendar-picker-indicator:hover {
        opacity: 1;
        background-color: rgba(168, 85, 247, 0.15);
        transform: scale(1.12);
      }

      /* ═══ Clock Icon for Time Inputs ═══ */
      input[type="time"]::-webkit-calendar-picker-indicator {
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23A855F7' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 17px 17px;
        width: 20px;
        height: 20px;
        padding: 0;
        margin-left: 6px;
        cursor: pointer;
        opacity: 0.9;
        transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
        border-radius: 6px;
        flex-shrink: 0;
      }
      input[type="time"]::-webkit-calendar-picker-indicator:hover {
        opacity: 1;
        background-color: rgba(168, 85, 247, 0.15);
        transform: scale(1.12);
      }

      /* ═══ Date/Time Value Text ═══ */
      input[type="date"]::-webkit-datetime-edit,
      input[type="time"]::-webkit-datetime-edit,
      input[type="datetime-local"]::-webkit-datetime-edit,
      input[type="month"]::-webkit-datetime-edit,
      input[type="week"]::-webkit-datetime-edit {
        color: var(--text);
        font-weight: 600;
        padding: 0;
      }
      input[type="date"]::-webkit-datetime-edit-fields-wrapper,
      input[type="time"]::-webkit-datetime-edit-fields-wrapper,
      input[type="datetime-local"]::-webkit-datetime-edit-fields-wrapper {
        padding: 0;
      }
      input[type="date"]::-webkit-datetime-edit-text,
      input[type="time"]::-webkit-datetime-edit-text,
      input[type="datetime-local"]::-webkit-datetime-edit-text {
        color: var(--text-3);
        padding: 0 2px;
      }

      /* ═══ Focused Field Highlight (month/day/year/hour/min) ═══ */
      input[type="date"]::-webkit-datetime-edit-month-field:focus,
      input[type="date"]::-webkit-datetime-edit-day-field:focus,
      input[type="date"]::-webkit-datetime-edit-year-field:focus,
      input[type="time"]::-webkit-datetime-edit-hour-field:focus,
      input[type="time"]::-webkit-datetime-edit-minute-field:focus,
      input[type="time"]::-webkit-datetime-edit-ampm-field:focus,
      input[type="datetime-local"]::-webkit-datetime-edit-month-field:focus,
      input[type="datetime-local"]::-webkit-datetime-edit-day-field:focus,
      input[type="datetime-local"]::-webkit-datetime-edit-year-field:focus,
      input[type="datetime-local"]::-webkit-datetime-edit-hour-field:focus,
      input[type="datetime-local"]::-webkit-datetime-edit-minute-field:focus {
        background: rgba(168, 85, 247, 0.25);
        color: var(--text);
        border-radius: 4px;
        outline: none;
        padding: 1px 3px;
      }

      /* ═══ Empty State (placeholder-like) ═══ */
      input[type="date"]:invalid::-webkit-datetime-edit,
      input[type="time"]:invalid::-webkit-datetime-edit {
        color: var(--text-3);
      }
    `;
    document.head.appendChild(style);
  }

  /* Init */
  if (document.body || document.head) {
    injectCSS();
    console.log('[custom-inputs] ✅ initialized');
  } else {
    setTimeout(() => {
      injectCSS();
      console.log('[custom-inputs] ✅ initialized');
    }, 50);
  }
})();
