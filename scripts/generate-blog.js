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
  'gemma2-9b-it'
];

/* ═══════════════════════════════════════════════════════════
   TOPICS — 60+ across 8 categories
   ═══════════════════════════════════════════════════════════ */
const TOPICS = [
  // ── Time Management (8) ──
  'Effective Time Management for UPSC Preparation',
  'How to Reduce Screen Time During UPSC Prep',
  'Balancing Job and UPSC Preparation',
  'Daily Study Timetable for UPSC Aspirants',
  'How to Avoid Burnout During Long UPSC Preparation',
  'Early Morning Study Routine for UPSC CSE',
  'How to Stay Consistent in UPSC Preparation',
  'Weekend Study Strategy for Working Aspirants',

  // ── Subject-wise Strategy (10) ──
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

  // ── Answer Writing (8) ──
  'UPSC Mains Answer Writing Tips for Beginners',
  'How to Structure UPSC Mains Answers Effectively',
  'Common Mistakes in UPSC Mains Answer Writing',
  'How to Improve Answer Writing Speed for UPSC Mains',
  'Using Diagrams in UPSC Mains Answers',
  'Essay Writing Strategy for UPSC',
  'How to Write Introductions in UPSC Mains',
  'Role of Examples in UPSC Answer Writing',

  // ── PYQ & Analysis (6) ──
  'How to Analyze UPSC Previous Year Questions',
  'Why PYQs Are Essential for UPSC Preparation',
  'How to Use UPSC PYQs for Revision',
  'Subject-wise PYQ Analysis for UPSC Prelims',
  'Common Patterns in UPSC Prelims Questions',
  'How to Track UPSC PYQ Progress Effectively',

  // ── Books & Resources (6) ──
  'Best Books for UPSC Prelims 2026',
  'Best Books for UPSC Mains GS Papers',
  'Standard Reference Books for UPSC Preparation',
  'Free Online Resources for UPSC Aspirants',
  'How to Choose the Right UPSC Coaching',
  'Newspaper Reading Strategy for UPSC',

  // ── Current Affairs (6) ──
  'Role of Current Affairs in UPSC CSE',
  'How to Prepare Current Affairs for UPSC 2026',
  'Best Sources for UPSC Current Affairs',
  'How to Make Notes from Current Affairs',
  'Monthly Current Affairs Compilation Strategy',
  'Current Affairs Revision Techniques',

  // ── Optional Subject (6) ──
  'UPSC Optional Subject Selection Guide',
  'How to Prepare Sociology Optional for UPSC',
  'Political Science Optional Strategy for UPSC',
  'History Optional Preparation Guide',
  'Geography Optional Strategy for UPSC',
  'How to Score High in Optional Subject',

  // ── Mock Tests & Revision (6) ──
  'Importance of Revision in UPSC Preparation',
  'How to Use Mock Tests for UPSC Prelims',
  'Full-Length Test Strategy for UPSC',
  'Spaced Repetition for UPSC Revision',
  'How to Analyze Mock Test Performance',
  'Best Time to Start Mock Tests',

  // ── Mental Health & Motivation (6) ──
  'Handling Failure in UPSC Preparation',
  'How to Stay Motivated During UPSC Journey',
  'Mental Health Tips for UPSC Aspirants',
  'Dealing with Peer Pressure During UPSC Prep',
  'How to Handle Family Expectations in UPSC',
  'Building Resilience for Long UPSC Preparation'
];

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

// Convert topic string to slug
function topicToSlug(topic) {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Get list of used topic slugs from existing blog posts
function getUsedTopicSlugs() {
  try {
    if (!fs.existsSync('blog')) return [];
    return fs.readdirSync('blog')
      .filter(f => f.endsWith('.html') && f !== 'index.html')
      .map(f => f.replace(/-\d{8}\.html$/, '').toLowerCase());
  } catch (e) {
    console.warn('⚠️ Could not read blog folder:', e.message);
    return [];
  }
}

// Get recent blog posts for "Read Next" section
function getRecentBlogPosts(excludeSlug = '', limit = 3) {
  try {
    if (!fs.existsSync('blog')) return [];
    const files = fs.readdirSync('blog')
      .filter(f => f.endsWith('.html') && f !== 'index.html' && !f.startsWith(excludeSlug))
      .map(f => ({
        file: f,
        mtime: fs.statSync(path.join('blog', f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit);

    return files.map(({ file }) => {
      try {
        const content = fs.readFileSync(path.join('blog', file), 'utf8');
        const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const title = titleMatch
          ? titleMatch[1].trim()
          : file.replace('.html', '').replace(/-/g, ' ');
        return { slug: file.replace('.html', ''), title };
      } catch (e) {
        return { slug: file.replace('.html', ''), title: file.replace('.html', '') };
      }
    });
  } catch (e) {
    return [];
  }
}

// Choose best topic (unused preferred)
function pickTopic() {
  const usedSlugs = getUsedTopicSlugs();
  const available = TOPICS.filter(t => !usedSlugs.includes(topicToSlug(t)));

  if (available.length > 0) {
    console.log(`📊 ${available.length}/${TOPICS.length} topics unused`);
    return available[Math.floor(Math.random() * available.length)];
  }

  console.warn('⚠️ All topics used! Restarting cycle.');
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

/* ═══════════════════════════════════════════════════════════
   HTML TEMPLATE
   ═══════════════════════════════════════════════════════════ */
function buildHtmlTemplate({ title, description, content, dateStr, slug, readNext }) {
  const readNextHtml = (readNext && readNext.length)
    ? `
    <div class="read-next">
      <h3 style="margin:0 0 16px;font-size:1.1rem;color:var(--text)">📚 Read Next</h3>
      <ul style="list-style:none;margin:0;padding:0">
        ${readNext.map(p => `<li style="margin-bottom:10px"><a href="/blog/${p.slug}.html">→ ${p.title}</a></li>`).join('')}
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
<link rel="icon" href="https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png">
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
:root{--bg:#0A0612;--bg-2:#120A1E;--card:#171026;--card-2:#1F1633;--border:#2A1E42;--border-2:#3D2C5E;--text:#FFF;--text-2:#B8A8D9;--text-3:#6E5F8C;--pink:#EC4899;--purple:#A855F7;--amber:#FBBF24;--emerald:#34D399;--grad-1:linear-gradient(135deg,#8B5CF6,#EC4899)}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.75;font-size:16.5px;-webkit-font-smoothing:antialiased;overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(circle at 15% 20%,rgba(168,85,247,.12),transparent 45%),radial-gradient(circle at 85% 80%,rgba(236,72,153,.10),transparent 45%)}
a{color:var(--purple);text-decoration:none;font-weight:600}
a:hover{color:var(--pink);text-decoration:underline}
.container{max-width:780px;margin:0 auto;padding:0 20px;position:relative;z-index:1}

.navbar{padding:16px 0;border-bottom:1px solid var(--border);background:rgba(10,6,18,.85);backdrop-filter:blur(20px);position:sticky;top:0;z-index:100}
.nav-inner{display:flex;justify-content:space-between;align-items:center;max-width:1100px;margin:0 auto;padding:0 20px}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;color:var(--text);font-size:1.05rem}
.logo img{width:36px;height:36px;border-radius:9px}
.nav-cta{background:var(--grad-1);color:#fff!important;padding:10px 20px;border-radius:10px;font-weight:800;font-size:.85rem;box-shadow:0 4px 14px rgba(168,85,247,.4)}

.article{padding:50px 0 80px;position:relative;z-index:1}
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

footer{border-top:1px solid var(--border);padding:40px 0;text-align:center;color:var(--text-3);font-size:.85rem;background:var(--bg-2);position:relative;z-index:1;margin-top:60px}
footer a{color:var(--text-2);margin:0 8px}

@media(max-width:600px){
  body{font-size:15.5px}
  h1{font-size:1.65rem}
  h2{font-size:1.25rem}
  .article{padding:30px 0 60px}
  .cta-box{padding:24px 20px}
  .nav-cta{padding:8px 14px;font-size:.78rem}
  .read-next{padding:18px}
}
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

<footer>
  <div class="container">
    <p>© 2026 UPSC Study Tracker · <a href="/">Home</a> · <a href="/blog/">Blog</a> · <a href="/app.html">App</a></p>
  </div>
</footer>

<script>
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});
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

    // Read recent posts for "Read Next" section
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
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: PROMPT }],
            temperature: 0.7,
            max_tokens: 8000
          })
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

    // Markdown fences hatao
    content = content.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    // Agar AI ne galti se full HTML de diya, to body nikaalo
    if (content.includes('<body')) {
      const match = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (match) content = match[1];
    }
    // Head/style/script tags hatao agar hain
    content = content.replace(/<head[\s\S]*?<\/head>/gi, '');
    content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
    content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
    content = content.replace(/<\/?(html|head|body)[^>]*>/gi, '');

    // Auto internal linking — homepage link add karo end me
    content += `
<div class="callout">
  <strong>💡 Pro Tip:</strong> Track your UPSC preparation with our free <a href="/app.html">UPSC Study Tracker app</a> — includes timer, syllabus tracker, revision scheduler, PYQ tracker, and more.
</div>`;

    // Description banao (first paragraph se)
    const descMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);
    const description = descMatch
      ? descMatch[1].slice(0, 155).trim() + '...'
      : `Complete guide on ${topic} for UPSC aspirants.`;

    // Template me wrap karo
    const finalHtml = buildHtmlTemplate({
      title: topic,
      description,
      content,
      dateStr,
      slug,
      readNext
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