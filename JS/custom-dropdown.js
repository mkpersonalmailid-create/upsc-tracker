/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Custom Dropdown v4
   ─────────────────────────────────────────────────────────────
   ✅ Replaces ALL <select> with custom designed dropdown
   ✅ Matches website design (purple gradient, rounded, etc.)
   ✅ Dark + Light theme support
   ✅ Works with dynamically added selects (MutationObserver)
   ✅ Keyboard support (arrow, enter, escape)
   ✅ Search for long lists (auto if >=8 options)
   ✅ FIX: Search input cursor preserved (no reverse typing)
   ✅ FIX: Locks BOTH body AND .content scroll (real scroll container)
   ✅ Syncs value + dispatches change event to original select
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[custom-dropdown] v4 loaded');

  const SEARCH_THRESHOLD = 8;

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    if (document.getElementById('cdDropdownCSS')) return;
    const style = document.createElement('style');
    style.id = 'cdDropdownCSS';
    style.textContent = `
      .cd-wrap {
        position: relative;
        display: inline-block;
        width: 100%;
        font-family: inherit;
      }
      .cd-wrap.cd-open {
        z-index: 9999;
      }
      .cd-wrap > select.cd-native-hidden {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      .cd-trigger {
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
        transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
        min-height: 44px;
        line-height: 1.3;
      }
      .cd-trigger:hover {
        border-color: var(--border-2);
        background: var(--card);
      }
      .cd-wrap.cd-open .cd-trigger,
      .cd-trigger:focus-visible {
        outline: none;
        border-color: var(--purple);
        box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.15);
        background: var(--card);
      }
      .cd-trigger-text {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--text);
      }
      .cd-trigger-text.cd-placeholder {
        color: var(--text-3);
      }
      .cd-arrow {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
        color: var(--purple);
        transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
      }
      .cd-wrap.cd-open .cd-arrow {
        transform: rotate(180deg);
      }

      .cd-panel {
        position: fixed;
        z-index: 99999;
        background: linear-gradient(180deg, var(--card), var(--card-2));
        border: 1.5px solid var(--border-2);
        border-radius: 14px;
        box-shadow:
          0 24px 60px rgba(0, 0, 0, 0.6),
          0 0 60px rgba(168, 85, 247, 0.2);
        padding: 6px;
        max-height: 320px;
        overflow-y: auto;
        opacity: 0;
        transform: translateY(-6px) scale(0.98);
        pointer-events: none;
        transition: opacity 0.2s cubic-bezier(0.32, 0.72, 0, 1),
                    transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
        font-family: inherit;
      }
      .cd-panel.cd-open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      .cd-panel::-webkit-scrollbar {
        width: 6px;
      }
      .cd-panel::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, var(--purple), var(--pink));
        border-radius: 10px;
      }

      .cd-search-wrap {
        padding: 6px 6px 8px;
        margin-bottom: 4px;
        border-bottom: 1px solid var(--border);
        position: sticky;
        top: 0;
        background: linear-gradient(180deg, var(--card), var(--card-2));
        z-index: 1;
      }
      .cd-search {
        width: 100%;
        padding: 8px 12px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 9px;
        font-size: 0.82rem;
        color: var(--text);
        font-family: inherit;
        outline: none;
        transition: all 0.2s;
        box-sizing: border-box;
      }
      .cd-search:focus {
        border-color: var(--purple);
        box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.12);
      }
      .cd-search::placeholder {
        color: var(--text-3);
      }

      .cd-options-wrap {
        display: flex;
        flex-direction: column;
      }

      .cd-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 9px;
        font-size: 0.86rem;
        color: var(--text-2);
        cursor: pointer;
        transition: all 0.15s;
        user-select: none;
        position: relative;
      }
      .cd-option:hover,
      .cd-option.cd-focused {
        background: var(--card-2);
        color: var(--text);
      }
      .cd-option.cd-selected {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.22), rgba(236, 72, 153, 0.12));
        color: var(--text);
        font-weight: 700;
        box-shadow: inset 0 0 0 1px rgba(168, 85, 247, 0.35);
      }
      .cd-option-label {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cd-check {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        color: #A855F7;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .cd-option.cd-selected .cd-check {
        opacity: 1;
      }

      .cd-empty {
        padding: 18px 14px;
        text-align: center;
        font-size: 0.82rem;
        color: var(--text-3);
      }

      .cd-group-label {
        padding: 10px 12px 6px;
        font-size: 0.68rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-3);
      }

      .cd-wrap.cd-sm .cd-trigger {
        padding: 8px 12px;
        font-size: 0.82rem;
        min-height: 38px;
        border-radius: 9px;
      }

      /* ═══ Scroll lock helper (fallback) ═══ */
      body.cd-scroll-locked {
        overflow: hidden !important;
      }
      body.cd-scroll-locked #content {
        overflow: hidden !important;
      }

      /* ═══ Light theme ═══ */
      html[data-theme='light'] .cd-trigger {
        background: #ffffff;
        border-color: #e5dbf5;
      }
      html[data-theme='light'] .cd-trigger:hover {
        border-color: #c9b8e8;
        background: #f8f4ff;
      }
      html[data-theme='light'] .cd-panel {
        background: #ffffff;
        border-color: #c9b8e8;
        box-shadow:
          0 24px 60px rgba(139, 92, 246, 0.18),
          0 0 40px rgba(139, 92, 246, 0.1);
      }
      html[data-theme='light'] .cd-search-wrap {
        background: #ffffff;
      }
      html[data-theme='light'] .cd-search {
        background: #f8f4ff;
        border-color: #e5dbf5;
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════ Helpers ═══════════════ */
  function isHidden(select) {
    if (select.offsetParent === null) return true;
    const style = window.getComputedStyle(select);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
    return false;
  }

  function getOptions(select) {
    const opts = [];
    select.querySelectorAll('option').forEach((opt) => {
      opts.push({
        value: opt.value,
        label: opt.textContent || opt.label || '',
        disabled: opt.disabled,
        selected: opt.selected,
      });
    });
    return opts;
  }

  function getSelectedOption(select) {
    const opt = select.options[select.selectedIndex];
    if (!opt) return { label: '— Select —', value: '' };
    return {
      label: opt.textContent || opt.label || '',
      value: opt.value,
    };
  }

  function shouldShowSearch(select) {
    const optCount = select.querySelectorAll('option').length;
    return optCount >= SEARCH_THRESHOLD;
  }

  function escHtml(str) {
    return String(str || '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  /* ═══════════════ Scroll Lock Helpers ═══════════════ */
  function lockScroll() {
    /* Lock both body AND #content (the real scroll container in app.html) */
    document.body.classList.add('cd-scroll-locked');

    const contentEl = document.getElementById('content');
    if (contentEl) {
      contentEl.dataset.cdPrevOverflow = contentEl.style.overflow || '';
      contentEl.style.overflow = 'hidden';
    }

    /* Also lock any .modal-overlay if present (in case dropdown is inside modal) */
    const modals = document.querySelectorAll('.modal-overlay.active, .modal.active');
    modals.forEach((m) => {
      m.dataset.cdPrevOverflow = m.style.overflow || '';
      m.style.overflow = 'hidden';
    });
  }

  function unlockScroll() {
    document.body.classList.remove('cd-scroll-locked');

    const contentEl = document.getElementById('content');
    if (contentEl) {
      contentEl.style.overflow = contentEl.dataset.cdPrevOverflow || '';
      delete contentEl.dataset.cdPrevOverflow;
    }

    const modals = document.querySelectorAll('.modal-overlay, .modal');
    modals.forEach((m) => {
      if (m.dataset.cdPrevOverflow !== undefined) {
        m.style.overflow = m.dataset.cdPrevOverflow || '';
        delete m.dataset.cdPrevOverflow;
      }
    });
  }

  /* ═══════════════ Convert One Select ═══════════════ */
  function convertSelect(select) {
    if (select.dataset.cdInitialized === '1') return;
    if (isHidden(select)) return;

    select.dataset.cdInitialized = '1';

    const wrap = document.createElement('div');
    wrap.className = 'cd-wrap';
    if (select.classList.contains('cd-sm') || select.dataset.cdSize === 'sm') {
      wrap.classList.add('cd-sm');
    }

    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('cd-native-hidden');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cd-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = `
      <span class="cd-trigger-text"></span>
      <svg class="cd-arrow" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    wrap.appendChild(trigger);

    const triggerText = trigger.querySelector('.cd-trigger-text');

    function updateTrigger() {
      const { label, value } = getSelectedOption(select);
      const isPlaceholder = !value || /^—|^--|Select/i.test(label);
      triggerText.textContent = label || '— Select —';
      triggerText.classList.toggle('cd-placeholder', isPlaceholder);
    }
    updateTrigger();

    /* ═══ Panel ═══ */
    const panel = document.createElement('div');
    panel.className = 'cd-panel';
    panel.setAttribute('role', 'listbox');
    document.body.appendChild(panel);

    /* ═══ Persistent search + options structure — created ONCE ═══ */
    let searchWrap = null;
    let searchInput = null;
    let optionsWrap = null;

    function ensureStructure() {
      if (shouldShowSearch(select)) {
        if (!searchWrap) {
          searchWrap = document.createElement('div');
          searchWrap.className = 'cd-search-wrap';
          searchWrap.innerHTML = `<input type="text" class="cd-search" placeholder="🔍 Search..." autocomplete="off" spellcheck="false">`;
          panel.appendChild(searchWrap);
          searchInput = searchWrap.querySelector('.cd-search');

          searchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            const cursorPos = e.target.selectionStart;
            renderOptions(val);
            if (document.activeElement === searchInput) {
              try {
                searchInput.setSelectionRange(cursorPos, cursorPos);
              } catch (err) {}
            }
          });

          searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (currentOptions.length) {
                const first = currentOptions[0];
                if (first && !first.disabled) {
                  select.value = first.value;
                  select.dispatchEvent(new Event('change', { bubbles: true }));
                  updateTrigger();
                  closePanel();
                  trigger.focus();
                }
              }
              return;
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              closePanel();
              trigger.focus();
              return;
            }
          });
        }
      }

      if (!optionsWrap) {
        optionsWrap = document.createElement('div');
        optionsWrap.className = 'cd-options-wrap';
        panel.appendChild(optionsWrap);
      }
    }

    /* ═══ State ═══ */
    let isOpen = false;
    let focusedIndex = -1;
    let currentOptions = [];

    /* ═══ Render options only (search input stays) ═══ */
    function renderOptions(searchQuery) {
      ensureStructure();

      const opts = getOptions(select);
      const q = (searchQuery || '').toLowerCase().trim();
      const filtered = q ? opts.filter((o) => o.label.toLowerCase().includes(q)) : opts;

      currentOptions = filtered;

      let html = '';
      if (!filtered.length) {
        html = `<div class="cd-empty">No results found</div>`;
      } else {
        filtered.forEach((opt, i) => {
          const selected = opt.value === select.value;
          html += `
            <div class="cd-option ${selected ? 'cd-selected' : ''}" data-index="${i}" data-value="${escHtml(opt.value)}">
              <span class="cd-option-label">${escHtml(opt.label)}</span>
              <svg class="cd-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          `;
        });
      }

      optionsWrap.innerHTML = html;

      optionsWrap.querySelectorAll('.cd-option').forEach((el) => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.index, 10);
          const opt = currentOptions[idx];
          if (!opt || opt.disabled) return;

          select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          updateTrigger();
          closePanel();
        });

        el.addEventListener('mouseenter', () => {
          focusedIndex = parseInt(el.dataset.index, 10);
          updateFocus();
        });
      });

      focusedIndex = currentOptions.findIndex((o) => o.value === select.value);
      updateFocus();
    }

    function updateFocus() {
      if (!optionsWrap) return;
      optionsWrap.querySelectorAll('.cd-option').forEach((el, i) => {
        el.classList.toggle('cd-focused', i === focusedIndex);
      });
    }

    /* ═══ Positioning ═══ */
    function positionPanel() {
      const rect = trigger.getBoundingClientRect();
      const panelHeight = Math.min(320, panel.scrollHeight || 300);
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const width = Math.max(rect.width, 200);

      panel.style.width = width + 'px';
      panel.style.left = Math.min(rect.left, window.innerWidth - width - 10) + 'px';

      if (spaceBelow < panelHeight + 20 && spaceAbove > spaceBelow) {
        panel.style.top = 'auto';
        panel.style.bottom = window.innerHeight - rect.top + 6 + 'px';
      } else {
        panel.style.top = rect.bottom + 6 + 'px';
        panel.style.bottom = 'auto';
      }
    }

    /* ═══ Open panel — with scroll lock ═══ */
    function openPanel() {
      if (isOpen) return;
      isOpen = true;

      /* Lock body + #content scroll */
      lockScroll();

      wrap.classList.add('cd-open');
      panel.classList.add('cd-open');
      trigger.setAttribute('aria-expanded', 'true');

      /* Reset search to empty on open */
      if (searchInput) searchInput.value = '';

      renderOptions('');
      positionPanel();

      if (searchInput) {
        setTimeout(() => {
          try {
            searchInput.focus();
            searchInput.setSelectionRange(0, 0);
          } catch (e) {}
        }, 60);
      }

      /* Prevent panel scroll from bubbling to parent */
      panel.addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });
      panel.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: false });
    }

    /* ═══ Close panel — with scroll unlock ═══ */
    function closePanel() {
      if (!isOpen) return;
      isOpen = false;

      /* Unlock scroll */
      unlockScroll();

      wrap.classList.remove('cd-open');
      panel.classList.remove('cd-open');
      trigger.setAttribute('aria-expanded', 'false');
      focusedIndex = -1;
    }

    /* ═══ Trigger ═══ */
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) closePanel();
      else openPanel();
    });

    /* Outside click */
    function onDocClick(e) {
      if (!isOpen) return;
      if (wrap.contains(e.target) || panel.contains(e.target)) return;
      closePanel();
    }
    document.addEventListener('click', onDocClick, true);

    /* Keyboard */
    function onKeyDown(e) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
        trigger.focus();
        return;
      }

      if (document.activeElement === searchInput) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusedIndex = Math.min(currentOptions.length - 1, focusedIndex + 1);
        updateFocus();
        optionsWrap?.querySelectorAll('.cd-option')[focusedIndex]?.scrollIntoView({ block: 'nearest' });
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusedIndex = Math.max(0, focusedIndex - 1);
        updateFocus();
        optionsWrap?.querySelectorAll('.cd-option')[focusedIndex]?.scrollIntoView({ block: 'nearest' });
        return;
      }

      if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const opt = currentOptions[focusedIndex];
        if (opt && !opt.disabled) {
          select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          updateTrigger();
          closePanel();
          trigger.focus();
        }
        return;
      }
    }
    document.addEventListener('keydown', onKeyDown);

    /* Reposition on scroll of ANY parent */
    window.addEventListener(
      'scroll',
      () => {
        if (isOpen) positionPanel();
      },
      { passive: true, capture: true },
    );
    window.addEventListener(
      'resize',
      () => {
        if (isOpen) positionPanel();
      },
      { passive: true },
    );

    /* Watch for value/options changes */
    const observer = new MutationObserver(() => {
      updateTrigger();
      if (isOpen) renderOptions(searchInput ? searchInput.value : '');
    });
    observer.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });

    let lastValue = select.value;
    setInterval(() => {
      if (select.value !== lastValue) {
        lastValue = select.value;
        updateTrigger();
        if (isOpen) renderOptions(searchInput ? searchInput.value : '');
      }
    }, 250);
  }

  /* ═══════════════ Scan & Convert All ═══════════════ */
  function convertAll() {
    document.querySelectorAll('select').forEach((s) => {
      try {
        convertSelect(s);
      } catch (e) {
        console.warn('[custom-dropdown] failed to convert:', e);
      }
    });
  }

  /* ═══════════════ MutationObserver for new selects ═══════════════ */
  const pageObserver = new MutationObserver((mutations) => {
    let hasNewSelect = false;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'SELECT') {
          hasNewSelect = true;
          break;
        }
        if (node.querySelector && node.querySelector('select')) {
          hasNewSelect = true;
          break;
        }
      }
      if (hasNewSelect) break;
    }
    if (hasNewSelect) setTimeout(convertAll, 30);
  });

  /* ═══════════════ INIT ═══════════════ */
  let attempts = 0;
  function waitThenStart() {
    if (document.body) {
      injectCSS();
      convertAll();
      pageObserver.observe(document.body, { childList: true, subtree: true });
      setInterval(convertAll, 800);
      console.log('[custom-dropdown] ✅ v4 initialized');
    } else {
      attempts++;
      if (attempts > 200) return console.error('[custom-dropdown] timeout');
      setTimeout(waitThenStart, 50);
    }
  }
  waitThenStart();

  window.cdRefresh = convertAll;
})();
