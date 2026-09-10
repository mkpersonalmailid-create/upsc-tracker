// POST /api/verify-payment
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id }
// Auth: Bearer <supabase_access_token>

const PLANS = {
  monthly: { amount: 9900, days: 30, plan: 'monthly' },
  yearly:  { amount: 89900, days: 365, plan: 'yearly' }
};

function json(o, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function hex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
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
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing payment fields' }, 400);
    }
    const plan = PLANS[plan_id];
    if (!plan) return json({ error: 'Invalid plan' }, 400);

    // 3. Verify HMAC signature
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(env.RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${razorpay_order_id}|${razorpay_payment_id}`));
    const expected = hex(sigBuf);

    // constant-time compare
    if (expected.length !== razorpay_signature.length) return json({ error: 'Invalid signature' }, 400);
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ razorpay_signature.charCodeAt(i);
    if (mismatch !== 0) return json({ error: 'Invalid signature' }, 400);

    // 4. Fetch payment details to confirm amount & status
    const auth64 = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { 'Authorization': 'Basic ' + auth64 }
    });
    if (!payRes.ok) return json({ error: 'Payment not found' }, 400);
    const payment = await payRes.json();

    // Validate
    if (payment.order_id !== razorpay_order_id) return json({ error: 'Order mismatch' }, 400);
    if (!['captured', 'authorized'].includes(payment.status)) {
      return json({ error: 'Payment not captured: ' + payment.status }, 400);
    }
    if (payment.amount !== plan.amount) return json({ error: 'Amount mismatch' }, 400);
    if (payment.notes?.user_id && payment.notes.user_id !== user.id) {
      return json({ error: 'User mismatch' }, 403);
    }

    // 5. Compute expiry
    const now = new Date();
    const startISO = now.toISOString();
    const expiryISO = new Date(now.getTime() + plan.days * 86400 * 1000).toISOString();

    // 6. Check for duplicate payment
    const dupeRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/payments?razorpay_payment_id=eq.${encodeURIComponent(razorpay_payment_id)}&select=id`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
        }
      }
    );
    if (dupeRes.ok) {
      const dupes = await dupeRes.json();
      if (Array.isArray(dupes) && dupes.length > 0) {
        return json({ success: true, already_processed: true, plan: plan.plan, expiry: expiryISO });
      }
    }

    // 7. Write subscription (upsert by user_id — one active subscription per user)
    const subPayload = {
      user_id: user.id,
      plan: plan.plan,
      status: 'active',
      razorpay_order_id,
      razorpay_payment_id,
      amount: payment.amount,
      currency: payment.currency || 'INR',
      start_date: startISO,
      expiry_date: expiryISO,
      updated_at: startISO
    };
    const subRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/subscriptions?on_conflict=user_id`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(subPayload)
      }
    );
    if (!subRes.ok) {
      const t = await subRes.text();
      console.error('subscription write failed:', t);
      return json({ error: 'Failed to save subscription' }, 500);
    }

    // 8. Log payment (unique on razorpay_payment_id)
    await fetch(`${env.SUPABASE_URL}/rest/v1/payments`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify({
        user_id: user.id,
        razorpay_order_id,
        razorpay_payment_id,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        status: payment.status,
        plan: plan.plan
      })
    });

    return json({ success: true, plan: plan.plan, expiry: expiryISO });
  } catch (e) {
    console.error('verify-payment error:', e);
    return json({ error: 'Server error' }, 500);
  }
}