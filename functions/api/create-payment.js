// POST /api/create-payment
// Handles both one-time orders and recurring subscriptions

const ONE_TIME_PLANS = {
  yearly: { amount: 50000, description: 'UPSC Tracker Premium — Yearly' } // ₹500 in paise
};
const SUBSCRIPTION_PLANS = {
  monthly: { plan_id_env: 'RAZORPAY_PLAN_ID_MONTHLY', description: 'UPSC Tracker Premium — Monthly', total_count: 120 }
};

function json(o, s = 200) {
  return new Response(JSON.stringify(o), { status: s,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

export async function onRequestPost({ request, env }) {
  try {
    // 1. Verify Supabase session
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return json({ error: 'Unauthenticated' }, 401);

    const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': env.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token }
    });
    if (!userRes.ok) return json({ error: 'Invalid session' }, 401);
    const user = await userRes.json();
    if (!user?.id) return json({ error: 'Invalid user' }, 401);

    // 2. Parse body
    let body; try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const { plan_id, type } = body;
    if (!plan_id || !type) return json({ error: 'Missing plan_id or type' }, 400);

    const auth64 = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const headers = { 'Authorization': 'Basic ' + auth64, 'Content-Type': 'application/json' };

    // ============ SUBSCRIPTION (monthly) ============
    if (type === 'subscription') {
      const plan = SUBSCRIPTION_PLANS[plan_id];
      if (!plan) return json({ error: 'Invalid subscription plan' }, 400);

      const razorpayPlanId = env[plan.plan_id_env];
      if (!razorpayPlanId) return json({ error: 'Server plan not configured' }, 500);

      // Create or fetch customer
      const custRes = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST', headers,
        body: JSON.stringify({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
          email: user.email,
          notes: { user_id: user.id },
          fail_existing: '0'
        })
      });
      const customer = await custRes.json();
      if (!customer.id) return json({ error: 'Failed to create Razorpay customer' }, 502);

      // Create subscription
      const subRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST', headers,
        body: JSON.stringify({
          plan_id: razorpayPlanId,
          customer_id: customer.id,
          total_count: plan.total_count,   // 120 months = 10 years
          quantity: 1,
          customer_notify: 1,
          notes: { user_id: user.id, plan_id }
        })
      });
      if (!subRes.ok) {
        const t = await subRes.text();
        console.error('Subscription creation failed:', t);
        return json({ error: 'Failed to create subscription' }, 502);
      }
      const sub = await subRes.json();

      return json({
        subscription_id: sub.id,
        key_id: env.RAZORPAY_KEY_ID,
        currency: 'INR',
        description: plan.description,
        type: 'subscription'
      });
    }

    // ============ ONE-TIME ORDER (yearly) ============
    if (type === 'one_time') {
      const plan = ONE_TIME_PLANS[plan_id];
      if (!plan) return json({ error: 'Invalid plan' }, 400);

      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST', headers,
        body: JSON.stringify({
          amount: plan.amount,
          currency: 'INR',
          receipt: `u_${user.id.slice(0, 8)}_${Date.now()}`,
          notes: { user_id: user.id, plan_id }
        })
      });
      if (!rzpRes.ok) {
        const t = await rzpRes.text();
        console.error('Order failed:', t);
        return json({ error: 'Failed to create order' }, 502);
      }
      const order = await rzpRes.json();

      return json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: env.RAZORPAY_KEY_ID,
        description: plan.description,
        type: 'one_time'
      });
    }

    return json({ error: 'Invalid payment type' }, 400);
  } catch (e) {
    console.error('create-payment error:', e);
    return json({ error: 'Server error' }, 500);
  }
}