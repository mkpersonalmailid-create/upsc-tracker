/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Notifications Extras v2
   ─────────────────────────────────────────────────────────────
   ✅ Per-user notifications
   ✅ Unread badge count on bell
   ✅ Modal to view all + mark as read
   ✅ Admin can send to all users / search + specific user
   ✅ Auto-refresh every 60s
   ✅ Fixed: Send button sits properly beside Refresh
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[notifications-extras] v2 loaded');

  let myNotifications = [];
  let unreadCount = 0;

  /* ═══════════════ HELPERS ═══════════════ */
  function escHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function relTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  const TYPE_STYLES = {
    info: { bg: 'rgba(168,85,247,.12)', border: 'rgba(168,85,247,.35)', color: '#C4B5FD', icon: 'ℹ️' },
    success: { bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.35)', color: '#6EE7B7', icon: '✅' },
    warning: { bg: 'rgba(251,191,36,.12)', border: 'rgba(251,191,36,.35)', color: '#FBBF24', icon: '⚠️' },
    danger: { bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.35)', color: '#FCA5A5', icon: '🚨' },
  };

  /* ═══════════════ CSS ═══════════════ */
  function injectCSS() {
    if (document.getElementById('notifExtrasCSS')) return;
    const style = document.createElement('style');
    style.id = 'notifExtrasCSS';
    style.textContent = `
      .notif-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 20px;
        background: linear-gradient(135deg, #EF4444, #F43F5E);
        color: #fff;
        font-size: .6rem;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--card);
        box-shadow: 0 2px 8px rgba(239,68,68,.5);
        animation: notifPulse 2s ease-in-out infinite;
      }
      @keyframes notifPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.12); }
      }

      .notif-item {
        display: flex;
        gap: 12px;
        padding: 14px;
        border-radius: 12px;
        margin-bottom: 8px;
        border-left: 3px solid var(--notif-color, var(--purple));
        background: var(--card-2);
        transition: all .2s;
        cursor: pointer;
      }
      .notif-item:hover {
        background: var(--card);
        transform: translateX(3px);
      }
      .notif-item.unread {
        background: linear-gradient(90deg, rgba(168,85,247,.08), var(--card-2));
      }
      .notif-icon { font-size: 1.3rem; flex-shrink: 0; }
      .notif-body { flex: 1; min-width: 0; }
      .notif-title {
        font-weight: 800;
        font-size: .88rem;
        color: var(--text);
        margin-bottom: 4px;
      }
      .notif-msg {
        font-size: .82rem;
        color: var(--text-2);
        line-height: 1.5;
        word-break: break-word;
      }
      .notif-time {
        font-size: .68rem;
        color: var(--text-3);
        margin-top: 6px;
        font-weight: 600;
      }
      .notif-unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: linear-gradient(135deg, #EC4899, #A855F7);
        flex-shrink: 0;
        margin-top: 6px;
        box-shadow: 0 0 8px rgba(236,72,153,.6);
      }

      .notif-empty { text-align: center; padding: 40px 20px; color: var(--text-3); }
      .notif-empty-icon { font-size: 2.4rem; margin-bottom: 10px; opacity: .5; }

      /* ═══ Search user picker ═══ */
      .notif-user-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 8px;
        cursor: pointer;
        transition: all .15s;
        border: 1px solid transparent;
      }
      .notif-user-item:hover { background: var(--card-2); }
      .notif-user-item.selected {
        background: linear-gradient(90deg, rgba(168,85,247,.2), rgba(236,72,153,.1));
        border-color: rgba(168,85,247,.4);
      }
      .notif-user-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--grad-1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 800;
        font-size: .75rem;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════ BADGE ═══════════════ */
  function updateBadge() {
    const bellBtn = document.getElementById('notifBtn');
    if (!bellBtn) return;
    bellBtn.style.position = 'relative';
    let badge = bellBtn.querySelector('.notif-badge');
    if (unreadCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notif-badge';
        bellBtn.appendChild(badge);
      }
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    } else if (badge) {
      badge.remove();
    }
  }

  /* ═══════════════ LOAD FROM DB ═══════════════ */
  async function loadNotifications() {
    if (!supa || !state.user) return;
    try {
      const { data, error } = await supa
        .from('user_notifications')
        .select('*')
        .eq('user_id', state.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      myNotifications = (data || []).map(function (n) {
        return {
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || 'info',
          link_view: n.link_view,
          read: n.read || false,
          created_at: n.created_at,
        };
      });

      unreadCount = myNotifications.filter(function (n) {
        return !n.read;
      }).length;
      updateBadge();
    } catch (e) {
      console.warn('[notifications] load error:', e);
    }
  }

  /* ═══════════════ MARK AS READ ═══════════════ */
  async function markAsRead(id) {
    const n = myNotifications.find(function (x) {
      return x.id === id;
    });
    if (!n || n.read) return;

    n.read = true;
    unreadCount = Math.max(0, unreadCount - 1);
    updateBadge();

    if (supa && state.user) {
      try {
        await supa.from('user_notifications').update({ read: true }).eq('id', id).eq('user_id', state.user.id);
      } catch (e) {
        console.warn('[notifications] mark read failed:', e);
      }
    }
  }

  async function markAllAsRead() {
    const unreadIds = myNotifications
      .filter(function (n) {
        return !n.read;
      })
      .map(function (n) {
        return n.id;
      });
    if (!unreadIds.length) return;

    myNotifications.forEach(function (n) {
      n.read = true;
    });
    unreadCount = 0;
    updateBadge();

    if (supa && state.user) {
      try {
        await supa.from('user_notifications').update({ read: true }).in('id', unreadIds).eq('user_id', state.user.id);
        if (typeof toast === 'function') toast('All marked as read', 'ok');
      } catch (e) {
        console.warn('[notifications] bulk mark failed:', e);
      }
    }
  }

  /* ═══════════════ DELETE ═══════════════ */
  async function deleteNotification(id) {
    myNotifications = myNotifications.filter(function (n) {
      return n.id !== id;
    });
    unreadCount = myNotifications.filter(function (n) {
      return !n.read;
    }).length;
    updateBadge();

    if (supa && state.user) {
      try {
        await supa.from('user_notifications').delete().eq('id', id).eq('user_id', state.user.id);
      } catch (e) {
        console.warn('[notifications] delete failed:', e);
      }
    }

    openNotificationsModal();
  }

  /* ═══════════════ NOTIFICATIONS MODAL (Bell popup) ═══════════════ */
  function openNotificationsModal() {
    if (typeof openModal !== 'function' || typeof modalShell !== 'function') return;

    const itemsHTML = myNotifications.length
      ? myNotifications
          .map(function (n) {
            const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
            return (
              '<div class="notif-item ' +
              (n.read ? '' : 'unread') +
              '" data-notif-id="' +
              n.id +
              '" style="--notif-color:' +
              style.color +
              '">' +
              '<span class="notif-icon">' +
              style.icon +
              '</span>' +
              '<div class="notif-body">' +
              '<div class="notif-title">' +
              escHtml(n.title) +
              '</div>' +
              '<div class="notif-msg">' +
              escHtml(n.message) +
              '</div>' +
              '<div class="notif-time">' +
              relTime(n.created_at) +
              '</div>' +
              '</div>' +
              (n.read ? '' : '<span class="notif-unread-dot"></span>') +
              '<button class="notif-del-btn" data-notif-del="' +
              n.id +
              '" title="Delete" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:.85rem;padding:4px 6px;border-radius:6px">✕</button>' +
              '</div>'
            );
          })
          .join('')
      : '<div class="notif-empty">' +
        '<div class="notif-empty-icon">🔔</div>' +
        '<div style="font-weight:800;font-size:.95rem;color:var(--text-2);margin-bottom:6px">No notifications yet</div>' +
        '<div style="font-size:.8rem">You\'ll see updates here.</div>' +
        '</div>';

    const unreadTotal = myNotifications.filter(function (n) {
      return !n.read;
    }).length;

    openModal(
      modalShell({
        title: '🔔 Notifications',
        subtitle: unreadTotal ? unreadTotal + ' unread' : 'All caught up!',
        body: '<div style="max-height:60vh;overflow-y:auto;margin:-4px 0">' + itemsHTML + '</div>',
        actions:
          (unreadTotal ? '<button class="btn btn-secondary" id="notifMarkAllBtn">✓ Mark All Read</button>' : '') +
          '<button class="btn btn-primary" data-close>Close</button>',
      }),
      {
        onMount: function () {
          document.querySelectorAll('[data-notif-id]').forEach(function (el) {
            el.onclick = function (e) {
              if (e.target.closest('[data-notif-del]')) return;
              const id = el.dataset.notifId;
              markAsRead(id);
              el.classList.remove('unread');
              const dot = el.querySelector('.notif-unread-dot');
              if (dot) dot.remove();
              const unreadLeft = myNotifications.filter(function (x) {
                return !x.read;
              }).length;
              const subtitleEl = document.querySelector('#modalBox .modal-head .sub');
              if (subtitleEl) subtitleEl.textContent = unreadLeft ? unreadLeft + ' unread' : 'All caught up!';
            };
          });

          document.querySelectorAll('[data-notif-del]').forEach(function (btn) {
            btn.onclick = function (e) {
              e.stopPropagation();
              deleteNotification(btn.dataset.notifDel);
            };
          });

          const markAllBtn = document.getElementById('notifMarkAllBtn');
          if (markAllBtn) {
            markAllBtn.onclick = async function () {
              await markAllAsRead();
              openNotificationsModal();
            };
          }
        },
      },
    );
  }

  /* ═══════════════ WIRE BELL CLICK ═══════════════ */
  function wireBell() {
    const bellBtn = document.getElementById('notifBtn');
    if (!bellBtn || bellBtn._notifWired) return;
    bellBtn._notifWired = true;
    bellBtn.onclick = function () {
      openNotificationsModal();
    };
  }

  /* ═══════════════ ADMIN: SEND NOTIFICATION MODAL ═══════════════ */
  async function openSendNotificationModal() {
    if (!state.user || state.profile?.is_admin !== true) {
      if (typeof toast === 'function') toast('Admin only', 'err');
      return;
    }

    let users = [];
    try {
      const { data } = await supa.from('profiles').select('id, name, email').order('name');
      users = data || [];
    } catch (e) {
      console.warn('[notifications] users fetch failed:', e);
    }

    /* Remove current admin from list */
    const filteredUsers = users.filter(function (u) {
      return u.id !== state.user.id;
    });

    const body =
      '<div class="field">' +
      '<label>Target</label>' +
      '<select id="sendNotifTargetType">' +
      '<option value="all">📢 All Users (broadcast)</option>' +
      '<option value="specific">👤 Specific User</option>' +
      '</select>' +
      '</div>' +
      /* Search + User list (hidden by default) */
      '<div id="sendNotifUserPicker" style="display:none">' +
      '<div class="field">' +
      '<label>Search User</label>' +
      '<input type="text" id="sendNotifUserSearch" placeholder="🔍 Search by name or email…" autocomplete="off">' +
      '</div>' +
      '<div class="field">' +
      '<label>Select User</label>' +
      '<div id="sendNotifUserList" style="max-height:180px;overflow-y:auto;background:var(--bg-2);border:1.5px solid var(--border);border-radius:11px;padding:6px"></div>' +
      '<div style="font-size:.72rem;color:var(--text-3);margin-top:6px">' +
      '<span id="sendNotifUserCount">' +
      filteredUsers.length +
      ' users</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="field">' +
      '<label>Type</label>' +
      '<select id="sendNotifType">' +
      '<option value="info">ℹ️ Info</option>' +
      '<option value="success">✅ Success</option>' +
      '<option value="warning">⚠️ Warning</option>' +
      '<option value="danger">🚨 Important</option>' +
      '</select>' +
      '</div>' +
      '<div class="field">' +
      '<label>Title</label>' +
      '<input type="text" id="sendNotifTitle" maxlength="100" placeholder="e.g. New feature released!">' +
      '</div>' +
      '<div class="field">' +
      '<label>Message</label>' +
      '<textarea id="sendNotifMsg" rows="4" maxlength="500" placeholder="Short description…"></textarea>' +
      '</div>' +
      '<div class="field">' +
      '<label>Link View (optional)</label>' +
      '<select id="sendNotifLink">' +
      '<option value="">— None —</option>' +
      '<option value="study">Study</option>' +
      '<option value="dashboard">Dashboard</option>' +
      '<option value="analytics">Analytics</option>' +
      '<option value="tests">Tests</option>' +
      '<option value="notes">Short Notes</option>' +
      '<option value="planner">Planner</option>' +
      '<option value="premium">Premium</option>' +
      '</select>' +
      '</div>' +
      '<div style="padding:10px 14px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.28);border-radius:10px;font-size:.78rem;color:#C4B5FD;line-height:1.5">' +
      '💡 <strong>Tip:</strong> Broadcast sends to all users. Specific user = targeted notification.' +
      '</div>';

    openModal(
      modalShell({
        title: '📤 Send Notification',
        subtitle: 'Notify users from admin panel',
        body: body,
        actions:
          '<button class="btn btn-secondary" data-close>Cancel</button>' +
          '<button class="btn btn-primary" id="sendNotifBtn">Send →</button>',
      }),
      {
        onMount: function () {
          let selectedUserId = null;

          const targetTypeSel = document.getElementById('sendNotifTargetType');
          const userPicker = document.getElementById('sendNotifUserPicker');
          const userSearch = document.getElementById('sendNotifUserSearch');
          const userList = document.getElementById('sendNotifUserList');
          const userCount = document.getElementById('sendNotifUserCount');

          /* ═══ Render user list with filter ═══ */
          function renderUserList(query) {
            const q = (query || '').toLowerCase().trim();
            const filtered = filteredUsers.filter(function (u) {
              if (!q) return true;
              const name = (u.name || '').toLowerCase();
              const email = (u.email || '').toLowerCase();
              return name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
            });

            userCount.textContent = filtered.length + ' user' + (filtered.length !== 1 ? 's' : '');

            if (!filtered.length) {
              userList.innerHTML =
                '<div style="padding:16px;text-align:center;font-size:.8rem;color:var(--text-3)">No users found</div>';
              return;
            }

            userList.innerHTML = filtered
              .map(function (u) {
                const displayName = u.name || u.email || u.id.slice(0, 8);
                const initial = (displayName[0] || 'U').toUpperCase();
                const isSelected = selectedUserId === u.id;
                return (
                  '<div class="notif-user-item' +
                  (isSelected ? ' selected' : '') +
                  '" data-uid="' +
                  u.id +
                  '">' +
                  '<div class="notif-user-avatar">' +
                  initial +
                  '</div>' +
                  '<div style="flex:1;min-width:0">' +
                  '<div style="font-size:.82rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
                  escHtml(displayName) +
                  '</div>' +
                  '<div style="font-size:.68rem;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
                  escHtml(u.email || '') +
                  '</div>' +
                  '</div>' +
                  (isSelected ? '<span style="color:var(--emerald);font-weight:900;font-size:1rem">✓</span>' : '') +
                  '</div>'
                );
              })
              .join('');

            userList.querySelectorAll('[data-uid]').forEach(function (el) {
              el.onclick = function () {
                selectedUserId = el.dataset.uid;
                renderUserList(userSearch.value);
              };
            });
          }

          /* ═══ Toggle between broadcast and specific ═══ */
          targetTypeSel.onchange = function () {
            const isSpecific = targetTypeSel.value === 'specific';
            userPicker.style.display = isSpecific ? 'block' : 'none';
            if (isSpecific) {
              renderUserList('');
              setTimeout(function () {
                userSearch.focus();
              }, 100);
            }
          };

          /* ═══ Search input ═══ */
          userSearch.oninput = function () {
            renderUserList(userSearch.value);
          };

          /* ═══ Send button ═══ */
          document.getElementById('sendNotifBtn').onclick = async function () {
            const targetType = targetTypeSel.value;
            const type = document.getElementById('sendNotifType').value;
            const title = document.getElementById('sendNotifTitle').value.trim();
            const message = document.getElementById('sendNotifMsg').value.trim();
            const linkView = document.getElementById('sendNotifLink').value || null;

            if (!title || !message) {
              if (typeof toast === 'function') toast('Enter title and message', 'err');
              return;
            }

            let targetUserIds = [];
            if (targetType === 'all') {
              targetUserIds = users.map(function (u) {
                return u.id;
              });
            } else {
              if (!selectedUserId) {
                if (typeof toast === 'function') toast('Please select a user', 'err');
                return;
              }
              targetUserIds = [selectedUserId];
            }

            if (!targetUserIds.length) {
              if (typeof toast === 'function') toast('No target users', 'err');
              return;
            }

            const btn = document.getElementById('sendNotifBtn');
            btn.disabled = true;
            btn.textContent = '⏳ Sending…';

            try {
              const rows = targetUserIds.map(function (uid) {
                return {
                  user_id: uid,
                  title: title,
                  message: message,
                  type: type,
                  link_view: linkView,
                  read: false,
                  created_by: state.user.id,
                };
              });

              const result = await supa.from('user_notifications').insert(rows);
              if (result.error) throw result.error;

              if (typeof closeModal === 'function') closeModal();
              if (typeof toast === 'function') {
                toast('✅ Sent to ' + targetUserIds.length + ' user(s)', 'ok', 3000);
              }
              if (typeof confetti === 'function') confetti();
            } catch (e) {
              console.error('[notifications] send failed:', e);
              if (typeof toast === 'function') toast('⚠️ Send failed: ' + (e.message || ''), 'err', 5000);
              btn.disabled = false;
              btn.textContent = 'Send →';
            }
          };
        },
      },
    );
  }

  /* ═══════════════ ADMIN PANEL: Inject Send Button (FIXED PLACEMENT) ═══════════════ */
  function injectAdminSendButton() {
    if (state.profile?.is_admin !== true) return;

    const adminView = document.getElementById('view-admin');
    if (!adminView || adminView.querySelector('#adminSendNotifBtn')) return;

    const firstCard = adminView.querySelector('.card');
    if (!firstCard) return;

    const header = firstCard.querySelector('.card-header');
    if (!header) return;

    const refreshBtn = header.querySelector('#refreshAdminBtn');
    if (!refreshBtn) return;

    /* ═══ Wrap both buttons in a flex group so they stay together on the right ═══ */
    let btnGroup = header.querySelector('.admin-header-btn-group');
    if (!btnGroup) {
      btnGroup = document.createElement('div');
      btnGroup.className = 'admin-header-btn-group';
      btnGroup.style.display = 'flex';
      btnGroup.style.gap = '8px';
      btnGroup.style.alignItems = 'center';
      btnGroup.style.flexShrink = '0';

      /* Move refresh button into group */
      refreshBtn.parentNode.insertBefore(btnGroup, refreshBtn);
      btnGroup.appendChild(refreshBtn);
    }

    /* Create Send Notification button */
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-sm';
    btn.id = 'adminSendNotifBtn';
    btn.textContent = '📤 Send Notification';
    btn.onclick = function () {
      openSendNotificationModal();
    };

    /* Insert before Refresh button */
    btnGroup.insertBefore(btn, btnGroup.firstChild);
  }

  /* ═══════════════ INIT ═══════════════ */
  let attempts = 0;
  function waitThenStart() {
    const ready = typeof state === 'object' && state !== null && document.getElementById('notifBtn');

    if (ready) {
      injectCSS();
      wireBell();

      const checkUser = setInterval(function () {
        if (state.user && supa) {
          clearInterval(checkUser);
          loadNotifications();
          setInterval(loadNotifications, 60000);
          setInterval(injectAdminSendButton, 2000);
        }
      }, 500);

      console.log('[notifications-extras] ✅ v2 patched all');
    } else {
      attempts++;
      if (attempts > 200) {
        console.error('[notifications-extras] timeout');
        return;
      }
      setTimeout(waitThenStart, 50);
    }
  }
  waitThenStart();

  /* ═══ EXPOSE GLOBALLY ═══ */
  window.openNotificationsModal = openNotificationsModal;
  window.openSendNotificationModal = openSendNotificationModal;
  window.loadNotifications = loadNotifications;
})();
