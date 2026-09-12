/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Planner Extras v1
   ─────────────────────────────────────────────────────────────
   ✅ Planner blocks persist on refresh (Supabase)
   ✅ Toggle complete syncs to DB
   ✅ Delete syncs to DB
   ✅ Loads all plans on login
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[planner-extras] v1 loaded');

  /* ═══════════════ LOAD PLANS FROM DB ═══════════════ */
  async function loadPlansFromDB() {
    if (!supa || !state.user) return;
    try {
      const { data, error } = await supa
        .from('plans')
        .select('*')
        .eq('user_id', state.user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data?.length) {
        state.plans = data.map((x) => ({
          id: x.id,
          date: x.date,
          start: x.start_time || '09:00',
          end: x.end_time || '11:00',
          subject: x.subject || 'Study',
          target_minutes: x.target_minutes || 60,
          completed: !!x.completed,
        }));
      } else {
        state.plans = state.plans || [];
      }
      console.log('[planner-extras] loaded', state.plans.length, 'plans');
    } catch (e) {
      console.warn('[planner-extras] load error:', e);
    }
  }

  /* ═══════════════ PATCH addPlanBlock — save to DB ═══════════════ */
  function patchAddPlanBlock() {
    const _orig = window.addPlanBlock;
    if (typeof _orig !== 'function') return;

    window.addPlanBlock = function (dateKeyStr) {
      _orig.call(this, dateKeyStr);

      /* After modal opens, rewire save button */
      setTimeout(() => {
        const saveBtn = document.getElementById('pbSave');
        if (!saveBtn) return;

        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);

        newBtn.onclick = async () => {
          const p = {
            id: crypto?.randomUUID
              ? crypto.randomUUID()
              : 'pln-' + Date.now() + '-' + Math.random().toString(36).slice(2),
            date: document.getElementById('pbDate').value,
            start: document.getElementById('pbStart').value,
            end: document.getElementById('pbEnd').value,
            subject: document.getElementById('pbSubject').value || 'Study',
            target_minutes: parseInt(document.getElementById('pbTarget').value, 10) || 60,
            completed: false,
          };

          state.plans.push(p);

          if (supa && state.user) {
            try {
              const { error } = await supa.from('plans').upsert(
                {
                  id: p.id,
                  user_id: state.user.id,
                  date: p.date,
                  start_time: p.start,
                  end_time: p.end,
                  subject: p.subject,
                  target_minutes: p.target_minutes,
                  completed: p.completed,
                },
                { onConflict: 'id' },
              );
              if (error) throw error;
              if (typeof toast === 'function') toast('✅ Block saved!', 'ok');
            } catch (e) {
              console.warn('[planner-extras] insert error:', e);
              if (typeof toast === 'function') toast('⚠️ Cloud save failed', 'warn', 3500);
            }
          }

          if (typeof closeModal === 'function') closeModal();
          if (typeof renderPlanner === 'function') renderPlanner();
        };
      }, 50);
    };

    try {
      addPlanBlock = window.addPlanBlock;
    } catch (e) {}
    console.log('[planner-extras] patched: addPlanBlock');
  }

  /* ═══════════════ PATCH renderPlanner — sync toggle/delete ═══════════════ */
  function patchRenderPlanner() {
    const _orig = window.renderPlanner;
    if (typeof _orig !== 'function') return;

    window.renderPlanner = function () {
      _orig.call(this);

      const el = document.getElementById('planList');
      if (!el) return;

      /* Rewire toggle button */
      el.querySelectorAll('[data-plan-toggle]').forEach((b) => {
        const newB = b.cloneNode(true);
        b.parentNode.replaceChild(newB, b);

        newB.onclick = async () => {
          const p = state.plans.find((x) => x.id === newB.dataset.planToggle);
          if (!p) return;
          p.completed = !p.completed;

          if (supa && state.user) {
            try {
              await supa.from('plans').update({ completed: p.completed }).eq('id', p.id).eq('user_id', state.user.id);
            } catch (e) {
              console.warn('[planner-extras] toggle error:', e);
            }
          }
          window.renderPlanner();
        };
      });

      /* Rewire delete button */
      el.querySelectorAll('[data-plan-del]').forEach((b) => {
        const newB = b.cloneNode(true);
        b.parentNode.replaceChild(newB, b);

        newB.onclick = async () => {
          const id = newB.dataset.planDel;
          state.plans = state.plans.filter((x) => x.id !== id);

          if (supa && state.user) {
            try {
              await supa.from('plans').delete().eq('id', id).eq('user_id', state.user.id);
            } catch (e) {
              console.warn('[planner-extras] delete error:', e);
            }
          }
          window.renderPlanner();
        };
      });

      if (typeof attachRipples === 'function') attachRipples();
    };

    try {
      renderPlanner = window.renderPlanner;
    } catch (e) {}
    console.log('[planner-extras] patched: renderPlanner');
  }

  /* ═══════════════ INIT ═══════════════ */
  let attempts = 0;
  function waitThenStart() {
    const ready =
      typeof renderPlanner === 'function' &&
      typeof state === 'object' &&
      state !== null &&
      document.getElementById('view-planner');

    if (ready) {
      patchAddPlanBlock();
      patchRenderPlanner();

      /* Wait for user + supa to be ready, then load plans */
      const checkUser = setInterval(() => {
        if (state.user && supa) {
          clearInterval(checkUser);
          loadPlansFromDB().then(() => {
            if (state.view === 'planner' && typeof renderPlanner === 'function') renderPlanner();
          });
        }
      }, 500);

      console.log('[planner-extras] ✅ patched all');
    } else {
      attempts++;
      if (attempts > 200) {
        console.error('[planner-extras] timeout');
        return;
      }
      setTimeout(waitThenStart, 50);
    }
  }

  waitThenStart();
})();
