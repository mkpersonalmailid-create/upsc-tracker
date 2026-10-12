/* ═══════════════════════════════════════════════════════
   ONBOARDING WIZARD — First-time user experience
   File: JS/onboarding.js
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ONBOARDED_KEY = 'upsc_onboarded_v1';
  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log('%c🎉 [Onboarding]', 'color:#10B981;font-weight:700', ...args);
  }

  const OPTIONAL_SUBJECTS = [
    'Anthropology',
    'Commerce & Accountancy',
    'Economics',
    'Geography',
    'History',
    'Law',
    'Management',
    'Mathematics',
    'Philosophy',
    'Physics',
    'Political Science',
    'Psychology',
    'Public Administration',
    'Sociology',
    'Statistics',
    'Zoology',
    'Botany',
    'Chemistry',
    'Medical Science',
    'Literature',
    'Not decided yet',
  ];

  const STAGES = [
    { id: 'beginner', label: 'Just started', emoji: '🌱' },
    { id: 'intermediate', label: 'In middle of prep', emoji: '🌿' },
    { id: 'revision', label: 'Revision phase', emoji: '🌳' },
    { id: 'interview', label: 'Interview prep', emoji: '🎯' },
  ];

  // ─── State ───
  let currentStep = 1;
  let formData = {
    optional: '',
    year: '',
    hours: '6',
    stage: 'beginner',
  };

  // ─── Check if user needs onboarding ───
  async function needsOnboarding() {
    // localStorage check — agar already dekha hai, skip
    try {
      if (localStorage.getItem(ONBOARDED_KEY) === 'true') return false;
    } catch (e) {}

    // Supabase check — agar profile complete hai, skip
    try {
      const supa = window.supa;
      if (!supa) return false;

      const {
        data: { user },
      } = await supa.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supa
        .from('profiles')
        .select('optional_subject, preparation_year, onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      // Agar profile already setup hai, toh skip
      if (profile?.optional_subject && profile?.preparation_year) {
        try {
          localStorage.setItem(ONBOARDED_KEY, 'true');
        } catch (e) {}
        return false;
      }

      // Agar user pehle onboard ho chuka hai
      if (profile?.onboarding_completed === true) {
        try {
          localStorage.setItem(ONBOARDED_KEY, 'true');
        } catch (e) {}
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  // ─── Inject Wizard ───
  function injectWizard() {
    // Agar already exists, skip
    if (document.getElementById('onboarding-wizard')) return;

    const wizard = document.createElement('div');
    wizard.id = 'onboarding-wizard';
    wizard.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeInOnboard 0.4s ease-out;
      font-family: 'Inter', system-ui, sans-serif;
    `;

    wizard.innerHTML = `
      <style>
        @keyframes fadeInOnboard {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpOnboard {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        #onboarding-wizard .wizard-card {
          background: linear-gradient(180deg, #141024, #1c1630);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 24px;
          max-width: 560px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), 0 0 100px rgba(168, 85, 247, 0.2);
          animation: slideUpOnboard 0.5s cubic-bezier(0.32, 0.72, 0, 1);
        }
        #onboarding-wizard .wiz-hero {
          padding: 40px 32px 24px;
          text-align: center;
          background: linear-gradient(180deg, rgba(168, 85, 247, 0.12), transparent);
          border-bottom: 1px solid rgba(168, 85, 247, 0.15);
          border-radius: 24px 24px 0 0;
        }
        #onboarding-wizard .wiz-badge {
          display: inline-block;
          padding: 6px 16px;
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.4);
          color: #FBBF24;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        #onboarding-wizard .wiz-title {
          color: #fff;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.2;
          margin: 0 0 8px;
        }
        #onboarding-wizard .wiz-sub {
          color: #A1A1AA;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }
        #onboarding-wizard .wiz-body {
          padding: 28px 32px;
        }
        #onboarding-wizard .wiz-label {
          display: block;
          color: #A99BC7;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
        }
        #onboarding-wizard .wiz-input,
        #onboarding-wizard .wiz-select {
          width: 100%;
          padding: 14px 16px;
          background: #0f0818;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        #onboarding-wizard .wiz-input:focus,
        #onboarding-wizard .wiz-select:focus {
          border-color: #A855F7;
          box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.15);
        }
                  #onboarding-wizard .wiz-select option {
          background: #1c1630;
          color: #ffffff;
          padding: 12px;
          font-size: 15px;
          font-family: 'Inter', system-ui, sans-serif;
        }
        #onboarding-wizard .wiz-select option:checked,
        #onboarding-wizard .wiz-select option:hover {
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          color: #ffffff;
        }
        #onboarding-wizard .wiz-field {
          margin-bottom: 18px;
        }
        #onboarding-wizard .wiz-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 18px;
        }
        #onboarding-wizard .wiz-hours {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        #onboarding-wizard .wiz-hour-btn {
          padding: 14px 8px;
          background: #0f0818;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #A99BC7;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        #onboarding-wizard .wiz-hour-btn:hover {
          border-color: rgba(168, 85, 247, 0.4);
          color: #fff;
        }
        #onboarding-wizard .wiz-hour-btn.active {
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4);
        }
        #onboarding-wizard .wiz-stages {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        #onboarding-wizard .wiz-stage {
          padding: 16px 12px;
          background: #0f0818;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          color: #A99BC7;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
          font-family: inherit;
        }
        #onboarding-wizard .wiz-stage:hover {
          border-color: rgba(168, 85, 247, 0.4);
          color: #fff;
        }
        #onboarding-wizard .wiz-stage.active {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.15));
          border-color: #A855F7;
          color: #fff;
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.3);
        }
        #onboarding-wizard .wiz-stage-emoji {
          font-size: 24px;
          display: block;
          margin-bottom: 6px;
        }
        #onboarding-wizard .wiz-footer {
          padding: 20px 32px 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        #onboarding-wizard .wiz-progress {
          display: flex;
          gap: 6px;
          margin-bottom: 0;
        }
        #onboarding-wizard .wiz-dot {
          width: 26px;
          height: 4px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          transition: all 0.3s;
        }
        #onboarding-wizard .wiz-dot.active {
          background: linear-gradient(90deg, #8B5CF6, #EC4899);
          width: 40px;
        }
        #onboarding-wizard .wiz-btn-primary {
          padding: 14px 28px;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.3s;
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.4);
        }
        #onboarding-wizard .wiz-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(236, 72, 153, 0.5);
        }
        #onboarding-wizard .wiz-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        #onboarding-wizard .wiz-btn-skip {
          padding: 10px;
          background: transparent;
          border: none;
          color: #71717A;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        #onboarding-wizard .wiz-btn-skip:hover {
          color: #A99BC7;
        }
        #onboarding-wizard .wiz-success-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin: 0 auto 20px;
          box-shadow: 0 20px 60px rgba(168, 85, 247, 0.5);
        }
        @media (max-width: 540px) {
          #onboarding-wizard .wiz-body { padding: 22px; }
          #onboarding-wizard .wiz-hero { padding: 32px 22px 20px; }
          #onboarding-wizard .wiz-footer { padding: 16px 22px 22px; }
          #onboarding-wizard .wiz-title { font-size: 22px; }
          #onboarding-wizard .wiz-grid { grid-template-columns: 1fr; }
          #onboarding-wizard .wiz-hours { grid-template-columns: repeat(3, 1fr); }
          #onboarding-wizard .wiz-stages { grid-template-columns: 1fr; }
        }
      </style>
      <div class="wizard-card" id="wizCard"></div>
    `;

    document.body.appendChild(wizard);
    renderStep();
  }

  // ─── Render Current Step ───
  function renderStep() {
    const card = document.getElementById('wizCard');
    if (!card) return;

    if (currentStep === 1) renderStep1(card);
    else if (currentStep === 2) renderStep2(card);
    else if (currentStep === 3) renderStep3(card);
  }

  // ══════════ STEP 1: Optional + Year ══════════
  function renderStep1(card) {
    card.innerHTML = `
      <div class="wiz-hero">
        <div class="wiz-badge">Step 1 of 3</div>
        <h2 class="wiz-title">Let's personalize your tracker</h2>
        <p class="wiz-sub">Tell us about your UPSC journey. This takes 30 seconds.</p>
      </div>
      <div class="wiz-body">
        <div class="wiz-field">
          <label class="wiz-label">Optional Subject</label>
          <select class="wiz-select" id="wizOptional">
            <option value="">— Select your optional —</option>
            ${OPTIONAL_SUBJECTS.map((s) => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div class="wiz-field">
          <label class="wiz-label">Target Exam Year</label>
          <input type="text" class="wiz-input" id="wizYear" placeholder="e.g. 2027" maxlength="10" autocomplete="off" />
        </div>
      </div>
      <div class="wiz-footer">
        <div class="wiz-progress">
          <div class="wiz-dot active"></div>
          <div class="wiz-dot"></div>
          <div class="wiz-dot"></div>
        </div>
        <button class="wiz-btn-primary" id="wizNext1" disabled>Next →</button>
      </div>
    `;

    const optional = document.getElementById('wizOptional');
    const year = document.getElementById('wizYear');
    const next = document.getElementById('wizNext1');

    function check() {
      next.disabled = !optional.value || !year.value.trim();
    }
    optional.onchange = check;
    year.oninput = check;
    setTimeout(() => optional.focus(), 300);

    next.onclick = () => {
      formData.optional = optional.value;
      formData.year = year.value.trim();
      currentStep = 2;
      renderStep();
    };
  }

  // ══════════ STEP 2: Hours + Stage ══════════
  function renderStep2(card) {
    const hourOptions = ['2', '4', '6', '8', '10+'];

    card.innerHTML = `
      <div class="wiz-hero">
        <div class="wiz-badge">Step 2 of 3</div>
        <h2 class="wiz-title">How much do you study daily?</h2>
        <p class="wiz-sub">Be honest — this helps us set realistic targets for you.</p>
      </div>
      <div class="wiz-body">
        <div class="wiz-field">
          <label class="wiz-label">Daily Study Hours</label>
          <div class="wiz-hours" id="wizHours">
            ${hourOptions.map((h) => `<button class="wiz-hour-btn" data-hours="${h}">${h}h</button>`).join('')}
          </div>
        </div>
        <div class="wiz-field">
          <label class="wiz-label">Where are you in your prep?</label>
          <div class="wiz-stages" id="wizStages">
            ${STAGES.map(
              (s) => `
              <button class="wiz-stage" data-stage="${s.id}">
                <span class="wiz-stage-emoji">${s.emoji}</span>
                ${s.label}
              </button>
            `,
            ).join('')}
          </div>
        </div>
      </div>
      <div class="wiz-footer">
        <div class="wiz-progress">
          <div class="wiz-dot active"></div>
          <div class="wiz-dot active"></div>
          <div class="wiz-dot"></div>
        </div>
        <button class="wiz-btn-primary" id="wizNext2">Next →</button>
      </div>
    `;

    // Pre-select
    document.querySelectorAll('.wiz-hour-btn').forEach((btn) => {
      if (btn.dataset.hours === formData.hours) btn.classList.add('active');
      btn.onclick = () => {
        document.querySelectorAll('.wiz-hour-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        formData.hours = btn.dataset.hours;
      };
    });

    document.querySelectorAll('.wiz-stage').forEach((btn) => {
      if (btn.dataset.stage === formData.stage) btn.classList.add('active');
      btn.onclick = () => {
        document.querySelectorAll('.wiz-stage').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        formData.stage = btn.dataset.stage;
      };
    });

    document.getElementById('wizNext2').onclick = () => {
      currentStep = 3;
      renderStep();
    };
  }

  // ══════════ STEP 3: Confirm + Start ══════════
  function renderStep3(card) {
    const stageLabel = STAGES.find((s) => s.id === formData.stage)?.label || 'Beginner';

    card.innerHTML = `
      <div class="wiz-hero">
        <div class="wiz-success-icon">🎯</div>
        <h2 class="wiz-title">You're all set!</h2>
        <p class="wiz-sub">Here's your personalized setup. Time to start your first session.</p>
      </div>
      <div class="wiz-body">
        <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 14px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <span style="color: #A99BC7; font-size: 13px; font-weight: 600;">Optional</span>
            <span style="color: #fff; font-size: 13px; font-weight: 700;">${formData.optional}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <span style="color: #A99BC7; font-size: 13px; font-weight: 600;">Target Year</span>
            <span style="color: #fff; font-size: 13px; font-weight: 700;">${formData.year}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <span style="color: #A99BC7; font-size: 13px; font-weight: 600;">Daily Target</span>
            <span style="color: #fff; font-size: 13px; font-weight: 700;">${formData.hours} hours</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0;">
            <span style="color: #A99BC7; font-size: 13px; font-weight: 600;">Stage</span>
            <span style="color: #fff; font-size: 13px; font-weight: 700;">${stageLabel}</span>
          </div>
        </div>
        <p style="color: #A1A1AA; font-size: 13px; line-height: 1.6; text-align: center; margin: 20px 0 0;">
          💡 <strong style="color: #fff;">Pro tip:</strong> Even 2 hours tracked daily beats 10 hours unplanned. Consistency is the game.
        </p>
      </div>
      <div class="wiz-footer">
        <div class="wiz-progress">
          <div class="wiz-dot active"></div>
          <div class="wiz-dot active"></div>
          <div class="wiz-dot active"></div>
        </div>
        <button class="wiz-btn-primary" id="wizFinish">Start My First Session 🚀</button>
      </div>
    `;

    document.getElementById('wizFinish').onclick = finishOnboarding;
  }

  // ─── Finish Onboarding ───
  async function finishOnboarding() {
    const finishBtn = document.getElementById('wizFinish');
    if (finishBtn) {
      finishBtn.disabled = true;
      finishBtn.textContent = '⏳ Saving…';
    }

    try {
      const supa = window.supa;
      if (supa) {
        const {
          data: { user },
        } = await supa.auth.getUser();

        if (user) {
          // Update profile with onboarding data
          const updateData = {
            optional_subject: formData.optional,
            preparation_year: formData.year,
          };

          // Try to add extra fields if they exist
          try {
            updateData.daily_target_hours = formData.hours;
            updateData.prep_stage = formData.stage;
            updateData.onboarding_completed = true;
          } catch (e) {}

          const { error } = await supa.from('profiles').update(updateData).eq('id', user.id);

          if (error) {
            // Agar extra fields error de, toh sirf basics update karo
            await supa
              .from('profiles')
              .update({
                optional_subject: formData.optional,
                preparation_year: formData.year,
              })
              .eq('id', user.id);
          }

          // Update local state
          const s = getState ? getState() : null;
          if (s && s.profile) {
            s.profile.optional_subject = formData.optional;
            s.profile.preparation_year = formData.year;
          }
        }
      }

      // Mark as onboarded
      try {
        localStorage.setItem(ONBOARDED_KEY, 'true');
      } catch (e) {}

      log('✅ Onboarding complete:', formData);

      // Close wizard
      closeWizard();

      // Show welcome toast
      setTimeout(() => {
        if (typeof window.toast === 'function') {
          window.toast('🎉 Welcome to UPSC Tracker! Start your first session.', 'ok');
        }
      }, 500);

      // Scroll to timer / start session area
      setTimeout(() => {
        const timer = document.querySelector('.timer-card, #timerSection, [data-timer]');
        if (timer) timer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1000);
    } catch (e) {
      console.error('[Onboarding] Save error:', e);
      closeWizard();
    }
  }

  // ─── Close Wizard ───
  function closeWizard() {
    const wizard = document.getElementById('onboarding-wizard');
    if (wizard) {
      wizard.style.transition = 'opacity 0.3s';
      wizard.style.opacity = '0';
      setTimeout(() => wizard.remove(), 300);
    }
  }

  // ─── Init ───
  async function init() {
    // Wait for user to be logged in
    let attempts = 0;
    const check = setInterval(async () => {
      attempts++;
      const supa = window.supa;

      if (supa) {
        try {
          const {
            data: { user },
          } = await supa.auth.getUser();
          if (user) {
            clearInterval(check);
            const needs = await needsOnboarding();
            if (needs) {
              log('Showing onboarding wizard');
              // Thoda delay — page load ho jaye
              setTimeout(injectWizard, 1200);
            } else {
              log('User already onboarded, skipping');
            }
            return;
          }
        } catch (e) {}
      }

      if (attempts > 60) clearInterval(check);
    }, 500);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for testing
  window.__onboarding = {
    reset: () => {
      try {
        localStorage.removeItem(ONBOARDED_KEY);
      } catch (e) {}
      location.reload();
    },
    show: () => injectWizard(),
  };

  log('Module loaded');
})();
