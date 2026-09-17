/* ═══════════════════════════════════════════════════════════════
   UPSC TRACKER — Trial UI
   ─────────────────────────────────────────────────────────────
   ✅ Sidebar card: "PREMIUM" → "FREE TRIAL · Ends in Xd Yh Zm"
   ✅ Bottom badge: "💎 Premium" → "⏳ Trial · Xd left"
   ✅ Top-right badge: 💎 → ⏳
   ✅ Live countdown (updates every 60 seconds)
   ⚠️ NO MutationObserver — safe polling only
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

  function updateTrialUI() {
    if (!isTrial()) return;

    const diff = new Date(state.subscription.expiry_date) - new Date();
    if (diff <= 0) return;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    /* ── 1. Sidebar top card ── */
    const indicator = document.getElementById('sidebarPlanIndicator');
    if (indicator) {
      const icon = indicator.querySelector('.plan-icon');
      const name = indicator.querySelector('.plan-name');
      const desc = indicator.querySelector('.plan-desc');
      if (icon) icon.textContent = '⏳';
      if (name) name.textContent = 'Free Trial';
      if (desc) desc.textContent = `Ends in ${days}d ${hours}h ${mins}m`;
      indicator.style.background = 'linear-gradient(135deg, rgba(251,191,36,.15), rgba(249,115,22,.08))';
      indicator.style.borderColor = 'rgba(251,191,36,.4)';
    }

    /* ── 2. Bottom user badge ── */
    const sbStatus = document.getElementById('sbUserStatus');
    if (sbStatus) {
      sbStatus.textContent = `⏳ Trial · ${days}d left`;
      sbStatus.style.color = '#FBBF24';
    }

    /* ── 3. Top-right plan badge ── */
    const planBadge = document.getElementById('planBadgeBtn');
    if (planBadge) {
      planBadge.textContent = '⏳';
      planBadge.title = `Trial · ${days} days left`;
    }
  }

  /* ═══ Poll every 30 seconds ═══ */
  function startTicker() {
    if (tickHandle) return;
    tickHandle = setInterval(updateTrialUI, 30000);
  }

  /* ═══ Initial runs (multiple delays to catch DOM settle) ═══ */
  function runInitial() {
    [200, 600, 1200, 2500, 5000].forEach((ms) => setTimeout(updateTrialUI, ms));
  }

  /* ═══ Install ═══ */
  function install() {
    runInitial();
    startTicker();
    console.log('[trial-ui] ✅ installed');
  }

  /* ═══ Wait for app ready ═══ */
  let attempts = 0;
  function waitThenStart() {
    if (typeof state !== 'undefined' && state?.user && document.getElementById('sidebarPlanIndicator')) {
      install();
    } else {
      attempts++;
      if (attempts > 200) return console.error('[trial-ui] timeout');
      setTimeout(waitThenStart, 100);
    }
  }
  waitThenStart();
})();
