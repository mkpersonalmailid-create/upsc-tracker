/* ═══════════════════════════════════════════════════════════════
   STUDY WITH PARTNER — Safe Module (No Loop)
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

  // ═══════════════ 1. INJECT SIDEBAR TAB (Once) ═══════════════
  function injectSidebarTab() {
    const nav = document.querySelector('.nav');
    if (!nav) return false;

    // Already exists
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
      <span class="nav-label">Study Partner</span>
      <span class="nav-badge hidden" id="partnerBadge">0</span>
    `;

    const anchor =
      nav.querySelector('.nav-item[data-view="premium"]') ||
      nav.querySelector('.nav-item[data-view="support"]') ||
      nav.querySelector('.nav-item[data-view="settings"]');

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

    await loadPartnerData(user);

    const myId = user.id;
    const accepted = pstate.links.filter((l) => l.status === 'accepted');
    const incoming = pstate.links.filter((l) => l.status === 'pending' && l.partner_id === myId);
    const outgoing = pstate.links.filter((l) => l.status === 'pending' && l.requester_id === myId);
    const myInvites = pstate.invites.filter((i) => i.status === 'pending');

    let html = `
      <div class="card" style="margin-bottom:18px">
        <div class="card-header">
          <div>
            <span class="card-title-lg">👥 Study with Partner</span>
            <div style="font-size:.82rem;color:var(--text-3);margin-top:4px">
              Study alongside a friend, compare progress, and stay motivated together.
            </div>
          </div>
          ${accepted.length < 1 ? `<button class="btn btn-primary btn-sm" id="pAddBtn">＋ Add Partner</button>` : ''}
        </div>
      </div>
    `;

    if (accepted.length === 0 && incoming.length === 0 && outgoing.length === 0 && myInvites.length === 0) {
      html += howItWorksCard();
    }

    if (incoming.length > 0) {
      html += `
        <div class="card" style="margin-bottom:18px;border-left:4px solid var(--amber)">
          <div class="card-header">
            <div><span class="card-title-lg">🔔 Partner Requests (${incoming.length})</span></div>
          </div>
          <div class="list" id="pIncomingList"></div>
        </div>`;
    }

    if (outgoing.length > 0 || myInvites.length > 0) {
      html += `
        <div class="card" style="margin-bottom:18px">
          <div class="card-header">
            <div><span class="card-title-lg">📤 Sent Requests</span></div>
          </div>
          <div class="list" id="pOutgoingList"></div>
        </div>`;
    }

    if (accepted.length > 0) {
      html += `<div id="pComparisonWrap"></div>`;
    } else if (incoming.length === 0 && outgoing.length === 0 && myInvites.length === 0) {
      html += `
        <div class="card">
          <div class="empty" style="padding:60px 20px">
            <div class="em">👥</div>
            <h4>No partner yet</h4>
            <p>Add a friend and start studying together!</p>
            <button class="btn btn-primary" id="pAddBtn2">＋ Add Your First Partner</button>
          </div>
        </div>`;
    }

    el.innerHTML = html;

    document.getElementById('pAddBtn')?.addEventListener('click', openAddPartnerModal);
    document.getElementById('pAddBtn2')?.addEventListener('click', openAddPartnerModal);

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

  // ═══════════════ 8. SEND REQUEST ═══════════════
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
        const { data: existing } = await supa
          .from('partner_links')
          .select('id, status')
          .or(
            `and(requester_id.eq.${user.id},partner_id.eq.${found.id}),and(requester_id.eq.${found.id},partner_id.eq.${user.id})`,
          )
          .maybeSingle();

        if (existing) {
          tmsg('A request already exists with this user', 'info');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Send Request';
          }
          return;
        }

        const { error: insertErr } = await supa.from('partner_links').insert({
          requester_id: user.id,
          partner_id: found.id,
          status: 'pending',
        });
        if (insertErr) throw insertErr;

        if (typeof window.closeModal === 'function') window.closeModal();
        tmsg(`✅ Request sent to ${found.name || found.email}!`, 'ok');
        renderPartnerView();
      } else {
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
      const sinceStr = since.toISOString().slice(0, 10);

      const [mySessions, partnerSessions] = await Promise.all([
        fetchSessions(myId, sinceStr),
        fetchSessions(partnerId, sinceStr),
      ]);

      const myTotal = mySessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);
      const pTotal = partnerSessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);
      const today = new Date().toISOString().slice(0, 10);
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
      // Add chat below comparison
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

  // ═══════════════ 12. INVITE TOKEN HANDLER ═══════════════
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

      await supa.from('partner_links').insert({
        requester_id: invite.requester_id,
        partner_id: user.id,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      });

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

    // Clear any existing polling
    if (chatPollHandle) {
      clearInterval(chatPollHandle);
      chatPollHandle = null;
    }

    const user = await getCurrentUser();
    if (!user) return;
    const supa = getSupa();
    if (!supa) return;

    // ── Render chat UI once ──
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

    // ── Fetch & render messages ──
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

        // Auto-scroll if was at bottom
        if (wasAtBottom) {
          listEl.scrollTop = listEl.scrollHeight;
        }

        // Mark as read (background)
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

    // ── Send message ──
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

    // Enter to send, Shift+Enter for new line
    inputEl.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    // Auto-grow textarea
    inputEl.oninput = () => {
      inputEl.style.height = '44px';
      inputEl.style.height = Math.min(120, inputEl.scrollHeight) + 'px';
    };

    // Initial load
    await loadMessages();

    // Poll every 5 seconds for new messages (light)
    chatPollHandle = setInterval(() => {
      const el = document.getElementById(containerId + '_list');
      if (!el) {
        // Chat is closed/removed
        if (chatPollHandle) {
          clearInterval(chatPollHandle);
          chatPollHandle = null;
        }
        return;
      }
      loadMessages();
    }, 5000);
  }

  // ═══════════════ 13. INIT (SAFE — No Observer, No Polling) ═══════════════
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
    const isPremium = isUserPremium();
    const icon = btn.querySelector('.nav-icon');

    if (isPremium) {
      btn.classList.remove('premium-locked');
      btn.classList.add('premium-unlocked');
      if (icon) icon.textContent = PARTNER_ICON;
    } else {
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

        // ✅ Update tab appearance multiple times to catch state load
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // ❌ NO MutationObserver
  // ❌ NO setInterval for appearance

  window.__partner = {
    reload: () => renderPartnerView(),
    open: () => openPartnerView(),
    state: pstate,
    isPremium: isUserPremium,
  };

  console.log('[Partner] 📦 Module loaded (safe)');
})();
