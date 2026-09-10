// POST /api/create-order
// Body: { plan_id: 'monthly' | 'yearly' }
// Auth: Bearer <supabase_access_token>

const PLANS = {
  monthly: { amount: 9900, description: 'UPSC Tracker Premium — Monthly' },
  yearly:  { amount: 89900, description: 'UPSC Tracker Premium — Yearly' }
};

function json(o, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    // 1. Verify Supabase session
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return json({ error: 'Unauthenticated' }, 401);

    const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token
      }
    });
    if (!userRes.ok) return json({ error: 'Invalid or expired session' }, 401);
    const user = await userRes.json();
    if (!user?.id) return json({ error: 'Invalid user' }, 401);

    // 2. Validate plan
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const plan = PLANS[body.plan_id];
    if (!plan) return json({ error: 'Invalid plan' }, 400);

    // 3. Create Razorpay order
    const auth64 = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth64,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: 'INR',
        receipt: `u_${user.id.slice(0, 8)}_${Date.now()}`,
        notes: { user_id: user.id, plan_id: body.plan_id, email: user.email || '' }
      })
    });
    if (!rzpRes.ok) {
      const t = await rzpRes.text();
      console.error('Razorpay order failed:', t);
      return json({ error: 'Failed to create order with Razorpay' }, 502);
    }
    const order = await rzpRes.json();

    return json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: env.RAZORPAY_KEY_ID,
      description: plan.description,
      plan_id: body.plan_id
    });
  } catch (e) {
    console.error('create-order error:', e);
    return json({ error: 'Server error' }, 500);
  }
}