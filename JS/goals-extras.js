/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Goals Extras v7 (FINAL)
   ─────────────────────────────────────────────────────────────
   ✅ Goal Study Mode (pick goal → timer auto-link)
   ✅ No double-prompt — chip visible = skip dropdown
   ✅ FORCE-SAVE — sessions reliably saved to history
   ✅ Units: Hours only
   ✅ Session ↔ Goal auto-increment
   ✅ Analytics strip on Goals page
   ✅ Planner + Goals → Calendar markers
   ✅ Tasks nav hidden
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[goals-extras] v7 loaded');

  /* ═══════════════ HELPERS ═══════════════ */
  function escHtml(str) {
    return String(str || '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  function safeUUID() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function todayKey() {
    const x = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }

  function addDaysKey(days) {
    const x = new Date();
    x.setDate(x.getDate() + days);
    const p = (n) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }

  function findCategoryForSubject(subj) {
    if (!subj || typeof SYLLABUS !== 'object') return '';
    for (const [pid, paper] of Object.entries(SYLLABUS)) {
      if ((paper.subjects || []).some((s) => s.name === subj)) {
        return paper.category || pid;
      }
    }
    return '';
  }

  /* ═══════════════ 1. HIDE TASKS ═══════════════ */
  function hideTasks() {
    const nav = document.querySelector('.nav-item[data-view="tasks"]');
    if (nav) nav.style.display = 'none';
    const view = document.getElementById('view-tasks');
    if (view) view.style.display = 'none';
    const badge = document.getElementById('tasksBadge');
    if (badge) badge.style.display = 'none';
  }

  /* ═══════════════ 2. GOAL SESSION HELPERS ═══════════════ */
  function computeGoalDurationSeconds(goal) {
    const unit = (goal.unit || '').toLowerCase();
    const target = Number(goal.target) || 0;
    if (unit.includes('hour') || unit.includes('hr')) return Math.round(target * 3600);
    if (unit.includes('minute') || unit.includes('min')) return Math.round(target * 60);
    return 0;
  }

  function goalSessionTag(goalId) {
    return `[GOAL:${goalId}]`;
  }

  function extractGoalId(notes) {
    const m = String(notes || '').match(/\[GOAL:([a-f0-9-]{20,})\]/i);
    return m ? m[1] : null;
  }

  /* ═══════════════ 3. INCREMENT GOAL FROM SESSION ═══════════════ */
  async function incrementGoalFromSession(goal, session) {
    if (!goal || goal.current >= goal.target) return false;
    const increment = (session.duration || 0) / 3600;
    if (increment <= 0) return false;

    goal.current = Math.min(goal.target, Math.round(((goal.current || 0) + increment) * 100) / 100);

    if (supa && state.user) {
      try {
        await supa.from('goals').update({ current_value: goal.current }).eq('id', goal.id).eq('user_id', state.user.id);
      } catch (e) {
        console.warn('[goals-extras] goal update failed:', e);
      }
    }
    return true;
  }

  /* ═══════════════ 4. SESSION → GOAL MATCHING ═══════════════ */
  async function processSession(session) {
    if (session._goalProcessed) return;
    session._goalProcessed = true;

    /* A. Explicit goal tag */
    const taggedId = extractGoalId(session.notes);
    if (taggedId) {
      const goal = state.goals.find((g) => g.id === taggedId);
      if (goal && goal.current < goal.target) {
        const ok = await incrementGoalFromSession(goal, session);
        if (ok && typeof toast === 'function') {
          toast(`🎯 Goal updated: ${goal.current} / ${goal.target} ${goal.unit || ''}`, 'ok', 2200);
        }
        if (typeof renderGoals === 'function') renderGoals();
        return;
      }
    }

    /* B. Auto-match */
    const matched = [];
    state.goals.forEach((g) => {
      if (g.current >= g.target) return;
      const unit = (g.unit || '').toLowerCase();
      if (!unit.includes('hour') && !unit.includes('hr')) return;
      if (g.subject && g.subject === session.subject) matched.push(g);
    });
    state.goals.forEach((g) => {
      if (g.current >= g.target) return;
      const unit = (g.unit || '').toLowerCase();
      if (!unit.includes('hour') && !unit.includes('hr')) return;
      if (!g.subject) matched.push(g);
    });

    const unique = [...new Set(matched)];
    if (!unique.length) return;

    for (const g of unique) await incrementGoalFromSession(g, session);
    if (typeof toast === 'function') {
      toast(`🎯 ${unique.length} goal${unique.length > 1 ? 's' : ''} auto-updated`, 'ok', 2000);
    }
    if (typeof renderGoals === 'function') renderGoals();
  }

  /* ═══════════════ 5. SESSION WATCHER ═══════════════ */
  const processedSessionIds = new Set();

  function startSessionWatcher() {
    state.sessions.forEach((s) => processedSessionIds.add(s.id));

    setInterval(() => {
      const newOnes = state.sessions.filter((s) => !processedSessionIds.has(s.id));
      if (!newOnes.length) return;
      newOnes.forEach((s) => {
        processedSessionIds.add(s.id);
        if (!s._goalGenerated) processSession(s);
      });
    }, 900);
  }

  /* ═══════════════ 6. TOGGLE GOAL COMPLETE ═══════════════ */
  async function toggleGoalComplete(goal) {
    const wasDone = goal.current >= goal.target;
    const tag = goalSessionTag(goal.id);
    const linkedSession = state.sessions.find((s) => (s.notes || '').includes(tag));

    if (wasDone) {
      if (linkedSession) {
        state.sessions = state.sessions.filter((s) => s.id !== linkedSession.id);
        processedSessionIds.delete(linkedSession.id);
        if (supa && state.user) {
          try {
            await supa.from('study_sessions').delete().eq('id', linkedSession.id);
          } catch (e) {}
        }
      }
      goal.current = 0;
      if (supa && state.user) {
        try {
          await supa.from('goals').update({ current_value: 0 }).eq('id', goal.id).eq('user_id', state.user.id);
        } catch (e) {}
      }
      if (typeof toast === 'function') toast('↺ Goal reset · session removed', 'info', 2200);
    } else {
      goal.current = goal.target;
      const durationSec = computeGoalDurationSeconds(goal);

      if (durationSec > 0) {
        const now = Date.now();
        const sessionId = linkedSession?.id || safeUUID();
        const session = {
          id: sessionId,
          date: todayKey(),
          ts: now,
          start_time: now - durationSec * 1000,
          end_time: now,
          duration: durationSec,
          subject: goal.subject || 'General Study',
          topic: goal.topic || goal.title,
          study_type: 'New Learning',
          notes: `${tag} Auto-logged from goal: ${goal.title}`,
          productivity: 3,
          energy: 3,
          category: goal.category || null,
          paper: goal.subject || 'General Study',
          _goalGenerated: true,
        };

        const existIdx = state.sessions.findIndex((s) => s.id === sessionId);
        if (existIdx >= 0) state.sessions[existIdx] = session;
        else state.sessions.push(session);
        processedSessionIds.add(sessionId);

        if (supa && state.user) {
          try {
            await supa.from('study_sessions').upsert(
              {
                id: session.id,
                user_id: state.user.id,
                date: session.date,
                start_time: new Date(session.start_time).toISOString(),
                end_time: new Date(session.end_time).toISOString(),
                duration_seconds: session.duration,
                subject: session.subject,
                topic: session.topic,
                study_type: session.study_type,
                notes: session.notes,
                paper: session.paper,
              },
              { onConflict: 'id' },
            );
          } catch (e) {}
        }

        if (typeof toast === 'function') {
          toast(`🎉 Goal complete · ${(durationSec / 3600).toFixed(1)}h added`, 'ok', 3500);
        }
      }

      if (supa && state.user) {
        try {
          await supa
            .from('goals')
            .update({ current_value: goal.current })
            .eq('id', goal.id)
            .eq('user_id', state.user.id);
        } catch (e) {}
      }
    }

    if (typeof renderGoals === 'function') renderGoals();
    if (state.view === 'study' && typeof renderStudy === 'function') renderStudy();
    if (state.view === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
    if (state.view === 'history' && typeof renderHistory === 'function') renderHistory();
    if (state.view === 'calendar' && typeof renderCalendar === 'function') renderCalendar();
  }

  /* ═══════════════ 7. ANALYTICS STRIP ═══════════════ */
  function renderGoalsAnalytics() {
    const view = document.getElementById('view-goals');
    if (!view) return;

    const old = document.getElementById('goalsAnalytics');
    if (old) old.remove();

    const today = todayKey();
    const tomorrow = addDaysKey(1);
    const goals = state.goals || [];
    const active = goals.filter((g) => g.current < g.target);
    const completed = goals.filter((g) => g.current >= g.target);
    const dueToday = goals.filter(
      (g) => g.deadline && String(g.deadline).slice(0, 10) === today && g.current < g.target,
    );
    const dueTomorrow = goals.filter(
      (g) => g.deadline && String(g.deadline).slice(0, 10) === tomorrow && g.current < g.target,
    );
    const overdue = goals.filter((g) => g.deadline && String(g.deadline).slice(0, 10) < today && g.current < g.target);

    const cards = [
      { icon: '🎯', label: 'Active Goals', value: active.length, sub: 'in progress', color: 'var(--purple)' },
      { icon: '✅', label: 'Completed', value: completed.length, sub: 'done', color: 'var(--green)' },
      { icon: '📅', label: 'Due Today', value: dueToday.length, sub: 'deadline today', color: 'var(--pink)' },
      {
        icon: '📆',
        label: 'Due Tomorrow',
        value: dueTomorrow.length,
        sub: 'deadline tomorrow',
        color: 'var(--orange)',
      },
      { icon: '⚠️', label: 'Overdue', value: overdue.length, sub: 'missed deadlines', color: 'var(--red)' },
    ];

    const strip = document.createElement('div');
    strip.id = 'goalsAnalytics';
    strip.style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px';
    strip.innerHTML = cards
      .map(
        (c) => `
      <div class="kpi" style="--c:${c.color};--cb:color-mix(in srgb, ${c.color} 15%, transparent);padding:14px 16px">
        <div class="kpi-top" style="margin-bottom:8px">
          <div class="kpi-icon" style="width:34px;height:34px;font-size:1rem">${c.icon}</div>
        </div>
        <div class="kpi-label">${c.label}</div>
        <div class="kpi-value" style="font-size:1.4rem">${c.value}</div>
        <div class="kpi-sub">${c.sub}</div>
      </div>`,
      )
      .join('');

    const firstCard = view.querySelector('.card');
    if (firstCard) firstCard.insertAdjacentElement('beforebegin', strip);
    else view.insertAdjacentElement('afterbegin', strip);
  }

  /* ═══════════════ 8. PATCH renderGoals ═══════════════ */
  function patchRenderGoals() {
    const _orig = window.renderGoals;
    if (typeof _orig !== 'function') return;

    window.renderGoals = function () {
      _orig.call(this);
      renderGoalsAnalytics();

      const el = document.getElementById('goalsList');
      if (!el) return;

      el.querySelectorAll('[data-goal-done]').forEach((btn) => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = async (e) => {
          e.stopPropagation();
          const g = state.goals.find((x) => x.id === newBtn.dataset.goalDone);
          if (!g) return;
          newBtn.disabled = true;
          await toggleGoalComplete(g);
        };
      });
    };

    try {
      renderGoals = window.renderGoals;
    } catch (e) {}
  }

  /* ═══════════════ 9. GOAL MODAL ═══════════════ */
  function buildLinkSection(g) {
    const CATS = [
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

    return `
      <div style="background:var(--card-2);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-top:4px">
        <button type="button" id="gmLinkToggle" style="width:100%;padding:12px 16px;text-align:left;font-size:.85rem;font-weight:700;display:flex;align-items:center;gap:10px;color:var(--text-2);background:transparent;border:none;cursor:pointer;">
          <span id="gmLinkArrow" style="font-size:.7rem;transition:transform .2s;display:inline-block">▶</span>
          <span>🔗 Link to specific content</span>
          <span style="color:var(--text-3);font-weight:500;font-size:.75rem">(optional)</span>
        </button>
        <div id="gmLinkBody" style="display:none;padding:0 16px 16px">
          <div class="field">
            <label>Category</label>
            <select id="gmCategory">${CATS.map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}</select>
          </div>
          <div class="field">
            <label>Subject</label>
            <select id="gmSubject" disabled><option value="">— Select category first —</option></select>
          </div>
          <div class="field">
            <label>Topic (optional)</label>
            <select id="gmTopic" disabled><option value="">— Select subject first —</option></select>
          </div>
          <div style="font-size:.72rem;color:var(--text-3);line-height:1.6;margin-top:8px">
            Leave empty to count <strong>all study sessions (global)</strong>. Pick a subject to only count that subject.
          </div>
        </div>
      </div>`;
  }

  function patchOpenGoalModal() {
    const _orig = window.openGoalModal;
    if (typeof _orig !== 'function') return;

    window.openGoalModal = function (existing) {
      const g = existing || {
        type: 'daily',
        title: '',
        target: 8,
        unit: 'hours',
        deadline: '',
        current: 0,
        subject: '',
        topic: '',
        category: '',
      };

      if (existing && g.subject && !g.category) {
        g.category = findCategoryForSubject(g.subject) || '';
      }

      openModal(
        modalShell({
          title: existing ? 'Edit Goal' : 'New Goal',
          body: `
            <div class="field">
              <label>Title</label>
              <input type="text" id="gmTitle" value="${escHtml(g.title)}" maxlength="120" placeholder="e.g. Study History 2 hours">
            </div>
            <div class="form-grid">
              <div class="field">
                <label>Type</label>
                <select id="gmType">
                  ${['daily', 'weekly', 'monthly', 'custom'].map((t) => `<option ${g.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label>Unit</label>
                <select id="gmUnit">
                  <option value="hours" selected>⏱ Hours</option>
                </select>
              </div>
            </div>
            <div class="form-grid">
              <div class="field">
                <label>Target</label>
                <input type="number" id="gmTarget" min="0.5" step="0.5" value="${g.target}">
              </div>
              <div class="field">
                <label>Deadline (optional)</label>
                <input type="date" id="gmDeadline" value="${g.deadline || ''}">
              </div>
            </div>
            ${buildLinkSection(g)}
            <div style="padding:12px 14px;background:linear-gradient(135deg,rgba(168,85,247,.09),rgba(236,72,153,.05));border:1px solid rgba(168,85,247,.28);border-radius:10px;font-size:.78rem;color:#C4B5FD;line-height:1.65;margin-top:6px">
              <div style="font-weight:800;color:#E9D5FF;margin-bottom:6px">💡 How it works</div>
              <div style="display:flex;gap:8px;margin-bottom:4px"><span>⏱</span><div><strong>Hours</strong> — Completing the goal adds those hours to your <strong>Study Time &amp; History</strong>.</div></div>
              <div style="display:flex;gap:8px"><span>🔗</span><div><strong>Link</strong> — Optional. Leave empty to count <em>all sessions (global)</em>.</div></div>
            </div>
          `,
          actions: `<button class="btn btn-ghost" data-close>Cancel</button>
            <button class="btn btn-primary" id="gmSave">${existing ? 'Save' : 'Create'}</button>`,
        }),
        {
          onMount() {
            const toggleBtn = document.getElementById('gmLinkToggle');
            const bodyEl = document.getElementById('gmLinkBody');
            const arrowEl = document.getElementById('gmLinkArrow');

            if (g.subject || g.topic) {
              bodyEl.style.display = 'block';
              arrowEl.style.transform = 'rotate(90deg)';
            }

            toggleBtn.onclick = () => {
              const open = bodyEl.style.display !== 'none';
              bodyEl.style.display = open ? 'none' : 'block';
              arrowEl.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
            };

            const catSel = document.getElementById('gmCategory');
            const subjSel = document.getElementById('gmSubject');
            const topicSel = document.getElementById('gmTopic');

            if (g.category) catSel.value = g.category;

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

            if (g.category) populateSubjects(g.category, g.subject);
            if (g.subject) populateTopics(g.category, g.subject, g.topic);

            catSel.onchange = () => {
              populateSubjects(catSel.value, '');
              topicSel.innerHTML = '<option value="">— Select subject first —</option>';
              topicSel.disabled = true;
            };
            subjSel.onchange = () => populateTopics(catSel.value, subjSel.value, '');

            document.getElementById('gmSave').onclick = async () => {
              const title = document.getElementById('gmTitle').value.trim();
              if (!title) {
                if (typeof toast === 'function') toast('Enter a title.', 'err');
                return;
              }

              const payload = {
                type: document.getElementById('gmType').value,
                title,
                target: parseFloat(document.getElementById('gmTarget').value) || 1,
                unit: 'hours',
                deadline: document.getElementById('gmDeadline').value || null,
                subject: subjSel.value || null,
                topic: topicSel.value || null,
                category: catSel.value || null,
                status: 'active',
              };

              let row;
              if (existing) {
                Object.assign(existing, payload);
                row = existing;
              } else {
                row = { id: safeUUID(), current: 0, ...payload };
                state.goals.push(row);
              }

              if (supa && state.user) {
                try {
                  const insertPayload = {
                    id: row.id,
                    user_id: state.user.id,
                    type: row.type,
                    title: row.title,
                    target_value: row.target,
                    current_value: row.current,
                    unit: row.unit,
                    deadline: row.deadline,
                    status: row.status,
                  };
                  if (row.subject) insertPayload.subject = row.subject;
                  if (row.topic) insertPayload.topic = row.topic;
                  if (row.category) insertPayload.category = row.category;
                  const { error } = await supa.from('goals').upsert(insertPayload, { onConflict: 'id' });
                  if (error) throw error;
                  if (typeof toast === 'function') toast('✅ Saved!', 'ok');
                } catch (e) {
                  console.warn('[goals-extras] upsert:', e);
                  if (typeof toast === 'function') toast('⚠️ Cloud: ' + (e.message || ''), 'warn', 4000);
                }
              }
              if (typeof closeModal === 'function') closeModal();
              if (typeof renderGoals === 'function') renderGoals();
              if (typeof renderGoalStudyPanelContent === 'function') {
                setTimeout(renderGoalStudyPanelContent, 100);
              }
            };
          },
        },
      );
    };

    try {
      openGoalModal = window.openGoalModal;
    } catch (e) {}
  }

  /* ═══════════════ 10. INJECT GOAL LINK IN SESSION MODALS ═══════════════ */
  function injectGoalLink(modalBox, isSaveSession) {
    if (!modalBox || modalBox.querySelector('#sessionGoalLink')) return;

    const activeGoals = (state.goals || []).filter((g) => g.current < g.target);
    if (!activeGoals.length) return;

    const body = modalBox.querySelector('.modal-body');
    if (!body) return;

    const opts = activeGoals
      .map((g) => {
        const remaining = Math.max(0, (g.target || 0) - (g.current || 0));
        const progress = `${(g.current || 0).toFixed(1)} / ${g.target} ${g.unit || 'h'}`;
        return `<option value="${g.id}">🎯 ${escHtml(g.title)} — ${progress} (${remaining.toFixed(1)} ${g.unit || 'h'} left)</option>`;
      })
      .join('');

    const html = `
      <div id="sessionGoalLink" style="padding:14px;background:linear-gradient(135deg,rgba(251,191,36,.12),rgba(236,72,153,.06));border:1px solid rgba(251,191,36,.4);border-radius:12px;margin-bottom:14px">
        <label style="color:#FBBF24;display:flex;align-items:center;gap:8px;font-weight:800;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">
          <span>🎯</span> Is this part of a goal?
        </label>
        <select id="sessionGoalSelect" style="width:100%;background:var(--bg-2);border:1.5px solid var(--border);border-radius:11px;padding:11px 13px;font-size:.86rem;color:var(--text)">
          <option value="">— No, independent study —</option>
          ${opts}
        </select>
        <div id="sessionGoalHint" style="font-size:.72rem;color:#C4B5FD;margin-top:8px;line-height:1.5;display:none;padding:8px 10px;background:rgba(0,0,0,.22);border-radius:8px"></div>
      </div>`;

    body.insertAdjacentHTML('afterbegin', html);

    const sel = document.getElementById('sessionGoalSelect');
    const hint = document.getElementById('sessionGoalHint');

    sel.onchange = () => {
      const gid = sel.value;
      if (!gid) {
        hint.style.display = 'none';
        return;
      }
      const goal = state.goals.find((g) => g.id === gid);
      if (!goal) return;

      const remaining = Math.max(0, goal.target - goal.current);
      hint.style.display = 'block';
      hint.innerHTML = `
        ✨ This session will count toward <strong style="color:#E9D5FF">${escHtml(goal.title)}</strong>.<br>
        ⏱ <strong>${remaining.toFixed(1)} ${goal.unit || 'hours'}</strong> remaining.
      `;

      if (!isSaveSession && goal.subject) {
        const catSel = document.getElementById('mlCategory');
        const subjSel = document.getElementById('mlSubject');
        const topicInput = document.getElementById('mlTopic');

        if (catSel && goal.category) {
          catSel.value = goal.category;
          catSel.dispatchEvent(new Event('change'));
        }
        setTimeout(() => {
          if (subjSel && goal.subject) {
            const hasOpt = Array.from(subjSel.options).some((o) => o.value === goal.subject);
            if (hasOpt) subjSel.value = goal.subject;
          }
          if (topicInput && goal.topic) topicInput.value = goal.topic;
        }, 60);
      }
    };
  }

  /* Patch openModal — skip dropdown when chip present */
  function patchOpenModal() {
    const _orig = window.openModal;
    if (typeof _orig !== 'function') return;

    window.openModal = function (html, opts) {
      _orig.call(this, html, opts);
      setTimeout(() => {
        const box = document.getElementById('modalBox');
        if (!box) return;
        const hasSessType = !!box.querySelector('#sessType');
        const hasMlType = !!box.querySelector('#mlType');
        if (!hasSessType && !hasMlType) return;

        /* SKIP if goal-timer chip already injected */
        if (box.querySelector('.goal-timer-chip')) return;
        /* SKIP if a timer-linked goal flag is set */
        if (state._timerHasGoal) return;

        injectGoalLink(box, hasSessType);
      }, 200); /* Longer timeout ensures chip is added first */
    };

    try {
      openModal = window.openModal;
    } catch (e) {}
  }

  /* ═══════════════ 11. TAG NOTES ON SAVE ═══════════════ */
  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target && e.target.closest && e.target.closest('#confirmSave, #mlSave');
      if (!btn) return;

      const sel = document.getElementById('sessionGoalSelect');
      if (!sel || !sel.value) return;

      const isSess = !!document.getElementById('sessNotes');
      const isMl = !!document.getElementById('mlNotes');
      const notesId = isSess ? 'sessNotes' : isMl ? 'mlNotes' : null;
      if (!notesId) return;

      const notesEl = document.getElementById(notesId);
      if (!notesEl) return;

      const tag = `[GOAL:${sel.value}]`;
      if (!notesEl.value.includes(tag)) {
        notesEl.value = (notesEl.value ? notesEl.value.trim() + '\n' : '') + tag;
      }
    },
    true,
  );

  /* ═══════════════ 12. FORCE-SAVE SESSIONS (history reliability) ═══════════════ */
  function patchForceSaveSessions() {
    document.addEventListener(
      'click',
      async (e) => {
        const btn = e.target && e.target.closest && e.target.closest('#confirmSave, #mlSave');
        if (!btn) return;

        /* Wait for original async save to finish */
        setTimeout(async () => {
          if (typeof supa === 'undefined' || !supa || !state.user) return;

          const sessions = state.sessions || [];
          if (!sessions.length) return;

          /* Find sessions created in last 30 seconds */
          const recent = sessions.filter((s) => s.ts && Date.now() - s.ts < 30000);
          if (!recent.length) return;

          for (const sess of recent) {
            try {
              const { data, error: checkErr } = await supa
                .from('study_sessions')
                .select('id')
                .eq('id', sess.id)
                .maybeSingle();

              if (checkErr) {
                console.warn('[goals-extras] DB check error:', checkErr);
                continue;
              }
              if (data) continue; /* Already saved */

              console.log('[goals-extras] Force-saving session:', sess.id);

              /* Build clean payload — only known columns */
              const payload = {
                id: sess.id,
                user_id: state.user.id,
                date: sess.date || todayKey(),
                start_time: new Date(sess.start_time || Date.now()).toISOString(),
                end_time: new Date(sess.end_time || Date.now()).toISOString(),
                duration_seconds: sess.duration || 0,
                subject: sess.subject || 'General Study',
                topic: sess.topic || null,
                study_type: sess.study_type || 'New Learning',
                notes: sess.notes || '',
                productivity: sess.productivity || 3,
                energy: sess.energy || 3,
                paper: sess.paper || sess.subject || 'General Study',
              };

              const { error: insErr } = await supa.from('study_sessions').insert(payload);

              if (insErr) {
                console.error('[goals-extras] ❌ Force save failed:', insErr);
                console.error('   code:', insErr.code, '| message:', insErr.message);
                if (typeof toast === 'function') {
                  toast('⚠️ Save issue: ' + (insErr.message || 'Unknown'), 'warn', 5000);
                }
              } else {
                console.log('[goals-extras] ✅ Force save OK');
              }
            } catch (err) {
              console.error('[goals-extras] Force save exception:', err);
            }
          }
        }, 1800);
      },
      true,
    );
    console.log('[goals-extras] patched: forceSaveSessions');
  }

  /* ═══════════════ 13. CALENDAR SYNC ═══════════════ */
  function patchCalendarMarkers() {
    const _orig = window.renderCalendar;
    if (typeof _orig !== 'function') return;
    window.renderCalendar = function () {
      _orig.call(this);
      setTimeout(injectPlannerGoalMarkers, 80);
    };
    try {
      renderCalendar = window.renderCalendar;
    } catch (e) {}
  }

  function injectPlannerGoalMarkers() {
    const grid = document.getElementById('calGrid');
    if (!grid) return;
    grid.querySelectorAll('[data-cal-day]').forEach((dayEl) => {
      const key = dayEl.dataset.calDay;
      if (!key) return;
      dayEl.querySelectorAll('.cal-pl-goal-marker').forEach((x) => x.remove());

      const plans = (state.plans || []).filter((p) => p.date === key);
      const goalsDue = (state.goals || []).filter((g) => {
        if (!g.deadline) return false;
        const d = String(g.deadline).slice(0, 10);
        return d === key && g.current < g.target;
      });
      if (!plans.length && !goalsDue.length) return;

      let topPx = 26;
      let html = '';
      if (plans.length) {
        html += `<span class="cal-pl-goal-marker" title="${plans.length} planned block(s)" style="position:absolute;top:${topPx}px;right:6px;font-size:.6rem;font-weight:900;background:rgba(20,184,166,.28);color:#5EEAD4;padding:1px 6px;border-radius:20px;pointer-events:none;">📅 ${plans.length}</span>`;
        topPx += 18;
      }
      if (goalsDue.length) {
        html += `<span class="cal-pl-goal-marker" title="${goalsDue.length} goal(s) due" style="position:absolute;top:${topPx}px;right:6px;font-size:.6rem;font-weight:900;background:rgba(251,191,36,.28);color:#FBBF24;padding:1px 6px;border-radius:20px;pointer-events:none;">🎯 ${goalsDue.length}</span>`;
      }
      if (html) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        while (wrapper.firstChild) dayEl.appendChild(wrapper.firstChild);
      }
    });
  }

  function patchOpenDayDetail() {
    const _orig = window.openDayDetail;
    if (typeof _orig !== 'function') return;
    window.openDayDetail = function (key) {
      _orig.call(this, key);
      setTimeout(() => {
        const plans = (state.plans || []).filter((p) => p.date === key);
        if (!plans.length) return;
        const modalBody = document.querySelector('#modalBox .modal-body');
        if (!modalBody) return;
        const plannerHTML = `
          <div style="padding:12px;background:rgba(20,184,166,.08);border:1px solid rgba(20,184,166,.3);border-radius:10px;margin-bottom:14px;margin-top:14px">
            <div style="font-size:.72rem;font-weight:800;color:#5EEAD4;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">
              📅 Planned Blocks (${plans.length})
            </div>
            ${plans
              .map(
                (p) => `
              <div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:.83rem">
                <span style="color:${p.completed ? 'var(--emerald)' : 'var(--text-3)'}">${p.completed ? '✓' : '○'}</span>
                <strong style="flex:1">${escHtml(p.subject)}</strong>
                <span style="color:var(--text-3);font-size:.75rem">${p.start}–${p.end} · ${p.target_minutes}m</span>
              </div>`,
              )
              .join('')}
          </div>`;
        const firstDiv = modalBody.querySelector('div');
        if (firstDiv && firstDiv.nextSibling) firstDiv.insertAdjacentHTML('afterend', plannerHTML);
        else modalBody.insertAdjacentHTML('afterbegin', plannerHTML);
      }, 60);
    };
    try {
      openDayDetail = window.openDayDetail;
    } catch (e) {}
  }

  /* ═══════════════ 14. GOAL STUDY MODE — Panel Content ═══════════════ */
  function renderGoalStudyPanelContent() {
    const panel = document.getElementById('goalStudyPanel');
    if (!panel) return;

    const activeGoals = (state.goals || []).filter((g) => g.current < g.target);

    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-size:1.4rem">🎯</span>
        <div style="flex:1">
          <div style="font-weight:800;font-size:1rem;color:#FBBF24">Goal Study Mode</div>
          <div style="font-size:.76rem;color:var(--text-3);margin-top:2px">Select a goal — timer will auto-link to it</div>
        </div>
      </div>
      ${
        activeGoals.length === 0
          ? `
        <div style="padding:16px;background:rgba(0,0,0,.2);border-radius:10px;text-align:center;font-size:.85rem;color:var(--text-2)">
          <div style="font-size:1.5rem;margin-bottom:6px">📭</div>
          No active goals yet.<br>
          <button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="switchView('goals');setTimeout(()=>document.getElementById('addGoalBtn').click(),200)">+ Create Goal</button>
        </div>`
          : `
        <div class="field">
          <label style="color:#FBBF24">Select Goal</label>
          <select id="goalStudySelect" style="width:100%;background:var(--bg-2);border:1.5px solid rgba(251,191,36,.4);border-radius:11px;padding:12px 14px;font-size:.88rem;color:var(--text)">
            <option value="">— Choose a goal —</option>
            ${activeGoals
              .map((g) => {
                const remaining = Math.max(0, (g.target || 0) - (g.current || 0));
                return `<option value="${g.id}">🎯 ${escHtml(g.title)} (${remaining.toFixed(1)} ${escHtml(g.unit || 'h')} left)</option>`;
              })
              .join('')}
          </select>
        </div>
        <div id="goalStudyInfo" style="display:none;padding:12px 14px;background:rgba(0,0,0,.22);border-radius:10px;font-size:.82rem;color:#C4B5FD;line-height:1.65;margin-top:10px"></div>`
      }`;

    const sel = document.getElementById('goalStudySelect');
    if (sel) {
      sel.onchange = () => {
        const gid = sel.value;
        const info = document.getElementById('goalStudyInfo');
        if (!gid) {
          info.style.display = 'none';
          return;
        }

        const goal = state.goals.find((g) => g.id === gid);
        if (!goal) return;

        const remaining = Math.max(0, goal.target - goal.current);
        info.style.display = 'block';
        info.innerHTML = `
          <strong style="color:#E9D5FF">${escHtml(goal.title)}</strong><br>
          ⏱ ${remaining.toFixed(1)} ${escHtml(goal.unit || 'hours')} remaining — timer hours will auto-add to this goal.
          ${goal.subject ? `<br>📚 Subject: <strong style="color:#E9D5FF">${escHtml(goal.subject)}</strong>` : ''}
          ${goal.topic ? `<br>📖 Topic: <strong style="color:#E9D5FF">${escHtml(goal.topic)}</strong>` : ''}`;

        if (goal.subject) {
          state.draft.category = goal.category || findCategoryForSubject(goal.subject) || 'prelims';
          state.draft.subject = goal.subject;
          state.draft.topic = goal.topic || null;
          if (typeof renderCategoryChips === 'function') renderCategoryChips();
          if (typeof renderSubjectSelector === 'function') renderSubjectSelector();
          if (typeof renderTopicSelect === 'function') renderTopicSelect();
        } else {
          state.draft.category = state.draft.category || 'prelims';
          state.draft.subject = goal.title;
          state.draft.topic = goal.topic || null;
        }
      };
    }
  }

  /* ═══════════════ 14b. GOAL STUDY MODE — Panel inject ═══════════════ */
  function injectGoalStudyMode() {
    const modesEl = document.getElementById('timerModes');
    if (!modesEl) return;

    if (!modesEl.querySelector('[data-mode="goal"]')) {
      const chip = document.createElement('button');
      chip.className = 'mode-chip';
      chip.dataset.mode = 'goal';
      chip.textContent = '🎯 Goal Study';
      modesEl.appendChild(chip);
    }

    const whatStudying = document.querySelector('.what-studying');
    if (!whatStudying) return;

    let panel = document.getElementById('goalStudyPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'goalStudyPanel';
      panel.style.cssText =
        'display:none;padding:18px;background:linear-gradient(135deg,rgba(251,191,36,.1),rgba(236,72,153,.06));border:1.5px solid rgba(251,191,36,.4);border-radius:14px;margin-bottom:18px';
      const catChips = document.getElementById('categoryChips');
      if (catChips && catChips.parentElement) catChips.parentElement.insertBefore(panel, catChips);
      else whatStudying.insertBefore(panel, whatStudying.firstChild);
    }

    if (!modesEl._goalModeWired) {
      modesEl._goalModeWired = true;
      modesEl.addEventListener('click', (e) => {
        const chip = e.target.closest('.mode-chip');
        if (!chip) return;
        const mode = chip.dataset.mode;

        const panelEl = document.getElementById('goalStudyPanel');
        const catChipsEl = document.getElementById('categoryChips');
        const subjSelector = document.getElementById('subjectSelector');
        const topicPicker = document.querySelector('.topic-picker');

        if (mode === 'goal') {
          state._goalStudyMode = true;
          if (panelEl) {
            panelEl.style.display = 'block';
            renderGoalStudyPanelContent();
          }
          if (catChipsEl) catChipsEl.style.display = 'none';
          if (subjSelector) subjSelector.style.display = 'none';
          if (topicPicker) topicPicker.style.display = 'none';
          document.querySelectorAll('.step-label').forEach((el) => (el.style.display = 'none'));
        } else {
          state._goalStudyMode = false;
          if (panelEl) panelEl.style.display = 'none';
          if (catChipsEl) catChipsEl.style.display = '';
          if (subjSelector) subjSelector.style.display = '';
          if (topicPicker) topicPicker.style.display = '';
          document.querySelectorAll('.step-label').forEach((el) => (el.style.display = ''));
        }
      });
    }

    renderGoalStudyPanelContent();
  }

  function patchRenderStudyForGoalMode() {
    const _orig = window.renderStudy;
    if (typeof _orig !== 'function') return;
    window.renderStudy = function () {
      _orig.call(this);
      setTimeout(injectGoalStudyMode, 30);
    };
    try {
      renderStudy = window.renderStudy;
    } catch (e) {}
  }

  /* ═══════════════ 15. START TIMER WITH GOAL ═══════════════ */
  function patchStartTimerForGoalMode() {
    const _orig = window.startTimer;
    if (typeof _orig !== 'function') return;

    window.startTimer = function () {
      if (state._goalStudyMode) {
        const sel = document.getElementById('goalStudySelect');
        const gid = sel ? sel.value : '';
        if (!gid) {
          if (typeof toast === 'function') toast('Please select a goal first', 'err', 3000);
          const panel = document.getElementById('goalStudyPanel');
          if (panel) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            panel.style.boxShadow = '0 0 0 3px rgba(239,68,68,.4)';
            setTimeout(() => {
              panel.style.boxShadow = '';
            }, 1500);
          }
          return;
        }

        const goal = state.goals.find((g) => g.id === gid);
        if (!goal) {
          if (typeof toast === 'function') toast('Goal not found', 'err');
          return;
        }

        if (!state.draft.subject) {
          state.draft.subject = goal.subject || goal.title;
          state.draft.category = goal.category || 'prelims';
        }

        _orig.call(this);

        if (state.timer) {
          state.timer.goalId = gid;
          state.timer.goalTitle = goal.title;
          state._timerHasGoal = true; /* ⬅️ FLAG — skip double-prompt */
          try {
            localStorage.setItem('upsc_tracker_v5_state.timer', JSON.stringify(state.timer));
          } catch (e) {}
          if (typeof toast === 'function') {
            toast(`🎯 Timer started · linked to "${goal.title}"`, 'ok', 2500);
          }
        }
      } else {
        _orig.call(this);
      }
    };

    try {
      startTimer = window.startTimer;
    } catch (e) {}
  }

  /* ═══════════════ 16. SAVE MODAL — Add chip when goal linked ═══════════════ */
  function patchSaveSessionModalForGoal() {
    const _orig = window.openSaveSessionModal;
    if (typeof _orig !== 'function') return;

    window.openSaveSessionModal = function (snap) {
      _orig.call(this, snap);

      if (snap && snap.goalId) {
        /* Add chip FAST (30ms) so openModal's 200ms check skips dropdown */
        setTimeout(() => {
          const notesEl = document.getElementById('sessNotes');
          if (notesEl) {
            const tag = `[GOAL:${snap.goalId}]`;
            if (!notesEl.value.includes(tag)) {
              notesEl.value = (notesEl.value ? notesEl.value.trim() + '\n' : '') + tag;
            }
          }
          const modal = document.querySelector('#modalBox .modal-body');
          if (modal && !modal.querySelector('.goal-timer-chip')) {
            const chip = document.createElement('div');
            chip.className = 'goal-timer-chip';
            chip.style.cssText =
              'padding:10px 14px;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.4);border-radius:10px;font-size:.82rem;color:#FBBF24;margin-bottom:12px;display:flex;align-items:center;gap:8px';
            chip.innerHTML = `<span>🎯</span><div>Linked to goal: <strong>${escHtml(snap.goalTitle || 'Goal')}</strong></div>`;
            modal.insertBefore(chip, modal.firstChild);
          }
        }, 30);
      }
    };

    try {
      openSaveSessionModal = window.openSaveSessionModal;
    } catch (e) {}
  }

  /* ═══════════════ 17. MANUAL LOG — Auto-select goal ═══════════════ */
  function patchManualLogForGoal() {
    const _orig = window.openManualLogModal;
    if (typeof _orig !== 'function') return;

    window.openManualLogModal = function () {
      _orig.call(this);

      if (state._goalStudyMode) {
        const sel = document.getElementById('goalStudySelect');
        const gid = sel ? sel.value : '';
        if (gid) {
          setTimeout(() => {
            const modalSel = document.getElementById('sessionGoalSelect');
            if (modalSel) {
              modalSel.value = gid;
              modalSel.dispatchEvent(new Event('change'));
            }
          }, 80);
        }
      }
    };

    try {
      openManualLogModal = window.openManualLogModal;
    } catch (e) {}
  }

  /* ═══════════════ 18. RESET FLAG AFTER SAVE ═══════════════ */
  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target && e.target.closest && e.target.closest('#confirmSave, #mlSave, [data-close]');
      if (!btn) return;
      /* Delay reset so save handler completes */
      setTimeout(() => {
        state._timerHasGoal = false;
      }, 2200);
    },
    true,
  );

  /* ═══════════════ INIT ═══════════════ */
  let attempts = 0;
  function waitThenStart() {
    const ready =
      typeof renderGoals === 'function' &&
      typeof state === 'object' &&
      state !== null &&
      document.getElementById('view-goals');

    if (ready) {
      hideTasks();
      patchRenderGoals();
      patchOpenGoalModal();
      patchOpenModal();
      startSessionWatcher();
      patchRenderStudyForGoalMode();
      patchStartTimerForGoalMode();
      patchSaveSessionModalForGoal();
      patchManualLogForGoal();
      patchForceSaveSessions(); /* ⬅️ NEW — force save fix */

      setTimeout(() => {
        patchCalendarMarkers();
        patchOpenDayDetail();
        injectGoalStudyMode();
        if (typeof renderCalendar === 'function') renderCalendar();
      }, 500);

      /* Auto-refresh Goal Study panel */
      setInterval(() => {
        if (state._goalStudyMode) {
          const panel = document.getElementById('goalStudyPanel');
          if (panel && panel.style.display !== 'none') {
            const sel = document.getElementById('goalStudySelect');
            const currentVal = sel ? sel.value : '';
            if (!currentVal) renderGoalStudyPanelContent();
          }
        }
      }, 3000);

      console.log('[goals-extras] ✅ patched all');
    } else {
      attempts++;
      if (attempts > 200) {
        console.error('[goals-extras] timeout');
        return;
      }
      setTimeout(waitThenStart, 50);
    }
  }

  waitThenStart();
})();
