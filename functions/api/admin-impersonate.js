// functions/api/admin-impersonate.js
// Admin Impersonation Endpoint
// Sirf admin hi kisi user ka magic link generate kar sakta hai

const SUPABASE_URL = 'https://zkmsgheoanyjvjfklqtg.supabase.co';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. Auth token verify karo
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return json({ error: 'No auth token' }, 401);
    }

    // 2. Service role key env se lo
    const serviceKey = env.IMPRSN8_SVC_KEY;
    if (!serviceKey) {
      return json({ error: 'Server not configured — env var missing' }, 500);
    }

    // 3. Caller ka user verify karo
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userRes.ok) {
      return json({ error: 'Invalid session' }, 401);
    }

    const caller = await userRes.json();
    if (!caller?.id) {
      return json({ error: 'Invalid user' }, 401);
    }

    // 4. Caller admin hai ya nahi — profiles check karo
    const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${caller.id}&select=is_admin,email,name`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    const profs = await profRes.json();
    const profile = Array.isArray(profs) ? profs[0] : null;

    if (!profile?.is_admin) {
      return json({ error: 'Admin access required' }, 403);
    }

    // 5. Target user email lo body se
    const body = await request.json().catch(() => ({}));
    const targetEmail = (body?.email || '').trim();

    if (!targetEmail) {
      return json({ error: 'Target email required' }, 400);
    }

    // 6. Magic link generate karo
    const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: targetEmail,
      }),
    });

    if (!linkRes.ok) {
      const errText = await linkRes.text();
      return json({ error: 'Failed to generate magic link', detail: errText }, 500);
    }

    const linkData = await linkRes.json();
    const actionLink = linkData.action_link || linkData.properties?.action_link;

    if (!actionLink) {
      return json({ error: 'No link generated' }, 500);
    }

    // 7. Log karo (audit trail)
    fetch(`${SUPABASE_URL}/rest/v1/user_activity`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        user_id: caller.id,
        event_type: 'admin_impersonate',
        event_data: {
          admin_email: profile.email,
          admin_name: profile.name,
          target_email: targetEmail,
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch(() => {});

    // 8. Success
    return json({
      success: true,
      magic_link: actionLink,
      target_email: targetEmail,
    });
  } catch (e) {
    return json({ error: e.message || 'Server error' }, 500);
  }
}

// Non-POST requests block karo
export async function onRequestGet() {
  return json({ error: 'POST only' }, 405);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
