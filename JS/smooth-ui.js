/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Smooth UI v1
   ─────────────────────────────────────────────────────────────
   ✅ iOS-style spring easing on ALL interactions
   ✅ Smooth view transitions (no jump)
   ✅ Smooth modal open/close
   ✅ Smooth button/card hover
   ✅ Smooth scroll behavior
   ✅ Reduced motion support (accessibility)
   ✅ Zero-conflict — overrides with !important only where needed
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[smooth-ui] v1 loaded');

  function injectCSS() {
    if (document.getElementById('smoothUICSS')) return;
    const style = document.createElement('style');
    style.id = 'smoothUICSS';
    style.textContent = `
      /* ═══════════════════════════════════════════════════════════
         GLOBAL EASING TOKENS
         ═══════════════════════════════════════════════════════════ */
      :root {
        --smooth-ease: cubic-bezier(0.32, 0.72, 0, 1);       /* iOS ease */
        --smooth-spring: cubic-bezier(0.34, 1.56, 0.64, 1);   /* spring bounce */
        --smooth-soft: cubic-bezier(0.4, 0, 0.2, 1);          /* material */
        --smooth-snap: cubic-bezier(0.16, 1, 0.3, 1);         /* snappy */
      }

      /* ═══════════════════════════════════════════════════════════
         SCROLL — Smooth scroll everywhere
         ═══════════════════════════════════════════════════════════ */
      html {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }
      .content,
      .nav,
      .modal,
      .cd-panel,
      .cdt-time-col {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        overscroll-behavior: contain;
      }

      /* Custom smooth scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, var(--purple), var(--pink));
        border-radius: 10px;
        border: 2px solid var(--bg);
        transition: background 0.3s ease;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, var(--pink), var(--purple));
      }

      /* ═══════════════════════════════════════════════════════════
         BUTTONS — Spring on press, smooth hover
         ═══════════════════════════════════════════════════════════ */
      button,
      .btn,
      .nav-item,
      .top-icon-btn,
      .collapse-btn,
      .avatar-btn,
      .cat-chip,
      .subject-pill,
      .mode-chip,
      .chart-tab,
      .demo-tab,
      .filter-chip,
      .cd-trigger,
      .cdt-trigger,
      .plan-btn,
      .cta-btn,
      .share-btn,
      .fab-item,
      .icon-mini,
      .icon-btn {
        transition:
          transform 0.35s var(--smooth-spring),
          background 0.25s var(--smooth-ease),
          color 0.2s var(--smooth-ease),
          border-color 0.25s var(--smooth-ease),
          box-shadow 0.3s var(--smooth-ease),
          opacity 0.25s var(--smooth-ease);
        will-change: transform;
      }

      /* Lighter tap animation for tiny buttons */
      button:active,
      .btn:active,
      .nav-item:active,
      .top-icon-btn:active,
      .collapse-btn:active,
      .avatar-btn:active,
      .cat-chip:active,
      .subject-pill:active,
      .mode-chip:active,
      .chart-tab:active,
      .icon-mini:active,
      .icon-btn:active {
        transform: scale(0.94);
        transition: transform 0.12s var(--smooth-ease);
      }

      /* Larger buttons — softer press */
      .btn-primary:active,
      .btn-secondary:active,
      .btn-lg:active,
      .cta-btn:active,
      .plan-btn:active,
      .auth-btn:active,
      .btn-premium:active {
        transform: scale(0.97) translateY(1px);
        transition: transform 0.12s var(--smooth-ease);
      }

      /* ═══════════════════════════════════════════════════════════
         CARDS — Smooth hover lift
         ═══════════════════════════════════════════════════════════ */
      .card,
      .kpi,
      .subject-card,
      .sn-card,
      .feature-card,
      .testimonial,
      .plan,
      .chart-card,
      .ai-card,
      .ticket-card,
      .mock-kpi,
      .mock-subject,
      .mock-chart,
      .mock-syl-cat,
      .mock-insight,
      .cal-day,
      .tt-record,
      .pl-block {
        transition:
          transform 0.4s var(--smooth-spring),
          border-color 0.3s var(--smooth-ease),
          box-shadow 0.35s var(--smooth-ease),
          background 0.3s var(--smooth-ease);
        will-change: transform;
      }

      /* Only apply hover lift on devices with real hover */
      @media (hover: hover) {
        .card:hover,
        .kpi:hover,
        .feature-card:hover,
        .testimonial:hover {
          transform: translateY(-4px);
        }
      }

      /* ═══════════════════════════════════════════════════════════
         ROWS / LIST ITEMS — Smooth slide
         ═══════════════════════════════════════════════════════════ */
      .row-item,
      .item-row,
      .notif-item,
      .cd-option,
      .rev-topic-item,
      .syl-topic {
        transition:
          background 0.25s var(--smooth-ease),
          border-color 0.25s var(--smooth-ease),
          transform 0.3s var(--smooth-spring),
          padding 0.25s var(--smooth-ease);
      }

      @media (hover: hover) {
        .row-item:hover,
        .item-row:hover,
        .notif-item:hover {
          transform: translateX(2px);
        }
      }

      /* ═══════════════════════════════════════════════════════════
         INPUTS — Smooth focus glow
         ═══════════════════════════════════════════════════════════ */
      input,
      textarea,
      select,
      .field input,
      .field select,
      .field textarea {
        transition:
          border-color 0.25s var(--smooth-ease),
          box-shadow 0.35s var(--smooth-ease),
          background 0.25s var(--smooth-ease);
      }

      /* ═══════════════════════════════════════════════════════════
         VIEW TRANSITIONS — Smooth page change
         ═══════════════════════════════════════════════════════════ */
      .view.active {
        animation: smoothViewIn 0.5s var(--smooth-ease) both;
      }
      @keyframes smoothViewIn {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.99);
          filter: blur(2px);
        }
        60% {
          filter: blur(0);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }
      }

      /* ═══════════════════════════════════════════════════════════
         MODALS — Smooth spring entrance
         ═══════════════════════════════════════════════════════════ */
      .modal-overlay {
        transition: opacity 0.3s var(--smooth-ease), backdrop-filter 0.3s var(--smooth-ease);
      }
      .modal-overlay.active {
        animation: none;
      }
      .modal-overlay.active .modal,
      #modalRoot.active .modal {
        animation: smoothModalIn 0.45s var(--smooth-spring) both;
      }
      @keyframes smoothModalIn {
        from {
          opacity: 0;
          transform: scale(0.92) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      /* ═══════════════════════════════════════════════════════════
         TOASTS — Smooth slide in from right
         ═══════════════════════════════════════════════════════════ */
      .toast {
        animation: smoothToastIn 0.45s var(--smooth-spring) both !important;
      }
      @keyframes smoothToastIn {
        from {
          opacity: 0;
          transform: translateX(60px) scale(0.9);
        }
        60% {
          transform: translateX(-4px) scale(1);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      /* ═══════════════════════════════════════════════════════════
         SIDEBAR — Smooth iOS slide
         ═══════════════════════════════════════════════════════════ */
      .sidebar {
        transition:
          width 0.45s var(--smooth-ease),
          transform 0.5s var(--smooth-ease),
          box-shadow 0.4s var(--smooth-ease);
      }
      .sidebar-overlay {
        transition:
          opacity 0.35s var(--smooth-ease),
          visibility 0.35s var(--smooth-ease),
          backdrop-filter 0.35s var(--smooth-ease);
      }

      /* ═══════════════════════════════════════════════════════════
         NAV ITEMS — Smooth slide & bounce
         ═══════════════════════════════════════════════════════════ */
      .nav-item {
        transition:
          background 0.3s var(--smooth-ease),
          color 0.25s var(--smooth-ease),
          transform 0.35s var(--smooth-spring),
          box-shadow 0.35s var(--smooth-ease);
      }
      @media (hover: hover) {
        .nav-item:hover {
          transform: translateX(4px);
        }
      }
      .nav-item.active {
        animation: smoothNavActive 0.5s var(--smooth-spring);
      }
      @keyframes smoothNavActive {
        0% { transform: scale(0.97); }
        60% { transform: scale(1.01); }
        100% { transform: scale(1); }
      }

      /* ═══════════════════════════════════════════════════════════
         CHIPS — Smooth scale pop
         ═══════════════════════════════════════════════════════════ */
      .cat-chip.selected,
      .subject-pill.selected,
      .mode-chip.active {
        animation: smoothChipPop 0.4s var(--smooth-spring);
      }
      @keyframes smoothChipPop {
        0% { transform: scale(1); }
        50% { transform: scale(1.06); }
        100% { transform: scale(1); }
      }

      /* ═══════════════════════════════════════════════════════════
         DROPDOWN / PICKER PANELS — Smooth spring
         ═══════════════════════════════════════════════════════════ */
      .cd-panel,
      .cdt-panel {
        transition:
          opacity 0.28s var(--smooth-ease),
          transform 0.35s var(--smooth-spring),
          box-shadow 0.3s var(--smooth-ease);
      }
      .cd-panel.cd-open,
      .cdt-panel.cdt-open {
        animation: smoothPanelIn 0.35s var(--smooth-spring);
      }
      @keyframes smoothPanelIn {
        0% {
          opacity: 0;
          transform: translateY(-8px) scale(0.96);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* ═══════════════════════════════════════════════════════════
         PROGRESS BARS — Smooth fill
         ═══════════════════════════════════════════════════════════ */
      .progress-fill,
      .pl-progress-fill,
      .syl-cat-bar-fill,
      .mock-kpi-bar > div,
      .mock-syl-bar > div,
      .pay-progress-fill {
        transition: width 0.8s var(--smooth-ease);
      }

      /* ═══════════════════════════════════════════════════════════
         CHECKBOX / TOGGLE — Smooth bounce
         ═══════════════════════════════════════════════════════════ */
      .item-check,
      .pl-block-check {
        transition:
          background 0.25s var(--smooth-ease),
          border-color 0.25s var(--smooth-ease),
          transform 0.3s var(--smooth-spring),
          color 0.2s var(--smooth-ease);
      }
      .item-check:active,
      .pl-block-check:active {
        transform: scale(0.9);
      }
      .item-check.done,
      .pl-block-check.done,
      .pl-block.done .pl-block-check {
        animation: smoothCheckPop 0.4s var(--smooth-spring);
      }
      @keyframes smoothCheckPop {
        0% { transform: scale(0.6); }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }

      /* ═══════════════════════════════════════════════════════════
         PILLS & BADGES — Smooth
         ═══════════════════════════════════════════════════════════ */
      .pill,
      .nav-badge,
      .sn-chip,
      .tt-chip,
      .pl-time-chip,
      .pl-dur-chip,
      .cal-summary-chip {
        transition:
          background 0.25s var(--smooth-ease),
          color 0.2s var(--smooth-ease),
          transform 0.3s var(--smooth-spring);
      }

      /* ═══════════════════════════════════════════════════════════
         IMAGES — Smooth load in
         ═══════════════════════════════════════════════════════════ */
      img {
        transition: opacity 0.4s var(--smooth-ease), transform 0.4s var(--smooth-ease);
      }

      /* ═══════════════════════════════════════════════════════════
         FAB — Smooth rotate & scale
         ═══════════════════════════════════════════════════════════ */
      #fab,
      .fab {
        transition:
          transform 0.4s var(--smooth-spring),
          box-shadow 0.35s var(--smooth-ease),
          background 0.3s var(--smooth-ease);
      }
      .fab-menu {
        transition: opacity 0.3s var(--smooth-ease);
      }
      .fab-item {
        transition:
          transform 0.35s var(--smooth-spring),
          background 0.25s var(--smooth-ease),
          border-color 0.25s var(--smooth-ease),
          box-shadow 0.3s var(--smooth-ease);
        animation: smoothFabItemIn 0.4s var(--smooth-spring) backwards;
      }
      .fab-menu.active .fab-item:nth-child(1) { animation-delay: 0.02s; }
      .fab-menu.active .fab-item:nth-child(2) { animation-delay: 0.06s; }
      .fab-menu.active .fab-item:nth-child(3) { animation-delay: 0.1s; }
      .fab-menu.active .fab-item:nth-child(4) { animation-delay: 0.14s; }
      .fab-menu.active .fab-item:nth-child(5) { animation-delay: 0.18s; }
      @keyframes smoothFabItemIn {
        from {
          opacity: 0;
          transform: translateY(10px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* ═══════════════════════════════════════════════════════════
         LINKS — Smooth underline
         ═══════════════════════════════════════════════════════════ */
      a {
        transition: color 0.2s var(--smooth-ease), opacity 0.2s var(--smooth-ease);
      }

      /* ═══════════════════════════════════════════════════════════
         ACCORDION / FAQ — Smooth height
         ═══════════════════════════════════════════════════════════ */
      .faq-a {
        transition:
          max-height 0.55s var(--smooth-ease),
          padding 0.35s var(--smooth-ease),
          opacity 0.35s var(--smooth-ease);
      }

      /* ═══════════════════════════════════════════════════════════
         SMOOTH CARET (blinking cursor in inputs)
         ═══════════════════════════════════════════════════════════ */
      input,
      textarea {
        caret-color: var(--purple);
      }

      /* ═══════════════════════════════════════════════════════════
         GLOBAL FOCUS RINGS — Smooth
         ═══════════════════════════════════════════════════════════ */
      *:focus-visible {
        outline: 2px solid var(--purple);
        outline-offset: 3px;
        transition: outline-offset 0.2s var(--smooth-ease), outline 0.2s var(--smooth-ease);
        border-radius: inherit;
      }

      /* ═══════════════════════════════════════════════════════════
         GPU ACCELERATION HINTS
         ═══════════════════════════════════════════════════════════ */
      .view,
      .card,
      .modal,
      .cd-panel,
      .cdt-panel,
      .fab,
      .fab-menu,
      .sidebar,
      .toast {
        transform: translateZ(0);
        backface-visibility: hidden;
      }

      /* ═══════════════════════════════════════════════════════════
         PREVENT LAYOUT SHIFT ON HOVER (buttons with icons)
         ═══════════════════════════════════════════════════════════ */
      .btn,
      button {
        transform-origin: center;
      }

      /* ═══════════════════════════════════════════════════════════
         ACCESSIBILITY — Reduce motion
         ═══════════════════════════════════════════════════════════ */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════ Smooth Scroll Helper ═══════════════ */
  function enableSmoothScroll() {
    // Add scroll-behavior to .content if not present
    const content = document.getElementById('content');
    if (content && getComputedStyle(content).scrollBehavior !== 'smooth') {
      content.style.scrollBehavior = 'smooth';
    }
  }

  /* ═══════════════ Smooth View Switch Patch ═══════════════ */
  function patchViewSwitch() {
    if (typeof window.switchView !== 'function') return;
    if (window._smoothViewPatched) return;
    window._smoothViewPatched = true;

    const _orig = window.switchView;
    window.switchView = function (name) {
      const content = document.getElementById('content');

      // Fade out content slightly before switch (fast — only 80ms)
      if (content && name !== 'study') {
        content.style.transition = 'opacity 0.12s ease';
        content.style.opacity = '0.7';
        setTimeout(() => {
          content.style.opacity = '';
        }, 60);
      }

      _orig.call(this, name);
    };
    try {
      switchView = window.switchView;
    } catch (e) {}
    console.log('[smooth-ui] patched: switchView');
  }

  /* ═══════════════ INIT ═══════════════ */
  let attempts = 0;
  function waitThenStart() {
    if (document.body) {
      injectCSS();
      enableSmoothScroll();

      // Patch after switchView is available
      setTimeout(patchViewSwitch, 500);
      setTimeout(patchViewSwitch, 1500);

      console.log('[smooth-ui] ✅ v1 initialized');
    } else {
      attempts++;
      if (attempts > 200) return console.error('[smooth-ui] timeout');
      setTimeout(waitThenStart, 50);
    }
  }
  waitThenStart();
})();
