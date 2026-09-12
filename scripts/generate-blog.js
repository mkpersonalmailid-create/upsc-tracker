// scripts/generate-blog.js

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'openai/gpt-oss-120b',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

/* ═══════════════════════════════════════════════════════════
   TOPICS — 60+ across 8 categories
   ═══════════════════════════════════════════════════════════ */
const TOPICS = [
  'Effective Time Management for UPSC Preparation',
  'How to Reduce Screen Time During UPSC Prep',
  'Balancing Job and UPSC Preparation',
  'Daily Study Timetable for UPSC Aspirants',
  'How to Avoid Burnout During Long UPSC Preparation',
  'Early Morning Study Routine for UPSC CSE',
  'How to Stay Consistent in UPSC Preparation',
  'Weekend Study Strategy for Working Aspirants',
  'How to Prepare Indian Polity for UPSC Prelims',
  'Best Approach to Study Modern Indian History for UPSC',
  'How to Master Geography for UPSC CSE',
  'Economics Preparation Strategy for UPSC Prelims',
  'Environment and Ecology Preparation for UPSC',
  'Science and Technology for UPSC Prelims',
  'How to Prepare International Relations for UPSC Mains',
  'Indian Society and Social Justice Preparation',
  'Internal Security Preparation Strategy for UPSC',
  'Ethics and Integrity Preparation for UPSC Mains',
  'UPSC Mains Answer Writing Tips for Beginners',
  'How to Structure UPSC Mains Answers Effectively',
  'Common Mistakes in UPSC Mains Answer Writing',
  'How to Improve Answer Writing Speed for UPSC Mains',
  'Using Diagrams in UPSC Mains Answers',
  'Essay Writing Strategy for UPSC',
  'How to Write Introductions in UPSC Mains',
  'Role of Examples in UPSC Answer Writing',
  'How to Analyze UPSC Previous Year Questions',
  'Why PYQs Are Essential for UPSC Preparation',
  'How to Use UPSC PYQs for Revision',
  'Subject-wise PYQ Analysis for UPSC Prelims',
  'Common Patterns in UPSC Prelims Questions',
  'How to Track UPSC PYQ Progress Effectively',
  'Best Books for UPSC Prelims 2026',
  'Best Books for UPSC Mains GS Papers',
  'Standard Reference Books for UPSC Preparation',
  'Free Online Resources for UPSC Aspirants',
  'How to Choose the Right UPSC Coaching',
  'Newspaper Reading Strategy for UPSC',
  'Role of Current Affairs in UPSC CSE',
  'How to Prepare Current Affairs for UPSC 2026',
  'Best Sources for UPSC Current Affairs',
  'How to Make Notes from Current Affairs',
  'Monthly Current Affairs Compilation Strategy',
  'Current Affairs Revision Techniques',
  'UPSC Optional Subject Selection Guide',
  'How to Prepare Sociology Optional for UPSC',
  'Political Science Optional Strategy for UPSC',
  'History Optional Preparation Guide',
  'Geography Optional Strategy for UPSC',
  'How to Score High in Optional Subject',
  'Importance of Revision in UPSC Preparation',
  'How to Use Mock Tests for UPSC Prelims',
  'Full-Length Test Strategy for UPSC',
  'Spaced Repetition for UPSC Revision',
  'How to Analyze Mock Test Performance',
  'Best Time to Start Mock Tests',
  'Handling Failure in UPSC Preparation',
  'How to Stay Motivated During UPSC Journey',
  'Mental Health Tips for UPSC Aspirants',
  'Dealing with Peer Pressure During UPSC Prep',
  'How to Handle Family Expectations in UPSC',
  'Building Resilience for Long UPSC Preparation',
];

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

function topicToSlug(topic) {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getUsedTopicSlugs() {
  try {
    if (!fs.existsSync('blog')) return [];
    return fs
      .readdirSync('blog')
      .filter((f) => f.endsWith('.html') && f !== 'index.html')
      .map((f) => f.replace(/-\d{8}\.html$/, '').toLowerCase());
  } catch (e) {
    console.warn('⚠️ Could not read blog folder:', e.message);
    return [];
  }
}

function getRecentBlogPosts(excludeSlug = '', limit = 3) {
  try {
    if (!fs.existsSync('blog')) return [];
    const files = fs
      .readdirSync('blog')
      .filter((f) => f.endsWith('.html') && f !== 'index.html' && !f.startsWith(excludeSlug))
      .map((f) => ({
        file: f,
        mtime: fs.statSync(path.join('blog', f)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit);

    return files.map(({ file }) => {
      try {
        const content = fs.readFileSync(path.join('blog', file), 'utf8');
        const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const title = titleMatch ? titleMatch[1].trim() : file.replace('.html', '').replace(/-/g, ' ');
        return { slug: file.replace('.html', ''), title };
      } catch (e) {
        return { slug: file.replace('.html', ''), title: file.replace('.html', '') };
      }
    });
  } catch (e) {
    return [];
  }
}

function pickTopic() {
  const usedSlugs = getUsedTopicSlugs();
  const available = TOPICS.filter((t) => !usedSlugs.includes(topicToSlug(t)));

  if (available.length > 0) {
    console.log(`📊 ${available.length}/${TOPICS.length} topics unused`);
    return available[Math.floor(Math.random() * available.length)];
  }

  console.warn('⚠️ All topics used! Restarting cycle.');
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

/* ═══════════════════════════════════════════════════════════
   SHARED NAVBAR + FOOTER + CSS
   ═══════════════════════════════════════════════════════════ */

const NAVBAR_HTML = `<nav class="navbar" id="navbar">
  <div class="nav-wrap">
    <div class="nav-inner">
      <a href="/" class="nav-logo">
        <img src="https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png" alt="UPSC Study Tracker">
        <span>UPSC Study Tracker</span>
      </a>
      <div class="nav-links">
        <a href="/#features">Features</a>
        <a href="/#how">How it works</a>
        <a href="/#pricing">Pricing</a>
        <a href="/blog/">Blog</a>
        <a href="/#faq">FAQ</a>
        <a href="/auth.html" class="nav-cta">LOGIN/SIGN UP →</a>
      </div>
    </div>
  </div>
</nav>`;

const FOOTER_HTML = `<footer>
  <div class="footer-wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png" alt="Logo">
        <p>The all-in-one study tracker for serious UPSC aspirants. Track, analyze, and crack UPSC with data.</p>
        <div class="footer-social">
          <a href="https://wa.me/?text=Check%20out%20UPSC%20Study%20Tracker%3A%20https%3A%2F%2Fupscstudytracker.co.in" target="_blank" rel="noopener" title="WhatsApp"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
          <a href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fupscstudytracker.co.in&text=Free%20UPSC%20Study%20Tracker" target="_blank" rel="noopener" title="X"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
          <a href="https://t.me/share/url?url=https%3A%2F%2Fupscstudytracker.co.in&text=Free%20UPSC%20Study%20Tracker" target="_blank" rel="noopener" title="Telegram"><svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fupscstudytracker.co.in" target="_blank" rel="noopener" title="LinkedIn"><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
          <a href="https://www.reddit.com/submit?url=https%3A%2F%2Fupscstudytracker.co.in&title=Free%20UPSC%20Study%20Tracker" target="_blank" rel="noopener" title="Reddit"><svg viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.561-1.249-1.249-1.249zm-5.466 3.321a.32.32 0 0 0-.217.062c-.005.005-.041.037-.041.074 0 .035.031.078.043.091.82.816 2.192 1.066 3.431 1.066 1.24 0 2.61-.25 3.432-1.066.012-.013.043-.056.043-.091 0-.037-.036-.069-.041-.074a.32.32 0 0 0-.217-.062.352.352 0 0 0-.143.036c-.729.329-1.585.487-2.533.487-.947 0-1.803-.158-2.533-.487a.352.352 0 0 0-.143-.036z"/></svg></a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <a href="/auth.html">App</a>
        <a href="/#features">Features</a>
        <a href="/#pricing">Pricing</a>
        <a href="/#faq">FAQ</a>
      </div>
      <div class="footer-col">
        <h4>Resources</h4>
        <a href="/blog/">Blog</a>
        <a href="/blog/">Beginner's Guide</a>
        <a href="/blog/">Book List</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="/about.html">About</a>
        <a href="/contact.html">Contact</a>
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2026 UPSC Study Tracker · Built with ❤️ for aspirants</div>
      <div>Made in India 🇮🇳</div>
    </div>
  </div>
</footer>`;

/* ═══════════════════════════════════════════════════════════
   HTML TEMPLATE
   ═══════════════════════════════════════════════════════════ */
function buildHtmlTemplate({ title, description, content, dateStr, slug, readNext }) {
  const readNextHtml =
    readNext && readNext.length
      ? `
    <div class="read-next">
      <h3 style="margin:0 0 16px;font-size:1.1rem;color:var(--text)">📚 Read Next</h3>
      <ul style="list-style:none;margin:0;padding:0">
        ${readNext.map((p) => `<li style="margin-bottom:10px"><a href="/blog/${p.slug}.html">→ ${p.title}</a></li>`).join('')}
      </ul>
    </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title} | UPSC Study Tracker Blog</title>
<meta name="description" content="${description}">
<meta name="keywords" content="upsc, upsc preparation, ${title.toLowerCase()}">
<meta name="author" content="UPSC Study Tracker">
<meta name="robots" content="index, follow">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://upscstudytracker.co.in/blog/${slug}.html">
<meta property="og:image" content="https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png">
<link rel="canonical" href="https://upscstudytracker.co.in/blog/${slug}.html">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${title}",
  "description": "${description}",
  "image": {
    "@type": "ImageObject",
    "url": "https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png",
    "width": 1200,
    "height": 630
  },
  "author": { "@type": "Organization", "name": "UPSC Study Tracker" },
  "publisher": {
    "@type": "Organization",
    "name": "UPSC Study Tracker",
    "logo": {
      "@type": "ImageObject",
      "url": "https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png"
    }
  },
  "datePublished": "${dateStr}",
  "dateModified": "${dateStr}",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://upscstudytracker.co.in/blog/${slug}.html" }
}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#08040F;--bg-2:#0F0818;--card:#141024;--card-2:#1C1630;--border:rgba(255,255,255,.06);--border-2:rgba(255,255,255,.12);--text:#FFF;--text-2:#A99BC7;--text-3:#645682;--pink:#EC4899;--purple:#A855F7;--amber:#FBBF24;--emerald:#34D399;--grad-1:linear-gradient(135deg,#8B5CF6,#EC4899)}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.75;font-size:16.5px;-webkit-font-smoothing:antialiased;overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(circle at 15% 20%,rgba(168,85,247,.12),transparent 45%),radial-gradient(circle at 85% 80%,rgba(236,72,153,.10),transparent 45%)}
a{color:var(--purple);text-decoration:none;font-weight:600}
a:hover{color:var(--pink);text-decoration:underline}
.container{max-width:780px;margin:0 auto;padding:0 20px;position:relative;z-index:1}

/* ═══ UNIFIED NAVBAR ═══ */
.navbar{position:fixed;top:0;left:0;right:0;z-index:100;padding:18px 0;background:rgba(8,4,15,.5);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border-bottom:1px solid transparent;transition:all .4s cubic-bezier(0.32,0.72,0,1)}
.navbar.scrolled{background:rgba(8,4,15,.88);border-bottom-color:var(--border);padding:12px 0;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.nav-wrap{max-width:1400px;margin:0 auto;padding:0 32px}
.nav-inner{display:flex;justify-content:space-between;align-items:center;max-width:none;padding:0}
.nav-logo{display:flex;align-items:center;gap:12px;font-weight:800;font-size:1.05rem;color:var(--text);transition:transform .3s cubic-bezier(0.34,1.56,0.64,1);text-decoration:none}
.nav-logo:hover{transform:scale(1.02)}
.nav-logo img{width:38px;height:38px;border-radius:11px;box-shadow:0 4px 14px rgba(168,85,247,.4)}
.nav-links{display:flex;align-items:center;gap:32px}
.nav-links a{font-size:.9rem;color:var(--text-2);font-weight:600;transition:color .25s;text-decoration:none;position:relative}
.nav-links a:not(.nav-cta):hover{color:var(--text)}
.nav-cta{background:var(--grad-1);color:#fff!important;padding:11px 22px;border-radius:12px;font-weight:800;font-size:.86rem;box-shadow:0 6px 20px rgba(168,85,247,.4);transition:all .3s cubic-bezier(0.34,1.56,0.64,1);text-decoration:none}
.nav-cta:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(236,72,153,.55);filter:brightness(1.08)}
@media(max-width:860px){.nav-links a:not(.nav-cta){display:none}}

/* ═══ ARTICLE ═══ */
.article{padding:150px 0 80px;position:relative;z-index:1}
.breadcrumb{font-size:.82rem;color:var(--text-3);margin-bottom:20px}
.breadcrumb a{color:var(--text-2);font-weight:500}
h1{font-size:clamp(1.9rem,4.5vw,2.8rem);font-weight:900;letter-spacing:-.03em;line-height:1.15;margin-bottom:18px;background:linear-gradient(135deg,#fff 0%,#C4B5FD 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.meta{display:flex;gap:18px;font-size:.82rem;color:var(--text-3);margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.meta span{display:inline-flex;align-items:center;gap:6px}

h2{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;margin:40px 0 16px;line-height:1.3;color:var(--text)}
h3{font-size:1.15rem;font-weight:700;margin:28px 0 12px;color:var(--text)}
p{margin-bottom:18px;color:var(--text-2);font-size:1.02rem}
ul,ol{margin:16px 0 20px 24px;color:var(--text-2)}
li{margin-bottom:10px;line-height:1.7}
strong{color:var(--text);font-weight:700}
blockquote{background:linear-gradient(135deg,rgba(168,85,247,.08),rgba(236,72,153,.05));border-left:4px solid var(--purple);padding:18px 24px;border-radius:10px;margin:24px 0;color:var(--text-2);font-style:italic}

.callout{background:linear-gradient(135deg,rgba(168,85,247,.1),rgba(236,72,153,.06));border:1px solid rgba(168,85,247,.3);border-left:4px solid var(--purple);border-radius:12px;padding:20px 24px;margin:28px 0;color:var(--text-2)}
.callout strong{color:var(--purple)}

.cta-box{background:linear-gradient(135deg,rgba(251,191,36,.12),rgba(236,72,153,.08));border:1px solid rgba(251,191,36,.35);border-radius:16px;padding:32px 28px;margin:40px 0;text-align:center}
.cta-box h3{margin:0 0 10px;font-size:1.3rem;color:var(--text)}
.cta-box p{margin-bottom:20px;color:var(--text-2)}
.cta-btn{display:inline-block;background:var(--grad-1);color:#fff;padding:14px 32px;border-radius:12px;font-weight:800;font-size:.95rem;box-shadow:0 8px 24px rgba(168,85,247,.4);transition:all .25s;text-decoration:none}
.cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(236,72,153,.5);color:#fff;text-decoration:none}

.read-next{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:24px;margin:30px 0;position:relative;z-index:1}
.read-next a{color:var(--text-2);font-weight:600;font-size:.95rem;transition:.2s}
.read-next a:hover{color:var(--purple);padding-left:4px}

.faq{margin:40px 0}
.faq-item{background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:12px;overflow:hidden;transition:.25s}
.faq-item:hover{border-color:var(--border-2)}
.faq-q{padding:18px 22px;font-weight:700;font-size:.95rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;color:var(--text);user-select:none}
.faq-q::after{content:'+';font-size:1.4rem;color:var(--text-3);transition:.3s}
.faq-item.open .faq-q::after{transform:rotate(45deg);color:var(--purple)}
.faq-a{padding:0 22px;max-height:0;overflow:hidden;transition:.3s;color:var(--text-2);font-size:.92rem}
.faq-item.open .faq-a{padding:0 22px 20px;max-height:600px}

/* ═══ UNIFIED FOOTER ═══ */
footer{padding:80px 32px 32px;border-top:1px solid var(--border);background:var(--bg-2);position:relative;z-index:1;margin-top:100px;text-align:left}
.footer-wrap{max-width:1400px;margin:0 auto}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:60px;margin-bottom:56px}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr;gap:40px}}
.footer-brand img{width:48px;height:48px;border-radius:12px;margin-bottom:16px;box-shadow:0 6px 18px rgba(168,85,247,.35)}
.footer-brand p{color:var(--text-3);font-size:.88rem;max-width:300px;line-height:1.7;margin-bottom:20px}
.footer-social{display:flex;gap:10px;flex-wrap:wrap}
.footer-social a{width:40px;height:40px;border-radius:11px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-2);transition:all .3s cubic-bezier(0.34,1.56,0.64,1);margin:0}
.footer-social a svg{width:18px;height:18px;fill:currentColor}
.footer-social a:hover{background:var(--grad-1);color:#fff;border-color:transparent;transform:translateY(-3px) scale(1.05);box-shadow:0 10px 28px rgba(168,85,247,.45)}
.footer-col h4{font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text);margin-bottom:20px}
.footer-col a{display:block;color:var(--text-3);font-size:.88rem;margin-bottom:12px;transition:all .3s;text-decoration:none}
.footer-col a:hover{color:var(--purple);transform:translateX(4px);text-decoration:none}
.footer-bottom{padding-top:32px;border-top:1px solid var(--border);text-align:center;color:var(--text-3);font-size:.83rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;align-items:center}
@media(max-width:600px){.footer-bottom{justify-content:center;text-align:center}}

@media(max-width:600px){
  body{font-size:15.5px}
  h1{font-size:1.65rem}
  h2{font-size:1.25rem}
  .article{padding:130px 0 60px}
  .cta-box{padding:24px 20px}
  .nav-cta{padding:8px 14px;font-size:.78rem}
  .read-next{padding:18px}
}
</style>
</head>
<body>

${NAVBAR_HTML}

<article class="article">
  <div class="container">
    <div class="breadcrumb">
      <a href="/">Home</a> › <a href="/blog/">Blog</a> › <span>${title}</span>
    </div>

    <h1>${title}</h1>

    <div class="meta">
      <span>📅 ${dateStr}</span>
      <span>⏱️ 8 min read</span>
      <span>✍️ UPSC Tracker Team</span>
    </div>

    ${content}

    ${readNextHtml}

    <div class="cta-box">
      <h3>🎯 Start Tracking Your UPSC Prep Today</h3>
      <p>Free UPSC Study Tracker — timer, syllabus, revisions, PYQs — all in one place.</p>
      <a href="/app.html" class="cta-btn">🚀 Start Free Now</a>
    </div>

  </div>
</article>

${FOOTER_HTML}

<script>
/* FAQ toggle */
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

/* Navbar scroll state */
(function(){
  var navbar = document.getElementById('navbar');
  if (!navbar) return;
  var ticking = false;
  window.addEventListener('scroll', function(){
    if (!ticking) {
      requestAnimationFrame(function(){
        navbar.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
</script>

</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
async function main() {
  try {
    const topic = pickTopic();
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const dateSlug = dateStr.replace(/-/g, '');
    const slug = topicToSlug(topic) + '-' + dateSlug;
    const fileName = `${slug}.html`;
    const filePath = path.join('blog', fileName);

    console.log(`📝 Topic: ${topic}`);
    console.log(`📁 Target: ${filePath}`);

    const readNext = getRecentBlogPosts(slug, 3);
    console.log(`🔗 Read Next: ${readNext.length} posts found`);

    const PROMPT = `Write a comprehensive, 1500-word blog article on the topic: "${topic}".

CRITICAL INSTRUCTIONS:
- Output ONLY the article body HTML (headings, paragraphs, lists, etc.)
- DO NOT include <!DOCTYPE>, <html>, <head>, <body>, <style>, or <script> tags
- DO NOT include inline CSS or style attributes
- DO NOT include markdown code fences

Structure your output EXACTLY like this:

<h2>Introduction</h2>
<p>Opening paragraph that hooks the reader...</p>

<h2>[Section 1 Title]</h2>
<p>Content...</p>
<ul><li>Point 1</li><li>Point 2</li></ul>

<h2>[Section 2 Title]</h2>
<p>Content...</p>

<h2>Pro Tips</h2>
<ol><li>Tip 1</li><li>Tip 2</li></ol>

<h2>Frequently Asked Questions</h2>
<div class="faq">
  <div class="faq-item">
    <div class="faq-q">Question 1?</div>
    <div class="faq-a">Answer 1.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">Question 2?</div>
    <div class="faq-a">Answer 2.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">Question 3?</div>
    <div class="faq-a">Answer 3.</div>
  </div>
</div>

<h2>Conclusion</h2>
<p>Final thoughts...</p>

RULES:
- Use natural, helpful, expert tone
- Write for serious UPSC aspirants
- Include practical, actionable advice
- Use <strong> for emphasis where important
- Total word count: 1500+
- Use <h2> for main sections, <h3> for subsections only
- Do NOT use markdown like ** or ##
- Output clean HTML only`;

    let response = null;
    let lastError = null;

    for (const model of MODELS) {
      try {
        console.log(`🔄 Trying: ${model}`);
        response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: PROMPT }],
            temperature: 0.7,
            max_tokens: 8000,
          }),
        });

        if (response.ok) {
          console.log(`✅ Success: ${model}`);
          break;
        } else {
          const errText = await response.text();
          console.log(`❌ Failed: ${response.status}`);
          lastError = `${model}: ${response.status}`;
          response = null;
        }
      } catch (e) {
        console.log(`❌ Error: ${e.message}`);
        lastError = e.message;
        response = null;
      }
    }

    if (!response || !response.ok) {
      throw new Error(`All models failed. Last: ${lastError}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    content = content
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    if (content.includes('<body')) {
      const match = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (match) content = match[1];
    }
    content = content.replace(/<head[\s\S]*?<\/head>/gi, '');
    content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
    content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
    content = content.replace(/<\/?(html|head|body)[^>]*>/gi, '');

    content += `
<div class="callout">
  <strong>💡 Pro Tip:</strong> Track your UPSC preparation with our free <a href="/app.html">UPSC Study Tracker app</a> — includes timer, syllabus tracker, revision scheduler, PYQ tracker, and more.
</div>`;

    const descMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);
    const description = descMatch
      ? descMatch[1].slice(0, 155).trim() + '...'
      : `Complete guide on ${topic} for UPSC aspirants.`;

    const finalHtml = buildHtmlTemplate({
      title: topic,
      description,
      content,
      dateStr,
      slug,
      readNext,
    });

    if (!fs.existsSync('blog')) fs.mkdirSync('blog');
    fs.writeFileSync(filePath, finalHtml, 'utf8');
    console.log(`✅ Blog post created: ${filePath}`);
    console.log(`📄 Size: ${(finalHtml.length / 1024).toFixed(1)} KB`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
