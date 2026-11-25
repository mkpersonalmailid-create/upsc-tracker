/* ============================================
   NEW HOME PAGE INJECTOR & TOPBAR ICONS REDESIGN
   ============================================ */
(function () {
  'use strict';

  // 1. Home View का HTML
  const homeHTML = `
    <section class="view" id="view-home" style="animation: fadeIn 0.3s ease;">
      
      <!-- Notice Board Section -->
      <div id="homeNoticeBanner" style="display: none; background: linear-gradient(90deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05)); border: 1px solid rgba(251, 191, 36, 0.3); border-left: 4px solid var(--amber); padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; align-items: center; gap: 12px;">
        <span style="background: var(--amber); color: #000; font-size: 0.7rem; font-weight: 900; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">Notice</span>
        <span id="homeNoticeText" style="font-size: 0.9rem; color: var(--text-2); font-weight: 600;"></span>
      </div>

      <!-- Welcome Section -->
      <div class="hero" style="background: var(--card); text-align: center; padding: 40px 20px; border-radius: var(--r-xl); border: 1px solid var(--border);">
        <h1 style="font-size: clamp(2rem, 4vw, 2.5rem); margin-bottom: 10px; background: var(--grad-1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          Hi <span id="homeUserName">Student</span> 👋
        </h1>
        <div style="display: inline-block; background: rgba(168, 85, 247, 0.15); color: var(--text-2); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; margin-bottom: 20px;">
          ⏱️ 2 min read for long-term benefit
        </div>
        <p style="color: var(--text-2); font-size: 1.05rem; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          Whether you are a <strong>beginner</strong> or at an <strong>advanced level</strong> of preparation, this app is going to change your preparation in a positive manner.
        </p>
      </div>

      <!-- How to use Section -->
      <div class="card" style="margin-top: 20px;">
        <div class="card-header"><span class="card-title-lg">🧭 How to use this app?</span></div>
        <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-2);">
          If you haven't understood the <strong style="color: var(--pink);">UPSC syllabus</strong> yet, please do that first. It will help you navigate the sections of this app much better. 
          <br><br>
          Long-term preparation needs everyday logging. After interviewing and asking <strong>1000+ students</strong>, we found that tracking your daily hours is the biggest problem. That's why we created this app—to keep you accountable every single day.
        </p>
      </div>

      <!-- Premium Info Section -->
      <div class="card" style="margin-top: 20px; background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.05)); border-color: rgba(168, 85, 247, 0.3);">
        <div class="card-header"><span class="card-title-lg">💎 Free vs Premium</span></div>
        <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-2);">
          Some sections of this app are <strong>Free forever</strong>. For advanced features, we have a Premium plan.
          <br><br>
          In the industry, these types of apps charge you ₹300/month. But understanding the requirement of students, we are charging <strong style="color: var(--amber);">less than ₹100</strong>—which is just the cost of a few cups of tea! 
          <br>
          <em>If you are dedicated to your preparation, we suggest you go for the Yearly Plan to save more.</em>
        </p>
        <p style="color: var(--text); font-weight: bold; margin-top: 15px; margin-bottom: 8px;">Premium features include:</p>
        <ul style="font-size: 0.9rem; line-height: 1.7; color: var(--text-2); padding-left: 20px; margin-top: 0;">
          <li><strong>Study with Partner:</strong> Choose a partner with the same Optional Subject and Target Year. If they accept your request, you can study together. You can also add a friend by email—if they are on this platform, we will send them an invite link!</li>
          <li>Advanced Analytics & Calendar</li>
          <li>Unlimited Notes & Tests</li>
        </ul>
      </div>
    </section>
  `;

  // 2. Topbar के आइकन्स को ऊपर-नीचे (Vertical) करने और उनके नीचे नाम लिखने का फंक्शन
  function styleTopbarIcons() {
    const iconConfigs = [
      { id: 'logoutBtn', label: 'Logout', color: '#fca5a5' },
      { id: 'settingsBtn', label: 'Settings' },
      { id: 'notifBtn', label: 'Alerts' },
      { id: 'themeBtn', label: 'Theme' },
      { id: 'planBadgeBtn', label: 'Plan' },
    ];

    iconConfigs.forEach((cfg) => {
      const btn = document.getElementById(cfg.id);
      if (btn && !btn.querySelector('.custom-topbar-label')) {
        const originalEmoji = btn.innerText;

        // बटन को flex-column बनाएं ताकि आइकन ऊपर और टेक्स्ट नीचे आए
        btn.style.cssText =
          'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 4px 6px; height: auto; min-width: 55px; background: transparent; border: none;';

        // आइकन और टेक्स्ट को सेट करें
        btn.innerHTML = `
            <span style="font-size: 1.1rem; line-height: 1;">${originalEmoji}</span>
            <span class="custom-topbar-label" style="font-size: 0.6rem; font-weight: 700; color: ${cfg.color || 'var(--text-2)'}; text-transform: capitalize;">${cfg.label}</span>
        `;
      }
    });

    // अवतार (Avatar) और नाम को भी ऊपर-नीचे करें
    const topAvatar = document.getElementById('topAvatar');
    const nameEl = document.getElementById('topbarUserName');

    if (topAvatar && nameEl && !document.getElementById('customAvatarContainer')) {
      const container = document.createElement('div');
      container.id = 'customAvatarContainer';
      // ड्रॉपडाउन/कॉलम स्टाइल
      container.style.cssText =
        'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; margin-left: 8px;';

      topAvatar.parentNode.insertBefore(container, topAvatar);
      container.appendChild(topAvatar);
      container.appendChild(nameEl);

      // अवतार का साइज़ थोड़ा छोटा करें ताकि बाकी आइकन्स के साथ मैच हो जाए
      topAvatar.style.width = '32px';
      topAvatar.style.height = '32px';
      topAvatar.style.fontSize = '0.85rem';

      // नाम की स्टाइलिंग (आइकन के नीचे)
      nameEl.style.cssText =
        'font-size: 0.65rem; font-weight: 800; color: var(--text); margin: 0; display: block !important; text-align: center;';
    }
  }

  // 3. यूज़र का नाम अपडेट करने का फंक्शन
  function updateUserName() {
    const nameEl = document.getElementById('sbUserName');
    const homeNameEl = document.getElementById('homeUserName');
    const topbarNameEl = document.getElementById('topbarUserName');

    if (nameEl) {
      const rawName = nameEl.innerText.trim();
      if (rawName && rawName !== 'Loading...' && rawName !== 'Student') {
        if (homeNameEl) homeNameEl.innerText = rawName.split(/\s+/)[0];

        if (topbarNameEl) {
          topbarNameEl.innerText = rawName.split(/\s+/)[0];
        }
      }
    }
  }

  // 4. Supabase से Notice (Announcement) लाने का फंक्शन
  async function loadNotice() {
    if (!window.supa) return;
    try {
      const { data } = await window.supa
        .from('site_announcements')
        .select('*')
        .eq('active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.message) {
        const banner = document.getElementById('homeNoticeBanner');
        const text = document.getElementById('homeNoticeText');
        if (banner && text) {
          text.innerText = data.message;
          banner.style.display = 'flex';
        }
      }
    } catch (e) {
      console.warn('Notice load error:', e);
    }
  }

  // 5. पेज में HTML और बटन इंजेक्ट करने का फंक्शन
  function injectHomePage() {
    const content = document.getElementById('content');
    const nav = document.querySelector('.nav');

    if (!content || !nav) return;
    if (document.getElementById('view-home')) return;

    // 1. Home View इंजेक्ट करें
    content.insertAdjacentHTML('afterbegin', homeHTML);

    // 2. Sidebar में Home बटन बनाएं
    const homeBtn = document.createElement('button');
    homeBtn.className = 'nav-item';
    homeBtn.dataset.view = 'home';
    homeBtn.innerHTML = `<span class="nav-icon">🏠</span><span class="nav-label">Home</span>`;

    const studyBtn = nav.querySelector('.nav-item[data-view="study"]');
    if (studyBtn) {
      nav.insertBefore(homeBtn, studyBtn);
    } else {
      nav.insertAdjacentElement('afterbegin', homeBtn);
    }

    // 3. Home बटन पर क्लिक करने का लॉजिक
    homeBtn.addEventListener('click', () => {
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      const homeView = document.getElementById('view-home');
      if (homeView) homeView.classList.add('active');

      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      homeBtn.classList.add('active');

      try {
        if (typeof state !== 'undefined') state.view = 'home';
        if (window.state) window.state.view = 'home';
      } catch (e) {}

      if (content) content.scrollTop = 0;
      updateUserName();
    });

    // बाकी बटन्स पर क्लिक करने पर Home से active क्लास हटाना
    document.querySelectorAll('.nav-item:not([data-view="home"])').forEach((otherBtn) => {
      otherBtn.addEventListener('click', () => {
        homeBtn.classList.remove('active');
      });
    });

    // === 4. TOPBAR MEIN NAAM ADD KARNA ===
    const topbarRight = document.querySelector('.topbar-right');
    const topAvatar = document.getElementById('topAvatar');

    if (topbarRight && topAvatar && !document.getElementById('topbarUserName')) {
      const userNameSpan = document.createElement('span');
      userNameSpan.id = 'topbarUserName';
      userNameSpan.innerText = 'Loading...';

      // अवतार के ठीक पहले डालें
      topbarRight.insertBefore(userNameSpan, topAvatar);
    }

    // === 5. TOPBAR ICONS KO REDESIGN KARNA ===
    styleTopbarIcons();

    // 6. डिफ़ॉल्ट रूप से Home पेज खोलें और नाम अपडेट करें
    setTimeout(() => {
      if (window.location.hash !== '#timer') {
        homeBtn.click();
      }
      loadNotice();
      updateUserName();
    }, 800);

    // 7. साइडबार में नाम आते ही उसे टॉपबार में भी अपडेट कर दें
    const sbUserName = document.getElementById('sbUserName');
    if (sbUserName) {
      const observer = new MutationObserver(() => {
        updateUserName();
      });
      observer.observe(sbUserName, { childList: true, characterData: true, subtree: true });
    }
  }

  // 6. बार-बार चेक करें कि पेज लोड हो गया है या नहीं
  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;
    const content = document.getElementById('content');
    const nav = document.querySelector('.nav');

    if (content && nav && nav.children.length > 0) {
      clearInterval(checkInterval);
      injectHomePage();
    }

    if (attempts > 600) clearInterval(checkInterval);
  }, 500);

  // Global access
  window.reloadHomeNotice = loadNotice;
})();
