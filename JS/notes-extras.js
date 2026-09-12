/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Notes Extras v1 (Short Notes + Links)
   ─────────────────────────────────────────────────────────────
   ✅ Category / Subject / Topic linking (custom supported)
   ✅ Multiple external links per note (Sheet / Keep / Drive / YouTube)
   ✅ Small text content
   ✅ Dashboard KPIs
   ✅ Search + Filter + Pinned
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[notes-extras] v1 loaded');

  /* ═══════════════ HELPERS ═══════════════ */
  function escHtml(str) {
    return String(str || '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function safeUUID() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'nt-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }
  function todayKey() {
    const x = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  function fmtRelDate(key) {
    if (!key) return '';
    const d = new Date(key);
    const diff = Math.round((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  const CAT_OPTIONS = [
    { id: '', label: '— Any Category —' },
    { id: 'prelims', label: '🎯 GS Prelims' },
    { id: 'mains-gs1', label: '📘 GS Mains · Paper I' },
    { id: 'mains-gs2', label: '📗 GS Mains · Paper II' },
    { id: 'mains-gs3', label: '📙 GS Mains · Paper III' },
    { id: 'mains-gs4', label: '📕 GS Mains · Paper IV' },
    { id: 'optional', label: '⭐ Optional' },
    { id: 'essay', label: '✍️ Essay' },
    { id: 'csat', label: '🧮 CSAT' },
  ];

  const LINK_TYPES = [
    { id: 'sheet', label: '📊 Google Sheet', color: '#10B981' },
    { id: 'keep', label: '📝 Google Keep', color: '#FBBF24' },
    { id: 'drive', label: '📁 Google Drive', color: '#06B6D4' },
    { id: 'youtube', label: '▶️ YouTube', color: '#EF4444' },
    { id: 'doc', label: '📄 Google Doc', color: '#6366F1' },
    { id: 'notion', label: '🗒 Notion', color: '#8B5CF6' },
    { id: 'other', label: '🔗 Other', color: '#A855F7' },
  ];

  function linkIcon(type) {
    const t = LINK_TYPES.find((x) => x.id === type);
    return t ? t.label.split(' ')[0] : '🔗';
  }
  function linkLabel(type) {
    const t = LINK_TYPES.find((x) => x.id === type);
    return t ? t.label : '🔗 Link';
  }
  function linkColor(type) {
    const t = LINK_TYPES.find((x) => x.id === type);
    return t ? t.color : '#A855F7';
  }

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    if (document.getElementById('notesExtrasCSS')) return;
    const style = document.createElement('style');
    style.id = 'notesExtrasCSS';
    style.textContent = `
      /* Note card */
      .sn-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 16px 18px;
        transition: all .22s;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 10px;
        cursor: pointer;
      }
      .sn-card:hover {
        border-color: var(--border-2);
        transform: translateY(-3px);
        box-shadow: var(--shadow-md);
      }
      .sn-card.pinned {
        border-color: rgba(251,191,36,.5);
        background: linear-gradient(135deg, rgba(251,191,36,.04), rgba(236,72,153,.02));
      }
      .sn-card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .sn-title {
        font-weight: 800;
        font-size: .98rem;
        line-height: 1.3;
        color: var(--text);
        word-break: break-word;
      }
      .sn-pin-badge {
        font-size: .9rem;
        flex-shrink: 0;
      }
      .sn-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .sn-chip {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 3px 9px;
        border-radius: 20px;
        font-size: .65rem;
        font-weight: 800;
        letter-spacing: .02em;
        background: var(--card-2);
        color: var(--text-2);
        white-space: nowrap;
      }
      .sn-chip.cat { background: rgba(168,85,247,.15); color: #C4B5FD; }
      .sn-chip.subj { background: rgba(236,72,153,.15); color: #F9A8D4; }
      .sn-chip.topic { background: rgba(20,184,166,.15); color: #5EEAD4; }

      .sn-content {
        font-size: .82rem;
        color: var(--text-2);
        line-height: 1.55;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .sn-links {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding-top: 8px;
        border-top: 1px dashed var(--border);
      }
      .sn-link-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: .7rem;
        font-weight: 700;
        text-decoration: none;
        transition: all .18s;
        border: 1px solid;
      }
      .sn-link-chip:hover {
        transform: translateY(-1px);
        filter: brightness(1.15);
      }
      .sn-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: .68rem;
        color: var(--text-3);
        padding-top: 6px;
        border-top: 1px dashed var(--border);
      }
      .sn-card-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity .2s;
      }
      .sn-card:hover .sn-card-actions { opacity: 1; }
      .sn-icon-btn {
        width: 26px; height: 26px;
        border-radius: 7px;
        display: flex; align-items: center; justify-content: center;
        font-size: .75rem;
        background: var(--card-2);
        border: 1px solid var(--border);
        color: var(--text-2);
        cursor: pointer;
        transition: all .18s;
      }
      .sn-icon-btn:hover {
        background: var(--card);
        color: var(--text);
        transform: scale(1.1);
      }

      /* Link row in modal */
      .sn-link-row {
        display: flex;
        gap: 6px;
        align-items: center;
        padding: 8px;
        background: var(--card-2);
        border-radius: 10px;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }
      .sn-link-row select {
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 7px 10px;
        font-size: .78rem;
        color: var(--text);
        min-width: 90px;
      }
      .sn-link-row input {
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 7px 10px;
        font-size: .82rem;
        color: var(--text);
        flex: 1;
        min-width: 120px;
      }
      .sn-link-del {
        width: 30px; height: 30px;
        border-radius: 8px;
        background: rgba(239,68,68,.1);
        border: 1px solid rgba(239,68,68,.3);
        color: #FCA5A5;
        cursor: pointer;
        font-size: .8rem;
        flex-shrink: 0;
      }
      .sn-link-del:hover { background: rgba(239,68,68,.2); }

      @media (max-width: 600px) {
        .sn-card { padding: 13px 14px; }
        .sn-title { font-size: .9rem; }
        .sn-link-row input { min-width: 100px; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════ KPI DASHBOARD ═══════════════ */
  function buildDashboard(notes) {
    const total = notes.length;
    const pinned = notes.filter((n) => n.pinned).length;
    const totalLinks = notes.reduce((a, n) => a + (n.links?.length || 0), 0);
    const subjects = new Set(notes.map((n) => n.subject).filter(Boolean)).size;

    const cards = [
      { icon: '📝', label: 'Total Notes', value: total, color: 'var(--purple)' },
      { icon: '📌', label: 'Pinned', value: pinned, color: 'var(--amber)' },
      { icon: '🔗', label: 'Total Links', value: totalLinks, color: 'var(--teal)' },
      { icon: '📚', label: 'Subjects', value: subjects, color: 'var(--pink)' },
    ];

    const strip = document.createElement('div');
    strip.className = 'kpi-grid';
    strip.style.marginBottom = '16px';
    strip.innerHTML = cards
      .map(
        (c) => `
      <div class="kpi" style="--c:${c.color};--cb:color-mix(in srgb, ${c.color} 15%, transparent)">
        <div class="kpi-top"><div class="kpi-icon">${c.icon}</div></div>
        <div class="kpi-label">${c.label}</div>
        <div class="kpi-value">${c.value}</div>
      </div>`,
      )
      .join('');
    return strip;
  }

  /* ═══════════════ FILTER BAR ═══════════════ */
  let noteFilter = { search: '', category: '', subject: '', pinnedOnly: false };

  function buildFilterBar(notes) {
    const categories = [...new Set(notes.map((n) => n.category).filter(Boolean))].sort();
    const subjects = [...new Set(notes.map((n) => n.subject).filter(Boolean))].sort();

    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center';

    bar.innerHTML = `
      <input type="text" id="snSearch" placeholder="🔍 Search notes…" value="${escHtml(noteFilter.search)}"
        style="flex:1;min-width:180px;background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:.85rem;color:var(--text)">
      <select id="snFilterCat" style="background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:.82rem;color:var(--text);min-width:150px">
        <option value="">All Categories</option>
        ${categories.map((c) => `<option value="${escHtml(c)}" ${noteFilter.category === c ? 'selected' : ''}>${escHtml(c)}</option>`).join('')}
      </select>
      <select id="snFilterSubj" style="background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:.82rem;color:var(--text);min-width:150px">
        <option value="">All Subjects</option>
        ${subjects.map((s) => `<option value="${escHtml(s)}" ${noteFilter.subject === s ? 'selected' : ''}>${escHtml(s)}</option>`).join('')}
      </select>
      <button id="snPinnedToggle" class="btn btn-secondary btn-sm" style="padding:9px 14px;font-size:.8rem;${noteFilter.pinnedOnly ? 'background:rgba(251,191,36,.2);border-color:rgba(251,191,36,.4);color:#FBBF24' : ''}">
        📌 ${noteFilter.pinnedOnly ? 'Pinned ON' : 'Pinned Only'}
      </button>
    `;

    setTimeout(() => {
      const s = bar.querySelector('#snSearch');
      const c = bar.querySelector('#snFilterCat');
      const sj = bar.querySelector('#snFilterSubj');
      const p = bar.querySelector('#snPinnedToggle');
      if (s)
        s.oninput = (e) => {
          noteFilter.search = e.target.value.toLowerCase();
          renderNotesView();
        };
      if (c)
        c.onchange = (e) => {
          noteFilter.category = e.target.value;
          renderNotesView();
        };
      if (sj)
        sj.onchange = (e) => {
          noteFilter.subject = e.target.value;
          renderNotesView();
        };
      if (p)
        p.onclick = () => {
          noteFilter.pinnedOnly = !noteFilter.pinnedOnly;
          renderNotesView();
        };
    }, 0);

    return bar;
  }

  /* ═══════════════ CARD ═══════════════ */
  function buildCard(note) {
    const card = document.createElement('div');
    card.className = 'sn-card' + (note.pinned ? ' pinned' : '');

    const catLabel = CAT_OPTIONS.find((c) => c.id === note.category)?.label || note.category || '';
    const chips = [];
    if (catLabel) chips.push(`<span class="sn-chip cat">${escHtml(catLabel)}</span>`);
    if (note.subject) chips.push(`<span class="sn-chip subj">📚 ${escHtml(note.subject)}</span>`);
    if (note.topic) chips.push(`<span class="sn-chip topic">📖 ${escHtml(note.topic)}</span>`);

    const links = (note.links || [])
      .map(
        (l) => `
      <a href="${escHtml(l.url)}" target="_blank" rel="noopener" class="sn-link-chip"
         style="background:${linkColor(l.type)}22;border-color:${linkColor(l.type)}55;color:${linkColor(l.type)}"
         onclick="event.stopPropagation()">
        ${linkIcon(l.type)} ${escHtml(l.label || linkLabel(l.type))}
      </a>`,
      )
      .join('');

    card.innerHTML = `
      <div class="sn-card-head">
        <div class="sn-title">${escHtml(note.title || 'Untitled')}</div>
        ${note.pinned ? '<div class="sn-pin-badge">📌</div>' : ''}
      </div>
      ${chips.length ? `<div class="sn-chips">${chips.join('')}</div>` : ''}
      ${note.content ? `<div class="sn-content">${escHtml(note.content)}</div>` : ''}
      ${links ? `<div class="sn-links">${links}</div>` : ''}
      <div class="sn-foot">
        <span>${fmtRelDate(note.updated_at || note.created_at)}</span>
        <div class="sn-card-actions">
          <button class="sn-icon-btn" data-sn-edit="${note.id}" title="Edit" onclick="event.stopPropagation()">✏️</button>
          <button class="sn-icon-btn" data-sn-del="${note.id}" title="Delete" style="color:#FCA5A5" onclick="event.stopPropagation()">🗑️</button>
        </div>
      </div>`;

    card.onclick = () => openShortNoteModal(note);

    setTimeout(() => {
      const editBtn = card.querySelector('[data-sn-edit]');
      const delBtn = card.querySelector('[data-sn-del]');
      if (editBtn)
        editBtn.onclick = (e) => {
          e.stopPropagation();
          openShortNoteModal(note);
        };
      if (delBtn)
        delBtn.onclick = (e) => {
          e.stopPropagation();
          deleteShortNote(note.id);
        };
    }, 0);

    return card;
  }

  /* ═══════════════ RENDER MAIN VIEW ═══════════════ */
  function renderNotesView() {
    const view = document.querySelector('#view-notes');
    if (!view) return;

    injectCSS();

    const card = view.querySelector('.card');
    if (!card) return;

    // Update title
    const titleEl = card.querySelector('.card-title-lg');
    if (titleEl) titleEl.textContent = '📝 Short Notes';

    // Get container — we'll rebuild everything inside the card after header
    let body = card.querySelector('#snBody');
    if (!body) {
      body = document.createElement('div');
      body.id = 'snBody';
      card.appendChild(body);

      // Hide old filter bar + notes grid + add-note button (repurpose)
      const oldFilters = card.querySelectorAll('.filter-bar, #notesGrid');
      oldFilters.forEach((x) => (x.style.display = 'none'));

      // Repurpose "New Note" button
      const addBtn = card.querySelector('#addNoteBtn');
      if (addBtn) {
        addBtn.textContent = '＋ New Short Note';
        addBtn.onclick = () => openShortNoteModal();
      }
    }

    body.innerHTML = '';

    const allNotes = state.notes || [];

    // 1. Dashboard KPIs
    body.appendChild(buildDashboard(allNotes));

    // 2. Filter bar
    body.appendChild(buildFilterBar(allNotes));

    // 3. Filter
    let filtered = allNotes.slice();
    if (noteFilter.search) {
      const q = noteFilter.search;
      filtered = filtered.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.content || '').toLowerCase().includes(q) ||
          (n.subject || '').toLowerCase().includes(q) ||
          (n.topic || '').toLowerCase().includes(q),
      );
    }
    if (noteFilter.category) filtered = filtered.filter((n) => n.category === noteFilter.category);
    if (noteFilter.subject) filtered = filtered.filter((n) => n.subject === noteFilter.subject);
    if (noteFilter.pinnedOnly) filtered = filtered.filter((n) => n.pinned);

    // Sort — pinned first, then latest
    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    });

    // 4. Grid
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.style.padding = '40px 20px';
      empty.innerHTML = `
        <div class="em">📝</div>
        <h4>${allNotes.length ? 'No notes match your filters' : 'No short notes yet'}</h4>
        <p>Save quick notes with links to Sheets, Keep, Drive, YouTube and more.</p>
        <button class="btn btn-primary" id="snEmptyAdd">＋ Create First Note</button>
      `;
      body.appendChild(empty);
      const btn = empty.querySelector('#snEmptyAdd');
      if (btn) btn.onclick = () => openShortNoteModal();
      return;
    }

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px';
    filtered.forEach((n) => grid.appendChild(buildCard(n)));
    body.appendChild(grid);

    if (typeof attachRipples === 'function') attachRipples();
  }

  /* ═══════════════ OPEN MODAL (Add/Edit) ═══════════════ */
  function openShortNoteModal(existing) {
    const n = existing || {
      title: '',
      category: '',
      subject: '',
      topic: '',
      content: '',
      links: [],
      pinned: false,
    };

    let workingLinks = JSON.parse(JSON.stringify(n.links || []));
    let selectedCategory = n.category || '';
    let selectedSubject = n.subject || '';
    let selectedTopic = n.topic || '';

    function buildLinksHTML() {
      if (!workingLinks.length) {
        return `<div style="text-align:center;font-size:.75rem;color:var(--text-3);padding:8px">No links added yet</div>`;
      }
      return workingLinks
        .map(
          (l, i) => `
        <div class="sn-link-row" data-link-idx="${i}">
          <select data-link-type="${i}">
            ${LINK_TYPES.map((t) => `<option value="${t.id}" ${t.id === l.type ? 'selected' : ''}>${t.label}</option>`).join('')}
          </select>
          <input type="text" data-link-label="${i}" placeholder="Label (optional)" value="${escHtml(l.label || '')}">
          <input type="url" data-link-url="${i}" placeholder="https://…" value="${escHtml(l.url || '')}">
          <button class="sn-link-del" data-link-del="${i}" title="Remove">✕</button>
        </div>`,
        )
        .join('');
    }

    const body = `
      <div class="field">
        <label>Title</label>
        <input type="text" id="snTitleInput" value="${escHtml(n.title)}" maxlength="150" placeholder="e.g. Modern History — Important Dates">
      </div>

      <div style="background:var(--card-2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-top:4px">
        <div style="font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);margin-bottom:10px">🔗 Link to Category / Subject</div>

        <div class="form-grid">
          <div class="field">
            <label>Category</label>
            <select id="snCategory">
              ${CAT_OPTIONS.map((c) => `<option value="${c.id}" ${c.id === selectedCategory ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Subject</label>
            <select id="snSubject" disabled><option value="">— Select category first —</option></select>
          </div>
        </div>
        <div class="field">
          <label>Topic (optional)</label>
          <select id="snTopic" disabled><option value="">— Select subject first —</option></select>
        </div>
      </div>

      <div class="field" style="margin-top:4px">
        <label>Content (short)</label>
        <textarea id="snContentInput" rows="4" maxlength="800" placeholder="Quick note — key points, formula, mnemonic…" style="min-height:90px">${escHtml(n.content)}</textarea>
        <div style="font-size:.68rem;color:var(--text-3);margin-top:4px">
          <span id="snCharCount">${(n.content || '').length}</span> / 800 characters
        </div>
      </div>

      <div style="margin-top:4px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <label style="font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-2)">🔗 External Links</label>
          <button type="button" class="btn btn-secondary btn-sm" id="snAddLinkBtn" style="padding:5px 12px;font-size:.72rem">＋ Add Link</button>
        </div>
        <div id="snLinksWrap">${buildLinksHTML()}</div>
      </div>

      <label style="display:flex;gap:8px;align-items:center;margin-top:6px;font-size:.85rem">
        <input type="checkbox" id="snPinned" ${n.pinned ? 'checked' : ''} style="width:16px;height:16px">
        📌 Pin this note
      </label>
    `;

    openModal(
      modalShell({
        title: existing ? '✏️ Edit Short Note' : '📝 New Short Note',
        subtitle: existing ? 'Update your note' : 'Save a quick note with links',
        body,
        actions: `<button class="btn btn-secondary" data-close>Cancel</button>
          <button class="btn btn-primary" id="snSaveBtn">${existing ? 'Save' : 'Create'}</button>`,
      }),
      {
        onMount() {
          const catSel = document.getElementById('snCategory');
          const subjSel = document.getElementById('snSubject');
          const topicSel = document.getElementById('snTopic');

          function populateSubjects(cat, preserveSubj) {
            if (!cat) {
              subjSel.innerHTML = '<option value="">— Select category first —</option>';
              subjSel.disabled = true;
              return;
            }
            const subjects = (typeof getSubjectsForCategory === 'function' ? getSubjectsForCategory(cat) : []) || [];
            subjSel.innerHTML =
              '<option value="">— Any Subject —</option>' +
              subjects.map((s) => `<option value="${escHtml(s)}">${escHtml(s)}</option>`).join('');
            subjSel.disabled = false;
            if (preserveSubj && subjects.includes(preserveSubj)) subjSel.value = preserveSubj;
          }

          function populateTopics(cat, subj, preserveTopic) {
            if (!subj) {
              topicSel.innerHTML = '<option value="">— Select subject first —</option>';
              topicSel.disabled = true;
              return;
            }
            const defaultTopics =
              (typeof getTopicsForCategorySubject === 'function' ? getTopicsForCategorySubject(cat, subj) : []) || [];
            const customTopics = (state.syllabus || [])
              .filter((s) => s.subject === subj && s.topic)
              .map((s) => s.topic);
            const topics = [...new Set([...defaultTopics, ...customTopics])];
            topicSel.innerHTML =
              '<option value="">— Any Topic —</option>' +
              topics.map((t) => `<option value="${escHtml(t)}">${escHtml(t)}</option>`).join('');
            topicSel.disabled = false;
            if (preserveTopic && topics.includes(preserveTopic)) topicSel.value = preserveTopic;
          }

          if (selectedCategory) populateSubjects(selectedCategory, selectedSubject);
          if (selectedSubject) populateTopics(selectedCategory, selectedSubject, selectedTopic);

          catSel.onchange = () => {
            selectedCategory = catSel.value;
            populateSubjects(selectedCategory, '');
            selectedSubject = '';
            selectedTopic = '';
            topicSel.innerHTML = '<option value="">— Select subject first —</option>';
            topicSel.disabled = true;
          };
          subjSel.onchange = () => {
            selectedSubject = subjSel.value;
            populateTopics(selectedCategory, selectedSubject, '');
            selectedTopic = '';
          };
          topicSel.onchange = () => {
            selectedTopic = topicSel.value;
          };

          // Char count
          const contentEl = document.getElementById('snContentInput');
          const charCount = document.getElementById('snCharCount');
          contentEl.oninput = () => {
            charCount.textContent = contentEl.value.length;
          };

          // Link handlers
          function rewireLinks() {
            const wrap = document.getElementById('snLinksWrap');
            wrap.innerHTML = buildLinksHTML();

            wrap.querySelectorAll('[data-link-type]').forEach((el) => {
              el.onchange = () => {
                const i = parseInt(el.dataset.linkType, 10);
                workingLinks[i].type = el.value;
              };
            });
            wrap.querySelectorAll('[data-link-label]').forEach((el) => {
              el.oninput = () => {
                const i = parseInt(el.dataset.linkLabel, 10);
                workingLinks[i].label = el.value;
              };
            });
            wrap.querySelectorAll('[data-link-url]').forEach((el) => {
              el.oninput = () => {
                const i = parseInt(el.dataset.linkUrl, 10);
                workingLinks[i].url = el.value;
              };
            });
            wrap.querySelectorAll('[data-link-del]').forEach((el) => {
              el.onclick = () => {
                const i = parseInt(el.dataset.linkDel, 10);
                workingLinks.splice(i, 1);
                rewireLinks();
              };
            });
          }
          rewireLinks();

          document.getElementById('snAddLinkBtn').onclick = () => {
            workingLinks.push({ type: 'sheet', label: '', url: '' });
            rewireLinks();
          };

          // Save
          document.getElementById('snSaveBtn').onclick = async () => {
            const title = document.getElementById('snTitleInput').value.trim();
            if (!title) {
              toast('Please enter a title', 'err');
              return;
            }

            // Filter empty links
            const cleanLinks = workingLinks.filter((l) => l.url && l.url.trim());

            const payload = {
              title,
              category: catSel.value || null,
              subject: subjSel.value || null,
              topic: topicSel.value || null,
              content: contentEl.value.trim(),
              links: cleanLinks,
              pinned: document.getElementById('snPinned').checked,
              updated_at: new Date().toISOString(),
            };

            const btn = document.getElementById('snSaveBtn');
            btn.disabled = true;
            btn.textContent = '⏳ Saving…';

            try {
              let savedRow;
              if (existing) {
                Object.assign(existing, payload);
                savedRow = existing;
              } else {
                savedRow = {
                  id: safeUUID(),
                  created_at: new Date().toISOString(),
                  ...payload,
                };
                state.notes.push(savedRow);
              }

              if (supa && state.user) {
                const { error } = await supa.from('notes').upsert(
                  {
                    id: savedRow.id,
                    user_id: state.user.id,
                    title: savedRow.title,
                    subject: savedRow.subject,
                    category: savedRow.category,
                    topic: savedRow.topic,
                    content: savedRow.content,
                    links: savedRow.links,
                    pinned: savedRow.pinned,
                    updated_at: savedRow.updated_at,
                  },
                  { onConflict: 'id' },
                );
                if (error) throw error;
              }

              if (typeof closeModal === 'function') closeModal();
              if (typeof toast === 'function') toast(existing ? '✅ Note updated' : '✅ Note created', 'ok');
              renderNotesView();
            } catch (e) {
              console.error('[notes-extras] save error:', e);
              if (typeof toast === 'function') toast('⚠️ Save failed: ' + (e.message || ''), 'err', 5000);
              btn.disabled = false;
              btn.textContent = existing ? 'Save' : 'Create';
            }
          };
        },
      },
    );
  }

  /* ═══════════════ DELETE ═══════════════ */
  async function deleteShortNote(id) {
    const note = state.notes.find((x) => x.id === id);
    if (!note) return;

    const ok = await customConfirm({
      title: 'Delete Note?',
      message: `"${note.title}" will be permanently deleted.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: '🗑️',
      type: 'danger',
    });
    if (!ok) return;

    state.notes = state.notes.filter((x) => x.id !== id);

    if (supa && state.user) {
      try {
        await supa.from('notes').delete().eq('id', id).eq('user_id', state.user.id);
      } catch (e) {
        console.warn('[notes-extras] delete error:', e);
      }
    }

    toast('Note deleted', 'ok');
    renderNotesView();
  }

  /* ═══════════════ PATCH renderNotes ═══════════════ */
  function patchRenderNotes() {
    const _orig = window.renderNotes;
    window.renderNotes = function () {
      if (typeof _orig === 'function') {
        try {
          _orig.call(this);
        } catch (e) {}
      }
      setTimeout(renderNotesView, 10);
    };
    try {
      renderNotes = window.renderNotes;
    } catch (e) {}
    console.log('[notes-extras] patched: renderNotes');
  }

  /* ═══════════════ INIT ═══════════════ */
  let attempts = 0;
  function waitThenStart() {
    const ready =
      typeof renderNotes === 'function' &&
      typeof state === 'object' &&
      state !== null &&
      document.getElementById('view-notes');

    if (ready) {
      injectCSS();
      patchRenderNotes();
      console.log('[notes-extras] ✅ patched all');
    } else {
      attempts++;
      if (attempts > 200) return console.error('[notes-extras] timeout');
      setTimeout(waitThenStart, 50);
    }
  }
  waitThenStart();
})();
