/* ============================================
   NEW HOME PAGE INJECTOR & TOPBAR ICONS REDESIGN
   ============================================ */
(function () {
  'use strict';

  // 1. Home View का HTML
  const homeHTML = `
    <section class="view" id="view-home" style="animation: fadeIn 0.3s ease;">
      
      <!-- HERO SECTION (Centered & Premium) -->
      <div class="hero" style="background: var(--card); text-align: center; padding: 50px 20px; border-radius: var(--r-xl); border: 1px solid var(--border); position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: var(--shadow-md);">
        
        <!-- Glow Effect -->
        <div style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 300px; height: 300px; background: rgba(168, 85, 247, 0.15); filter: blur(80px); border-radius: 50%; pointer-events: none;"></div>
        
        <div style="position: relative; z-index: 1; max-width: 750px;">
          <!-- Social Proof Badge -->
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--green); padding: 6px 14px; border-radius: 30px; font-size: 0.8rem; font-weight: 800; margin-bottom: 20px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: var(--green); border-radius: 50%; animation: pulse 2s infinite;"></span>
            500+ Serious Aspirants already inside
          </div>
          
          <h1 style="font-size: clamp(2.2rem, 5vw, 3.2rem); margin-bottom: 16px; font-weight: 900; line-height: 1.1; color: var(--text); letter-spacing: -0.03em;">
            Don't just study hard.<br>
            <span style="background: var(--grad-1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Study with a system.</span>
          </h1>
          
          <p style="color: var(--text-2); font-size: 1.05rem; line-height: 1.6; font-weight: 500; margin-bottom: 32px;">
            Hi <span id="homeUserName" style="color: var(--amber); font-weight: 800;">Student</span>, UPSC is not about who studies the most. It's about who tracks, revises, and analyzes better. Take control of your preparation today.
          </p>

          <!-- Main Action Buttons (Centered Grid) -->
          <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
            
            <!-- Timer Button (Primary) -->
            <button onclick="if(typeof switchView === 'function') switchView('study');" style="background: var(--grad-1); color: #fff; border: none; padding: 16px 36px; border-radius: 12px; font-weight: 900; font-size: 1.05rem; cursor: pointer; box-shadow: 0 8px 25px rgba(168, 85, 247, 0.4); display: flex; align-items: center; gap: 8px; transition: transform 0.2s;">
              ⏱️ Start Timer
            </button>
            
            <!-- Partner Button -->
            <button onclick="if(window.__partner && typeof window.__partner.open === 'function') window.__partner.open(); else if(typeof switchView === 'function') switchView('partner');" style="background: var(--card-2); color: var(--text); border: 1px solid var(--border); padding: 16px 24px; border-radius: 12px; font-weight: 800; font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='var(--card)'; this.style.borderColor='var(--purple)';" onmouseout="this.style.background='var(--card-2)'; this.style.borderColor='var(--border)';">
              🤝 Study Partner
            </button>
            
            <!-- Calendar Button -->
            <button onclick="if(typeof switchView === 'function') switchView('calendar');" style="background: var(--card-2); color: var(--text); border: 1px solid var(--border); padding: 16px 24px; border-radius: 12px; font-weight: 800; font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='var(--card)'; this.style.borderColor='var(--purple)';" onmouseout="this.style.background='var(--card-2)'; this.style.borderColor='var(--border)';">
              🗓️ Calendar
            </button>
            
            <!-- Upgrade Button -->
            <button onclick="if(typeof switchView === 'function') switchView('premium');" style="background: rgba(251, 191, 36, 0.15); color: var(--amber); border: 1px solid rgba(251, 191, 36, 0.4); padding: 16px 24px; border-radius: 12px; font-weight: 800; font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='rgba(251, 191, 36, 0.25)';" onmouseout="this.style.background='rgba(251, 191, 36, 0.15)';">
              💎 Upgrade
            </button>

          </div>
        </div>
      </div>

      <!-- FEATURE HIGHLIGHTS (Colorful Grid) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-top: 24px;">
        
        <!-- Box 1: Syllabus (Purple) -->
        <div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 12px; background: linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.03)); border: 1px solid rgba(168, 85, 247, 0.3); transition: transform 0.2s;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(168, 85, 247, 0.2); color: var(--purple); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">📖</div>
          <div style="font-weight: 900; font-size: 1.1rem; color: var(--text);">Pre-integrated UPSC Syllabus</div>
          <div style="font-size: 0.9rem; color: var(--text-2); line-height: 1.5;">Every paper, subject, and topic is already mapped. Zero manual setup required.</div>
        </div>

        <!-- Box 2: State PCS (Teal) -->
        <div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 12px; background: linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(20, 184, 166, 0.03)); border: 1px solid rgba(20, 184, 166, 0.3); transition: transform 0.2s;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(20, 184, 166, 0.2); color: var(--teal); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">📝</div>
          <div style="font-weight: 900; font-size: 1.1rem; color: var(--text);">Custom Subjects (State PCS)</div>
          <div style="font-size: 0.9rem; color: var(--text-2); line-height: 1.5;">Preparing for State PCS simultaneously? Add any custom subject you want to learn.</div>
        </div>

        <!-- Box 3: GoalMax (Orange) -->
        <div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 12px; background: linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(249, 115, 22, 0.03)); border: 1px solid rgba(249, 115, 22, 0.3); transition: transform 0.2s;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(249, 115, 22, 0.2); color: var(--orange); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">🔄</div>
          <div style="font-weight: 900; font-size: 1.1rem; color: var(--text);">GoalMax Revision Cycle</div>
          <div style="font-size: 0.9rem; color: var(--text-2); line-height: 1.5;">Set how many revisions you need (3, 4, 5...). The app auto-tracks and schedules them.</div>
        </div>

        <!-- Box 4: Partner (Pink) -->
        <div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 12px; background: linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(236, 72, 153, 0.03)); border: 1px solid rgba(236, 72, 153, 0.3); transition: transform 0.2s;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(236, 72, 153, 0.2); color: var(--pink); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">🤝</div>
          <div style="font-weight: 900; font-size: 1.1rem; color: var(--text);">Study With Partner</div>
          <div style="font-size: 0.9rem; color: var(--text-2); line-height: 1.5;">Don't prepare alone. Match with aspirants sharing your exact Optional & Target Year.</div>
        </div>

      </div>

      <!-- EXPERT SESSION BANNER (NEW) -->
      <div class="card" style="margin-top: 24px; background: linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(6, 182, 212, 0.05)); border: 1px solid rgba(20, 184, 166, 0.3); border-radius: var(--r-md); padding: 24px; display: flex; flex-direction: column; gap: 16px; align-items: flex-start;">
        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(20, 184, 166, 0.2); color: var(--teal); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; flex-shrink: 0; box-shadow: 0 4px 15px rgba(20, 184, 166, 0.2);">🧑‍🏫</div>
          <div style="flex: 1; min-width: 250px;">
            <h2 style="font-size: 1.3rem; font-weight: 900; color: var(--text); margin-bottom: 6px; line-height: 1.2;">Want to take a complete look at the app?</h2>
            <p style="font-size: 0.95rem; color: var(--text-2); line-height: 1.6; margin: 0;">
              If you want to take a complete look at the UPSC study app, you can book a <strong style="color: var(--teal);">30-minute session with an expert</strong> to manage your time effectively and learn how to use this app to its full potential.
            </p>
          </div>
        </div>
        <a href="https://calendar.app.google/QoHPZWeBaWxyi9p2A" target="_blank" style="text-decoration: none; background: var(--teal); color: #000; border: none; padding: 14px 28px; border-radius: 10px; font-weight: 900; font-size: 0.95rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(20, 184, 166, 0.3); transition: transform 0.2s;">
          📅 Book Your Free Session Now →
        </a>
      </div>

      <!-- PREMIUM UPGRADE SECTION -->
      <!-- 👇 Yahan ID add ki gayi hai: id="premiumUpgradeBox" 👇 -->
      <div id="premiumUpgradeBox" class="card" style="margin-top: 24px; background: linear-gradient(135deg, rgba(23, 16, 38, 1) 0%, rgba(45, 27, 78, 1) 100%); border: 1px solid rgba(251, 191, 36, 0.4); position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <div style="position: absolute; top: 0; right: 0; background: var(--amber); color: #000; font-size: 0.75rem; font-weight: 900; padding: 6px 16px; border-bottom-left-radius: 12px; letter-spacing: 0.05em; z-index: 10;">PREMIUM</div>
        
        <div style="display: flex; flex-direction: column; gap: 16px; padding-top: 10px;">
          <div>
            <h2 style="font-size: 1.6rem; font-weight: 900; color: #fff; margin-bottom: 8px;">Unlock the ultimate edge.</h2>
            <p style="font-size: 0.95rem; color: #b8a8d9; line-height: 1.6;">
              Other apps charge you ₹300+ per month. We believe in keeping it accessible for serious aspirants. Upgrade for <strong>just ₹99 per month</strong>—which is literally the cost of <strong style="color: var(--amber); font-size: 1.1rem;">two cups of ☕ chai</strong>.
              <br><br>
              Invest that small amount to completely dominate your preparation.
            </p>
          </div>

          <!-- Premium Benefits List -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <span style="color: var(--green); font-size: 1.1rem;">✔</span>
              <div style="font-size: 0.85rem; color: #e2d9f3;"><strong style="color: #fff;">Deep Analytics:</strong> Find hidden patterns.</div>
            </div>
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <span style="color: var(--green); font-size: 1.1rem;">✔</span>
              <div style="font-size: 0.85rem; color: #e2d9f3;"><strong style="color: #fff;">Unlimited Access:</strong> No limits on Notes & Tests.</div>
            </div>
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <span style="color: var(--green); font-size: 1.1rem;">✔</span>
              <div style="font-size: 0.85rem; color: #e2d9f3;"><strong style="color: #fff;">Advanced Planner:</strong> Map your entire month.</div>
            </div>
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <span style="color: var(--green); font-size: 1.1rem;">✔</span>
              <div style="font-size: 0.85rem; color: #e2d9f3;"><strong style="color: #fff;">Data Exports:</strong> Download progress anytime.</div>
            </div>
          </div>

          <!-- Pricing Highlight Box -->
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; background: rgba(251, 191, 36, 0.1); border: 1px dashed rgba(251, 191, 36, 0.5); padding: 16px; border-radius: 12px;">
            <div>
              <div style="font-size: 0.8rem; color: #b8a8d9; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">Plan starts from</div>
              <div style="font-size: 2rem; font-weight: 900; color: var(--amber); line-height: 1;">₹99<span style="font-size: 0.9rem; color: #b8a8d9; font-weight: 600;">/month</span></div>
            </div>
            <button onclick="if(typeof switchView === 'function') switchView('premium');" style="background: var(--amber); color: #000; border: none; padding: 14px 28px; border-radius: 10px; font-weight: 900; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4); transition: transform 0.2s;">
              Upgrade
            </button>
          </div>
        </div>
      </div>
      
    </section>
  `;

  // 2. Topbar के आइकन्स को नया लुक देना और टॉगल स्विच जोड़ना
  function styleTopbarIcons() {
    const planBtn = document.getElementById('planBadgeBtn');
    if (planBtn) planBtn.style.display = 'none';

    const oldThemeBtn = document.getElementById('themeBtn');
    if (oldThemeBtn) oldThemeBtn.style.display = 'none';

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

      const topAvatar = document.getElementById('topAvatar');
      if (topAvatar) {
        topbarRight.insertBefore(toggleWrap, topAvatar);
      } else {
        topbarRight.appendChild(toggleWrap);
      }

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
        if (topbarNameEl) topbarNameEl.innerText = rawName.split(/\s+/)[0];
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

  // 5. Premium Box Hide/Show Logic (Admin Panel ke hisaab se)
  async function checkUserPlanAndHideBox() {
    const premiumBox = document.getElementById('premiumUpgradeBox');
    if (!premiumBox) return;

    // Agar state ya user load nahi hua hai, toh 1 second baad wapas check karein
    if (typeof state === 'undefined' || !state.user || !state.profile) {
      setTimeout(checkUserPlanAndHideBox, 1000);
      return;
    }

    // 1. Agar Admin hai, toh box chhipa dein
    if (state.profile.is_admin === true) {
      premiumBox.style.display = 'none';
      return;
    }

    // 2. Agar state mein pehle se subscription info hai
    if (
      state.sub &&
      state.sub.status === 'active' &&
      (!state.sub.expiry_date || new Date(state.sub.expiry_date) > new Date())
    ) {
      premiumBox.style.display = 'none';
      return;
    }

    // 3. Fallback: Supabase se seedha check karein (Admin Panel ki tarah)
    try {
      const { data: subs } = await supa
        .from('subscriptions')
        .select('status, expiry_date')
        .eq('user_id', state.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      const activeSub = subs && subs[0];
      const isPremium = activeSub && (!activeSub.expiry_date || new Date(activeSub.expiry_date) > new Date());

      if (isPremium) {
        premiumBox.style.display = 'none'; // Premium/Trial user hai
      } else {
        premiumBox.style.display = 'block'; // Free user hai
      }
    } catch (err) {
      premiumBox.style.display = 'block'; // Error aane par free user maankar box dikha dein
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

      // HTML load hone ke baad plan check karein
      setTimeout(checkUserPlanAndHideBox, 1500);
    }

    if (attempts > 600) clearInterval(checkInterval);
  }, 500);
})();
