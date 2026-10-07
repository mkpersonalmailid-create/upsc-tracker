/* ============================================
   HELPER: Safe State Access
   ============================================ */
function getState() {
  try {
    if (typeof state !== 'undefined' && state) return state;
  } catch (e) {}
  if (typeof window.state !== 'undefined' && window.state) return window.state;
  if (typeof window.appState !== 'undefined' && window.appState) return window.appState;
  return null;
}
/* ═══════════════════════════════════════════════════════════════
   STUDY WITH PARTNER — Complete Safe Module
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const APP_URL = 'https://upscstudytracker.co.in';
  const PARTNER_ICON = '◉';

  const pstate = {
    initialized: false,
    links: [],
    invites: [],
    loading: false,
    cachedUser: null,
  };

  function esc(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    );
  }

  function fmtDuration(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const hr = Math.floor(sec / 3600);
    const mn = Math.floor((sec % 3600) / 60);
    return hr ? `${hr}h ${mn}m` : `${mn}m`;
  }

  function tmsg(msg, type = 'info') {
    if (typeof window.toast === 'function') window.toast(msg, type);
    else console.log('[Partner]', msg);
  }

  function getState() {
    try {
      if (typeof state !== 'undefined' && state) return state;
    } catch (e) {}
    return window.state || null;
  }

  function getSupa() {
    return window.supa || null;
  }

  async function getCurrentUser() {
    if (pstate.cachedUser) return pstate.cachedUser;
    const supa = getSupa();
    if (!supa) return null;
    try {
      const {
        data: { user },
      } = await supa.auth.getUser();
      pstate.cachedUser = user || null;
      return user;
    } catch (e) {
      return null;
    }
  }

  // ═══════════════ PREMIUM CHECK ═══════════════
  function isUserPremium() {
    try {
      if (typeof isPremiumUser === 'function') return isPremiumUser();
      if (typeof window.isPremiumUser === 'function') return window.isPremiumUser();
    } catch (e) {}
    try {
      const s = getState();
      if (!s) return false;
      if (s.profile?.is_admin === true) return true;
      if (s.isPremium === true) return true;
    } catch (e) {}
    return false;
  }

  function showPremiumPrompt() {
    try {
      if (typeof window.openUpgradeModal === 'function') {
        window.openUpgradeModal('Study Partner');
        return;
      }
    } catch (e) {}
    tmsg('Study Partner is a Premium feature.', 'info');
  }

  // ═══════════════ 1. INJECT SIDEBAR TAB ═══════════════
  function injectSidebarTab() {
    const nav = document.querySelector('.nav');
    if (!nav) return false;

    if (document.querySelector('.nav-item[data-view="partner"]')) {
      return true;
    }

    const isPremium = isUserPremium();
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.dataset.view = 'partner';
    if (!isPremium) btn.classList.add('premium-locked');

    btn.innerHTML = `
      <span class="nav-icon">${isPremium ? PARTNER_ICON : '🔒'}</span>
      <span class="nav-label">Study With Partner</span>
      <span class="nav-badge hidden" id="partnerBadge">0</span>
    `;
    if (!pstate.cachedUser) btn.style.visibility = 'hidden';

    const anchor =
      nav.querySelector('.nav-item[data-view="history"]') ||
      nav.querySelector('.nav-item[data-view="analytics"]') ||
      nav.querySelector('.nav-item[data-view="premium"]');

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(btn, anchor);
    } else {
      nav.appendChild(btn);
    }

    btn.addEventListener('click', () => {
      if (!isUserPremium()) {
        showPremiumPrompt();
        return;
      }
      openPartnerView();
    });

    return true;
  }

  // ═══════════════ 2. INJECT VIEW ═══════════════
  function injectView() {
    const content = document.getElementById('content');
    if (!content) return false;
    if (document.getElementById('view-partner')) return true;

    const section = document.createElement('section');
    section.className = 'view';
    section.id = 'view-partner';
    section.innerHTML = `<div id="partnerContent"></div>`;
    content.appendChild(section);
    return true;
  }

  // ═══════════════ 3. OPEN PARTNER VIEW ═══════════════
  function openPartnerView() {
    if (!isUserPremium()) {
      showPremiumPrompt();
      return;
    }

    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    const view = document.getElementById('view-partner');
    if (view) view.classList.add('active');

    document.querySelectorAll('.nav-item').forEach((n) => {
      n.classList.toggle('active', n.dataset.view === 'partner');
    });

    const content = document.getElementById('content');
    if (content) content.scrollTop = 0;

    renderPartnerView();
  }

  // ═══════════════ 4. HOW IT WORKS ═══════════════
  function howItWorksCard() {
    return `
      <div class="card" style="margin-bottom:18px;background:linear-gradient(135deg,rgba(168,85,247,.08),rgba(236,72,153,.04));border:1px solid rgba(168,85,247,.25)">
        <div class="card-header">
          <div>
            <span class="card-title-lg">💡 How Study Partner Works</span>
            <div style="font-size:.82rem;color:var(--text-3);margin-top:4px">
              Understand the feature in 4 simple steps
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:8px">
          <div style="padding:16px;background:var(--card-2);border-radius:12px;border-left:3px solid var(--purple)">
            <div style="font-size:1.4rem;margin-bottom:8px">1️⃣</div>
            <div style="font-weight:800;font-size:.9rem;margin-bottom:6px">Add Your Partner</div>
            <div style="font-size:.8rem;color:var(--text-2);line-height:1.6">
              Enter your friend's email address. We'll check if they're on UPSC Tracker.
            </div>
          </div>
          <div style="padding:16px;background:var(--card-2);border-radius:12px;border-left:3px solid var(--pink)">
            <div style="font-size:1.4rem;margin-bottom:8px">2️⃣</div>
            <div style="font-weight:800;font-size:.9rem;margin-bottom:6px">Invite or Request</div>
            <div style="font-size:.8rem;color:var(--text-2);line-height:1.6">
              If they're registered → instant request. If not → you get a shareable invite link.
            </div>
          </div>
          <div style="padding:16px;background:var(--card-2);border-radius:12px;border-left:3px solid var(--orange)">
            <div style="font-size:1.4rem;margin-bottom:8px">3️⃣</div>
            <div style="font-weight:800;font-size:.9rem;margin-bottom:6px">Both Accept</div>
            <div style="font-size:.8rem;color:var(--text-2);line-height:1.6">
              Comparison only unlocks when BOTH accept. Your privacy is protected.
            </div>
          </div>
          <div style="padding:16px;background:var(--card-2);border-radius:12px;border-left:3px solid var(--teal)">
            <div style="font-size:1.4rem;margin-bottom:8px">4️⃣</div>
            <div style="font-weight:800;font-size:.9rem;margin-bottom:6px">Compare & Compete</div>
            <div style="font-size:.8rem;color:var(--text-2);line-height:1.6">
              See side-by-side stats and motivate each other daily.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════ 4.4. PROFILE SETUP FORM ═══════════════
  async function renderProfileSetupForm() {
    const user = await getCurrentUser();
    if (!user) return '';

    const supa = getSupa();
    const { data: profile } = await supa
      .from('profiles')
      .select('optional_subject, preparation_year')
      .eq('id', user.id)
      .maybeSingle();

    const currentOptional = profile?.optional_subject || '';
    const currentYear = profile?.preparation_year || '';

    const optionalOptions = OPTIONAL_SUBJECTS.map(
      (s) => `<option value="${esc(s)}" ${currentOptional === s ? 'selected' : ''}>${esc(s)}</option>`,
    ).join('');

    return `
      <div class="card" style="margin-top:18px;background:linear-gradient(135deg,rgba(168,85,247,.08),rgba(236,72,153,.04));border:1px solid rgba(168,85,247,.3)">
        <div class="card-header">
          <div>
            <span class="card-title-lg">🎯 Setup Your Partner Profile</span>
            <div style="font-size:.82rem;color:var(--text-3);margin-top:4px">
              Set these 2 fields before finding a partner (one-time setup)
            </div>
          </div>
        </div>

        <div style="padding:16px;background:var(--card-2);border-radius:12px;margin-bottom:16px;font-size:.82rem;color:var(--text-2);line-height:1.6">
          💡 <strong style="color:var(--text)">Why?</strong>
          We'll match you with aspirants who have the <strong>same optional subject</strong> and <strong>same target exam year</strong> — so your preparation stays in sync.
        </div>

        <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="field">
            <label>Optional Subject</label>
            <select id="setupOptional">
              <option value="">— Select Optional —</option>
              ${optionalOptions}
            </select>
          </div>
          <div class="field">
            <label>Target Exam Year</label>
            <input type="text" id="setupYear" placeholder="e.g. 2027" maxlength="10" autocomplete="off" value="${esc(currentYear)}" />
            <div style="font-size:.7rem;color:var(--text-3);margin-top:6px">
              Example: 2027
            </div>
          </div>
        </div>

        <div id="setupMsg" style="display:none;padding:10px 14px;border-radius:10px;font-size:.82rem;margin-top:14px"></div>

        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <button class="btn btn-primary" id="setupSaveBtn">
            Save & Continue →
          </button>
        </div>
      </div>
    `;
  }

  // ═══════════════ 4.45. WIRE PROFILE SETUP FORM ═══════════════
  function wireProfileSetupForm() {
    const saveBtn = document.getElementById('setupSaveBtn');
    const optSelect = document.getElementById('setupOptional');
    const yearInput = document.getElementById('setupYear');
    const msgEl = document.getElementById('setupMsg');

    if (!saveBtn || !optSelect || !yearInput) return;

    function showMsg(text, type) {
      if (!msgEl) return;
      msgEl.style.display = 'block';
      if (type === 'ok') {
        msgEl.style.background = 'rgba(16,185,129,.12)';
        msgEl.style.color = '#6EE7B7';
        msgEl.style.border = '1px solid rgba(16,185,129,.3)';
      } else {
        msgEl.style.background = 'rgba(239,68,68,.12)';
        msgEl.style.color = '#FCA5A5';
        msgEl.style.border = '1px solid rgba(239,68,68,.3)';
      }
      msgEl.textContent = text;
    }

    saveBtn.onclick = async () => {
      const optional = optSelect.value;
      const year = (yearInput.value || '').trim();

      if (!optional) {
        showMsg('Please select your Optional Subject', 'err');
        return;
      }
      if (!year) {
        showMsg('Please enter your Target Exam Year', 'err');
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Saving…';

      try {
        const supa = getSupa();
        const user = await getCurrentUser();
        if (!supa || !user) throw new Error('Session expired');

        const { error } = await supa
          .from('profiles')
          .update({
            optional_subject: optional,
            preparation_year: year,
          })
          .eq('id', user.id);

        if (error) throw error;

        try {
          const s = getState();
          if (s && s.profile) {
            s.profile.optional_subject = optional;
            s.profile.prep_year = year;
          }
        } catch (e) {}

        showMsg('✅ Profile saved! Loading matches…', 'ok');

        setTimeout(() => {
          renderPartnerView();
        }, 800);
      } catch (e) {
        console.warn('[Partner] setup save error:', e);
        showMsg('Failed: ' + (e.message || 'Unknown'), 'err');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Continue →';
      }
    };
  }

  // ═══════════════ 4.5. DISCOVER USERS (Strict Match) ═══════════════
  async function renderDiscoverSection() {
    const supa = getSupa();
    const user = await getCurrentUser();
    if (!supa || !user) return '';

    try {
      const { data: myProfile } = await supa
        .from('profiles')
        .select('optional_subject, preparation_year')
        .eq('id', user.id)
        .maybeSingle();

      const myOptional = myProfile?.optional_subject;
      const myYear = myProfile?.preparation_year;

      if (!myOptional || !myYear) return '';

      const { data: matches } = await supa
        .from('profiles')
        .select('id, name, optional_subject, preparation_year, discoverable, is_admin')
        .eq('discoverable', true)
        .eq('optional_subject', myOptional)
        .eq('preparation_year', myYear)
        .neq('id', user.id)
        .limit(50);

      const filterLabel = `${esc(myOptional)} · ${esc(myYear)}`;

      const myId = user.id;
      const existingIds = new Set();
      pstate.links.forEach((l) => {
        if (l.status === 'pending' || l.status === 'accepted') {
          existingIds.add(l.requester_id === myId ? l.partner_id : l.requester_id);
        }
      });

      const discoverable = (matches || []).filter((u) => !existingIds.has(u.id));

      // ═══ NO MATCHES ═══
      if (!discoverable.length) {
        return `
          <div class="card" style="margin-bottom:18px;background:linear-gradient(135deg,rgba(168,85,247,.06),rgba(236,72,153,.02));border:1px solid rgba(168,85,247,.25)">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
              <div style="flex:1;min-width:200px">
                <span class="card-title-lg">🔍 Discover Users</span>
                <div style="font-size:.78rem;color:var(--text-3);margin-top:4px">
                  Match: <strong style="color:var(--purple)">${filterLabel}</strong>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" id="discoverRefreshBtn">
                🔄 Find Now
              </button>
            </div>
            <div class="empty" style="padding:40px 20px">
              <div class="em">🔍</div>
              <h4>No matches yet</h4>
              <p style="font-size:.82rem;color:var(--text-3);margin-top:8px;max-width:420px;margin-left:auto;margin-right:auto;line-height:1.6">
                No user found with the same optional (<strong>${esc(myOptional)}</strong>) and same year (<strong>${esc(myYear)}</strong>).
                <br>Check back later — matches will appear as more users join.
              </p>
            </div>
          </div>
        `;
      }

      // ═══ USERS FOUND ═══
      const usersHtml = discoverable
        .slice(0, 30)
        .map((u) => {
          const initial = (u.name || 'U')[0].toUpperCase();
          return `
            <div class="row-item" style="cursor:default">
              <div style="width:40px;height:40px;border-radius:50%;background:var(--grad-1);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;flex-shrink:0">
                ${initial}
              </div>
              <div class="row-info">
                <div class="row-title">${esc(u.name || 'User')}</div>
                <div class="row-meta">${esc(u.optional_subject || '')} · ${esc(u.preparation_year || '')}</div>
              </div>
              <button class="btn btn-primary btn-sm" data-discover-send="${u.id}" data-discover-name="${esc(u.name || 'User')}">
                + Send Request
              </button>
            </div>
          `;
        })
        .join('');

      return `
        <div class="card" style="margin-bottom:18px;background:linear-gradient(135deg,rgba(168,85,247,.06),rgba(236,72,153,.02));border:1px solid rgba(168,85,247,.25)">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
            <div style="flex:1;min-width:200px">
              <span class="card-title-lg">🔍 Discover Users</span>
              <div style="font-size:.78rem;color:var(--text-3);margin-top:4px">
                Match: <strong style="color:var(--purple)">${filterLabel}</strong> · ${discoverable.length} found
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="discoverRefreshBtn">
              🔄 Find Now
            </button>
          </div>
          <div class="list">${usersHtml}</div>
        </div>
      `;
    } catch (e) {
      console.warn('[Partner] discover error:', e);
      return '';
    }
  }

  // ═══════════════ 4.6. SEND DISCOVER REQUEST ═══════════════
  async function sendDiscoverRequest(targetId, targetName, btn) {
    const supa = getSupa();
    const user = await getCurrentUser();
    if (!supa || !user) return;

    if (targetId === user.id) {
      tmsg('You cannot add yourself as a partner', 'err');
      return;
    }

    btn.disabled = true;
    const origText = btn.textContent;
    btn.textContent = '⏳ Sending…';

    try {
      // Check ANY entry between both users (any direction, any status)
      const { data: existing } = await supa
        .from('partner_links')
        .select('id, status')
        .or(
          `and(requester_id.eq.${user.id},partner_id.eq.${targetId}),and(requester_id.eq.${targetId},partner_id.eq.${user.id})`,
        )
        .maybeSingle();

      if (existing) {
        // ═══ Block if pending or accepted ═══
        if (existing.status === 'pending' || existing.status === 'accepted') {
          tmsg('A request already exists with this user', 'info');
          btn.textContent = '✓ Sent';
          btn.disabled = true;
          return;
        }

        // ═══ Revive if removed or rejected ═══
        const { error: updateErr } = await supa
          .from('partner_links')
          .update({
            requester_id: user.id,
            partner_id: targetId,
            status: 'pending',
            accepted_at: null,
            created_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;
      } else {
        // ═══ Insert new ═══
        const { error: insertErr } = await supa.from('partner_links').insert({
          requester_id: user.id,
          partner_id: targetId,
          status: 'pending',
        });
        if (insertErr) throw insertErr;
      }

      tmsg(`✅ Request sent to ${targetName}!`, 'ok');
      btn.textContent = '✓ Sent';
      btn.disabled = true;
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');

      setTimeout(() => renderPartnerView(), 1000);
    } catch (e) {
      console.warn('[Partner] discover send error:', e);
      tmsg('Failed: ' + (e.message || 'Unknown error'), 'err');
      btn.textContent = origText;
      btn.disabled = false;
    }
  }
  // ═══════════════ 5. RENDER PARTNER VIEW ═══════════════
  async function renderPartnerView() {
    const el = document.getElementById('partnerContent');
    if (!el) return;

    el.innerHTML = `<div class="empty"><div class="em">👥</div><h4>Loading…</h4></div>`;

    const user = await getCurrentUser();
    if (!user) {
      el.innerHTML = `<div class="empty"><div class="em">🔒</div><h4>Sign in to continue</h4></div>`;
      return;
    }

    // ═══ CHECK PROFILE SETUP ═══
    const supa = getSupa();
    const { data: myProfile } = await supa
      .from('profiles')
      .select('optional_subject, preparation_year')
      .eq('id', user.id)
      .maybeSingle();

    const needsSetup = !myProfile?.optional_subject || !myProfile?.preparation_year;

    if (needsSetup) {
      el.innerHTML = await renderProfileSetupForm();
      wireProfileSetupForm();
      return;
    }

    await loadPartnerData(user);

    const myId = user.id;
    const accepted = pstate.links.filter((l) => l.status === 'accepted');
    const incoming = pstate.links.filter((l) => l.status === 'pending' && l.partner_id === myId);
    const outgoing = pstate.links.filter((l) => l.status === 'pending' && l.requester_id === myId);
    const myInvites = pstate.invites.filter((i) => i.status === 'pending');

    // ═══ MAIN HEADER CARD ═══
    let html = `
      <div class="card" style="margin-bottom:18px">
        <div class="card-header">
          <div>
            <span class="card-title-lg">👥 Study with Partner</span>
            <div style="font-size:.82rem;color:var(--text-3);margin-top:4px">
              Study alongside a friend, compare progress, and stay motivated together.
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="pAddBtn">＋ Add by Email</button>
        </div>
      </div>
    `;

    // ═══ DISCOVER USERS — SABSE UPAR ═══
    const discoverHtml = await renderDiscoverSection();
    if (discoverHtml) {
      html += discoverHtml;
    }

    // ═══ HOW IT WORKS (only when no partner/requests) ═══
    if (accepted.length === 0 && incoming.length === 0 && outgoing.length === 0 && myInvites.length === 0) {
      html += howItWorksCard();
    }

    // ═══ INCOMING REQUESTS ═══
    if (incoming.length > 0) {
      html += `
        <div class="card" style="margin-bottom:18px;border-left:4px solid var(--amber)">
          <div class="card-header">
            <div><span class="card-title-lg">🔔 Partner Requests (${incoming.length})</span></div>
          </div>
          <div class="list" id="pIncomingList"></div>
        </div>`;
    }

    // ═══ OUTGOING REQUESTS ═══
    if (outgoing.length > 0 || myInvites.length > 0) {
      html += `
        <div class="card" style="margin-bottom:18px">
          <div class="card-header">
            <div><span class="card-title-lg">📤 Sent Requests</span></div>
          </div>
          <div class="list" id="pOutgoingList"></div>
        </div>`;
    }

    // ═══ COMPARISON WRAP ═══
    if (accepted.length > 0) {
      html += `<div id="pComparisonWrap"></div>`;
    } else if (accepted.length === 0 && incoming.length === 0 && outgoing.length === 0 && myInvites.length === 0) {
      html += `
        <div class="card">
          <div class="empty" style="padding:60px 20px">
            <div class="em">👥</div>
            <h4>No partner yet</h4>
            <p>Send a request from Discover Users above, or add by email.</p>
          </div>
        </div>`;
    }

    el.innerHTML = html;

    // ═══ WIRE: ADD BUTTONS ═══
    document.getElementById('pAddBtn')?.addEventListener('click', openAddPartnerModal);

    // ═══ WIRE: DISCOVER REFRESH BUTTON ═══
    const refreshBtn = el.querySelector('#discoverRefreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = '⏳ Searching…';
        renderPartnerView();
      };
    }

    // ═══ WIRE: SEND REQUEST FROM DISCOVER ═══
    el.querySelectorAll('[data-discover-send]').forEach((btn) => {
      btn.onclick = async () => {
        const targetId = btn.dataset.discoverSend;
        const targetName = btn.dataset.discoverName;
        await sendDiscoverRequest(targetId, targetName, btn);
      };
    });

    // ═══ RENDER INCOMING ═══
    if (incoming.length > 0) {
      const listEl = document.getElementById('pIncomingList');
      listEl.innerHTML = '';
      for (const link of incoming) {
        const profile = await fetchProfile(link.requester_id);
        const card = document.createElement('div');
        card.className = 'row-item';
        card.innerHTML = `
          <div style="width:38px;height:38px;border-radius:50%;background:var(--grad-1);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;flex-shrink:0">
            ${esc((profile?.name || 'U')[0].toUpperCase())}
          </div>
          <div class="row-info">
            <div class="row-title">${esc(profile?.name || 'User')}</div>
            <div class="row-meta">${esc(profile?.email || '')}</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-success btn-sm" data-pa-accept="${link.id}">✓ Accept</button>
            <button class="btn btn-secondary btn-sm" data-pa-reject="${link.id}">✕ Decline</button>
          </div>`;
        listEl.appendChild(card);
      }
      listEl
        .querySelectorAll('[data-pa-accept]')
        .forEach((b) => (b.onclick = () => respondToRequest(b.dataset.paAccept, 'accepted')));
      listEl
        .querySelectorAll('[data-pa-reject]')
        .forEach((b) => (b.onclick = () => respondToRequest(b.dataset.paReject, 'rejected')));
    }

    // ═══ RENDER OUTGOING ═══
    if (outgoing.length > 0 || myInvites.length > 0) {
      const listEl = document.getElementById('pOutgoingList');
      listEl.innerHTML = '';
      for (const link of outgoing) {
        const profile = await fetchProfile(link.partner_id);
        const card = document.createElement('div');
        card.className = 'row-item';
        card.innerHTML = `
          <div style="width:38px;height:38px;border-radius:50%;background:var(--card-2);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">⏳</div>
          <div class="row-info">
            <div class="row-title">${esc(profile?.name || 'User')}</div>
            <div class="row-meta">Waiting for response…</div>
          </div>
          <button class="btn btn-danger btn-sm" data-pa-cancel="${link.id}">Cancel</button>`;
        listEl.appendChild(card);
      }
      for (const inv of myInvites) {
        const card = document.createElement('div');
        card.className = 'row-item';
        card.innerHTML = `
          <div style="width:38px;height:38px;border-radius:50%;background:var(--card-2);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">📨</div>
          <div class="row-info">
            <div class="row-title">${esc(inv.invitee_email)}</div>
            <div class="row-meta">Invite sent — expires on ${new Date(inv.expires_at).toLocaleDateString()}</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-primary btn-sm" data-pa-share="${inv.id}">Share Link</button>
            <button class="btn btn-secondary btn-sm" data-pa-cancel-inv="${inv.id}">Cancel</button>
          </div>`;
        listEl.appendChild(card);
      }
      listEl.querySelectorAll('[data-pa-cancel]').forEach((b) => (b.onclick = () => cancelRequest(b.dataset.paCancel)));
      listEl
        .querySelectorAll('[data-pa-cancel-inv]')
        .forEach((b) => (b.onclick = () => cancelInvite(b.dataset.paCancelInv)));
      listEl.querySelectorAll('[data-pa-share]').forEach(
        (b) =>
          (b.onclick = () => {
            const inv = pstate.invites.find((i) => i.id === b.dataset.paShare);
            if (inv) openShareModal(inv);
          }),
      );
    }

    // ═══ RENDER COMPARISON + CHAT ═══
    if (accepted.length > 0) {
      await renderComparison(accepted, myId);
    }
  }

  // ═══════════════ 6. DATA LOADING ═══════════════
  async function loadPartnerData(user) {
    const supa = getSupa();
    if (!supa) return;
    if (!user) {
      user = await getCurrentUser();
      if (!user) return;
    }
    pstate.loading = true;
    try {
      const { data: links } = await supa
        .from('partner_links')
        .select('*')
        .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      pstate.links = links || [];

      const { data: invites } = await supa
        .from('partner_invites')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });
      pstate.invites = invites || [];

      updateBadge(user.id);
    } catch (e) {
      console.warn('[Partner] load error:', e);
    } finally {
      pstate.loading = false;
    }
  }

  function updateBadge(myId) {
    const badge = document.getElementById('partnerBadge');
    if (!badge) return;
    const pendingCount = pstate.links.filter((l) => l.status === 'pending' && l.partner_id === myId).length;
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  async function fetchProfile(userId) {
    const supa = getSupa();
    if (!supa) return null;
    try {
      const { data } = await supa
        .from('profiles')
        .select('id, name, email, optional_subject')
        .eq('id', userId)
        .maybeSingle();
      return data;
    } catch (e) {
      return null;
    }
  }

  // ═══════════════ 7. ADD PARTNER MODAL ═══════════════
  function openAddPartnerModal() {
    const body = `
      <div style="padding:12px 14px;background:var(--card-2);border-radius:12px;margin-bottom:14px;font-size:.82rem;color:var(--text-2);line-height:1.6">
        <strong style="color:var(--text)">How it works:</strong>
        <br>Enter your friend's email below.
        <br>• If they're on UPSC Tracker → we'll send them a request.
        <br>• If not → you'll get a shareable invite link.
      </div>
      <div class="field">
        <label>Partner's Email</label>
        <input type="email" id="pEmailInput" placeholder="friend@example.com" autocomplete="off" />
      </div>`;

    const actions = `
      <button class="btn btn-secondary" data-close>Cancel</button>
      <button class="btn btn-primary" id="pSendBtn">Send Request</button>`;

    if (typeof window.openModal !== 'function') {
      tmsg('Modal system not ready', 'err');
      return;
    }

    window.openModal(
      window.modalShell({
        title: '➕ Add Study Partner',
        subtitle: 'Find your partner by email',
        body,
        actions,
      }),
      {
        onMount() {
          const input = document.getElementById('pEmailInput');
          setTimeout(() => input?.focus(), 100);
          document.getElementById('pSendBtn').onclick = async () => {
            const email = (input.value || '').trim().toLowerCase();
            if (!email || !email.includes('@')) {
              tmsg('Please enter a valid email', 'err');
              return;
            }
            await sendPartnerRequest(email);
          };
        },
      },
    );
  }

  // ═══════════════ 8. SEND REQUEST (BY EMAIL) ═══════════════
  async function sendPartnerRequest(email) {
    const supa = getSupa();
    const user = await getCurrentUser();
    if (!supa || !user) return;

    const myEmail = (user.email || '').toLowerCase();
    if (email === myEmail) {
      tmsg('You cannot add yourself as a partner', 'err');
      return;
    }

    const btn = document.getElementById('pSendBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Searching…';
    }

    try {
      const { data: found } = await supa.from('profiles').select('id, name, email').ilike('email', email).maybeSingle();

      if (found) {
        // Check ANY entry between both users
        const { data: existing } = await supa
          .from('partner_links')
          .select('id, status')
          .or(
            `and(requester_id.eq.${user.id},partner_id.eq.${found.id}),and(requester_id.eq.${found.id},partner_id.eq.${user.id})`,
          )
          .maybeSingle();

        if (existing) {
          // Block if pending or accepted
          if (existing.status === 'pending' || existing.status === 'accepted') {
            tmsg('A request already exists with this user', 'info');
            if (btn) {
              btn.disabled = false;
              btn.textContent = 'Send Request';
            }
            return;
          }

          // Revive if removed or rejected
          const { error: updateErr } = await supa
            .from('partner_links')
            .update({
              requester_id: user.id,
              partner_id: found.id,
              status: 'pending',
              accepted_at: null,
              created_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          if (updateErr) throw updateErr;
        } else {
          // Insert new
          const { error: insertErr } = await supa.from('partner_links').insert({
            requester_id: user.id,
            partner_id: found.id,
            status: 'pending',
          });
          if (insertErr) throw insertErr;
        }

        if (typeof window.closeModal === 'function') window.closeModal();
        tmsg(`✅ Request sent to ${found.name || found.email}!`, 'ok');
        renderPartnerView();
      } else {
        // User not found → invite link
        const { data: invite, error: invErr } = await supa
          .from('partner_invites')
          .insert({ requester_id: user.id, invitee_email: email, status: 'pending' })
          .select()
          .single();
        if (invErr) throw invErr;

        if (typeof window.closeModal === 'function') window.closeModal();
        tmsg('📨 Invite link ready!', 'ok');
        openShareModal(invite);
        renderPartnerView();
      }
    } catch (e) {
      console.warn('[Partner] send error:', e);
      tmsg('Error: ' + (e.message || 'Failed'), 'err');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Send Request';
      }
    }
  }
  // ═══════════════ 9. SHARE MODAL ═══════════════
  function openShareModal(invite) {
    const link = `${APP_URL}/auth.html?invite=${invite.token}`;
    const shareText = `Join me on UPSC Tracker as my study partner! Use this link: ${link}`;

    const body = `
      <div style="padding:12px 14px;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.35);border-radius:12px;margin-bottom:14px;font-size:.82rem;color:#FBBF24;line-height:1.6;display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:1.2rem;flex-shrink:0">⚠️</span>
        <div>
          <strong>Partner not registered on this platform</strong>
          <div style="color:var(--text-2);margin-top:4px;font-size:.78rem">
            Share this link with them. They'll create an account and automatically become your study partner.
          </div>
        </div>
      </div>
      <div style="padding:14px;background:var(--card-2);border-radius:12px;margin-bottom:14px">
        <div style="font-size:.72rem;color:var(--text-3);font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Invite Link</div>
        <div style="font-family:var(--mono);font-size:.78rem;word-break:break-all;color:var(--text-2)" id="pShareLink">${esc(link)}</div>
      </div>
      <div style="font-size:.78rem;color:var(--text-3);text-align:center;margin-bottom:12px">
        Share this link via any platform:
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        <button class="btn btn-secondary" id="pCopyBtn" style="padding:14px">📋 Copy Link</button>
        <button class="btn btn-secondary" id="pWhatsappBtn" style="padding:14px;background:#25D366;color:#fff;border:none">💬 WhatsApp</button>
        <button class="btn btn-secondary" id="pTelegramBtn" style="padding:14px;background:#0088cc;color:#fff;border:none">✈️ Telegram</button>
        <button class="btn btn-secondary" id="pInstagramBtn" style="padding:14px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:#fff;border:none">📷 Instagram</button>
      </div>
      <p style="font-size:.72rem;color:var(--text-3);text-align:center;margin-top:14px">
        ⏳ This link is valid for 7 days
      </p>`;

    const actions = `<button class="btn btn-secondary" data-close>Close</button>`;

    if (typeof window.openModal !== 'function') {
      navigator.clipboard?.writeText(link);
      tmsg('Link copied to clipboard!', 'ok');
      return;
    }

    window.openModal(
      window.modalShell({
        title: '🎉 Invite Ready!',
        subtitle: 'Share with your friend to get started',
        body,
        actions,
      }),
      {
        onMount() {
          document.getElementById('pCopyBtn').onclick = () => {
            navigator.clipboard.writeText(link).then(() => tmsg('✅ Link copied!', 'ok'));
          };
          document.getElementById('pWhatsappBtn').onclick = () => {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
          };
          document.getElementById('pTelegramBtn').onclick = () => {
            window.open(
              `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Join me on UPSC Tracker!')}`,
              '_blank',
            );
          };
          document.getElementById('pInstagramBtn').onclick = () => {
            navigator.clipboard.writeText(shareText).then(() => {
              tmsg('✅ Text copied — paste it in Instagram DM!', 'ok');
              setTimeout(() => window.open('https://www.instagram.com/direct/inbox/', '_blank'), 500);
            });
          };
        },
      },
    );
  }

  // ═══════════════ 10. RESPOND / CANCEL ═══════════════
  async function respondToRequest(linkId, status) {
    const supa = getSupa();
    if (!supa) return;
    try {
      const updates = { status };
      if (status === 'accepted') updates.accepted_at = new Date().toISOString();
      const { error } = await supa.from('partner_links').update(updates).eq('id', linkId);
      if (error) throw error;
      tmsg(status === 'accepted' ? '✅ Partner added!' : 'Request declined', 'ok');
      renderPartnerView();
    } catch (e) {
      tmsg('Failed: ' + e.message, 'err');
    }
  }

  async function cancelRequest(linkId) {
    const supa = getSupa();
    if (!supa) return;
    try {
      const { error } = await supa.from('partner_links').delete().eq('id', linkId);
      if (error) throw error;
      tmsg('Request cancelled', 'info');
      renderPartnerView();
    } catch (e) {
      tmsg('Failed: ' + e.message, 'err');
    }
  }

  async function cancelInvite(inviteId) {
    const supa = getSupa();
    if (!supa) return;
    try {
      const { error } = await supa.from('partner_invites').update({ status: 'cancelled' }).eq('id', inviteId);
      if (error) throw error;
      tmsg('Invite cancelled', 'info');
      renderPartnerView();
    } catch (e) {
      tmsg('Failed: ' + e.message, 'err');
    }
  }

  // ═══════════════ 11. COMPARISON ═══════════════
  async function renderComparison(acceptedLinks, myId) {
    const wrap = document.getElementById('pComparisonWrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    for (const link of acceptedLinks) {
      const partnerId = link.requester_id === myId ? link.partner_id : link.requester_id;
      const partner = await fetchProfile(partnerId);
      if (!partner) continue;

      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceStr = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, '0')}-${String(since.getDate()).padStart(2, '0')}`;

      const [mySessions, partnerSessions] = await Promise.all([
        fetchSessions(myId, sinceStr),
        fetchSessions(partnerId, sinceStr),
      ]);

      const myTotal = mySessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);
      const pTotal = partnerSessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);
      // Local date (IST) instead of UTC
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const myToday = mySessions.filter((s) => s.date === today).reduce((a, s) => a + (s.duration_seconds || 0), 0);
      const pToday = partnerSessions.filter((s) => s.date === today).reduce((a, s) => a + (s.duration_seconds || 0), 0);
      const myStreak = computeStreak(mySessions);
      const pStreak = computeStreak(partnerSessions);
      const mySyl = await fetchSyllabusCount(myId);
      const pSyl = await fetchSyllabusCount(partnerId);
      const partnerShort = (partner.name || 'P').split(' ')[0].toUpperCase();

      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '18px';
      card.innerHTML = `
        <div class="card-header">
          <div>
            <span class="card-title-lg">📊 You vs ${esc(partner.name || 'Partner')}</span>
            <div style="font-size:.78rem;color:var(--text-3);margin-top:4px">
              Last 30 days · Side-by-side comparison
            </div>
          </div>
          <button class="btn btn-danger btn-sm" data-pa-remove="${link.id}">Remove Partner</button>
        </div>
        <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          <div class="kpi" style="--c:var(--purple);--cb:rgba(168,85,247,0.15)">
            <div class="kpi-label">⏱ Today's Study Time</div>
            <div style="display:flex;justify-content:space-between;align-items:end;margin-top:8px">
              <div>
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">YOU</div>
                <div style="font-size:1.4rem;font-weight:900;color:var(--purple)">${fmtDuration(myToday)}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">${esc(partnerShort)}</div>
                <div style="font-size:1.4rem;font-weight:900;color:var(--pink)">${fmtDuration(pToday)}</div>
              </div>
            </div>
            ${myToday > pToday ? '<div style="font-size:.7rem;color:var(--emerald);margin-top:6px">🏆 You are ahead!</div>' : pToday > myToday ? '<div style="font-size:.7rem;color:var(--amber);margin-top:6px">💪 Time to catch up!</div>' : '<div style="font-size:.7rem;color:var(--text-3);margin-top:6px">🤝 It\'s a tie!</div>'}
          </div>
          <div class="kpi" style="--c:var(--orange);--cb:rgba(249,115,22,0.15)">
            <div class="kpi-label">📅 30-Day Total</div>
            <div style="display:flex;justify-content:space-between;align-items:end;margin-top:8px">
              <div>
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">YOU</div>
                <div style="font-size:1.4rem;font-weight:900;color:var(--orange)">${fmtDuration(myTotal)}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">${esc(partnerShort)}</div>
                <div style="font-size:1.4rem;font-weight:900;color:var(--amber)">${fmtDuration(pTotal)}</div>
              </div>
            </div>
          </div>
          <div class="kpi" style="--c:var(--red);--cb:rgba(239,68,68,0.15)">
            <div class="kpi-label">🔥 Current Streak</div>
            <div style="display:flex;justify-content:space-between;align-items:end;margin-top:8px">
              <div>
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">YOU</div>
                <div style="font-size:1.4rem;font-weight:900">${myStreak}d</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">${esc(partnerShort)}</div>
                <div style="font-size:1.4rem;font-weight:900">${pStreak}d</div>
              </div>
            </div>
          </div>
          <div class="kpi" style="--c:var(--teal);--cb:rgba(20,184,166,0.15)">
            <div class="kpi-label">📖 Syllabus Progress</div>
            <div style="display:flex;justify-content:space-between;align-items:end;margin-top:8px">
              <div>
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">YOU</div>
                <div style="font-size:1.4rem;font-weight:900">${mySyl.done}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">${esc(partnerShort)}</div>
                <div style="font-size:1.4rem;font-weight:900">${pSyl.done}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top:16px;padding:12px 14px;background:var(--card-2);border-radius:10px;font-size:.8rem;color:var(--text-2);line-height:1.6">
          💡 <strong>Tip:</strong> Stay consistent with your partner — motivate each other daily!
        </div>`;

      wrap.appendChild(card);
      card.querySelector('[data-pa-remove]')?.addEventListener('click', () => removePartner(link.id, partner.name));

      const chatContainer = document.createElement('div');
      chatContainer.id = 'pChat_' + partnerId;
      wrap.appendChild(chatContainer);
      renderMessages(partnerId, partner.name);
    }
  }

  async function fetchSessions(userId, sinceDate) {
    const supa = getSupa();
    if (!supa) return [];
    try {
      const { data } = await supa
        .from('study_sessions')
        .select('date, duration_seconds')
        .eq('user_id', userId)
        .gte('date', sinceDate);
      return data || [];
    } catch (e) {
      return [];
    }
  }

  async function fetchSyllabusCount(userId) {
    const supa = getSupa();
    if (!supa) return { done: 0, total: 0 };
    try {
      const { data } = await supa.from('syllabus_topics').select('status').eq('user_id', userId);
      const list = data || [];
      const done = list.filter((s) => s.status === 'completed' || (s.status || '').startsWith('rev')).length;
      return { done, total: list.length };
    } catch (e) {
      return { done: 0, total: 0 };
    }
  }

  function computeStreak(sessions) {
    const days = new Set(sessions.filter((s) => s.duration_seconds > 0).map((s) => s.date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 400; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (days.has(key)) streak++;
      else if (i === 0) continue;
      else break;
    }
    return streak;
  }

  async function removePartner(linkId, partnerName) {
    const ok = window.customConfirm
      ? await window.customConfirm({
          title: 'Remove Partner?',
          message: `Are you sure you want to remove ${partnerName || 'this partner'}?`,
          confirmText: 'Remove',
          cancelText: 'Cancel',
          icon: '👋',
          type: 'danger',
        })
      : confirm('Remove partner?');
    if (!ok) return;

    const supa = getSupa();
    if (!supa) return;
    try {
      const { error } = await supa.from('partner_links').update({ status: 'removed' }).eq('id', linkId);
      if (error) throw error;
      tmsg('Partner removed', 'info');
      renderPartnerView();
    } catch (e) {
      tmsg('Failed: ' + e.message, 'err');
    }
  }

  // ═══════════════ 12. INVITE TOKEN ═══════════════
  async function handleInviteToken() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (!token) return;
    const supa = getSupa();
    const user = await getCurrentUser();
    if (!supa || !user) return;

    try {
      const { data: invite } = await supa
        .from('partner_invites')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (!invite) return;
      if (new Date(invite.expires_at) < new Date()) {
        tmsg('This invite link has expired', 'warn');
        return;
      }
      if (invite.requester_id === user.id) {
        tmsg('This is your own invite link', 'info');
        return;
      }

      // Check ANY entry between both users
      const { data: existing } = await supa
        .from('partner_links')
        .select('id, status')
        .or(
          `and(requester_id.eq.${invite.requester_id},partner_id.eq.${user.id}),and(requester_id.eq.${user.id},partner_id.eq.${invite.requester_id})`,
        )
        .maybeSingle();

      if (existing) {
        // Block if already accepted
        if (existing.status === 'accepted') {
          tmsg('You are already partners with this user', 'info');
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        // Revive/accept existing entry
        const { error: updateErr } = await supa
          .from('partner_links')
          .update({
            requester_id: invite.requester_id,
            partner_id: user.id,
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;
      } else {
        // Insert new accepted entry
        const { error: insertErr } = await supa.from('partner_links').insert({
          requester_id: invite.requester_id,
          partner_id: user.id,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        });
        if (insertErr) throw insertErr;
      }

      await supa
        .from('partner_invites')
        .update({
          status: 'accepted',
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      window.history.replaceState({}, '', window.location.pathname);
      const requester = await fetchProfile(invite.requester_id);
      tmsg(`🎉 You're now study partners with ${requester?.name || 'your friend'}!`, 'ok', 5000);
    } catch (e) {
      console.warn('[Partner] invite error:', e);
    }
  }
  // ═══════════════ 12.5. MESSAGES (Chat) ═══════════════
  let chatPollHandle = null;

  async function renderMessages(partnerId, partnerName) {
    const containerId = 'pChat_' + partnerId;
    let container = document.getElementById(containerId);
    if (!container) return;

    if (chatPollHandle) {
      clearInterval(chatPollHandle);
      chatPollHandle = null;
    }

    const user = await getCurrentUser();
    if (!user) return;
    const supa = getSupa();
    if (!supa) return;

    container.innerHTML = `
      <div class="card" style="margin-top:18px">
        <div class="card-header">
          <div>
            <span class="card-title-lg">💬 Messages</span>
            <div style="font-size:.78rem;color:var(--text-3);margin-top:4px">
              Chat with ${esc(partnerName || 'Partner')}
            </div>
          </div>
        </div>

        <div id="${containerId}_list" style="
          max-height: 360px; overflow-y: auto; padding: 12px;
          background: var(--bg-2); border: 1px solid var(--border);
          border-radius: 12px; display: flex; flex-direction: column; gap: 8px;
          min-height: 180px;
        ">
          <div style="text-align:center;color:var(--text-3);font-size:.82rem;padding:20px">Loading messages…</div>
        </div>

        <div style="display:flex;gap:8px;margin-top:12px;align-items:flex-end">
          <textarea id="${containerId}_input" rows="1" maxlength="1000"
            placeholder="Type your message…"
            style="flex:1;background:var(--bg-2);border:1.5px solid var(--border);
                   border-radius:12px;padding:11px 14px;font-size:.88rem;color:var(--text);
                   resize:none;min-height:44px;max-height:120px;font-family:inherit;outline:none"></textarea>
          <button class="btn btn-primary" id="${containerId}_send" style="padding:11px 20px;height:44px">
            Send ➤
          </button>
        </div>
      </div>
    `;

    const listEl = document.getElementById(containerId + '_list');
    const inputEl = document.getElementById(containerId + '_input');
    const sendBtn = document.getElementById(containerId + '_send');

    async function loadMessages() {
      try {
        const { data: msgs } = await supa
          .from('partner_messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`,
          )
          .order('created_at', { ascending: true })
          .limit(200);

        const list = msgs || [];

        if (!list.length) {
          listEl.innerHTML = `<div style="text-align:center;color:var(--text-3);font-size:.82rem;padding:20px">No messages yet. Say hi! 👋</div>`;
          return;
        }

        const wasAtBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 60;

        listEl.innerHTML = list
          .map((m) => {
            const mine = m.sender_id === user.id;
            const time = new Date(m.created_at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const date = new Date(m.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            });
            return `
              <div style="display:flex;flex-direction:column;align-items:${mine ? 'flex-end' : 'flex-start'};gap:2px">
                <div style="
                  max-width:75%; padding:9px 13px; border-radius:14px;
                  font-size:.85rem; line-height:1.5; word-wrap:break-word; white-space:pre-wrap;
                  ${
                    mine
                      ? 'background:linear-gradient(135deg,#8B5CF6,#EC4899);color:#fff;border-bottom-right-radius:4px'
                      : 'background:var(--card);color:var(--text);border:1px solid var(--border);border-bottom-left-radius:4px'
                  }
                ">${esc(m.message)}</div>
                <div style="font-size:.62rem;color:var(--text-3);padding:0 6px">
                  ${date} · ${time}${mine ? ' · ✓' : ''}
                </div>
              </div>
            `;
          })
          .join('');

        if (wasAtBottom) {
          listEl.scrollTop = listEl.scrollHeight;
        }

        const unreadIds = list.filter((m) => m.receiver_id === user.id && !m.read_at).map((m) => m.id);
        if (unreadIds.length) {
          supa
            .from('partner_messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds)
            .then(() => {})
            .catch(() => {});
        }
      } catch (e) {
        console.warn('[Partner] load messages error:', e);
      }
    }

    async function sendMessage() {
      const text = (inputEl.value || '').trim();
      if (!text) return;

      sendBtn.disabled = true;
      try {
        const { error } = await supa.from('partner_messages').insert({
          sender_id: user.id,
          receiver_id: partnerId,
          message: text,
        });
        if (error) throw error;
        inputEl.value = '';
        inputEl.style.height = '44px';
        await loadMessages();
        listEl.scrollTop = listEl.scrollHeight;
      } catch (e) {
        tmsg('Failed to send: ' + (e.message || 'Unknown'), 'err');
      } finally {
        sendBtn.disabled = false;
      }
    }

    sendBtn.onclick = sendMessage;

    inputEl.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    inputEl.oninput = () => {
      inputEl.style.height = '44px';
      inputEl.style.height = Math.min(120, inputEl.scrollHeight) + 'px';
    };

    await loadMessages();

    chatPollHandle = setInterval(() => {
      const el = document.getElementById(containerId + '_list');
      if (!el) {
        if (chatPollHandle) {
          clearInterval(chatPollHandle);
          chatPollHandle = null;
        }
        return;
      }
      loadMessages();
    }, 5000);
  }

  // ═══════════════ 13. INIT ═══════════════
  function tryInject() {
    const nav = document.querySelector('.nav');
    const content = document.getElementById('content');
    if (!nav || !content) return false;

    const tabOk = injectSidebarTab();
    const viewOk = injectView();

    if (tabOk && viewOk) {
      pstate.initialized = true;
      return true;
    }
    return false;
  }

  function updatePartnerTabAppearance() {
    const btn = document.querySelector('.nav-item[data-view="partner"]');
    if (!btn) return;
    if (pstate.cachedUser) btn.style.visibility = '';

    const isPremium = isUserPremium();
    const icon = btn.querySelector('.nav-icon');
    const isLocked = btn.classList.contains('premium-locked');

    if (isPremium && isLocked) {
      btn.classList.remove('premium-locked');
      btn.classList.add('premium-unlocked');
      if (icon) icon.textContent = PARTNER_ICON;
    } else if (!isPremium && !isLocked) {
      btn.classList.add('premium-locked');
      btn.classList.remove('premium-unlocked');
      if (icon) icon.textContent = '🔒';
    }
  }

  async function backgroundLoad() {
    let tries = 0;
    const checkUser = setInterval(async () => {
      tries++;
      const user = await getCurrentUser();
      if (user && getSupa()) {
        clearInterval(checkUser);

        updatePartnerTabAppearance();
        setTimeout(updatePartnerTabAppearance, 800);
        setTimeout(updatePartnerTabAppearance, 2000);
        setTimeout(updatePartnerTabAppearance, 4000);
        setTimeout(updatePartnerTabAppearance, 7000);

        try {
          await loadPartnerData(user);
          await handleInviteToken();
        } catch (e) {}
      } else if (tries > 60) {
        clearInterval(checkUser);
      }
    }, 500);
  }

  function boot() {
    if (!tryInject()) {
      let retries = 0;
      const iv = setInterval(() => {
        retries++;
        if (tryInject() || retries > 60) clearInterval(iv);
      }, 200);
    }
    backgroundLoad();

    let pollCount = 0;
    const pollHandle = setInterval(() => {
      pollCount++;
      updatePartnerTabAppearance();
      if (pollCount > 30) clearInterval(pollHandle);
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.__partner = {
    reload: () => renderPartnerView(),
    open: () => openPartnerView(),
    state: pstate,
    isPremium: isUserPremium,
  };

  console.log('[Partner] 📦 Module loaded (safe)');
})();

/* ============================================
   PARTNER CHAT POPUP + NOTIFICATION SYSTEM
   ============================================ */

// Notification sound (Base64 encoded - no external file needed)
const NOTIFICATION_SOUND =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';

let messageStack = []; // Stack of pending chat popups
let currentPopupPartner = null;
let lastMessageCheckTime = new Date().toISOString();
let soundEnabled = true;

// Inject popup container into DOM (once)
function injectChatPopupContainer() {
  if (document.getElementById('partner-chat-popup-container')) return;

  const container = document.createElement('div');
  container.id = 'partner-chat-popup-container';
  container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        display: flex;
        flex-direction: column-reverse;
        gap: 10px;
        pointer-events: none;
    `;
  document.body.appendChild(container);
}

// Play notification sound using Web Audio API (bypass autoplay policy)
function playNotificationSound() {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      console.log('Web Audio API not supported');
      return;
    }
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Play a pleasant two-tone chime
    const now = ctx.currentTime;

    // Tone 1: Higher pitch
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2: Lower pitch (slight delay)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, now + 0.15); // E5
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);

    console.log('🔔 Notification sound played');
  } catch (e) {
    console.log('Sound error:', e);
  }
}

// Create a floating popup for a specific partner
function createChatPopup(partnerInfo, messageData) {
  injectChatPopupContainer();

  const container = document.getElementById('partner-chat-popup-container');
  const popupId = `partner-popup-${partnerInfo.id}`;

  // If popup already exists for this partner, just update
  let existingPopup = document.getElementById(popupId);
  if (existingPopup) {
    updatePopupMessage(existingPopup, messageData);
    return;
  }

  const popup = document.createElement('div');
  popup.id = popupId;
  popup.dataset.partnerId = partnerInfo.id;
  popup.style.cssText = `
        width: 320px;
        background: linear-gradient(135deg, #1a0b2e, #2d1b4e);
        border: 1px solid rgba(168, 85, 247, 0.4);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(168, 85, 247, 0.2);
        overflow: hidden;
        pointer-events: auto;
        animation: slideUpPopup 0.3s ease-out;
        font-family: 'Inter', system-ui, sans-serif;
    `;

  const avatarLetter = (partnerInfo.name || 'P').charAt(0).toUpperCase();
  const previewText =
    messageData.message.length > 50 ? messageData.message.substring(0, 50) + '...' : messageData.message;

  popup.innerHTML = `
        <style>
            @keyframes slideUpPopup {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .partner-popup-header {
                display: flex;
                align-items: center;
                padding: 12px 14px;
                background: rgba(168, 85, 247, 0.1);
                border-bottom: 1px solid rgba(168, 85, 247, 0.2);
                cursor: pointer;
            }
            .partner-popup-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(135deg, #8B5CF6, #EC4899);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 16px;
                flex-shrink: 0;
            }
            .partner-popup-name {
                flex: 1;
                margin-left: 10px;
                color: #fff;
                font-weight: 600;
                font-size: 14px;
            }
            .partner-popup-close {
                background: transparent;
                border: none;
                color: #A1A1AA;
                font-size: 20px;
                cursor: pointer;
                padding: 0 6px;
                line-height: 1;
            }
            .partner-popup-close:hover { color: #fff; }
            .partner-popup-body {
                padding: 12px 14px;
                cursor: pointer;
            }
            .partner-popup-msg {
                color: #E5E7EB;
                font-size: 13px;
                line-height: 1.4;
                margin: 0;
                word-wrap: break-word;
            }
            .partner-popup-time {
                color: #71717A;
                font-size: 11px;
                margin-top: 4px;
            }
            .partner-popup-footer {
                padding: 8px 14px 12px 14px;
                display: flex;
                gap: 8px;
            }
            .partner-popup-btn {
                flex: 1;
                background: linear-gradient(135deg, #8B5CF6, #EC4899);
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s;
            }
            .partner-popup-btn:hover { opacity: 0.9; }
            .partner-popup-btn.secondary {
                background: rgba(168, 85, 247, 0.15);
                color: #A855F7;
            }
            .partner-popup-badge {
                position: absolute;
                top: 8px;
                right: 40px;
                background: #EC4899;
                color: white;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 10px;
                font-weight: 700;
            }
        </style>
        <div class="partner-popup-header">
            <div class="partner-popup-avatar">${avatarLetter}</div>
            <div class="partner-popup-name">${partnerInfo.name || 'Partner'}</div>
            <button class="partner-popup-close" onclick="closePartnerPopup('${partnerInfo.id}')">×</button>
        </div>
        <div class="partner-popup-body" onclick="openPartnerChat('${partnerInfo.id}')">
            <p class="partner-popup-msg">${escapeHtmlForPopup(previewText)}</p>
            <div class="partner-popup-time">${formatPopupTime(messageData.created_at)}</div>
        </div>
        <div class="partner-popup-footer">
            <button class="partner-popup-btn" onclick="openPartnerChat('${partnerInfo.id}')">Reply</button>
            <button class="partner-popup-btn secondary" onclick="closePartnerPopup('${partnerInfo.id}')">Dismiss</button>
        </div>
    `;

  // Prepend so newest popup appears at bottom (due to column-reverse)
  container.appendChild(popup);
}

function updatePopupMessage(popup, messageData) {
  const msgEl = popup.querySelector('.partner-popup-msg');
  const timeEl = popup.querySelector('.partner-popup-time');
  if (msgEl) {
    const previewText =
      messageData.message.length > 50 ? messageData.message.substring(0, 50) + '...' : messageData.message;
    msgEl.textContent = previewText;
  }
  if (timeEl) timeEl.textContent = formatPopupTime(messageData.created_at);
}

function escapeHtmlForPopup(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatPopupTime(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return d.toLocaleDateString();
}

// Global functions
window.closePartnerPopup = function (partnerId) {
  const popup = document.getElementById(`partner-popup-${partnerId}`);
  if (popup) {
    popup.style.transition = 'opacity 0.2s, transform 0.2s';
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(20px)';
    setTimeout(() => popup.remove(), 200);
  }
  messageStack = messageStack.filter((m) => m.partnerId !== partnerId);
};

window.openPartnerChat = function (partnerId) {
  // Close popup
  window.closePartnerPopup(partnerId);

  // Open partner view and switch to that partner's chat
  if (typeof openPartnerView === 'function') {
    openPartnerView();
    // Scroll to that partner's chat
    setTimeout(() => {
      const chatEl = document.querySelector(`[data-partner-chat="${partnerId}"]`);
      if (chatEl) chatEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  }
};

// Main polling function - checks for new messages
async function checkForNewMessages() {
  if (!window.supa) return;
  const state = getState();
  if (!state || !state.user) return;

  try {
    const { data, error } = await window.supa
      .from('partner_messages')
      .select('id, sender_id, message, created_at')
      .eq('receiver_id', state.user.id)
      .gt('created_at', lastMessageCheckTime)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return;

    // Update last check time
    lastMessageCheckTime = new Date().toISOString();

    // Group messages by sender
    const bySender = {};
    data.forEach((msg) => {
      if (!bySender[msg.sender_id]) bySender[msg.sender_id] = [];
      bySender[msg.sender_id].push(msg);
    });

    // Play sound once per poll if there are new messages
    playNotificationSound();

    // ✅ NEW: Browser notification (works even when tab is in background)
    if ('Notification' in window && Notification.permission === 'granted') {
      const firstSenderId = Object.keys(bySender)[0];
      const firstMsg = bySender[firstSenderId][0];
      try {
        new Notification('💬 New message from your partner', {
          body: firstMsg.message.substring(0, 100),
          icon: '/android-chrome-192x192.png',
          tag: 'partner-message',
        });
      } catch (e) {
        console.log('Notification error:', e);
      }
    }

    // Get sender profiles
    const senderIds = Object.keys(bySender);
    const { data: profiles } = await window.supa.from('profiles').select('id, name, full_name').in('id', senderIds);

    const profileMap = {};
    (profiles || []).forEach((p) => (profileMap[p.id] = p));

    // Show popup for each sender (stacked)
    for (const senderId of senderIds) {
      const messages = bySender[senderId];
      const latestMsg = messages[messages.length - 1];
      const profile = profileMap[senderId] || {};

      const displayName =
        profile.name ||
        profile.full_name ||
        profile.username ||
        profile.display_name ||
        (profile.email ? profile.email.split('@')[0] : null) ||
        'Partner';

      console.log('👤 Sender name resolved:', senderId, '→', displayName, 'from profile:', profile);

      createChatPopup(
        {
          id: senderId,
          name: displayName,
        },
        latestMsg,
      );
    }

    // Also refresh the chat view if partner tab is open
    if (typeof renderMessages === 'function') {
      const partnerView = document.getElementById('partner-view');
      if (partnerView && partnerView.style.display !== 'none') {
        renderMessages();
      }
    }
  } catch (e) {
    console.log('Message check error:', e);
  }
}

// Start polling when user is logged in
function startMessagePolling() {
  injectChatPopupContainer();

  // Set initial check time (so we don't spam old messages)
  lastMessageCheckTime = new Date().toISOString();

  // Poll every 5 seconds
  setInterval(checkForNewMessages, 5000);

  // ✅ NEW: Request browser notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // ✅ NEW: Prime audio context (Chrome autoplay policy)
  // Jab user pehli baar page pe click kare, tab sound enable ho jayegi
  document.addEventListener(
    'click',
    function primeAudio() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          ctx.resume().then(() => {
            console.log('🔊 Audio context unlocked');
            ctx.close();
          });
        }
      } catch (e) {}
      document.removeEventListener('click', primeAudio);
    },
    { once: true },
  );

  console.log('✅ Partner message polling started');
}

// Auto-start when page loads
(function initChatPopup() {
  // Wait for user to be logged in
  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;
    const state = getState();
    if (state && state.user && window.supa) {
      clearInterval(checkInterval);
      startMessagePolling();
    }
    if (attempts > 60) clearInterval(checkInterval); // Stop after 5 min
  }, 5000);
})();
