/* ═══════════════════════════════════════════════════════════════
   STUDY WITH PARTNER — Feature Module
   Auto-injects sidebar tab + view. Zero changes to app.html.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ═══════════════ CONFIG ═══════════════
  const APP_URL = 'https://upscstudytracker.co.in';
  const MAX_PARTNERS = 1; // Change to 3 if you want multiple

  // ═══════════════ STATE ═══════════════
  const pstate = {
    initialized: false,
    links: [], // partner_links rows (user is either requester or partner)
    invites: [], // partner_invites rows (user is requester)
    loading: false,
    activeTab: 'overview', // overview | requests | add
  };

  // ═══════════════ HELPERS ═══════════════
  const $p = (s, r = document) => r.querySelector(s);
  const $$p = (s, r = document) => [...r.querySelectorAll(s)];

  function waitForApp() {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (
          typeof window.state !== 'undefined' &&
          window.state &&
          typeof window.supa !== 'undefined' &&
          window.supa &&
          window.state.user
        ) {
          clearInterval(check);
          resolve();
        }
      }, 300);
      setTimeout(() => clearInterval(check), 30000);
    });
  }

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

  function toastMsg(msg, type = 'info') {
    if (typeof window.toast === 'function') window.toast(msg, type);
    else console.log('[Partner]', msg);
  }

  // ═══════════════ STEP 1: INJECT SIDEBAR TAB ═══════════════
  function injectSidebarTab() {
    const nav = document.querySelector('.nav');
    if (!nav) return false;
    if (document.querySelector('.nav-item[data-view="partner"]')) return true; // already

    // "More" section ke baad ya end me daal do
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.dataset.view = 'partner';
    btn.innerHTML = `
      <span class="nav-icon">👥</span>
      <span class="nav-label">Study Partner</span>
      <span class="nav-badge hidden" id="partnerBadge">0</span>
    `;
    btn.addEventListener('click', () => {
      if (typeof window.switchView === 'function') window.switchView('partner');
      else showPartnerView();
    });

    // Insert "Study Partner" in the "More" section — before Premium
    const premiumBtn = nav.querySelector('.nav-item[data-view="premium"]');
    if (premiumBtn && premiumBtn.parentNode) {
      premiumBtn.parentNode.insertBefore(btn, premiumBtn);
    } else {
      // Fallback: before admin section
      const adminWrap = document.getElementById('adminNavWrap');
      if (adminWrap && adminWrap.parentNode) {
        adminWrap.parentNode.insertBefore(btn, adminWrap);
      } else {
        nav.appendChild(btn);
      }
    }
    return true;
  }

  // ═══════════════ STEP 2: INJECT VIEW ═══════════════
  function injectView() {
    const content = document.getElementById('content');
    if (!content) return false;
    if (document.getElementById('view-partner')) return true; // already

    const section = document.createElement('section');
    section.className = 'view';
    section.id = 'view-partner';
    section.innerHTML = `
      <div id="partnerContent">
        <div class="empty"><div class="em">👥</div><h4>Loading…</h4></div>
      </div>
    `;
    content.appendChild(section);
    return true;
  }

  // ═══════════════ STEP 3: HOOK INTO switchView ═══════════════
  function hookSwitchView() {
    if (!window.switchView || window.__partnerHooked) return;
    const original = window.switchView;
    window.switchView = function (name) {
      if (name === 'partner') {
        showPartnerView();
        // update nav active states manually
        document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-partner'));
        document
          .querySelectorAll('.nav-item')
          .forEach((n) => n.classList.toggle('active', n.dataset.view === 'partner'));
        document.getElementById('content').scrollTop = 0;
        return;
      }
      return original.apply(this, arguments);
    };
    window.__partnerHooked = true;
  }

  // ═══════════════ STEP 4: LOAD DATA FROM SUPABASE ═══════════════
  async function loadPartnerData() {
    const supa = window.supa;
    const user = window.state?.user;
    if (!supa || !user) return;

    pstate.loading = true;

    try {
      // Fetch all partner_links involving this user
      const { data: links, error: linkErr } = await supa
        .from('partner_links')
        .select('*')
        .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (linkErr) console.warn('[Partner] link load error:', linkErr.message);
      pstate.links = links || [];

      // Fetch invites created by this user
      const { data: invites, error: invErr } = await supa
        .from('partner_invites')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (invErr) console.warn('[Partner] invite load error:', invErr.message);
      pstate.invites = invites || [];

      updateBadge();
    } catch (e) {
      console.warn('[Partner] load error:', e);
    } finally {
      pstate.loading = false;
    }
  }

  // ═══════════════ BADGE UPDATE ═══════════════
  function updateBadge() {
    const badge = document.getElementById('partnerBadge');
    if (!badge) return;
    const pendingCount = pstate.links.filter(
      (l) => l.status === 'pending' && l.partner_id === window.state?.user?.id,
    ).length;
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // ═══════════════ STEP 5: MAIN VIEW ═══════════════
  async function showPartnerView() {
    const el = document.getElementById('partnerContent');
    if (!el) return;

    el.innerHTML = '<div class="empty"><div class="em">👥</div><h4>Loading…</h4></div>';

    await loadPartnerData();

    const user = window.state?.user;
    const myId = user.id;

    const accepted = pstate.links.filter((l) => l.status === 'accepted');
    const incoming = pstate.links.filter((l) => l.status === 'pending' && l.partner_id === myId);
    const outgoing = pstate.links.filter((l) => l.status === 'pending' && l.requester_id === myId);
    const myInvites = pstate.invites.filter((i) => i.status === 'pending');

    // ═══ HEADER ═══
    let html = `
      <div class="card" style="margin-bottom:18px">
        <div class="card-header">
          <div>
            <span class="card-title-lg">👥 Study with Partner</span>
            <div style="font-size:.82rem;color:var(--text-3);margin-top:4px">
              Apne dost ke saath padho, compare karo, aur motivate raho.
            </div>
          </div>
          ${accepted.length < MAX_PARTNERS ? `<button class="btn btn-primary btn-sm" id="pAddBtn">＋ Add Partner</button>` : ''}
        </div>
      </div>
    `;

    // ═══ INCOMING REQUESTS ═══
    if (incoming.length > 0) {
      html += `
        <div class="card" style="margin-bottom:18px;border-left:4px solid var(--amber)">
          <div class="card-header">
            <span class="card-title-lg">🔔 Partner Requests (${incoming.length})</span>
          </div>
          <div class="list" id="pIncomingList"></div>
        </div>
      `;
    }

    // ═══ OUTGOING (pending) ═══
    if (outgoing.length > 0 || myInvites.length > 0) {
      html += `
        <div class="card" style="margin-bottom:18px">
          <div class="card-header">
            <span class="card-title-lg">📤 Sent Requests</span>
          </div>
          <div class="list" id="pOutgoingList"></div>
        </div>
      `;
    }

    // ═══ ACCEPTED PARTNERS (Comparison) ═══
    if (accepted.length > 0) {
      html += `<div id="pComparisonWrap"></div>`;
    } else if (incoming.length === 0 && outgoing.length === 0 && myInvites.length === 0) {
      // Empty state
      html += `
        <div class="card">
          <div class="empty" style="padding:60px 20px">
            <div class="em">👥</div>
            <h4>Abhi tak koi partner nahi</h4>
            <p>Apne dost ko add karo aur saath me padho!</p>
            <button class="btn btn-primary" id="pAddBtn2">＋ Add Your First Partner</button>
          </div>
        </div>
      `;
    }

    el.innerHTML = html;

    // ═══ RENDER INCOMING REQUESTS ═══
    if (incoming.length > 0) {
      const listEl = document.getElementById('pIncomingList');
      if (listEl) {
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
              <button class="btn btn-secondary btn-sm" data-pa-reject="${link.id}">✕ Reject</button>
            </div>
          `;
          listEl.appendChild(card);
        }

        listEl.querySelectorAll('[data-pa-accept]').forEach((b) => {
          b.onclick = () => respondToRequest(b.dataset.paAccept, 'accepted');
        });
        listEl.querySelectorAll('[data-pa-reject]').forEach((b) => {
          b.onclick = () => respondToRequest(b.dataset.paReject, 'rejected');
        });
      }
    }

    // ═══ RENDER OUTGOING ═══
    if (outgoing.length > 0 || myInvites.length > 0) {
      const listEl = document.getElementById('pOutgoingList');
      if (listEl) {
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
            <button class="btn btn-danger btn-sm" data-pa-cancel="${link.id}">Cancel</button>
          `;
          listEl.appendChild(card);
        }
        for (const inv of myInvites) {
          const inviteLink = `${APP_URL}/auth.html?invite=${inv.token}`;
          const card = document.createElement('div');
          card.className = 'row-item';
          card.innerHTML = `
            <div style="width:38px;height:38px;border-radius:50%;background:var(--card-2);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">📨</div>
            <div class="row-info">
              <div class="row-title">${esc(inv.invitee_email)}</div>
              <div class="row-meta">Invite link — expires ${new Date(inv.expires_at).toLocaleDateString()}</div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-primary btn-sm" data-pa-share="${inv.id}">Share</button>
              <button class="btn btn-secondary btn-sm" data-pa-cancel-inv="${inv.id}">Cancel</button>
            </div>
          `;
          listEl.appendChild(card);
        }

        listEl.querySelectorAll('[data-pa-cancel]').forEach((b) => {
          b.onclick = () => cancelRequest(b.dataset.paCancel);
        });
        listEl.querySelectorAll('[data-pa-cancel-inv]').forEach((b) => {
          b.onclick = () => cancelInvite(b.dataset.paCancelInv);
        });
        listEl.querySelectorAll('[data-pa-share]').forEach((b) => {
          b.onclick = () => {
            const inv = pstate.invites.find((i) => i.id === b.dataset.paShare);
            if (inv) openShareModal(inv);
          };
        });
      }
    }

    // ═══ RENDER COMPARISON ═══
    if (accepted.length > 0) {
      renderComparison(accepted);
    }

    // ═══ WIRE ADD BUTTONS ═══
    document.getElementById('pAddBtn')?.addEventListener('click', openAddPartnerModal);
    document.getElementById('pAddBtn2')?.addEventListener('click', openAddPartnerModal);
  }

  // ═══════════════ FETCH PROFILE HELPER ═══════════════
  async function fetchProfile(userId) {
    if (!window.supa) return null;
    try {
      const { data } = await window.supa
        .from('profiles')
        .select('id, name, email, optional_subject')
        .eq('id', userId)
        .maybeSingle();
      return data;
    } catch (e) {
      return null;
    }
  }

  // ═══════════════ ADD PARTNER MODAL ═══════════════
  function openAddPartnerModal() {
    const body = `
      <div class="field">
        <label>Partner's Email</label>
        <input type="email" id="pEmailInput" placeholder="friend@example.com" autocomplete="off" />
        <div style="font-size:.72rem;color:var(--text-3);margin-top:6px">
          Agar wo app me registered hoga toh direct request jayegi.
          Warna aapko invite link milega jise WhatsApp/Telegram pe share kar sakte ho.
        </div>
      </div>
    `;

    const actions = `
      <button class="btn btn-secondary" data-close>Cancel</button>
      <button class="btn btn-primary" id="pSendBtn">Send Request</button>
    `;

    if (typeof window.openModal !== 'function') {
      toastMsg('Modal system not ready', 'err');
      return;
    }

    window.openModal(
      window.modalShell({
        title: '➕ Add Study Partner',
        subtitle: 'Email se partner dhundho',
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
              toastMsg('Valid email daalo', 'err');
              return;
            }
            await sendPartnerRequest(email);
          };
        },
      },
    );
  }

  // ═══════════════ SEND REQUEST ═══════════════
  async function sendPartnerRequest(email) {
    const supa = window.supa;
    const user = window.state?.user;
    if (!supa || !user) return;

    const myEmail = (user.email || '').toLowerCase();
    if (email === myEmail) {
      toastMsg('Khud ko partner nahi bana sakte 😅', 'err');
      return;
    }

    const btn = document.getElementById('pSendBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Searching…';
    }

    try {
      // Search user by email
      const { data: found, error: searchErr } = await supa
        .from('profiles')
        .select('id, name, email')
        .ilike('email', email)
        .maybeSingle();

      if (searchErr) console.warn('[Partner] search error:', searchErr.message);

      if (found) {
        // ═══ CASE 1: Email exists → in-app request ═══
        // Check duplicate
        const { data: existing } = await supa
          .from('partner_links')
          .select('id, status')
          .or(
            `and(requester_id.eq.${user.id},partner_id.eq.${found.id}),and(requester_id.eq.${found.id},partner_id.eq.${user.id})`,
          )
          .maybeSingle();

        if (existing) {
          toastMsg('Ye request already bhej hui hai ya partner already hai', 'info');
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
        toastMsg(`✅ Request sent to ${found.name || found.email}!`, 'ok');
        showPartnerView();
      } else {
        // ═══ CASE 2: Email not found → invite link ═══
        const { data: invite, error: invErr } = await supa
          .from('partner_invites')
          .insert({
            requester_id: user.id,
            invitee_email: email,
            status: 'pending',
          })
          .select()
          .single();

        if (invErr) throw invErr;

        if (typeof window.closeModal === 'function') window.closeModal();
        toastMsg('📨 Invite link ready! Share karo', 'ok');
        openShareModal(invite);
        showPartnerView();
      }
    } catch (e) {
      console.warn('[Partner] send error:', e);
      toastMsg('Error: ' + (e.message || 'Failed'), 'err');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Send Request';
      }
    }
  }

  // ═══════════════ SHARE MODAL ═══════════════
  function openShareModal(invite) {
    const link = `${APP_URL}/auth.html?invite=${invite.token}`;
    const shareText = `Bhai, UPSC Tracker pe mera study partner ban na! Ye link use kar: ${link}`;

    const body = `
      <div style="padding:14px;background:var(--card-2);border-radius:12px;margin-bottom:14px">
        <div style="font-size:.72rem;color:var(--text-3);font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Invite Link</div>
        <div style="font-family:var(--mono);font-size:.78rem;word-break:break-all;color:var(--text-2)" id="pShareLink">${esc(link)}</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        <button class="btn btn-secondary" id="pCopyBtn" style="padding:14px">📋 Copy Link</button>
        <button class="btn btn-secondary" id="pWhatsappBtn" style="padding:14px;background:#25D366;color:#fff;border:none">💬 WhatsApp</button>
        <button class="btn btn-secondary" id="pTelegramBtn" style="padding:14px;background:#0088cc;color:#fff;border:none">✈️ Telegram</button>
        <button class="btn btn-secondary" id="pInstagramBtn" style="padding:14px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:#fff;border:none">📷 Instagram</button>
      </div>

      <p style="font-size:.72rem;color:var(--text-3);text-align:center;margin-top:14px">
        ⏳ Ye link 7 din tak valid hai
      </p>
    `;

    const actions = `<button class="btn btn-secondary" data-close>Close</button>`;

    if (typeof window.openModal !== 'function') {
      // Fallback: just copy
      navigator.clipboard?.writeText(link);
      toastMsg('Link copied!', 'ok');
      return;
    }

    window.openModal(
      window.modalShell({
        title: '🎉 Invite Ready!',
        subtitle: 'Share with your friend',
        body,
        actions,
      }),
      {
        onMount() {
          document.getElementById('pCopyBtn').onclick = () => {
            navigator.clipboard.writeText(link).then(() => toastMsg('✅ Link copied!', 'ok'));
          };

          document.getElementById('pWhatsappBtn').onclick = () => {
            const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(url, '_blank');
          };

          document.getElementById('pTelegramBtn').onclick = () => {
            const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Study partner ban na!')}`;
            window.open(url, '_blank');
          };

          document.getElementById('pInstagramBtn').onclick = () => {
            navigator.clipboard.writeText(shareText).then(() => {
              toastMsg('✅ Text copied — Instagram me paste karo!', 'ok');
              setTimeout(() => window.open('https://www.instagram.com/direct/inbox/', '_blank'), 500);
            });
          };
        },
      },
    );
  }

  // ═══════════════ RESPOND TO REQUEST ═══════════════
  async function respondToRequest(linkId, status) {
    const supa = window.supa;
    if (!supa) return;

    try {
      const updates = { status };
      if (status === 'accepted') updates.accepted_at = new Date().toISOString();

      const { error } = await supa.from('partner_links').update(updates).eq('id', linkId);
      if (error) throw error;

      toastMsg(status === 'accepted' ? '✅ Partner added!' : '❌ Request rejected', 'ok');
      showPartnerView();
    } catch (e) {
      toastMsg('Failed: ' + e.message, 'err');
    }
  }

  // ═══════════════ CANCEL REQUEST ═══════════════
  async function cancelRequest(linkId) {
    const supa = window.supa;
    if (!supa) return;
    try {
      const { error } = await supa.from('partner_links').delete().eq('id', linkId);
      if (error) throw error;
      toastMsg('Request cancelled', 'info');
      showPartnerView();
    } catch (e) {
      toastMsg('Failed: ' + e.message, 'err');
    }
  }

  // ═══════════════ CANCEL INVITE ═══════════════
  async function cancelInvite(inviteId) {
    const supa = window.supa;
    if (!supa) return;
    try {
      const { error } = await supa.from('partner_invites').update({ status: 'cancelled' }).eq('id', inviteId);
      if (error) throw error;
      toastMsg('Invite cancelled', 'info');
      showPartnerView();
    } catch (e) {
      toastMsg('Failed: ' + e.message, 'err');
    }
  }

  // ═══════════════ COMPARISON DASHBOARD ═══════════════
  async function renderComparison(acceptedLinks) {
    const wrap = document.getElementById('pComparisonWrap');
    if (!wrap) return;

    const myId = window.state?.user?.id;

    for (const link of acceptedLinks) {
      const partnerId = link.requester_id === myId ? link.partner_id : link.requester_id;
      const partner = await fetchProfile(partnerId);
      if (!partner) continue;

      // Fetch both users' sessions (last 30 days)
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceStr = since.toISOString().slice(0, 10);

      const [mySessions, partnerSessions] = await Promise.all([
        fetchSessions(myId, sinceStr),
        fetchSessions(partnerId, sinceStr),
      ]);

      // Compute stats
      const myTotal = mySessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);
      const pTotal = partnerSessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);

      const today = new Date().toISOString().slice(0, 10);
      const myToday = mySessions.filter((s) => s.date === today).reduce((a, s) => a + (s.duration_seconds || 0), 0);
      const pToday = partnerSessions.filter((s) => s.date === today).reduce((a, s) => a + (s.duration_seconds || 0), 0);

      // Streak
      const myStreak = computeStreak(mySessions);
      const pStreak = computeStreak(partnerSessions);

      // Syllabus progress
      const mySyl = await fetchSyllabusCount(myId);
      const pSyl = await fetchSyllabusCount(partnerId);

      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '18px';
      card.innerHTML = `
        <div class="card-header">
          <div>
            <span class="card-title-lg">📊 You vs ${esc(partner.name || 'Partner')}</span>
            <div style="font-size:.78rem;color:var(--text-3);margin-top:4px">
              Last 30 days comparison
            </div>
          </div>
          <button class="btn btn-danger btn-sm" data-pa-remove="${link.id}">Remove Partner</button>
        </div>

        <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">

          <div class="kpi" style="--c:var(--purple);--cb:rgba(168,85,247,0.15)">
            <div class="kpi-label">Today's Study Time</div>
            <div style="display:flex;justify-content:space-between;align-items:end;margin-top:8px">
              <div>
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">YOU</div>
                <div style="font-size:1.4rem;font-weight:900;color:var(--purple)">${fmtDuration(myToday)}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">${esc((partner.name || 'P').split(' ')[0].toUpperCase())}</div>
                <div style="font-size:1.4rem;font-weight:900;color:var(--pink)">${fmtDuration(pToday)}</div>
              </div>
            </div>
            ${myToday > pToday ? '<div style="font-size:.7rem;color:var(--emerald);margin-top:6px">🏆 You lead!</div>' : pToday > myToday ? '<div style="font-size:.7rem;color:var(--amber);margin-top:6px">💪 Catch up!</div>' : '<div style="font-size:.7rem;color:var(--text-3);margin-top:6px">🤝 Tied!</div>'}
          </div>

          <div class="kpi" style="--c:var(--orange);--cb:rgba(249,115,22,0.15)">
            <div class="kpi-label">30-Day Total</div>
            <div style="display:flex;justify-content:space-between;align-items:end;margin-top:8px">
              <div>
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">YOU</div>
                <div style="font-size:1.4rem;font-weight:900;color:var(--orange)">${fmtDuration(myTotal)}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">${esc((partner.name || 'P').split(' ')[0].toUpperCase())}</div>
                <div style="font-size:1.4rem;font-weight:900;color:var(--amber)">${fmtDuration(pTotal)}</div>
              </div>
            </div>
          </div>

          <div class="kpi" style="--c:var(--red);--cb:rgba(239,68,68,0.15)">
            <div class="kpi-label">🔥 Streak</div>
            <div style="display:flex;justify-content:space-between;align-items:end;margin-top:8px">
              <div>
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">YOU</div>
                <div style="font-size:1.4rem;font-weight:900">${myStreak}d</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">${esc((partner.name || 'P').split(' ')[0].toUpperCase())}</div>
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
                <div style="font-size:.65rem;color:var(--text-3);font-weight:800">${esc((partner.name || 'P').split(' ')[0].toUpperCase())}</div>
                <div style="font-size:1.4rem;font-weight:900">${pSyl.done}</div>
              </div>
            </div>
            <div style="font-size:.68rem;color:var(--text-3);margin-top:6px">topics completed</div>
          </div>

        </div>

        <div style="margin-top:16px;padding:12px 14px;background:var(--card-2);border-radius:10px;font-size:.8rem;color:var(--text-2);line-height:1.6">
          💡 <strong>Tip:</strong> Partner ke saath consistent raho — ek dusre ko motivate karo!
        </div>
      `;

      wrap.innerHTML = '';
      wrap.appendChild(card);

      card.querySelector('[data-pa-remove]')?.addEventListener('click', () => removePartner(link.id, partner.name));
    }
  }

  async function fetchSessions(userId, sinceDate) {
    if (!window.supa) return [];
    try {
      const { data } = await window.supa
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
    if (!window.supa) return { done: 0, total: 0 };
    try {
      const { data } = await window.supa.from('syllabus_topics').select('status').eq('user_id', userId);
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
          message: `${partnerName || 'Partner'} ko remove karoge? Tum dono ka comparison band ho jayega.`,
          confirmText: 'Remove',
          cancelText: 'Cancel',
          icon: '👋',
          type: 'danger',
        })
      : confirm('Remove partner?');

    if (!ok) return;

    try {
      const { error } = await window.supa.from('partner_links').update({ status: 'removed' }).eq('id', linkId);
      if (error) throw error;
      toastMsg('Partner removed', 'info');
      showPartnerView();
    } catch (e) {
      toastMsg('Failed: ' + e.message, 'err');
    }
  }

  // ═══════════════ URL INVITE HANDLING (auth.html ke liye) ═══════════════
  // Agar user invite link se aaya hai, toh signup ke baad handle karo
  async function handleInviteToken() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (!token) return;

    const supa = window.supa;
    const user = window.state?.user;
    if (!supa || !user) return;

    try {
      // Find invite
      const { data: invite, error } = await supa
        .from('partner_invites')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (error || !invite) {
        console.warn('[Partner] invite not found or expired');
        return;
      }

      // Check expiry
      if (new Date(invite.expires_at) < new Date()) {
        toastMsg('Ye invite link expire ho gaya hai', 'warn');
        return;
      }

      // Don't allow self-accept
      if (invite.requester_id === user.id) {
        toastMsg('Ye aapka hi invite hai 😅', 'info');
        return;
      }

      // Create partner_link as accepted (both consent — invite was sent by requester, now accepted by user)
      const { error: linkErr } = await supa.from('partner_links').insert({
        requester_id: invite.requester_id,
        partner_id: user.id,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      });

      if (linkErr) {
        // Maybe already exists
        console.warn('[Partner] link insert error:', linkErr.message);
      }

      // Mark invite as accepted
      await supa
        .from('partner_invites')
        .update({
          status: 'accepted',
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);

      const requester = await fetchProfile(invite.requester_id);
      toastMsg(`🎉 ${requester?.name || 'User'} ke saath partner ban gaye!`, 'ok', 5000);
    } catch (e) {
      console.warn('[Partner] invite handling error:', e);
    }
  }

  // ═══════════════ INIT ═══════════════
  async function init() {
    await waitForApp();

    let retries = 0;
    const injectAll = () => {
      const tabOk = injectSidebarTab();
      const viewOk = injectView();
      if (tabOk && viewOk) {
        hookSwitchView();
        pstate.initialized = true;
        loadPartnerData(); // background load for badge

        // Handle invite token if present
        handleInviteToken();

        console.log('[Partner] ✅ Initialized');
        return true;
      }
      return false;
    };

    if (!injectAll()) {
      const interval = setInterval(() => {
        retries++;
        if (injectAll() || retries > 20) {
          clearInterval(interval);
        }
      }, 500);
    }
  }

  // Start when DOM + app are ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1500));
  } else {
    setTimeout(init, 1500);
  }
  // Expose for debugging
  window.__partner = {
    reload: () => showPartnerView(),
    state: pstate,
  };
})();
