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
  // ═══════════════════════════════════════════════════════════
  if (url.pathname.startsWith('/api/')) {
    return next();
  }

  // ═══════════════════════════════════════════════════════════
  //  4. OAUTH, HTML, CSS, JS BYPASS (Google Login Fix)
  //  Isme CSS aur JS folders bhi add kar diye hain taaki
  //  page load hote waqt dobara password na maange.
  // ═══════════════════════════════════════════════════════════
  if (
    url.pathname === '/' || 
    url.pathname === '/index.html' || 
    url.pathname === '/auth.html' || 
    url.pathname === '/app.html' ||
    url.pathname === '/favicon.ico' ||
    url.pathname.startsWith('/CSS/') || 
    url.pathname.startsWith('/JS/') ||
    url.pathname.startsWith('/assets/')
  ) {
    return next(); // Bina password ke andar jaane do
  }

  // ═══════════════════════════════════════════════════════════
  //  5. BASIC AUTH for other preview pages
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