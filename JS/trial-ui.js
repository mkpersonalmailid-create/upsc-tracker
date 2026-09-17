/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Trial UI Enhancer
   ─────────────────────────────────────────────────────────────
   ✅ Sidebar card: "PREMIUM" → "FREE TRIAL · Ends in Xd Yh Zm"
   ✅ Bottom user badge: "💎 Premium" → "⏳ Trial · Xd left"
   ✅ Live countdown (updates every minute)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[trial-ui] loaded');

  let tickHandle = null;

  function isTrial() {
    return (
      typeof state !== 'undefined' &&
      state?.subscription?.plan === 'trial' &&
      state?.isPremium === true &&
      state?.subscription?.expiry_date
    );
  }

  function getTimeLeft() {
    if (!state?.subscription?.expiry_date) return null;
    const diff = new Date(state.subscription.expiry_date) - new Date();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return { days, hours, mins, total: diff };
  }

  function updateTrialUI() {
    if (!isTrial()) return;

    const timeLeft = getTimeLeft();
    if (!timeLeft) return;

    /* ═══ 1. Sidebar plan indicator (top) ═══ */
    const indicator = document.getElementById('sidebarPlanIndicator');
    if (indicator) {
      const icon = indicator.querySelector('.plan-icon');
      const name = indicator.querySelector('.plan-name');
      const desc = indicator.querySelector('.plan-desc');

      if (icon) icon.textContent = '⏳';
      if (name) name.textContent = 'Free Trial';
      if (desc) {
        const shortTime =
          timeLeft.days > 0
            ? `${timeLeft.days}d ${timeLeft.hours}h left`
            : timeLeft.hours > 0
              ? `${timeLeft.hours}h ${timeLeft.mins}m left`
              : `${timeLeft.mins}m left`;
        desc.textContent = `Ends in ${shortTime}`;
      }

      // Trial ke liye amber/orange tint
      indicator.classList.add('pro');
      // Amber glow for trial
      indicator.style.background = 'linear-gradient(135deg, rgba(251,191,36,.15), rgba(249,115,22,.08))';
      indicator.style.borderColor = 'rgba(251,191,36,.4)';
    }

    /* ═══ 2. Bottom user badge ═══ */
    const sbStatus = document.getElementById('sbUserStatus');
    if (sbStatus) {
      sbStatus.textContent = `⏳ Trial · ${timeLeft.days}d left`;
      sbStatus.style.color = '#FBBF24';
    }

    /* ═══ 3. Top-right plan badge button ═══ */
    const planBadge = document.getElementById('planBadgeBtn');
    if (planBadge) {
      planBadge.textContent = '⏳';
      planBadge.title = `Trial · ${timeLeft.days} days left`;
    }
  }

  function startTicker() {
    if (tickHandle) return;
    tickHandle = setInterval(updateTrialUI, 60000); // update every 60s
  }

  function stopTicker() {
    if (tickHandle) {
      clearInterval(tickHandle);
      tickHandle = null;
    }
  }

  /* ═══ Patch updatePremiumUI — har baar override karo ═══ */
  function patchUpdatePremiumUI() {
    if (typeof window.updatePremiumUI !== 'function') return;
    const _orig = window.updatePremiumUI;
    window.updatePremiumUI = function () {
      _orig.call(this);
      setTimeout(updateTrialUI, 50);
    };
  }

  /* ═══ Watch sidebar for re-renders ═══ */
  function watchSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const observer = new MutationObserver(() => {
      if (isTrial()) updateTrialUI();
    });
    observer.observe(sidebar, { childList: true, subtree: true, characterData: true });
  }

  /* ═══ Install ═══ */
  function install() {
    patchUpdatePremiumUI();
    watchSidebar();

    // Initial runs (DOM settle ke liye)
    setTimeout(updateTrialUI, 300);
    setTimeout(updateTrialUI, 1000);
    setTimeout(updateTrialUI, 2500);

    // Watch for new sidebar indicator creation
    const indicatorObserver = new MutationObserver(() => {
      if (isTrial()) updateTrialUI();
    });
    indicatorObserver.observe(document.body, { childList: true, subtree: true });

    startTicker();

    // Cleanup on logout
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('beforeunload', stopTicker);
    }

    console.log('[trial-ui] ✅ installed');
  }

  /* ═══ Wait for state + user ═══ */
  let attempts = 0;
  function waitThenStart() {
    if (
      typeof state !== 'undefined' &&
      typeof state === 'object' &&
      state.user &&
      typeof window.updatePremiumUI === 'function'
    ) {
      install();
    } else {
      attempts++;
      if (attempts > 300) return console.error('[trial-ui] timeout');
      setTimeout(waitThenStart, 100);
    }
  }
  waitThenStart();
})();
