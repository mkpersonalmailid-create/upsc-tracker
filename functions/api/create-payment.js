// POST /api/create-payment
// Handles both one-time orders (yearly) and recurring subscriptions (monthly)

const ONE_TIME_PLANS = {
  yearly: {
    amount: 50000, // ₹500 in paise
    description: 'UPSC Tracker Premium — Yearly'
  }
};

const SUBSCRIPTION_PLANS = {
  monthly: {
    plan_id_env: 'RAZORPAY_PLAN_ID_MONTHLY',
    description: 'UPSC Tracker Premium — Monthly',
    total_count: 60 // 60 months = 5 years (was 120 = 10 years)
  }
};

function json(o, s = 200) {
  return new Response(JSON.stringify(o), {
    status: s,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    // ═══ 1. Verify Supabase session ═══
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return json({ error: 'Unauthenticated' }, 401);

    const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token
      }
    });
    if (!userRes.ok) return json({ error: 'Invalid session' }, 401);
    const user = await userRes.json();
    if (!user?.id) return json({ error: 'Invalid user' }, 401);

    // ═══ 2. Parse body ═══
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

        const { plan_id, type, coupon_code, coupon_price } = body;
    if (!plan_id || !type) return json({ error: 'Missing plan_id or type' }, 400);

    const auth64 = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const headers = {
      'Authorization': 'Basic ' + auth64,
      'Content-Type': 'application/json'
    };

    const customerName = user.user_metadata?.full_name
      || user.email?.split('@')[0]
      || 'Student';
    const customerPhone = user.user_metadata?.phone
      || user.phone
      || '';

    // ═══════════════════════════════════════════════
    //  SUBSCRIPTION (monthly) — UPI Autopay
    // ═══════════════════════════════════════════════
    if (type === 'subscription') {
      const plan = SUBSCRIPTION_PLANS[plan_id];
      if (!plan) return json({ error: 'Invalid subscription plan' }, 400);

      const razorpayPlanId = env[plan.plan_id_env];
      if (!razorpayPlanId) {
        console.error('Missing env var:', plan.plan_id_env);
        return json({ error: 'Server plan not configured' }, 500);
      }

      // ─── Direct subscription creation (no customer API needed) ───
      // Razorpay auto-creates customer from notes
      const subPayload = {
        plan_id: razorpayPlanId,
        total_count: plan.total_count,
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id: user.id,
          plan_id: plan_id,
          email: user.email,
          name: customerName
        }
      };

      // Add phone if available
      if (customerPhone) {
        subPayload.notes.phone = customerPhone;
      }

      const subRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(subPayload)
      });

      if (!subRes.ok) {
        const errText = await subRes.text();
        console.error('Subscription creation failed:', subRes.status, errText);
        let errMsg = 'Failed to create subscription';
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson?.error?.description || errMsg;
        } catch {}
        return json({ error: errMsg }, 502);
      }

      const sub = await subRes.json();
      console.log('Subscription created:', sub.id, 'for user:', user.id);

      return json({
        subscription_id: sub.id,
        key_id: env.RAZORPAY_KEY_ID,
        currency: 'INR',
        description: plan.description,
        type: 'subscription'
      });
    }

    // ═══════════════════════════════════════════════
    //  ONE-TIME ORDER (yearly) — Card / UPI / Netbanking
    // ═══════════════════════════════════════════════
    if (type === 'one_time') {
      const plan = ONE_TIME_PLANS[plan_id];
      if (!plan) return json({ error: 'Invalid plan' }, 400);

            // Coupon price override
      const TEST_PRICES = { 'TEST1': 100 }; // ₹1 in paise
      const useCouponPrice = coupon_code && TEST_PRICES[coupon_code] && coupon_price === TEST_PRICES[coupon_code] / 100;
      const finalAmount = useCouponPrice ? TEST_PRICES[coupon_code] : plan.amount;
      
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST', headers,
        body: JSON.stringify({
          amount: finalAmount,
          currency: 'INR',
          receipt: `u_${user.id.slice(0, 8)}_${Date.now()}`,
          notes: {
            user_id: user.id,
            plan_id: plan_id,
            email: user.email,
            name: customerName
          }
        })
      });

      if (!orderRes.ok) {
        const errText = await orderRes.text();
        console.error('Order failed:', orderRes.status, errText);
        let errMsg = 'Failed to create order';
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson?.error?.description || errMsg;
        } catch {}
        return json({ error: errMsg }, 502);
      }

      const order = await orderRes.json();
      console.log('Order created:', order.id, 'for user:', user.id);

            return json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: env.RAZORPAY_KEY_ID,
        description: useCouponPrice ? `UPSC Tracker — Test (₹${finalAmount/100})` : plan.description,
        type: 'one_time'
      });
    }

    return json({ error: 'Invalid payment type' }, 400);

  } catch (e) {
    console.error('create-payment error:', e);
    return json({ error: 'Server error', message: e.message }, 500);
  }
}