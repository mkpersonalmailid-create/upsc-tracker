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

  // ⚡ Use global OPTIONAL_SUBJECTS from app.html (same as Settings)
  const OPTIONAL_SUBJECTS = window.OPTIONAL_SUBJECTS || [];

  const STAGES = [
    { id: 'beginner', label: 'Just started', emoji: '🌱' },
    { id: 'intermediate', label: 'In middle of prep', emoji: '🌿' },
    { id: 'revision', label: 'Revision phase', emoji: '🌳' },
    { id: 'interview', label: 'Interview prep', emoji: '🎯' },
  ];

  let currentStep = 1;
  let formData = {
    optional: '',
    year: '',
    hours: '6',
    stage: 'beginner',
  };

  /* ═══════════════════════════════════════════════════════
     CHECK IF USER NEEDS ONBOARDING
     ═══════════════════════════════════════════════════════ */
  async function needsOnboarding() {
    try {
      if (localStorage.getItem(ONBOARDED_KEY) === 'true') return false;
    } catch (e) {}

    try {
      const supa = window.supa;
      if (!supa) return false;

      const {
        data: { user },
      } = await supa.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supa
        .from('profiles')
        .select('optional_subject, preparation_year, onboarding_completed, is_admin')
        .eq('id', user.id)
        .maybeSingle();

      // Admin skip
      if (profile?.is_admin === true) {
        try {
          localStorage.setItem(ONBOARDED_KEY, 'true');
        } catch (e) {}
        return false;
      }

      // Already setup
      if (profile?.optional_subject && profile?.preparation_year) {
        try {
          localStorage.setItem(ONBOARDED_KEY, 'true');
        } catch (e) {}
        return false;
      }

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

  /* ═══════════════════════════════════════════════════════
     INJECT WIZARD
     ═══════════════════════════════════════════════════════ */
  function injectWizard() {
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
        @keyframes fadeInOnboard { from { opacity: 0; } to { opacity: 1; } }
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
        #onboarding-wizard .wizard-card::-webkit-scrollbar { width: 6px; }
        #onboarding-wizard .wizard-card::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.4); border-radius: 10px;
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
        #onboarding-wizard .wiz-body { padding: 28px 32px; }
        #onboarding-wizard .wiz-label {
          display: block;
          color: #A99BC7;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
        }
        #onboarding-wizard .wiz-input {
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
        #onboarding-wizard .wiz-input:focus {
          border-color: #A855F7;
          box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.15);
        }
        #onboarding-wizard .wiz-field { margin-bottom: 18px; }
        #onboarding-wizard .wiz-optionals {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
          padding: 4px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        #onboarding-wizard .wiz-optionals::-webkit-scrollbar { width: 6px; }
        #onboarding-wizard .wiz-optionals::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.4);
          border-radius: 10px;
        }
        #onboarding-wizard .wiz-optional-btn {
          padding: 11px 8px;
          background: #0f0818;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: #A99BC7;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          text-align: center;
          line-height: 1.3;
        }
        #onboarding-wizard .wiz-optional-btn:hover {
          border-color: rgba(168, 85, 247, 0.5);
          color: #fff;
          transform: translateY(-1px);
        }
        #onboarding-wizard .wiz-optional-btn.active {
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4);
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
        #onboarding-wizard .wiz-progress { display: flex; gap: 6px; }
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
          #onboarding-wizard .wiz-optionals { grid-template-columns: repeat(2, 1fr); }
          #onboarding-wizard .wiz-hours { grid-template-columns: repeat(3, 1fr); }
          #onboarding-wizard .wiz-stages { grid-template-columns: 1fr; }
        }
      </style>
      <div class="wizard-card" id="wizCard"></div>
    `;

    document.body.appendChild(wizard);
    renderStep();
  }

  /* ═══════════════════════════════════════════════════════
     RENDER CURRENT STEP
     ═══════════════════════════════════════════════════════ */
  function renderStep() {
    const card = document.getElementById('wizCard');
    if (!card) return;

    if (currentStep === 1) renderStep1(card);
    else if (currentStep === 2) renderStep2(card);
    else if (currentStep === 3) renderStep3(card);
  }

  /* ══════════ STEP 1: Optional + Year ══════════ */
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
          <div class="wiz-optionals" id="wizOptionalGrid">
            ${OPTIONAL_SUBJECTS.map(
              (s) => `
              <button type="button" class="wiz-optional-btn" data-value="${s}">
                ${s}
              </button>
            `,
            ).join('')}
          </div>
        </div>
        <div class="wiz-field" style="margin-top: 20px;">
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

    const year = document.getElementById('wizYear');
    const next = document.getElementById('wizNext1');

    // Pre-select if already chosen
    if (formData.optional) {
      document.querySelectorAll('.wiz-optional-btn').forEach((btn) => {
        if (btn.dataset.value === formData.optional) btn.classList.add('active');
      });
    }
    if (formData.year) year.value = formData.year;

    function check() {
      next.disabled = !formData.optional || !year.value.trim();
    }

    document.querySelectorAll('.wiz-optional-btn').forEach((btn) => {
      btn.onclick = () => {
        document.querySelectorAll('.wiz-optional-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        formData.optional = btn.dataset.value;
        check();
      };
    });

    year.oninput = check;
    setTimeout(() => year.focus(), 300);
    check();

    next.onclick = () => {
      formData.year = year.value.trim();
      currentStep = 2;
      renderStep();
    };
  }

  /* ══════════ STEP 2: Hours + Stage ══════════ */
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
        <div class="wiz-field" style="margin-top: 20px;">
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

  /* ══════════ STEP 3: Confirm + Start ══════════ */
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

  /* ═══════════════════════════════════════════════════════
     FINISH ONBOARDING
     ═══════════════════════════════════════════════════════ */
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
          // Primary update
          const { error } = await supa
            .from('profiles')
            .update({
              optional_subject: formData.optional,
              preparation_year: formData.year,
              daily_target_hours: formData.hours,
              prep_stage: formData.stage,
              onboarding_completed: true,
            })
            .eq('id', user.id);

          // Fallback if some columns don't exist
          if (error) {
            log('Full update failed, trying minimal:', error.message);
            await supa
              .from('profiles')
              .update({
                optional_subject: formData.optional,
                preparation_year: formData.year,
              })
              .eq('id', user.id);
          }

          // Update local state
          try {
            const s = typeof getState === 'function' ? getState() : null;
            if (s && s.profile) {
              s.profile.optional_subject = formData.optional;
              s.profile.preparation_year = formData.year;
            }
          } catch (e) {}
        }
      }

      try {
        localStorage.setItem(ONBOARDED_KEY, 'true');
      } catch (e) {}

      log('✅ Onboarding complete:', formData);

      closeWizard();

      setTimeout(() => {
        if (typeof window.toast === 'function') {
          window.toast('🎉 Welcome to UPSC Tracker! Start your first session.', 'ok');
        }
      }, 500);

      setTimeout(() => {
        const timer = document.querySelector('.timer-card, #timerSection, [data-timer]');
        if (timer) timer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1000);
    } catch (e) {
      console.error('[Onboarding] Save error:', e);
      closeWizard();
    }
  }

  /* ═══════════════════════════════════════════════════════
     CLOSE WIZARD
     ═══════════════════════════════════════════════════════ */
  function closeWizard() {
    const wizard = document.getElementById('onboarding-wizard');
    if (wizard) {
      wizard.style.transition = 'opacity 0.3s';
      wizard.style.opacity = '0';
      setTimeout(() => wizard.remove(), 300);
    }
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */
  async function init() {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

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
