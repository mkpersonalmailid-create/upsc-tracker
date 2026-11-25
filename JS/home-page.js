/* ============================================
   NEW HOME PAGE INJECTOR & TOPBAR ICONS REDESIGN
   ============================================ */
(function () {
  'use strict';

  // 1. Home View का HTML (New Premium Dashboard Vibe)
  const homeHTML = `
    <section class="view" id="view-home" style="animation: fadeIn 0.3s ease;">
      
      <!-- HERO SECTION -->
      <div class="hero" style="background: linear-gradient(135deg, var(--card), rgba(168, 85, 247, 0.1)); text-align: left; padding: 40px; border-radius: var(--r-xl); border: 1px solid var(--border); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 20px;">
        <!-- Background Glow -->
        <div style="position: absolute; top: -50px; right: -50px; width: 250px; height: 250px; background: rgba(236, 72, 153, 0.15); filter: blur(80px); border-radius: 50%;"></div>
        
        <div style="position: relative; z-index: 1;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); color: var(--text); padding: 6px 16px; border-radius: 30px; font-size: 0.85rem; font-weight: 800; margin-bottom: 20px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: var(--green); border-radius: 50%; animation: pulse 2s infinite;"></span>
            Welcome back, <span id="homeUserName" style="color: var(--amber); font-size: 1rem;">Student</span>
          </div>
          
          <h1 style="font-size: clamp(2.2rem, 5vw, 3.5rem); margin-bottom: 12px; font-weight: 900; line-height: 1.1; color: var(--text); letter-spacing: -0.03em;">
            Don't just study hard.<br>
            <span style="background: var(--grad-1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Study with a system.</span>
          </h1>
          
          <p style="color: var(--text-2); font-size: 1.05rem; max-width: 500px; line-height: 1.6; font-weight: 500; margin-bottom: 24px;">
            UPSC is not about who studies the most. It's about who tracks, revises, and analyzes better. Take control of your preparation today.
          </p>

          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button onclick="if(typeof switchView === 'function') switchView('study');" style="background: var(--grad-1); color: #fff; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4); display: flex; align-items: center; gap: 8px;">
              ⏱️ Start Timer
            </button>
            <button onclick="if(typeof switchView === 'function') switchView('premium');" style="background: var(--card-2); color: var(--text); border: 1px solid var(--border); padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 8px;">
              💎 Go Premium
            </button>
          </div>
        </div>
      </div>

      <!-- FEATURE HIGHLIGHTS (Grid Boxes) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-top: 20px;">
        
        <!-- Box 1 -->
        <div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 10px; background: rgba(168, 85, 247, 0.05); border-color: rgba(168, 85, 247, 0.2);">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(168, 85, 247, 0.15); color: var(--purple); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">📊</div>
          <div style="font-weight: 900; font-size: 1.05rem; color: var(--text);">Real Analytics</div>
          <div style="font-size: 0.85rem; color: var(--text-2); line-height: 1.5;">Find out exactly where your hours are going and when you are most productive.</div>
        </div>

        <!-- Box 2 -->
        <div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 10px; background: rgba(236, 72, 153, 0.05); border-color: rgba(236, 72, 153, 0.2);">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(236, 72, 153, 0.15); color: var(--pink); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">🤝</div>
          <div style="font-weight: 900; font-size: 1.05rem; color: var(--text);">Study With Partner</div>
          <div style="font-size: 0.85rem; color: var(--text-2); line-height: 1.5;">Don't prepare alone. Match with aspirants having the same Optional & Year.</div>
        </div>

        <!-- Box 3 -->
        <div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 10px; background: rgba(20, 184, 166, 0.05); border-color: rgba(20, 184, 166, 0.2);">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(20, 184, 166, 0.15); color: var(--teal); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">📖</div>
          <div style="font-weight: 900; font-size: 1.05rem; color: var(--text);">Syllabus Mastery</div>
          <div style="font-size: 0.85rem; color: var(--text-2); line-height: 1.5;">Track every topic, plan revisions, and never lose sight of the finish line.</div>
        </div>

      </div>

      <!-- PREMIUM UPGRADE SECTION (The Hook) -->
      <div class="card" style="margin-top: 20px; background: linear-gradient(135deg, #171026 0%, #2d1b4e 100%); border: 1px solid rgba(251, 191, 36, 0.4); position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; right: 0; background: var(--amber); color: #000; font-size: 0.75rem; font-weight: 900; padding: 6px 16px; border-bottom-left-radius: 12px; letter-spacing: 0.05em;">PREMIUM</div>
        
        <div style="display: flex; flex-direction: column; gap: 16px; padding-top: 10px;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 900; color: #fff; margin-bottom: 8px;">Why go Premium?</h2>
            <p style="font-size: 0.95rem; color: var(--text-2); line-height: 1.6;">
              Other apps charge ₹300+ per month for basic features. We charge <strong>less than the price of two cups of chai.</strong> You get all advanced tools to completely dominate your preparation.
            </p>
          </div>

          <!-- Premium Benefits List -->
          <div style="display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <span style="color: var(--emerald); font-size: 1.2rem;">✔</span>
              <div style="font-size: 0.9rem; color: #e2d9f3;"><strong style="color: #fff;">Unlimited Access:</strong> No limits on Notes, Tests, and Data Exports.</div>
            </div>
            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <span style="color: var(--emerald); font-size: 1.2rem;">✔</span>
              <div style="font-size: 0.9rem; color: #e2d9f3;"><strong style="color: #fff;">Deep Analytics:</strong> Discover hidden patterns in your study routine.</div>
            </div>
            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <span style="color: var(--emerald); font-size: 1.2rem;">✔</span>
              <div style="font-size: 0.9rem; color: #e2d9f3;"><strong style="color: #fff;">Partner Matching:</strong> Find the perfect study buddy to stay accountable.</div>
            </div>
          </div>

          <!-- Pricing Highlight Box -->
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; background: rgba(251, 191, 36, 0.1); border: 1px dashed rgba(251, 191, 36, 0.5); padding: 16px; border-radius: 12px;">
            <div>
              <div style="font-size: 0.8rem; color: var(--text-2); text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">Yearly Plan</div>
              <div style="font-size: 1.8rem; font-weight: 900; color: var(--amber); line-height: 1;">₹799<span style="font-size: 0.9rem; color: var(--text-2); font-weight: 600;">/year</span></div>
            </div>
            <button onclick="if(typeof switchView === 'function') switchView('premium');" style="background: var(--amber); color: #000; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 900; font-size: 0.9rem; cursor: pointer; box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);">
              Upgrade Now →
            </button>
          </div>
        </div>
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
