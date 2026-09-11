// POST /api/razorpay-webhook
// Handles: subscription.authenticated, .activated, .charged, .completed, .cancelled, .halted
// Also handles: payment.captured, payment.failed

function json(o, s = 200) {
  return new Response(JSON.stringify(o), {
    status: s,
    headers: { 'Content-Type': 'application/json' }
  });
}

function hex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';
    if (!signature) return json({ error: 'Missing signature' }, 400);

    // ═══ Verify webhook signature ═══
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(env.RAZORPAY_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
    const expected = hex(sigBuf);
    if (expected.length !== signature.length) return json({ error: 'Invalid signature' }, 400);
    let m = 0;
    for (let i = 0; i < expected.length; i++) m |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    if (m !== 0) return json({ error: 'Invalid signature' }, 400);

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const sub = payload.payload?.subscription?.entity;

    // Agar subscription event nahi hai toh gracefully ignore
    if (!sub) {
      console.log('Non-subscription event:', event);
      return json({ ok: true, event, ignored: true });
    }

    const subscriptionId = sub.id;
    const userId = sub.notes?.user_id;
    if (!userId) return json({ error: 'No user_id in subscription notes' }, 400);

    const now = new Date().toISOString();
    const currentEnd = sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null;

    let status = 'active';
    let updateData = {};

    switch (event) {
      // ═══ User ne UPI app me mandate approve kiya ═══
      case 'subscription.authenticated':
        status = 'authenticated';
        updateData = {
          status,
          razorpay_subscription_id: subscriptionId,
          updated_at: now
        };
        break;

      // ═══ Subscription active ho gaya (mandate + first charge) ═══
      case 'subscription.activated':
      case 'subscription.charged':
        status = 'active';
        updateData = {
          status,
          expiry_date: currentEnd,
          next_billing_date: currentEnd,
          razorpay_payment_id: payload.payload?.payment?.entity?.id || null,
          razorpay_subscription_id: subscriptionId,
          updated_at: now
        };
        break;

      case 'subscription.completed':
        status = 'completed';
        updateData = { status, updated_at: now };
        break;

      case 'subscription.cancelled':
        status = 'cancelled';
        updateData = { status, updated_at: now };
        break;

      case 'subscription.halted':
        status = 'halted';
        updateData = { status, updated_at: now };
        break;

      default:
        console.log('Unhandled event:', event);
        return json({ ok: true, event, ignored: true });
    }

    // ═══ UPDATE existing subscription row ═══
    const patchResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/subscriptions?razorpay_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      }
    );

    let patchedRows = [];
    try {
      patchedRows = await patchResp.json();
    } catch (e) {
      patchedRows = [];
    }

    // ═══ Agar row exist nahi karti → INSERT karo ═══
    if (!Array.isArray(patchedRows) || patchedRows.length === 0) {
      console.log('No existing row — inserting new subscription record');
      await fetch(`${env.SUPABASE_URL}/rest/v1/subscriptions`, {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          user_id: userId,
          plan: 'monthly',
          razorpay_subscription_id: subscriptionId,
          start_date: now,
          ...updateData
        })
      });
    }

    // ═══ Log payment jab charged ho ═══
    if (event === 'subscription.charged') {
      const p = payload.payload?.payment?.entity;
      if (p) {
        await fetch(`${env.SUPABASE_URL}/rest/v1/payments`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=ignore-duplicates'
          },
          body: JSON.stringify({
            user_id: userId,
            razorpay_order_id: p.order_id,
            razorpay_payment_id: p.id,
            razorpay_subscription_id: subscriptionId,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            plan: 'monthly'
          })
        });
      }
    }

    // ═══ Membership upgrade jab activate ho ═══
    if (event === 'subscription.activated' || event === 'subscription.charged') {
      await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ membership: 'premium' })
      });
    }

    // ═══ Membership downgrade jab cancel/halt/complete ho ═══
    if (event === 'subscription.cancelled' || event === 'subscription.halted' || event === 'subscription.completed') {
      await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ membership: 'free' })
      });
    }

    console.log('Webhook processed:', event, 'for sub:', subscriptionId, 'status:', status);
    return json({ ok: true, event, status, subscriptionId });

  } catch (e) {
    console.error('webhook error:', e);
    return json({ error: 'Server error', message: e.message }, 500);
  }
}