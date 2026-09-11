// POST /api/verify-payment
// Handles both one-time orders and subscriptions

const ONE_TIME_PLANS = { yearly: { days: 365, plan: 'yearly' } };

function json(o, s = 200) {
  return new Response(JSON.stringify(o), { status: s,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
function hex(buf) { return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''); }
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let m = 0; for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

export async function onRequestPost({ request, env }) {
  try {
    // 1. Auth
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return json({ error: 'Unauthenticated' }, 401);
    const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`,
      { headers: { 'apikey': env.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token } });
    if (!userRes.ok) return json({ error: 'Invalid session' }, 401);
    const user = await userRes.json();

    // 2. Body
    let body; try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature,
            razorpay_subscription_id, plan_id } = body;

    if (!razorpay_payment_id || !razorpay_signature) return json({ error: 'Missing payment fields' }, 400);

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(env.RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const auth64 = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

    let amount, currency, planName, expiryDays, subscriptionId = null;

    // ============ SUBSCRIPTION VERIFY ============
    if (razorpay_subscription_id) {
      const sigBuf = await crypto.subtle.sign('HMAC', key,
        enc.encode(`${razorpay_payment_id}|${razorpay_subscription_id}`));
      const expected = hex(sigBuf);
      if (!timingSafeEqual(expected, razorpay_signature)) return json({ error: 'Invalid signature' }, 400);

      const sRes = await fetch(`https://api.razorpay.com/v1/subscriptions/${razorpay_subscription_id}`,
        { headers: { 'Authorization': 'Basic ' + auth64 } });
      if (!sRes.ok) return json({ error: 'Subscription not found' }, 400);
      const sub = await sRes.json();

      if (sub.status !== 'active' && sub.status !== 'authenticated') {
        return json({ error: 'Subscription not active: ' + sub.status }, 400);
      }
      if (sub.notes?.user_id && sub.notes.user_id !== user.id) return json({ error: 'User mismatch' }, 403);

      amount = sub.quantity * (sub.plan?.item?.amount || 0);
      currency = sub.plan?.item?.currency || 'INR';
      planName = 'monthly';
      subscriptionId = razorpay_subscription_id;
      const currentEnd = sub.current_end ? sub.current_end * 1000 : Date.now() + 30 * 86400000;
      expiryDays = Math.max(1, Math.round((currentEnd - Date.now()) / 86400000));
    }
    // ============ ONE-TIME ORDER VERIFY ============
    else if (razorpay_order_id) {
      // Signature check
      const sigBuf = await crypto.subtle.sign('HMAC', key,
        enc.encode(`${razorpay_order_id}|${razorpay_payment_id}`));
      const expected = hex(sigBuf);
      if (!timingSafeEqual(expected, razorpay_signature)) return json({ error: 'Invalid signature' }, 400);

      // Fetch payment from Razorpay
      const pRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
        { headers: { 'Authorization': 'Basic ' + auth64 } });
      if (!pRes.ok) return json({ error: 'Payment not found' }, 400);
      const payment = await pRes.json();
      if (payment.order_id !== razorpay_order_id) return json({ error: 'Order mismatch' }, 400);
      if (!['captured', 'authorized'].includes(payment.status)) return json({ error: 'Not captured' }, 400);

      // ─── Fetch ORDER from Razorpay to get ACTUAL amount (coupon-aware) ───
      const oRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`,
        { headers: { 'Authorization': 'Basic ' + auth64 } });
      if (!oRes.ok) return json({ error: 'Order not found' }, 400);
      const order = await oRes.json();

      // Paid amount MUST equal the order amount (whatever it is — ₹1 or ₹500)
      if (payment.amount !== order.amount) {
        return json({ error: 'Amount mismatch' }, 400);
      }

      const plan = ONE_TIME_PLANS[plan_id];
      if (!plan) return json({ error: 'Invalid plan' }, 400);
      if (payment.notes?.user_id && payment.notes.user_id !== user.id) return json({ error: 'User mismatch' }, 403);

      amount = payment.amount;
      currency = payment.currency;
      planName = plan.plan;
      expiryDays = plan.days;
    } else {
      return json({ error: 'Missing order or subscription id' }, 400);
    }

    // ============ Duplicate check ============
    const dupeRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/payments?razorpay_payment_id=eq.${encodeURIComponent(razorpay_payment_id)}&select=id`,
      { headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY } });
    if (dupeRes.ok) {
      const dupes = await dupeRes.json();
      if (Array.isArray(dupes) && dupes.length > 0) {
        return json({ success: true, already_processed: true, plan: planName });
      }
    }

    const now = new Date();
    const expiryISO = new Date(now.getTime() + expiryDays * 86400000).toISOString();

    // ============ Save subscription ============
    const subPayload = {
      user_id: user.id, plan: planName, status: 'active',
      razorpay_order_id: razorpay_order_id || null,
      razorpay_payment_id, razorpay_subscription_id: subscriptionId,
      amount, currency,
      start_date: now.toISOString(), expiry_date: expiryISO,
      next_billing_date: subscriptionId ? expiryISO : null,
      updated_at: now.toISOString()
    };
    const subRes = await fetch(`${env.SUPABASE_URL}/rest/v1/subscriptions?on_conflict=user_id`, {
      method: 'POST',
      headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(subPayload)
    });
    if (!subRes.ok) { console.error(await subRes.text()); return json({ error: 'Failed to save subscription' }, 500); }

    // ============ Log payment ============
    await fetch(`${env.SUPABASE_URL}/rest/v1/payments`, {
      method: 'POST',
      headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates' },
      body: JSON.stringify({ user_id: user.id, razorpay_order_id, razorpay_payment_id,
        amount, currency, status: 'captured', plan: planName })
    });

    return json({ success: true, plan: planName, expiry: expiryISO, amount });
  } catch (e) {
    console.error('verify-payment error:', e);
    return json({ error: 'Server error', message: e.message }, 500);
  }
}