export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  
  // Production URL ko chhodo (no auth needed)
  if (url.hostname === 'upscstudytracker.co.in') {
    return next();
  }
  
  // Sirf .pages.dev URLs pe auth lagao
  if (!url.hostname.endsWith('.pages.dev')) {
    return next();
  }
  
  // Credentials (env se ya default)
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