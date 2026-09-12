/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Notifications Extras v1
   ─────────────────────────────────────────────────────────────
   ✅ Per-user notifications
   ✅ Unread badge count on bell
   ✅ Modal to view all + mark as read
   ✅ Admin can send to all users / specific user
   ✅ Auto-refresh every 60s
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[notifications-extras] v1 loaded');

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
      .notif-icon {
        font-size: 1.3rem;
        flex-shrink: 0;
      }
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

      .notif-empty {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-3);
      }
      .notif-empty-icon {
        font-size: 2.4rem;
        margin-bottom: 10px;
        opacity: .5;
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

  /* ═══════════════ MODAL ═══════════════ */
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
          /* Click item → mark as read */
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

          /* Delete buttons */
          document.querySelectorAll('[data-notif-del]').forEach(function (btn) {
            btn.onclick = function (e) {
              e.stopPropagation();
              deleteNotification(btn.dataset.notifDel);
            };
          });

          /* Mark all button */
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

  /* ═══════════════ ADMIN: SEND NOTIFICATION ═══════════════ */
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

    const body =
      '<div class="field">' +
      '<label>Target</label>' +
      '<select id="sendNotifTarget">' +
      '<option value="all">📢 All Users (broadcast)</option>' +
      users
        .filter(function (u) {
          return u.id !== state.user.id;
        })
        .map(function (u) {
          return '<option value="' + u.id + '">👤 ' + escHtml(u.name || u.email || u.id.slice(0, 8)) + '</option>';
        })
        .join('') +
      '</select>' +
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
      '💡 <strong>Tip:</strong> Broadcast sends to all users. Targeted sends to specific user only.' +
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
          document.getElementById('sendNotifBtn').onclick = async function () {
            const target = document.getElementById('sendNotifTarget').value;
            const type = document.getElementById('sendNotifType').value;
            const title = document.getElementById('sendNotifTitle').value.trim();
            const message = document.getElementById('sendNotifMsg').value.trim();
            const linkView = document.getElementById('sendNotifLink').value || null;

            if (!title || !message) {
              if (typeof toast === 'function') toast('Enter title and message', 'err');
              return;
            }

            const btn = document.getElementById('sendNotifBtn');
            btn.disabled = true;
            btn.textContent = '⏳ Sending…';

            try {
              let targetUserIds = [];
              if (target === 'all') {
                targetUserIds = users.map(function (u) {
                  return u.id;
                });
              } else {
                targetUserIds = [target];
              }

              if (!targetUserIds.length) throw new Error('No target users');

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

  /* ═══════════════ ADMIN PANEL: Add Send Button ═══════════════ */
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

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-sm';
    btn.id = 'adminSendNotifBtn';
    btn.textContent = '📤 Send Notification';
    btn.style.marginRight = '8px';
    btn.onclick = function () {
      openSendNotificationModal();
    };

    refreshBtn.parentNode.insertBefore(btn, refreshBtn);
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

      console.log('[notifications-extras] ✅ patched all');
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
