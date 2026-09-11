export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // ═══════════════════════════════════════════════════════════
  //  1. PRODUCTION DOMAIN — no auth needed
  // ═══════════════════════════════════════════════════════════
  if (url.hostname === 'upscstudytracker.co.in') {
    return next();
  }

  // ═══════════════════════════════════════════════════════════
  //  2. NON-PAGES.DEV DOMAINS — no auth needed
  // ═══════════════════════════════════════════════════════════
  if (!url.hostname.endsWith('.pages.dev')) {
    return next();
  }

  // ═══════════════════════════════════════════════════════════
  //  3. API ROUTES BYPASS — /api/* 
  //  Reason: API routes are already protected by Supabase JWT
  //  (Bearer token in Authorization header).
  //  Basic Auth here would cause annoying popup during payment.
  // ═══════════════════════════════════════════════════════════
  if (url.pathname.startsWith('/api/')) {
    return next();
  }

  // ═══════════════════════════════════════════════════════════
  //  4. BASIC AUTH for preview pages (.pages.dev HTML/JS/CSS)
  // ═══════════════════════════════════════════════════════════
  const user = env.PREVIEW_USERNAME || 'mukund';
  const pass = env.PREVIEW_PASSWORD || 'UpscDev@2026';

  const auth = request.headers.get('Authorization');
  const expected = 'Basic ' + btoa(`${user}:${pass}`);

  if (auth !== expected) {
    return new Response('🔒 Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="UPSC Dev Preview"',
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store'
      }
    });
  }

  return next();
}