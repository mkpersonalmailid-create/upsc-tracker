// ═══════════════════════════════════════════════════════════════
// UPSC Tracker — Blog Index & Sitemap Updater
// ═══════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const CONFIG = {
  blogDir: 'blog',
  indexFile: 'index.html',
  templateFile: 'index-template.html',
  sitemapFile: 'sitemap.xml',
  siteUrl: 'https://upscstudytracker.co.in',
  defaultDate: '2026-01-01',
  defaultDescription: 'Read this UPSC preparation article.',
};

function main() {
  console.log('🚀 Starting blog index + sitemap update...\n');
  const posts = scanBlogPosts();
  console.log(`📚 Found ${posts.length} blog posts\n`);
  if (posts.length === 0) {
    console.log('⚠️  No blog posts found. Exiting.');
    return;
  }
  const template = loadTemplate();
  const newIndex = buildIndexHtml(template, posts);
  fs.writeFileSync(path.join(CONFIG.blogDir, CONFIG.indexFile), newIndex, 'utf8');
  console.log(`✅ Blog index updated with ${posts.length} posts`);
  updateSitemap(posts);
  console.log(`✅ Sitemap updated with ${posts.length} blog posts`);
  console.log('\n🎉 Done!\n');
}

function scanBlogPosts() {
  const files = fs.readdirSync(CONFIG.blogDir).filter((f) => {
    if (!f.endsWith('.html')) return false;
    if (f === CONFIG.indexFile) return false;
    if (f.startsWith('index-')) return false;
    return true;
  });

  const posts = files.map((file) => {
    const filePath = path.join(CONFIG.blogDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      file,
      title: extractTitle(content, file),
      description: extractDescription(content),
      date: extractDate(content),
    };
  });

  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

function extractTitle(content, fallbackFile) {
  let match = content.match(/<title>([^<]+)<\/title>/i);
  if (match) {
    return match[1]
      .replace(/\s*\|\s*UPSC.*$/i, '')
      .replace(/\s*[-—]\s*UPSC.*$/i, '')
      .trim();
  }
  match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (match) return match[1].trim();
  return fallbackFile.replace(/\.html$/, '').replace(/-/g, ' ');
}

function extractDescription(content) {
  const match = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (match) return match[1].slice(0, 200).trim();
  return CONFIG.defaultDescription;
}

function extractDate(content) {
  let match = content.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"/i);
  if (match) return match[1];
  match = content.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i);
  if (match) return match[1].slice(0, 10);
  match = content.match(/(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  return CONFIG.defaultDate;
}

function loadTemplate() {
  const templatePath = path.join(CONFIG.blogDir, CONFIG.templateFile);
  if (fs.existsSync(templatePath)) {
    console.log(`📋 Using template: ${CONFIG.templateFile}`);
    return fs.readFileSync(templatePath, 'utf8');
  }
  const indexPath = path.join(CONFIG.blogDir, CONFIG.indexFile);
  if (fs.existsSync(indexPath)) {
    console.log(`⚠️  Template not found — using existing ${CONFIG.indexFile} as base`);
    return fs.readFileSync(indexPath, 'utf8');
  }
  throw new Error(`Neither ${CONFIG.templateFile} nor ${CONFIG.indexFile} exists!`);
}

function buildIndexHtml(template, posts) {
  let html = template;
  html = html.replace(/<strong>\d+<\/strong>\s*Articles/i, `<strong>${posts.length}</strong> Articles`);
  html = html.replace(
    /<span\s+class="posts-count">\d+\s+posts<\/span>/i,
    `<span class="posts-count">${posts.length} posts</span>`,
  );
  const cardsHtml = posts.map((post) => buildCardHtml(post)).join('\n');
  html = html.replace(
    /<div\s+class="posts-grid">[\s\S]*?<\/div>\s*(?=<!--\s*CTA Banner\s*-->)/i,
    `<div class="posts-grid">\n${cardsHtml}\n        </div>\n\n        `,
  );
  return html;
}

// ⬇️ यहाँ class="post-card reveal" कर दिया गया है ⬇️
function buildCardHtml(post) {
  const prettyDate = formatDate(post.date);
  return `          <a href="/blog/${post.file}" class="post-card reveal">
            <span class="post-tag">📖 UPSC</span>
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <p class="post-excerpt">${escapeHtml(post.description)}</p>
            <div class="post-footer">
              <span class="post-date">📅 ${prettyDate}</span>
              <span class="post-read"
                >Read
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </a>`;
}

function updateSitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const mainUrls = `  <!-- Homepage -->
  <url>
    <loc>${CONFIG.siteUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Blog Homepage -->
  <url>
    <loc>${CONFIG.siteUrl}/blog/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

  const blogUrls = posts
    .map(
      (p) => `  <url>
    <loc>${CONFIG.siteUrl}/blog/${p.file}</loc>
    <lastmod>${p.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join('\n');

  const staticPages = `  <!-- Static Pages -->
  <url><loc>${CONFIG.siteUrl}/about.html</loc><lastmod>2026-09-11</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${CONFIG.siteUrl}/contact.html</loc><lastmod>2026-09-11</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${CONFIG.siteUrl}/privacy.html</loc><lastmod>2026-09-11</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${CONFIG.siteUrl}/terms.html</loc><lastmod>2026-09-11</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>`;

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${mainUrls}

  <!-- Blog Posts (${posts.length}) -->
${blogUrls}

${staticPages}
</urlset>
`;
  fs.writeFileSync(CONFIG.sitemapFile, sitemap, 'utf8');
}

function formatDate(isoDate) {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return isoDate;
  }
}

function escapeHtml(str) {
  return String(str || '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

try {
  main();
} catch (err) {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
}
