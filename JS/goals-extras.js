/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Goals Extras v1 (FINAL)
   ─────────────────────────────────────────────────────────────
   ✅ Goal completion PERSISTS on refresh (RLS + await fix)
   ✅ Tasks nav + view HIDDEN (merged into Goals)
   ✅ Goals auto-increment when you log sessions
   ✅ Planner blocks SHOW in Calendar (markers)
   ✅ Goals (with deadline) SHOW in Calendar
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[goals-extras] v1 loaded');

  /* ═══════════════ 1. HIDE TASKS NAV + VIEW ═══════════════ */
  function hideTasks() {
    const navTasks = document.querySelector('.nav-item[data-view="tasks"]');
    if (navTasks) navTasks.style.display = 'none';

    const viewTasks = document.getElementById('view-tasks');
    if (viewTasks) viewTasks.style.display = 'none';

    // Also hide Tasks badge in sidebar
    const badge = document.getElementById('tasksBadge');
    if (badge) badge.style.display = 'none';

    console.log('[goals-extras] tasks hidden');
  }

  /* ═══════════════ 2. FIX GOAL TOGGLE — PERSIST PROPERLY ═══════════════ */
  function patchRenderGoals() {
    const _orig = window.renderGoals;
    if (typeof _orig !== 'function') {
      console.warn('[goals-extras] renderGoals not found');
      return;
    }

    window.renderGoals = function () {
      _orig.call(this);

      const el = document.getElementById('goalsList');
      if (!el) return;

      // Re-wire toggle buttons with proper async + error handling
      el.querySelectorAll('[data-goal-done]').forEach((b) => {
        const newBtn = b.cloneNode(true);
        b.parentNode.replaceChild(newBtn, b);

        newBtn.onclick = async () => {
          const g = state.goals.find((x) => x.id === newBtn.dataset.goalDone);
          if (!g) return;

          const wasDone = g.current >= g.target;
          const oldVal = g.current;
          const newVal = wasDone ? 0 : g.target;

          // Optimistic UI update
          g.current = newVal;
          newBtn.disabled = true;

          if (supa && state.user) {
            try {
              const { error } = await supa
                .from('goals')
                .update({ current_value: newVal })
                .eq('id', g.id)
                .eq('user_id', state.user.id);

              if (error) throw error;

              console.log('[goals-extras] goal persisted:', newVal);
              if (typeof toast === 'function') {
                toast(wasDone ? '↺ Goal reset' : '🎉 Goal completed!', 'ok', 2200);
              }
            } catch (e) {
              console.error('[goals-extras] goal update failed:', e);
              g.current = oldVal;
              if (typeof toast === 'function') {
                toast('❌ Save failed — ' + (e.message || 'Unknown'), 'err', 4000);
              }
            }
          }

          newBtn.disabled = false;
          window.renderGoals();
        };
      });
    };

    try {
      renderGoals = window.renderGoals;
    } catch (e) {}

    console.log('[goals-extras] patched: renderGoals');
  }

  /* ═══════════════ 3. AUTO-INCREMENT GOALS FROM SESSIONS ═══════════════ */
  async function autoIncrementGoals(session) {
    if (!state.goals.length) return;

    const durHours = (session.duration || 0) / 3600;
    if (durHours <= 0) return;

    const updates = [];

    state.goals.forEach((g) => {
      if (g.status === 'completed') return;
      if (g.current >= g.target) return;

      const unit = (g.unit || '').toLowerCase();
      const isHourGoal = unit.includes('hour') || unit.includes('hr');
      const isSessionGoal = unit.includes('session');
      const hasSubject = g.subject && g.subject.length > 0;
      const matchesSubject = hasSubject && g.subject === session.subject;

      // Match rules:
      //   - Hour goal + no subject → any session counts
      //   - Hour goal + subject    → only that subject's session counts
      //   - Session goal           → increment by 1 per session
      let increment = 0;

      if (isHourGoal) {
        if (!hasSubject || matchesSubject) increment = durHours;
      } else if (isSessionGoal) {
        if (!hasSubject || matchesSubject) increment = 1;
      } else {
        // Unknown unit → skip
        return;
      }

      if (increment <= 0) return;

      const newCurrent = Math.min((g.current || 0) + increment, g.target);
      g.current = Math.round(newCurrent * 100) / 100; // 2 decimal
      updates.push(g);
    });

    if (updates.length && supa && state.user) {
      for (const g of updates) {
        try {
          await supa.from('goals').update({ current_value: g.current }).eq('id', g.id).eq('user_id', state.user.id);
        } catch (e) {
          console.warn('[goals-extras] auto-increment failed:', g.id, e);
        }
      }

      if (typeof toast === 'function') {
        toast(`🎯 ${updates.length} goal${updates.length > 1 ? 's' : ''} updated`, 'ok', 2000);
      }
      if (typeof renderGoals === 'function') renderGoals();
    }
  }

  /* ═══════════════ 4. WATCH SESSIONS — TRIGGER GOAL INCREMENT ═══════════════ */
  function watchSessions() {
    let lastCount = state.sessions.length;
    let lastTotalSec = state.sessions.reduce((a, s) => a + (s.duration || 0), 0);

    setInterval(() => {
      const newCount = state.sessions.length;
      const newTotal = state.sessions.reduce((a, s) => a + (s.duration || 0), 0);

      if (newCount > lastCount) {
        // New sessions added
        const newSessions = state.sessions.slice(lastCount);
        newSessions.forEach((s) => autoIncrementGoals(s));
      }

      lastCount = newCount;
      lastTotalSec = newTotal;
    }, 900);

    console.log('[goals-extras] watching sessions');
  }

  /* ═══════════════ 5. PATCH openGoalModal — Add Subject dropdown ═══════════════ */
  function patchOpenGoalModal() {
    const _orig = window.openGoalModal;
    if (typeof _orig !== 'function') {
      console.warn('[goals-extras] openGoalModal not found');
      return;
    }

    window.openGoalModal = function (existing) {
      const g = existing || {
        type: 'daily',
        title: '',
        target: 8,
        unit: 'hours',
        deadline: '',
        current: 0,
        subject: '',
      };

      // Build subject list
      const subjects = new Set();
      state.sessions.forEach((s) => s.subject && subjects.add(s.subject));
      state.subjects.forEach((s) => s.name && subjects.add(s.name));
      if (typeof SYLLABUS === 'object' && SYLLABUS) {
        Object.values(SYLLABUS).forEach((paper) => {
          (paper.subjects || []).forEach((sub) => sub.name && subjects.add(sub.name));
        });
      }
      const subjectList = [...subjects].sort();

      openModal(
        modalShell({
          title: existing ? 'Edit Goal' : 'New Goal',
          body: `
            <div class="field">
              <label>Title</label>
              <input type="text" id="gmTitle" value="${escHtml(g.title)}" maxlength="120" placeholder="e.g. Study History daily">
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
                  <option value="hours" ${g.unit === 'hours' ? 'selected' : ''}>Hours</option>
                  <option value="sessions" ${g.unit === 'sessions' ? 'selected' : ''}>Sessions</option>
                  <option value="topics" ${g.unit === 'topics' ? 'selected' : ''}>Topics</option>
                </select>
              </div>
            </div>
            
            <div class="form-grid">
              <div class="field">
                <label>Target</label>
                <input type="number" id="gmTarget" min="1" step="0.5" value="${g.target}">
              </div>
              <div class="field">
                <label>Deadline (optional)</label>
                <input type="date" id="gmDeadline" value="${g.deadline || ''}">
              </div>
            </div>
            
            <div class="field">
              <label>Subject (optional)</label>
              <select id="gmSubject">
                <option value="">— Any / All Subjects —</option>
                ${subjectList
                  .map(
                    (s) => `<option value="${escHtml(s)}" ${g.subject === s ? 'selected' : ''}>${escHtml(s)}</option>`,
                  )
                  .join('')}
              </select>
              <div style="font-size:.72rem;color:var(--text-3);margin-top:6px;line-height:1.5">
                💡 Subject choose karoge toh jab us subject ko study karoge, ye goal automatically badhega.
                Khali chhodo toh saare sessions count honge.
              </div>
            </div>
          `,
          actions: `<button class="btn btn-ghost" data-close>Cancel</button>
            <button class="btn btn-primary" id="gmSave">${existing ? 'Save' : 'Create'}</button>`,
        }),
        {
          onMount() {
            document.getElementById('gmSave').onclick = async () => {
              const title = document.getElementById('gmTitle').value.trim();
              if (!title) {
                toast('Enter title.', 'err');
                return;
              }
              const payload = {
                type: document.getElementById('gmType').value,
                title,
                target: parseFloat(document.getElementById('gmTarget').value) || 1,
                unit: document.getElementById('gmUnit').value,
                deadline: document.getElementById('gmDeadline').value || null,
                subject: document.getElementById('gmSubject').value || null,
                status: 'active',
              };

              let row;
              if (existing) {
                Object.assign(existing, payload);
                row = existing;
              } else {
                row = { id: uuid(), current: 0, ...payload };
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
                  // Only include subject if column exists (try-catch)
                  if (row.subject) insertPayload.subject = row.subject;

                  const { error } = await supa.from('goals').upsert(insertPayload, { onConflict: 'id' });

                  if (error) throw error;
                  toast('✅ Saved!', 'ok');
                } catch (e) {
                  console.warn('[goals-extras] upsert failed:', e);
                  toast('⚠️ Cloud save: ' + (e.message || 'Check SQL'), 'warn', 5000);
                }
              } else {
                toast('Saved locally', 'ok');
              }

              closeModal();
              renderGoals();
            };
          },
        },
      );
    };

    try {
      openGoalModal = window.openGoalModal;
    } catch (e) {}

    console.log('[goals-extras] patched: openGoalModal');
  }

  function escHtml(str) {
    return String(str || '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  /* ═══════════════ 6. CALENDAR SYNC — Planner + Goals markers ═══════════════ */
  function patchCalendarMarkers() {
    const _orig = window.renderCalendar;
    if (typeof _orig !== 'function') return false;

    window.renderCalendar = function () {
      _orig.call(this);
      // Post-render, add our custom markers
      setTimeout(injectPlannerGoalMarkers, 80);
    };

    try {
      renderCalendar = window.renderCalendar;
    } catch (e) {}

    console.log('[goals-extras] patched: renderCalendar (planner/goal markers)');
    return true;
  }

  function injectPlannerGoalMarkers() {
    const grid = document.getElementById('calGrid');
    if (!grid) return;

    grid.querySelectorAll('[data-cal-day]').forEach((dayEl) => {
      const key = dayEl.dataset.calDay;
      if (!key) return;

      // Remove old injected markers
      dayEl.querySelectorAll('.cal-pl-goal-marker').forEach((x) => x.remove());

      const plans = (state.plans || []).filter((p) => p.date === key);
      const goalsDue = (state.goals || []).filter((g) => {
        if (!g.deadline) return false;
        const d = String(g.deadline).slice(0, 10);
        return d === key && g.current < g.target;
      });

      if (!plans.length && !goalsDue.length) return;

      let topPx = 6;
      let html = '';

      if (plans.length) {
        html += `<span class="cal-pl-goal-marker" title="${plans.length} planned block(s)" style="
          position:absolute;top:${topPx}px;right:6px;
          font-size:.6rem;font-weight:900;
          background:rgba(20,184,166,.28);color:#5EEAD4;
          padding:1px 6px;border-radius:20px;
          pointer-events:none;
        ">📅 ${plans.length}</span>`;
        topPx += 18;
      }

      if (goalsDue.length) {
        html += `<span class="cal-pl-goal-marker" title="${goalsDue.length} goal(s) due" style="
          position:absolute;top:${topPx}px;right:6px;
          font-size:.6rem;font-weight:900;
          background:rgba(251,191,36,.28);color:#FBBF24;
          padding:1px 6px;border-radius:20px;
          pointer-events:none;
        ">🎯 ${goalsDue.length}</span>`;
      }

      if (html) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        while (wrapper.firstChild) dayEl.appendChild(wrapper.firstChild);
      }
    });
  }

  /* ═══════════════ 7. EXTEND getGoalsDueOn FOR DAY DETAIL ═══════════════ */
  // (Calendar-extras already handles goals with deadlines — no patch needed)

  /* ═══════════════ 8. SHOW PLANNER BLOCKS IN DAY DETAIL ═══════════════ */
  function patchOpenDayDetail() {
    const _orig = window.openDayDetail;
    if (typeof _orig !== 'function') return;

    window.openDayDetail = function (key) {
      // Call original first
      _orig.call(this, key);

      // Then augment modal with planner blocks if any
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
              </div>
            `,
              )
              .join('')}
          </div>
        `;

        // Insert after the top stats grid
        const firstDiv = modalBody.querySelector('div');
        if (firstDiv && firstDiv.nextSibling) {
          firstDiv.insertAdjacentHTML('afterend', plannerHTML);
        } else {
          modalBody.insertAdjacentHTML('afterbegin', plannerHTML);
        }
      }, 60);
    };

    try {
      openDayDetail = window.openDayDetail;
    } catch (e) {}

    console.log('[goals-extras] patched: openDayDetail (planner in day detail)');
  }

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
      patchSessionWatch();
      watchSessions();

      // Calendar patch (wait for calendar-extras to load first)
      setTimeout(() => {
        patchCalendarMarkers();
        patchOpenDayDetail();
        // Trigger a re-render to inject markers
        if (typeof renderCalendar === 'function') renderCalendar();
      }, 500);

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

  function patchSessionWatch() {
    // Extra: hook on renderAll so goals refresh after session save
    const _orig = window.renderAll;
    if (typeof _orig !== 'function') return;
    window.renderAll = function () {
      _orig.call(this);
      if (state.view === 'goals' && typeof renderGoals === 'function') renderGoals();
    };
    try {
      renderAll = window.renderAll;
    } catch (e) {}
  }

  waitThenStart();
})();
