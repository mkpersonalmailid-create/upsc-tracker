/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Tests Extras v1 (PYQ + Mock merged)
   ─────────────────────────────────────────────────────────────
   ✅ Unified Test records (PYQ / Mock / Sectional / Full)
   ✅ Category → Subject → Topic linking
   ✅ Accuracy analytics + graphs
   ✅ AI-style personalized suggestions
   ✅ Subject coverage tracking
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[tests-extras] v1 loaded');

  /* ═══════════════ HELPERS ═══════════════ */
  function escHtml(str) {
    return String(str || '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function safeUUID() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'tr-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }
  function todayKey() {
    const x = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  function fmtDate(key) {
    if (!key) return '—';
    const d = new Date(key + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function pct(n) {
    return Math.round(n * 100) + '%';
  }

  const TEST_TYPES = [
    { id: 'pyq', label: '📜 PYQ', color: '#A855F7' },
    { id: 'mock', label: '📋 Mock', color: '#EC4899' },
    { id: 'sectional', label: '🧩 Sectional', color: '#14B8A6' },
    { id: 'full', label: '🎯 Full-Length', color: '#F97316' },
  ];

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

  function getAccuracy(t) {
    if (!t.attempted) return 0;
    return (t.correct || 0) / t.attempted;
  }

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    if (document.getElementById('testsExtrasCSS')) return;
    const style = document.createElement('style');
    style.id = 'testsExtrasCSS';
    style.textContent = `
      .tt-record {
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
      }
      .tt-record:hover {
        border-color: var(--border-2);
        transform: translateX(3px);
      }
      .tt-record::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: var(--tc, var(--purple));
        border-radius: 3px 0 0 3px;
      }
      .tt-record-body { flex: 1; min-width: 0; }
      .tt-record-title {
        font-weight: 800;
        font-size: .92rem;
        margin-bottom: 6px;
        color: var(--text);
      }
      .tt-record-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        font-size: .7rem;
      }
      .tt-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: 20px;
        font-size: .65rem;
        font-weight: 800;
        white-space: nowrap;
        background: var(--card);
        color: var(--text-2);
      }
      .tt-record-stats {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        flex-shrink: 0;
      }
      .tt-accuracy {
        font-size: 1.15rem;
        font-weight: 900;
        letter-spacing: -.02em;
      }
      .tt-accuracy.good { color: var(--emerald); }
      .tt-accuracy.mid { color: var(--amber); }
      .tt-accuracy.bad { color: var(--red); }
      .tt-score-sub {
        font-size: .68rem;
        color: var(--text-3);
        font-weight: 600;
      }
      .tt-del {
        width: 30px; height: 30px;
        border-radius: 8px;
        background: transparent;
        border: none;
        color: var(--text-3);
        cursor: pointer;
        font-size: .85rem;
        flex-shrink: 0;
        transition: all .2s;
      }
      .tt-del:hover {
        background: rgba(239,68,68,.12);
        color: #FCA5A5;
      }

      .tt-ai-item {
        display: flex;
        gap: 12px;
        padding: 12px 14px;
        background: rgba(0,0,0,.2);
        border-radius: 10px;
        border-left: 3px solid var(--purple);
        align-items: flex-start;
        margin-bottom: 8px;
      }
      .tt-ai-item.good { border-left-color: var(--emerald); }
      .tt-ai-item.warn { border-left-color: var(--amber); }
      .tt-ai-item.bad { border-left-color: var(--red); }
      .tt-ai-ico { font-size: 1.15rem; flex-shrink: 0; }
      .tt-ai-text {
        font-size: .85rem;
        line-height: 1.55;
        color: var(--text-2);
      }
      .tt-ai-text strong { color: var(--text); }

      .tt-subject-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: var(--card-2);
        border-radius: 10px;
        margin-bottom: 6px;
      }
      .tt-subject-name {
        flex: 1;
        font-weight: 700;
        font-size: .85rem;
      }
      .tt-subject-bar {
        width: 80px;
        height: 6px;
        background: var(--bg);
        border-radius: 20px;
        overflow: hidden;
      }
      .tt-subject-fill {
        height: 100%;
        border-radius: 20px;
        transition: width .5s;
      }
      .tt-subject-pct {
        font-weight: 800;
        font-size: .8rem;
        min-width: 42px;
        text-align: right;
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════ KPI DASHBOARD ═══════════════ */
  function buildDashboard(records) {
    const total = records.length;
    const totalQ = records.reduce((a, r) => a + (r.attempted || 0), 0);
    const totalCorrect = records.reduce((a, r) => a + (r.correct || 0), 0);
    const avgAcc = totalQ ? totalCorrect / totalQ : 0;
    const bestAcc = total ? Math.max(...records.map((r) => getAccuracy(r))) : 0;
    const subjectsCovered = new Set(records.map((r) => r.subject).filter(Boolean)).size;

    const cards = [
      { icon: '📝', label: 'Total Tests', value: total, sub: 'attempted', color: 'var(--purple)' },
      {
        icon: '🎯',
        label: 'Avg Accuracy',
        value: pct(avgAcc),
        sub: `${totalCorrect}/${totalQ} correct`,
        color: 'var(--emerald)',
      },
      { icon: '🏆', label: 'Best Accuracy', value: pct(bestAcc), sub: 'personal record', color: 'var(--amber)' },
      { icon: '📚', label: 'Subjects', value: subjectsCovered, sub: 'covered', color: 'var(--pink)' },
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
        <div class="kpi-sub">${c.sub}</div>
      </div>`,
      )
      .join('');
    return strip;
  }

  /* ═══════════════ FILTER ═══════════════ */
  let testFilter = { type: '', subject: '', search: '' };

  function buildFilterBar(records) {
    const subjects = [...new Set(records.map((r) => r.subject).filter(Boolean))].sort();

    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center';

    bar.innerHTML = `
      <input type="text" id="ttSearch" placeholder="🔍 Search tests…" value="${escHtml(testFilter.search)}"
        style="flex:1;min-width:160px;background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:.85rem;color:var(--text)">
      <select id="ttType" style="background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:.82rem;color:var(--text);min-width:130px">
        <option value="">All Types</option>
        ${TEST_TYPES.map((t) => `<option value="${t.id}" ${testFilter.type === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
      </select>
      <select id="ttSubject" style="background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:.82rem;color:var(--text);min-width:150px">
        <option value="">All Subjects</option>
        ${subjects.map((s) => `<option value="${escHtml(s)}" ${testFilter.subject === s ? 'selected' : ''}>${escHtml(s)}</option>`).join('')}
      </select>
    `;

    setTimeout(() => {
      const s = bar.querySelector('#ttSearch');
      const t = bar.querySelector('#ttType');
      const sb = bar.querySelector('#ttSubject');
      if (s)
        s.oninput = (e) => {
          testFilter.search = e.target.value.toLowerCase();
          renderTestsView();
        };
      if (t)
        t.onchange = (e) => {
          testFilter.type = e.target.value;
          renderTestsView();
        };
      if (sb)
        sb.onchange = (e) => {
          testFilter.subject = e.target.value;
          renderTestsView();
        };
    }, 0);

    return bar;
  }

  /* ═══════════════ RECORD ROW ═══════════════ */
  function buildRecord(t) {
    const acc = getAccuracy(t);
    const accClass = acc >= 0.7 ? 'good' : acc >= 0.5 ? 'mid' : 'bad';
    const typeObj = TEST_TYPES.find((x) => x.id === t.test_type) || TEST_TYPES[1];
    const catLabel = CAT_OPTIONS.find((c) => c.id === t.category)?.label || '';

    const row = document.createElement('div');
    row.className = 'tt-record';
    row.style.setProperty('--tc', typeObj.color);

    row.innerHTML = `
      <div class="tt-record-body">
        <div class="tt-record-title">${escHtml(t.name || 'Untitled Test')}</div>
        <div class="tt-record-meta">
          <span class="tt-chip" style="background:${typeObj.color}22;color:${typeObj.color}">${typeObj.label}</span>
          ${catLabel ? `<span class="tt-chip">${escHtml(catLabel)}</span>` : ''}
          ${t.subject ? `<span class="tt-chip">📚 ${escHtml(t.subject)}</span>` : ''}
          ${t.topic ? `<span class="tt-chip">📖 ${escHtml(t.topic)}</span>` : ''}
          <span class="tt-chip">📅 ${fmtDate(t.date)}</span>
          ${t.time_taken ? `<span class="tt-chip">⏱ ${t.time_taken}m</span>` : ''}
        </div>
      </div>
      <div class="tt-record-stats">
        <div class="tt-accuracy ${accClass}">${t.attempted ? pct(acc) : '—'}</div>
        <div class="tt-score-sub">${t.correct || 0}/${t.attempted || 0} correct</div>
        ${t.total_marks ? `<div class="tt-score-sub">Score: ${t.score || 0}/${t.total_marks}</div>` : ''}
      </div>
      <button class="tt-del" data-tt-del="${t.id}" title="Delete">✕</button>
    `;

    setTimeout(() => {
      row.querySelector('[data-tt-del]').onclick = () => deleteTestRecord(t.id);
    }, 0);

    return row;
  }

  /* ═══════════════ SUBJECT ACCURACY ═══════════════ */
  function buildSubjectAccuracy(records) {
    const bySubj = {};
    records.forEach((r) => {
      if (!r.subject || !r.attempted) return;
      if (!bySubj[r.subject]) bySubj[r.subject] = { correct: 0, attempted: 0, tests: 0 };
      bySubj[r.subject].correct += r.correct || 0;
      bySubj[r.subject].attempted += r.attempted || 0;
      bySubj[r.subject].tests++;
    });

    const entries = Object.entries(bySubj).sort((a, b) => getAcc(b[1]) - getAcc(a[1]));
    function getAcc(x) {
      return x.attempted ? x.correct / x.attempted : 0;
    }

    if (!entries.length) return null;

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = '18px';
    card.innerHTML = `
      <div class="card-header"><span class="card-title-lg">📊 Subject-wise Accuracy</span></div>
      <div style="margin-top:10px">
        ${entries
          .map(([subj, data]) => {
            const acc = getAcc(data);
            const cls = acc >= 0.7 ? 'var(--emerald)' : acc >= 0.5 ? 'var(--amber)' : 'var(--red)';
            return `
            <div class="tt-subject-row">
              <div style="width:26px;height:26px;border-radius:50%;background:${cls};display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;color:#fff;flex-shrink:0">${data.tests}</div>
              <div class="tt-subject-name">${escHtml(subj)}</div>
              <div class="tt-subject-bar"><div class="tt-subject-fill" style="width:${acc * 100}%;background:${cls}"></div></div>
              <div class="tt-subject-pct" style="color:${cls}">${pct(acc)}</div>
            </div>`;
          })
          .join('')}
      </div>`;
    return card;
  }

  /* ═══════════════ AI SUGGESTIONS ═══════════════ */
  function buildAISuggestions(records) {
    const out = [];

    if (!records.length) {
      out.push({ icon: '📌', type: 'info', text: 'Log your first test to unlock personalized performance insights.' });
      return out;
    }

    // Subject-wise accuracy
    const bySubj = {};
    records.forEach((r) => {
      if (!r.subject || !r.attempted) return;
      if (!bySubj[r.subject]) bySubj[r.subject] = { correct: 0, attempted: 0, tests: 0 };
      bySubj[r.subject].correct += r.correct || 0;
      bySubj[r.subject].attempted += r.attempted || 0;
      bySubj[r.subject].tests++;
    });

    const accOf = (x) => (x.attempted ? x.correct / x.attempted : 0);

    // Weak subjects
    const weak = Object.entries(bySubj)
      .filter(([, d]) => accOf(d) < 0.5 && d.tests >= 1)
      .sort((a, b) => accOf(a[1]) - accOf(b[1]));
    if (weak.length) {
      out.push({
        icon: '⚠️',
        type: 'bad',
        text: `Focus area: <strong>${weak
          .slice(0, 3)
          .map(([s]) => s)
          .join(', ')}</strong> — accuracy below 50%. Revise these subjects and retake sectional tests.`,
      });
    }

    // Strong subjects
    const strong = Object.entries(bySubj)
      .filter(([, d]) => accOf(d) >= 0.75 && d.tests >= 2)
      .sort((a, b) => accOf(b[1]) - accOf(a[1]));
    if (strong.length) {
      out.push({
        icon: '🏆',
        type: 'good',
        text: `Strong in <strong>${strong
          .slice(0, 3)
          .map(([s]) => s)
          .join(', ')}</strong> — accuracy 75%+. Maintain with regular quick revisions.`,
      });
    }

    // Subjects not tested
    const allSubjects = new Set();
    if (typeof SYLLABUS === 'object') {
      Object.values(SYLLABUS).forEach((p) => p.subjects.forEach((s) => allSubjects.add(s.name)));
    }
    const notTested = [...allSubjects].filter((s) => !bySubj[s]);
    if (notTested.length > 3) {
      out.push({
        icon: '📌',
        type: 'warn',
        text: `<strong>${notTested.length} subjects</strong> never tested yet: ${notTested.slice(0, 4).join(', ')}. Schedule sectional tests for them.`,
      });
    }

    // Accuracy trend — compare last 5 vs previous 5
    const sorted = [...records].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (sorted.length >= 6) {
      const recent5 = sorted.slice(0, 5);
      const prev5 = sorted.slice(5, 10);
      const recAcc = recent5.reduce((a, r) => a + getAccuracy(r), 0) / recent5.length;
      const prevAcc = prev5.length ? prev5.reduce((a, r) => a + getAccuracy(r), 0) / prev5.length : 0;
      if (prev5.length) {
        const diff = (recAcc - prevAcc) * 100;
        if (diff >= 5) {
          out.push({
            icon: '📈',
            type: 'good',
            text: `Accuracy up <strong>${diff.toFixed(1)}%</strong> in last 5 tests — great momentum!`,
          });
        } else if (diff <= -5) {
          out.push({
            icon: '📉',
            type: 'warn',
            text: `Accuracy dropped <strong>${Math.abs(diff).toFixed(1)}%</strong> recently — review mistakes and slow down.`,
          });
        }
      }
    }

    // Test type balance
    const typeCounts = {};
    records.forEach((r) => {
      typeCounts[r.test_type || 'mock'] = (typeCounts[r.test_type || 'mock'] || 0) + 1;
    });
    const pyqCount = typeCounts['pyq'] || 0;
    if (records.length >= 5 && pyqCount === 0) {
      out.push({
        icon: '📜',
        type: 'warn',
        text: `No <strong>PYQ (Previous Year Questions)</strong> attempted yet. PYQs are the single best predictor of UPSC — start now.`,
      });
    }

    // Consistency — last 30 days
    const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const recentTests = records.filter((r) => r.date >= thirtyAgo).length;
    if (recentTests >= 8) {
      out.push({
        icon: '🔥',
        type: 'good',
        text: `<strong>${recentTests} tests</strong> in last 30 days — excellent test-taking consistency.`,
      });
    } else if (records.length > 0 && recentTests <= 2) {
      out.push({
        icon: '⏰',
        type: 'warn',
        text: `Only <strong>${recentTests} test${recentTests === 1 ? '' : 's'}</strong> in last 30 days. Aim for 1 test every 2-3 days.`,
      });
    }

    return out;
  }

  /* ═══════════════ RENDER MAIN ═══════════════ */
  function renderTestsView() {
    const view = document.getElementById('view-tests');
    if (!view) return;

    injectCSS();

    const card = view.querySelector('.card');
    if (!card) return;

    const titleEl = card.querySelector('.card-title-lg');
    if (titleEl) titleEl.textContent = '📋 Tests';

    let body = card.querySelector('#ttBody');
    if (!body) {
      body = document.createElement('div');
      body.id = 'ttBody';
      card.appendChild(body);
    }

    body.innerHTML = '';

    const records = state.testRecords || [];

    // 1. Dashboard
    body.appendChild(buildDashboard(records));

    // 2. Filter
    body.appendChild(buildFilterBar(records));

    // 3. Filter
    let filtered = records.slice();
    if (testFilter.search) {
      const q = testFilter.search;
      filtered = filtered.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(q) ||
          (r.subject || '').toLowerCase().includes(q) ||
          (r.topic || '').toLowerCase().includes(q),
      );
    }
    if (testFilter.type) filtered = filtered.filter((r) => r.test_type === testFilter.type);
    if (testFilter.subject) filtered = filtered.filter((r) => r.subject === testFilter.subject);

    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // 4. Records list
    const sectionHead = document.createElement('div');
    sectionHead.style.cssText = 'margin-top:16px;margin-bottom:10px;display:flex;align-items:center;gap:8px';
    sectionHead.innerHTML = `
      <span style="font-size:.78rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--text-2)">📋 Records</span>
      <span style="font-size:.68rem;font-weight:800;padding:2px 10px;border-radius:20px;background:var(--card-2);color:var(--text-3)">${filtered.length}</span>
    `;
    body.appendChild(sectionHead);

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.style.padding = '30px 20px';
      empty.innerHTML = `
        <div class="em">📋</div>
        <h4>${records.length ? 'No tests match your filters' : 'No tests logged yet'}</h4>
        <p>Track PYQs, mock tests, and sectionals — all in one place.</p>
        <button class="btn btn-primary" id="ttEmptyAdd">＋ Log First Test</button>
      `;
      body.appendChild(empty);
      const b = empty.querySelector('#ttEmptyAdd');
      if (b) b.onclick = () => openTestModal();
      return;
    }

    filtered.forEach((r) => body.appendChild(buildRecord(r)));

    // 5. Subject accuracy
    const subjAcc = buildSubjectAccuracy(records);
    if (subjAcc) body.appendChild(subjAcc);

    // 6. AI suggestions
    const aiCard = document.createElement('div');
    aiCard.className = 'ai-card';
    aiCard.style.marginTop = '18px';
    const insights = buildAISuggestions(records);
    aiCard.innerHTML = `
      <span class="ai-badge">✨ Personalized Insights</span>
      <div class="ai-list" style="margin-top:10px">
        ${insights
          .map(
            (i) =>
              `<div class="tt-ai-item ${i.type || 'info'}"><span class="tt-ai-ico">${i.icon}</span><div class="tt-ai-text">${i.text}</div></div>`,
          )
          .join('')}
      </div>
    `;
    body.appendChild(aiCard);

    if (typeof attachRipples === 'function') attachRipples();
  }

  /* ═══════════════ OPEN ADD/EDIT MODAL ═══════════════ */
  function openTestModal() {
    const body = `
      <div class="field">
        <label>Test Name</label>
        <input type="text" id="ttName" placeholder="e.g. Vision Prelims Mock 1 / UPSC 2023 GS Paper I" maxlength="150">
      </div>

      <div class="form-grid">
        <div class="field">
          <label>Type</label>
          <select id="ttTestType">
            ${TEST_TYPES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Date</label>
          <input type="date" id="ttDate" value="${todayKey()}">
        </div>
      </div>

      <div style="background:var(--card-2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-top:4px">
        <div style="font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);margin-bottom:10px">🎯 Link to Category / Subject</div>
        <div class="form-grid">
          <div class="field">
            <label>Category</label>
            <select id="ttCat">
              ${CAT_OPTIONS.map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Subject</label>
            <select id="ttSubj" disabled><option value="">— Select category first —</option></select>
          </div>
        </div>
        <div class="field">
          <label>Topic (optional)</label>
          <select id="ttTopic" disabled><option value="">— Select subject first —</option></select>
        </div>
      </div>

      <div class="form-grid form-grid-3" style="margin-top:6px">
        <div class="field"><label>Total Qs</label><input type="number" id="ttTotal" min="0" value="100"></div>
        <div class="field"><label>Attempted</label><input type="number" id="ttAttempted" min="0" value="0"></div>
        <div class="field"><label>Correct</label><input type="number" id="ttCorrect" min="0" value="0"></div>
      </div>

      <div class="form-grid form-grid-3">
        <div class="field"><label>Total Marks</label><input type="number" id="ttTotalMarks" min="0" value="0"></div>
        <div class="field"><label>Score</label><input type="number" id="ttScore" min="0" value="0"></div>
        <div class="field"><label>Time (min)</label><input type="number" id="ttTime" min="0" value="120"></div>
      </div>

      <div style="padding:10px 14px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.28);border-radius:10px;font-size:.78rem;color:#C4B5FD;line-height:1.6;margin-top:6px">
        <strong style="color:#E9D5FF">💡 Live calc:</strong> Incorrect = Attempted − Correct · Accuracy = Correct / Attempted
        <div id="ttLiveCalc" style="margin-top:6px;font-family:var(--mono);font-size:.72rem;color:#E9D5FF">—</div>
      </div>

      <div class="field">
        <label>Notes (optional)</label>
        <textarea id="ttNotes" rows="3" placeholder="Mistakes, learnings, weak areas…"></textarea>
      </div>
    `;

    openModal(
      modalShell({
        title: '📋 Log Test Record',
        subtitle: 'PYQ / Mock / Sectional / Full',
        body,
        actions: `<button class="btn btn-secondary" data-close>Cancel</button>
          <button class="btn btn-primary" id="ttSaveBtn">Save Record</button>`,
      }),
      {
        onMount() {
          const catSel = document.getElementById('ttCat');
          const subjSel = document.getElementById('ttSubj');
          const topicSel = document.getElementById('ttTopic');

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

          catSel.onchange = () => {
            populateSubjects(catSel.value, '');
            topicSel.innerHTML = '<option value="">— Select subject first —</option>';
            topicSel.disabled = true;
          };
          subjSel.onchange = () => populateTopics(catSel.value, subjSel.value, '');

          // Live calc
          function updateCalc() {
            const att = parseInt(document.getElementById('ttAttempted').value, 10) || 0;
            const cor = parseInt(document.getElementById('ttCorrect').value, 10) || 0;
            const inc = Math.max(0, att - cor);
            const acc = att ? ((cor / att) * 100).toFixed(1) : '0.0';
            document.getElementById('ttLiveCalc').textContent = `Incorrect: ${inc} · Accuracy: ${acc}%`;
          }
          ['ttAttempted', 'ttCorrect'].forEach((id) => {
            document.getElementById(id).oninput = updateCalc;
          });
          updateCalc();

          document.getElementById('ttSaveBtn').onclick = async () => {
            const name = document.getElementById('ttName').value.trim();
            if (!name) {
              toast('Please enter a test name', 'err');
              return;
            }
            const attempted = parseInt(document.getElementById('ttAttempted').value, 10) || 0;
            const correct = parseInt(document.getElementById('ttCorrect').value, 10) || 0;
            if (correct > attempted) {
              toast('Correct cannot exceed Attempted', 'err');
              return;
            }

            const record = {
              id: safeUUID(),
              name,
              test_type: document.getElementById('ttTestType').value,
              date: document.getElementById('ttDate').value || todayKey(),
              category: catSel.value || null,
              subject: subjSel.value || null,
              topic: topicSel.value || null,
              total_questions: parseInt(document.getElementById('ttTotal').value, 10) || 0,
              attempted,
              correct,
              incorrect: Math.max(0, attempted - correct),
              total_marks: parseFloat(document.getElementById('ttTotalMarks').value) || 0,
              score: parseFloat(document.getElementById('ttScore').value) || 0,
              time_taken: parseInt(document.getElementById('ttTime').value, 10) || 0,
              notes: document.getElementById('ttNotes').value.trim(),
              created_at: new Date().toISOString(),
            };

            state.testRecords = state.testRecords || [];
            state.testRecords.push(record);

            const btn = document.getElementById('ttSaveBtn');
            btn.disabled = true;
            btn.textContent = '⏳ Saving…';

            try {
              if (supa && state.user) {
                const { error } = await supa.from('test_records').insert({ ...record, user_id: state.user.id });
                if (error) throw error;
              }
              if (typeof closeModal === 'function') closeModal();
              if (typeof toast === 'function') toast('✅ Test logged!', 'ok');
              if (typeof confetti === 'function') confetti();
              renderTestsView();
            } catch (e) {
              console.error('[tests-extras] save error:', e);
              if (typeof toast === 'function') toast('⚠️ Save failed: ' + (e.message || ''), 'err', 5000);
              state.testRecords = state.testRecords.filter((x) => x.id !== record.id);
              btn.disabled = false;
              btn.textContent = 'Save Record';
            }
          };
        },
      },
    );
  }

  /* ═══════════════ DELETE ═══════════════ */
  async function deleteTestRecord(id) {
    const rec = (state.testRecords || []).find((x) => x.id === id);
    if (!rec) return;

    const ok = await customConfirm({
      title: 'Delete Test Record?',
      message: `"${rec.name}" will be permanently removed.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: '🗑️',
      type: 'danger',
    });
    if (!ok) return;

    state.testRecords = state.testRecords.filter((x) => x.id !== id);

    if (supa && state.user) {
      try {
        await supa.from('test_records').delete().eq('id', id).eq('user_id', state.user.id);
      } catch (e) {
        console.warn('[tests-extras] delete error:', e);
      }
    }

    toast('Record deleted', 'ok');
    renderTestsView();
  }

  /* ═══════════════ LOAD FROM DB ═══════════════ */
  async function loadTestRecords() {
    if (!supa || !state.user) return;
    try {
      const { data, error } = await supa
        .from('test_records')
        .select('*')
        .eq('user_id', state.user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      state.testRecords = (data || []).map((x) => ({
        id: x.id,
        name: x.name,
        test_type: x.test_type || 'mock',
        date: x.date,
        category: x.category,
        subject: x.subject,
        topic: x.topic,
        total_questions: x.total_questions || 0,
        attempted: x.attempted || 0,
        correct: x.correct || 0,
        incorrect: x.incorrect || 0,
        total_marks: x.total_marks || 0,
        score: x.score || 0,
        time_taken: x.time_taken || 0,
        notes: x.notes || '',
        created_at: x.created_at,
      }));
      console.log('[tests-extras] loaded', state.testRecords.length, 'records');
    } catch (e) {
      console.warn('[tests-extras] load error:', e);
      state.testRecords = state.testRecords || [];
    }
  }

  /* ═══════════════ PATCH renderTests ═══════════════ */
  function patchRenderTests() {
    window.renderTests = function () {
      renderTestsView();
      // Wire "Add Test" button
      const addBtn = document.getElementById('addTestBtn');
      if (addBtn) addBtn.onclick = () => openTestModal();
    };
    try {
      renderTests = window.renderTests;
    } catch (e) {}
  }

  /* ═══════════════ INIT ═══════════════ */
  let attempts = 0;
  function waitThenStart() {
    const ready = typeof state === 'object' && state !== null && document.getElementById('view-tests');

    if (ready) {
      injectCSS();
      patchRenderTests();

      // Load records from DB
      const checkUser = setInterval(() => {
        if (state.user && supa) {
          clearInterval(checkUser);
          loadTestRecords().then(() => {
            if (state.view === 'tests') renderTestsView();
          });
        }
      }, 500);

      console.log('[tests-extras] ✅ patched all');
    } else {
      attempts++;
      if (attempts > 200) return console.error('[tests-extras] timeout');
      setTimeout(waitThenStart, 50);
    }
  }
  waitThenStart();
})();
