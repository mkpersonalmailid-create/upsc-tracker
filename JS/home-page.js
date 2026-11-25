/* ============================================
   NEW HOME PAGE INJECTOR & TOPBAR ICONS REDESIGN
   ============================================ */
(function () {
  'use strict';

  // 1. Home View का HTML
  const homeHTML = `
    <section class="view" id="view-home" style="animation: fadeIn 0.3s ease;">
      
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

  // 2. Topbar के आइकन्स को नया लुक देना और टॉगल स्विच जोड़ना
  function styleTopbarIcons() {
    // 'Plan' वाले बटन को छिपा दें
    const planBtn = document.getElementById('planBadgeBtn');
    if (planBtn) planBtn.style.display = 'none';

    // पुराने थीम बटन को छिपा दें (क्योंकि अब हम नया टॉगल लगा रहे हैं)
    const oldThemeBtn = document.getElementById('themeBtn');
    if (oldThemeBtn) oldThemeBtn.style.display = 'none';

    // बाकी आइकन्स की लिस्ट (Theme को हटा दिया गया है)
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
      // पहले से मौजूद थीम (Light/Dark) चेक करें
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

      // टॉगल बटन को टॉपबार में जोड़ें (अवतार से ठीक पहले)
      const topAvatar = document.getElementById('topAvatar');
      if (topAvatar) {
        topbarRight.insertBefore(toggleWrap, topAvatar);
      } else {
        topbarRight.appendChild(toggleWrap);
      }

      // टॉगल करने का लॉजिक
      document.getElementById('customThemeToggleInput').addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'light' : 'dark';

        // app.html वाले फंक्शन को कॉल करें
        if (typeof applyTheme === 'function') {
          applyTheme(newTheme);
        } else {
          // अगर ग्लोबल फंक्शन न मिले तो मैन्युअली बदलें
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

    content.insertAdjacentHTML('afterbegin', homeHTML);

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

    document.querySelectorAll('.nav-item:not([data-view="home"])').forEach((otherBtn) => {
      otherBtn.addEventListener('click', () => {
        homeBtn.classList.remove('active');
      });
    });

    const topbarRight = document.querySelector('.topbar-right');
    const topAvatar = document.getElementById('topAvatar');

    if (topbarRight && topAvatar && !document.getElementById('topbarUserName')) {
      const userNameSpan = document.createElement('span');
      userNameSpan.id = 'topbarUserName';
      userNameSpan.innerText = 'Loading...';

      topbarRight.insertBefore(userNameSpan, topAvatar);
    }

    styleTopbarIcons();

    setTimeout(() => {
      if (window.location.hash !== '#timer') {
        homeBtn.click();
      }
      updateUserName();
    }, 800);

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
