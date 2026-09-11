// scripts/update-blog-index.js

const fs = require('fs');
const path = require('path');

function main() {
  const blogDir = 'blog';
  const files = fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.html') && f !== 'index.html');

  const posts = files.map(file => {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
    
    // Title nikaalo
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i)
      || content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s*\|\s*UPSC Tracker.*$/i, '').trim() : file;
    
    // Description nikaalo
    const descMatch = content.match(/<meta name="description" content="([^"]+)"/i);
    const description = descMatch ? descMatch[1].slice(0, 200) : 'Read this UPSC preparation article.';
    
    // Date nikaalo
    const dateMatch = content.match(/<meta property="article:published_time" content="([^"]+)"/i)
      || content.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1].slice(0, 10) : '2026-01-01';
    
    return { file, title, description, date };
  });

  // Latest first
  posts.sort((a, b) => b.date.localeCompare(a.date));

  const cardsHtml = posts.map(p => `
    <article style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:24px;transition:all .25s;">
      <div style="font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--purple);margin-bottom:10px">📖 UPSC</div>
      <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:10px;color:var(--text);line-height:1.35">
        <a href="/blog/${p.file}" style="color:var(--text);text-decoration:none">${p.title}</a>
      </h2>
      <p style="font-size:.88rem;color:var(--text-2);line-height:1.6;margin-bottom:16px">${p.description}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:.78rem;color:var(--text-3)">
        <span>📅 ${p.date}</span>
        <a href="/blog/${p.file}" style="color:var(--purple);font-weight:700;text-decoration:none">Read →</a>
      </div>
    </article>`).join('\n');

  const indexHtml = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>UPSC Preparation Blog — Study Strategies & Tips | UPSC Tracker</title>
<meta name="description" content="Free UPSC study strategies, book recommendations, time management tips, and prep guides. Updated daily for serious aspirants.">
<link rel="icon" href="https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0A0612;--card:#171026;--border:#2A1E42;--text:#FFF;--text-2:#B8A8D9;--text-3:#6E5F8C;--purple:#A855F7;--grad-1:linear-gradient(135deg,#8B5CF6,#EC4899)}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(circle at 15% 20%,rgba(168,85,247,.12),transparent 45%),radial-gradient(circle at 85% 80%,rgba(236,72,153,.10),transparent 45%)}
a{color:var(--purple);text-decoration:none}
.navbar{padding:16px 0;border-bottom:1px solid var(--border);background:rgba(10,6,18,.85);backdrop-filter:blur(20px);position:sticky;top:0;z-index:100}
.nav-inner{max-width:1100px;margin:0 auto;padding:0 20px;display:flex;justify-content:space-between;align-items:center}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;color:var(--text)}
.logo img{width:36px;height:36px;border-radius:9px}
.nav-cta{background:var(--grad-1);color:#fff!important;padding:10px 20px;border-radius:10px;font-weight:800;font-size:.85rem}
.hero{text-align:center;padding:60px 20px 40px;position:relative;z-index:1}
.hero .tag{font-size:.72rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--purple);margin-bottom:14px}
.hero h1{font-size:clamp(2rem,4vw,3rem);font-weight:900;letter-spacing:-.03em;margin-bottom:16px;background:linear-gradient(135deg,#fff,#C4B5FD);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{color:var(--text-2);font-size:1.05rem;max-width:600px;margin:0 auto}
.posts{max-width:1100px;margin:0 auto;padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px;position:relative;z-index:1}
footer{border-top:1px solid var(--border);padding:40px 0;text-align:center;color:var(--text-3);font-size:.85rem;margin-top:60px;background:var(--bg-2);position:relative;z-index:1}
footer a{color:var(--text-2);margin:0 8px}
</style>
</head>
<body>
<nav class="navbar">
  <div class="nav-inner">
    <a href="/" class="logo">
      <img src="https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png" alt="UPSC Tracker">
      <span>UPSC Study Tracker</span>
    </a>
    <a href="/app.html" class="nav-cta">Start Free →</a>
  </div>
</nav>

<section class="hero">
  <div class="tag">Blog</div>
  <h1>UPSC Preparation Blog</h1>
  <p>Free study strategies, book recommendations, and time management tips for serious aspirants.</p>
</section>

<section class="posts">
  ${cardsHtml}
</section>

<footer>
  <div>© 2026 UPSC Study Tracker</div>
  <div style="margin-top:10px">
    <a href="/">Home</a> · <a href="/app.html">App</a> · <a href="/about.html">About</a> · <a href="/contact.html">Contact</a>
  </div>
</footer>
</body>
</html>`;

  fs.writeFileSync('blog/index.html', indexHtml, 'utf8');
  console.log(`✅ Blog index updated with ${posts.length} posts`);
}

main();