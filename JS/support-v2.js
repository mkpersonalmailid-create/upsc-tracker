/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Support v2
   ─────────────────────────────────────────────────────────────
   ✅ Support Ticket tab — bug/technical issues with priority
   ✅ Send Feedback tab — emoji sentiment + idea/improvement
   ✅ My Tickets / My Feedback — dynamic title + content
   ✅ Admin reply visible for both
   ✅ Tab switch pe list auto-reload
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[support-v2] loaded');

  function escHtml(s) {
    return String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  /* ═══════════════ TAB CONTENT ═══════════════ */
  function renderSupportTabV2() {
    const el = document.getElementById('supportTabContent');
    if (!el) return;

    if (state.supportTab === 'ticket') {
      el.innerHTML = `
        <div class="form-grid">
          <div class="field"><label>Category</label>
            <select id="supCategory">
              <option value="bug">🐛 Bug / Technical</option>
              <option value="data">📊 Data / Sync</option>
              <option value="payment">💳 Payment</option>
              <option value="content">📖 Content Issue</option>
              <option value="other">💭 Other</option>
            </select>
          </div>
          <div class="field"><label>Priority</label>
            <select id="supPriority">
              <option value="low">Low</option>
              <option value="normal" selected>Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Subject</label>
          <input type="text" id="supSubject" placeholder="Short title" maxlength="120">
        </div>
        <div class="field">
          <label>Describe your issue</label>
          <textarea id="supMessage" rows="6" placeholder="Please describe your issue in detail…" style="min-height:140px" maxlength="1500"></textarea>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:6px"><span id="supCharCount">0</span> / 1500</div>
        </div>
        <button class="btn btn-primary" id="supSubmitBtn" style="margin-top:6px">📤 Submit Ticket</button>`;

      document.getElementById('supSubmitBtn').onclick = submitSupport;
      document.getElementById('supMessage').oninput = () => {
        document.getElementById('supCharCount').textContent = document.getElementById('supMessage').value.length;
      };
    } else {
      el.innerHTML = `
        <div class="field">
          <label>How are you feeling about UPSC Tracker?</label>
          <div id="fbMoodPicker" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:6px">
            <button type="button" class="fb-mood" data-mood="5" style="padding:14px 8px;border-radius:12px;border:1.5px solid var(--border);background:var(--card-2);text-align:center;cursor:pointer;transition:all .2s">
              <div style="font-size:1.8rem;line-height:1">😍</div>
              <div style="font-size:.68rem;font-weight:800;color:var(--text-2);margin-top:6px">Love it</div>
            </button>
            <button type="button" class="fb-mood" data-mood="4" style="padding:14px 8px;border-radius:12px;border:1.5px solid var(--border);background:var(--card-2);text-align:center;cursor:pointer;transition:all .2s">
              <div style="font-size:1.8rem;line-height:1">😊</div>
              <div style="font-size:.68rem;font-weight:800;color:var(--text-2);margin-top:6px">Good</div>
            </button>
            <button type="button" class="fb-mood" data-mood="3" style="padding:14px 8px;border-radius:12px;border:1.5px solid var(--border);background:var(--card-2);text-align:center;cursor:pointer;transition:all .2s">
              <div style="font-size:1.8rem;line-height:1">😐</div>
              <div style="font-size:.68rem;font-weight:800;color:var(--text-2);margin-top:6px">Neutral</div>
            </button>
            <button type="button" class="fb-mood" data-mood="2" style="padding:14px 8px;border-radius:12px;border:1.5px solid var(--border);background:var(--card-2);text-align:center;cursor:pointer;transition:all .2s">
              <div style="font-size:1.8rem;line-height:1">😞</div>
              <div style="font-size:.68rem;font-weight:800;color:var(--text-2);margin-top:6px">Not great</div>
            </button>
            <button type="button" class="fb-mood" data-mood="1" style="padding:14px 8px;border-radius:12px;border:1.5px solid var(--border);background:var(--card-2);text-align:center;cursor:pointer;transition:all .2s">
              <div style="font-size:1.8rem;line-height:1">😡</div>
              <div style="font-size:.68rem;font-weight:800;color:var(--text-2);margin-top:6px">Frustrated</div>
            </button>
          </div>
          <input type="hidden" id="fbRating" value="3">
        </div>
        <div class="field">
          <label>What kind of feedback?</label>
          <select id="fbCategory">
            <option value="feature">💡 Feature Idea</option>
            <option value="improvement">✨ Improvement</option>
            <option value="other">💭 General</option>
          </select>
        </div>
        <div class="field">
          <label>Your message</label>
          <textarea id="fbMessage" rows="6" placeholder="Tell us what's on your mind…" style="min-height:140px" maxlength="1000"></textarea>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:6px"><span id="fbCharCount">0</span> / 1000</div>
        </div>
        <button class="btn btn-primary" id="fbSubmitBtn" style="margin-top:6px">📤 Send Feedback</button>`;

      const moodBtns = el.querySelectorAll('.fb-mood');
      moodBtns.forEach((btn) => {
        btn.onclick = () => {
          moodBtns.forEach((b) => {
            b.style.borderColor = 'var(--border)';
            b.style.background = 'var(--card-2)';
            b.style.transform = 'none';
          });
          btn.style.borderColor = 'var(--purple)';
          btn.style.background = 'linear-gradient(135deg, rgba(168,85,247,.15), rgba(236,72,153,.08))';
          btn.style.transform = 'scale(1.05)';
          document.getElementById('fbRating').value = btn.dataset.mood;
        };
      });

      document.getElementById('fbSubmitBtn').onclick = submitFeedback;
      document.getElementById('fbMessage').oninput = () => {
        document.getElementById('fbCharCount').textContent = document.getElementById('fbMessage').value.length;
      };
    }

    /* ✅ CRITICAL: loadMySupportHistory() call karo after form render */
    loadMySupportHistory();

    if (typeof attachRipples === 'function') attachRipples();
  }

  /* ═══════════════ LOAD MY HISTORY ═══════════════ */
  async function loadMySupportHistory() {
    const el = document.getElementById('supportHistory');
    if (!el) return;

    /* ✅ Update card title dynamically — robust selector */
    const historyCard = el.closest('.card');
    if (historyCard) {
      const titleEl = historyCard.querySelector('.card-title-lg');
      if (titleEl) titleEl.textContent = state.supportTab === 'ticket' ? 'My Tickets' : 'My Feedback';
    }

    if (!supa || !state.user) {
      el.innerHTML = '<div class="empty"><p>Sign in to view.</p></div>';
      return;
    }

    el.innerHTML = '<div class="skel" style="height:60px"></div>';
    const badgeEl = document.getElementById('supCountBadge');

    try {
      if (state.supportTab === 'ticket') {
        /* ── MY TICKETS ── */
        const { data } = await supa
          .from('support_tickets')
          .select('*')
          .eq('user_id', state.user.id)
          .order('created_at', { ascending: false })
          .limit(30);

        if (badgeEl) badgeEl.textContent = (data || []).length;

        if (!data || !data.length) {
          el.innerHTML =
            '<div class="empty"><div class="em">🆘</div><h4>No tickets yet</h4><p>Raise a ticket for any issue you face.</p></div>';
          return;
        }

        el.innerHTML = data
          .map((t) => {
            const stCls = t.status === 'replied' ? 's-replied' : t.status === 'closed' ? 's-closed' : 's-open';
            return `<div class="ticket-card">
              <div class="ticket-head">
                <div>
                  <div class="ticket-title">${escHtml(t.subject || 'No subject')}</div>
                  <div class="ticket-meta">${escHtml(t.category || '')} · ${fmtRelDate((t.created_at || '').slice(0, 10))}</div>
                </div>
                <span class="pill ${stCls}">${escHtml(t.status || 'open')}</span>
              </div>
              <div class="ticket-msg">${escHtml(t.message)}</div>
              ${
                t.admin_reply
                  ? `<div class="ticket-reply"><strong>👑 Admin reply:</strong> ${escHtml(t.admin_reply)}</div>`
                  : '<div style="margin-top:10px;font-size:.74rem;color:var(--text-3);font-style:italic">⏳ Waiting for admin reply…</div>'
              }
            </div>`;
          })
          .join('');
      } else {
        /* ── MY FEEDBACK ── */
        const { data } = await supa
          .from('feedback')
          .select('*')
          .eq('user_id', state.user.id)
          .order('created_at', { ascending: false })
          .limit(30);

        if (badgeEl) badgeEl.textContent = (data || []).length;

        if (!data || !data.length) {
          el.innerHTML =
            '<div class="empty"><div class="em">💬</div><h4>No feedback sent yet</h4><p>Share your thoughts above.</p></div>';
          return;
        }

        const moodEmoji = { 5: '😍', 4: '😊', 3: '😐', 2: '😞', 1: '😡' };
        const catLabel = { feature: '💡 Feature Idea', improvement: '✨ Improvement', other: '💭 General' };

        el.innerHTML = data
          .map((f) => {
            const mood = moodEmoji[f.rating] || '💬';
            const cat = catLabel[f.category] || f.category || 'Feedback';
            const stCls =
              f.status === 'replied' || f.status === 'done'
                ? 's-replied'
                : f.status === 'closed'
                  ? 's-closed'
                  : 's-open';
            return `<div class="ticket-card">
              <div class="ticket-head">
                <div>
                  <div class="ticket-title">${mood} ${escHtml(cat)}</div>
                  <div class="ticket-meta">${fmtRelDate((f.created_at || '').slice(0, 10))}</div>
                </div>
                <span class="pill ${stCls}">${escHtml(f.status || 'new')}</span>
              </div>
              <div class="ticket-msg">${escHtml(f.message)}</div>
              ${
                f.admin_reply
                  ? `<div class="ticket-reply"><strong>👑 Admin reply:</strong> ${escHtml(f.admin_reply)}</div>`
                  : '<div style="margin-top:10px;font-size:.74rem;color:var(--text-3);font-style:italic">⏳ Waiting for admin reply…</div>'
              }
            </div>`;
          })
          .join('');
      }
    } catch (e) {
      el.innerHTML = `<div class="empty"><p style="color:var(--red)">Failed to load: ${escHtml(e.message)}</p></div>`;
    }
  }

  /* ═══════════════ MAIN ═══════════════ */
  async function renderSupportV2() {
    renderSupportTabV2();
    /* loadMySupportHistory ab renderSupportTabV2 ke andar called hai,
       par safety ke liye ek aur call */
    await loadMySupportHistory();
  }

  /* ═══════════════ INSTALL ═══════════════ */
  function install() {
    window.renderSupport = renderSupportV2;
    window.renderSupportTab = renderSupportTabV2;
    window.loadSupportHistory = loadMySupportHistory;

    /* Wrap submitFeedback to auto-reload feedback list */
    const _origSubmitFeedback = window.submitFeedback;
    window.submitFeedback = async function () {
      try {
        await _origSubmitFeedback.call(this);
      } catch (e) {}
      setTimeout(() => {
        loadMySupportHistory();
      }, 600);
    };

    /* Wrap submitSupport to auto-reload ticket list */
    const _origSubmitSupport = window.submitSupport;
    window.submitSupport = async function () {
      try {
        await _origSubmitSupport.call(this);
      } catch (e) {}
      setTimeout(() => {
        loadMySupportHistory();
      }, 600);
    };

    console.log('[support-v2] ✅ override installed');

    try {
      if (document.querySelector('#view-support.active')) {
        window.renderSupport();
      }
    } catch (e) {}
  }

  let attempts = 0;
  function waitThenStart() {
    if (
      typeof window.renderSupport === 'function' &&
      typeof window.submitSupport === 'function' &&
      typeof window.submitFeedback === 'function' &&
      typeof window.fmtRelDate === 'function' &&
      typeof window.attachRipples === 'function'
    ) {
      install();
    } else {
      attempts++;
      if (attempts > 200) return console.error('[support-v2] timeout');
      setTimeout(waitThenStart, 50);
    }
  }
  waitThenStart();
})();
