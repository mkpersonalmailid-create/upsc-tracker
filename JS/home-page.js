/* ============================================
   NEW HOME PAGE INJECTOR & TOPBAR ICONS REDESIGN
   ============================================ */
(function () {
  'use strict';

  // 1. Home View का HTML (New Premium SaaS Copywriting)
  const homeHTML = `
    <section class="view" id="view-home" style="animation: fadeIn 0.3s ease;">
      
      <!-- HERO SECTION (Emotional Connection) -->
      <div class="hero" style="background: var(--card); text-align: center; padding: 50px 20px; border-radius: var(--r-xl); border: 1px solid var(--border); position: relative; overflow: hidden;">
        <!-- Background Glow -->
        <div style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 200px; height: 200px; background: rgba(168, 85, 247, 0.2); filter: blur(80px); border-radius: 50%;"></div>
        
        <div style="position: relative; z-index: 1;">
          <div style="display: inline-block; background: rgba(168, 85, 247, 0.15); color: var(--purple); padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px;">
            Hi <span id="homeUserName">Student</span> 👋
          </div>
          <h1 style="font-size: clamp(2rem, 4vw, 2.8rem); margin-bottom: 16px; font-weight: 900; line-height: 1.2; background: var(--grad-1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em;">
            It's not about studying 12 hours.<br>It's about knowing where those 12 hours went.
          </h1>
          <p style="color: var(--text-2); font-size: 1.05rem; max-width: 550px; margin: 0 auto; line-height: 1.6; font-weight: 500;">
            Stop guessing your progress. UPSC Tracker is the operating system for your preparation—built to keep you consistent, organised, and in control.
          </p>
        </div>
      </div>

      <!-- PROBLEM & SOLUTION (Problem Awareness & Value) -->
      <div class="card" style="margin-top: 20px;">
        <div class="card-header"><span class="card-title-lg">Why most aspirants feel stuck</span></div>
        <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-2);">
          The UPSC syllabus is vast. Without a proper system, preparation feels like walking in the dark. You sit at your desk for hours, but when someone asks what you actually covered, you draw a blank. <br><br>
          <strong>You don't need more motivation. You need a system.</strong> This app was built after interviewing 1000+ aspirants who struggled with the exact same problem: tracking daily hours and maintaining consistency. That ends today.
        </p>
      </div>

      <!-- FEATURES BREAKDOWN (Solution) -->
      <div class="card" style="margin-top: 20px;">
        <div class="card-header"><span class="card-title-lg">Your Daily UPSC Operating System</span></div>
        <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 10px;">
          
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <div style="background: rgba(168, 85, 247, 0.15); color: var(--purple); padding: 8px; border-radius: 10px; font-size: 1.2rem; flex-shrink: 0;">⏱️</div>
            <div>
              <div style="font-weight: 800; color: var(--text); font-size: 0.95rem;">Track Every Minute</div>
              <div style="font-size: 0.85rem; color: var(--text-2); line-height: 1.6;">Use the built-in timer to log exactly what you study. No more guessing.</div>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <div style="background: rgba(236, 72, 153, 0.15); color: var(--pink); padding: 8px; border-radius: 10px; font-size: 1.2rem; flex-shrink: 0;">📖</div>
            <div>
              <div style="font-weight: 800; color: var(--text); font-size: 0.95rem;">Master the Syllabus</div>
              <div style="font-size: 0.85rem; color: var(--text-2); line-height: 1.6;">Tick off topics, plan revisions, and never lose track of what's pending.</div>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <div style="background: rgba(20, 184, 166, 0.15); color: var(--teal); padding: 8px; border-radius: 10px; font-size: 1.2rem; flex-shrink: 0;">📊</div>
            <div>
              <div style="font-weight: 800; color: var(--text); font-size: 0.95rem;">Analyze Your Reality</div>
              <div style="font-size: 0.85rem; color: var(--text-2); line-height: 1.6;">Find out when you are most productive and where you are lagging.</div>
            </div>
          </div>

        </div>
      </div>

      <!-- PREMIUM FEATURES (Desire & Value) -->
      <div class="card" style="margin-top: 20px; background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.05)); border-color: rgba(168, 85, 247, 0.3);">
        <div class="card-header"><span class="card-title-lg">Elevate your preparation with Premium</span></div>
        <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-2); margin-bottom: 16px;">
          Free is great to get started, but Premium gives you the ultimate edge:
        </p>
        
        <ul style="font-size: 0.9rem; line-height: 1.7; color: var(--text-2); padding-left: 20px; margin-top: 0; display: flex; flex-direction: column; gap: 12px;">
          <li>
            <strong style="color: var(--text);">Study With Partner:</strong> Don't prepare alone. Get matched with aspirants who share your <strong>exact Optional Subject and Target Year</strong>. Compare stats, stay accountable, and grow together.
          </li>
          <li>
            <strong style="color: var(--text);">Advanced Analytics:</strong> Dive deep into your study patterns. Identify your most productive hours and fix your weak spots.
          </li>
          <li>
            <strong style="color: var(--text);">Advanced Calendar & Planner:</strong> Map out your entire month, schedule revisions, and track your test scores.
          </li>
          <li>
            <strong style="color: var(--text);">Unlimited Notes & Exports:</strong> Build your personal library of short notes and export your data anytime.
          </li>
        </ul>
      </div>

      <!-- PRICING / VALUE PERCEPTION -->
      <div class="card" style="margin-top: 20px; text-align: center;">
        <div class="card-header" style="justify-content: center;"><span class="card-title-lg">Less than the cost of two cups of tea.</span></div>
        <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-2);">
          Other prep apps charge you ₹300+ every month. We know the budget constraints of a serious aspirant. That's why Premium costs <strong style="color: var(--amber);">less than ₹100/month</strong>. 
          <br><br>
          If you are dedicated to cracking this exam, we highly recommend the <strong>Yearly Plan</strong> to save even more.
        </p>
        <button onclick="if(typeof switchView === 'function') switchView('premium');" style="margin-top: 16px; background: var(--grad-1); color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 0.95rem; cursor: pointer; box-shadow: 0 6px 18px rgba(168, 85, 247, 0.4);">
          View Premium Plans →
        </button>
      </div>

    </section>
  `;

  // 2. Topbar के आइकन्स को नया लुक देना और टॉगल स्विच जोड़ना
  function styleTopbarIcons() {
    // 'Plan' वाले बटन को छिपा दें
    const planBtn = document.getElementById('planBadgeBtn');
    if (planBtn) planBtn.style.display = 'none';

    // पुराने थीम बटन को छिपा दें (क्योंकि अब हम नया टॉगल लगा रहे हैं)
    const oldThemeBtn = document.getElementById('themeBtn');
    if (oldThemeBtn) oldThemeBtn.style.display = 'none';

    // बाकी आइकन्स की लिस्ट
    const iconConfigs = [
      { id: 'logoutBtn', label: 'Logout', color: '#fca5a5' },
      { id: 'settingsBtn', label: 'Settings' },
      { id: 'notifBtn', label: 'Alerts' },
    ];

    iconConfigs.forEach((cfg) => {
      const btn = document.getElementById(cfg.id);
      if (btn && !btn.querySelector('.custom-topbar-label')) {
        const originalEmoji = btn.innerText;

        btn.style.cssText =
          'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 4px 6px; height: auto; min-width: 55px; background: transparent; border: none;';

        btn.innerHTML = `
            <span style="font-size: 1.1rem; line-height: 1;">${originalEmoji}</span>
            <span class="custom-topbar-label" style="font-size: 0.6rem; font-weight: 700; color: ${cfg.color || 'var(--text)'}; text-transform: capitalize;">${cfg.label}</span>
        `;
      }
    });

    // === नया टॉगल स्विच बनाएं ===
    const topbarRight = document.querySelector('.topbar-right');
    if (topbarRight && !document.getElementById('customThemeToggleWrap')) {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const isLight = currentTheme === 'light';

      const toggleWrap = document.createElement('div');
      toggleWrap.id = 'customThemeToggleWrap';
      toggleWrap.style.cssText =
        'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 4px 6px; min-width: 55px;';

      toggleWrap.innerHTML = `
        <label class="theme-switch" style="position: relative; display: inline-block; width: 34px; height: 18px;">
          <input type="checkbox" id="customThemeToggleInput" ${isLight ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
          <span class="theme-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #3d2c5e; transition: .4s; border-radius: 34px;"></span>
        </label>
        <span style="font-size: 0.6rem; font-weight: 700; color: var(--text);">Theme</span>
      `;

      // स्टाइल्स (CSS) इंजेक्ट करें
      if (!document.getElementById('themeToggleStyles')) {
        const style = document.createElement('style');
        style.id = 'themeToggleStyles';
        style.innerHTML = `
          .theme-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
          input:checked + .theme-slider { background-color: var(--amber); }
          input:checked + .theme-slider:before { transform: translateX(16px); }
        `;
        document.head.appendChild(style);
      }

      // टॉगल बटन को टॉपबार में जोड़ें
      const topAvatar = document.getElementById('topAvatar');
      if (topAvatar) {
        topbarRight.insertBefore(toggleWrap, topAvatar);
      } else {
        topbarRight.appendChild(toggleWrap);
      }

      // टॉगल करने का लॉजिक
      document.getElementById('customThemeToggleInput').addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'light' : 'dark';
        if (typeof applyTheme === 'function') {
          applyTheme(newTheme);
        } else {
          document.documentElement.setAttribute('data-theme', newTheme);
          if (typeof state !== 'undefined' && state.settings) state.settings.theme = newTheme;
        }
      });
    }

    // अवतार (Avatar) और नाम को ऊपर-नीचे करें
    const topAvatar = document.getElementById('topAvatar');
    const nameEl = document.getElementById('topbarUserName');

    if (topAvatar && nameEl && !document.getElementById('customAvatarContainer')) {
      const container = document.createElement('div');
      container.id = 'customAvatarContainer';
      container.style.cssText =
        'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; margin-left: 8px;';

      topAvatar.parentNode.insertBefore(container, topAvatar);
      container.appendChild(topAvatar);
      container.appendChild(nameEl);

      topAvatar.style.width = '32px';
      topAvatar.style.height = '32px';
      topAvatar.style.fontSize = '0.85rem';

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

  // 4. पेज में HTML और बटन इंजेक्ट करने का फंक्शन
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

      topbarRight.insertBefore(userNameSpan, topAvatar);
    }

    // === 5. TOPBAR ICONS KO REDESIGN KARNA ===
    styleTopbarIcons();

    // 6. डिफ़ॉल्ट रूप से Home पेज खोलें और नाम अपडेट करें
    setTimeout(() => {
      if (window.location.hash !== '#timer') {
        homeBtn.click();
      }
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

  // 5. बार-बार चेक करें कि पेज लोड हो गया है या नहीं
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
})();
