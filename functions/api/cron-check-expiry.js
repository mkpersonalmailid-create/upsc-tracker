export async function onRequestPost({ env }) {
  try {
    const now = new Date().toISOString();
    
    // Find all active subscriptions whose expiry_date has passed
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/subscriptions?status=eq.active&expiry_date=lt.${now}&select=id,user_id`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
        }
      }
    );
    
    const expired = await res.json();
    if (!Array.isArray(expired) || !expired.length) {
      return new Response(JSON.stringify({ ok: true, updated: 0 }), { status: 200 });
    }
    
    // Mark them as expired
    const ids = expired.map(s => s.id).join(',');
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/subscriptions?id=in.(${ids})`,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'expired', updated_at: now })
      }
    );
    
    return new Response(JSON.stringify({ ok: true, updated: expired.length }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}