/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Support v2
   ─────────────────────────────────────────────────────────────
   ✅ Support Ticket tab — bug/technical issues with priority
   ✅ Send Feedback tab — emoji sentiment + idea/improvement
   ✅ "My Tickets" only shows on Ticket tab (hidden on Feedback)
   ✅ Overrides existing renderSupport() + renderSupportTab()
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

  /* ═══════════════ TAB CONTENT (Ticket + Feedback) ═══════════════ */
  function renderSupportTabV2() {
    const el = document.getElementById('supportTabContent');
    if (!el) return;

    if (state.supportTab === 'ticket') {
      // ═══ TICKET TAB ═══
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
      // ═══ FEEDBACK TAB ═══
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

      // Wire mood picker
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

    if (typeof attachRipples === 'function') attachRipples();
  }

  /* ═══════════════ SUPPORT VIEW (Toggle My Tickets) ═══════════════ */
  async function renderSupportV2() {
    renderSupportTabV2();

    // "My Tickets" card = 2nd card in #view-support
    const cards = document.querySelectorAll('#view-support .card');
    if (cards.length >= 2) {
      cards[1].style.display = state.supportTab === 'ticket' ? '' : 'none';
    }

    if (state.supportTab === 'ticket') {
      if (typeof loadSupportHistory === 'function') {
        await loadSupportHistory();
      }
    }
  }

  /* ═══════════════ INSTALL ═══════════════ */
  function install() {
    window.renderSupport = renderSupportV2;
    window.renderSupportTab = renderSupportTabV2;
    console.log('[support-v2] ✅ override installed');

    // Re-render if support view is currently active
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
