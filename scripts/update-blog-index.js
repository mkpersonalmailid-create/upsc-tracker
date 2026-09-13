// ═══════════════════════════════════════════════════════════════
// UPSC Tracker — Blog Index & Sitemap Updater
// ═══════════════════════════════════════════════════════════════
// Ye script:
//   1. blog/ folder scan karta hai (.html files)
//   2. index-template.html se premium design uthata hai
//   3. Blog cards generate karke index.html me daalta hai
//   4. sitemap.xml auto-update karta hai
//
// Cron me chalta hai (daily-blog.yml) after generate-blog.js
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const CONFIG = {
  blogDir: 'blog',
  indexFile: 'index.html',
  templateFile: 'index-template.html',
  sitemapFile: 'sitemap.xml',
  siteUrl: 'https://upscstudytracker.co.in',
  defaultDate: '2026-01-01',
  defaultDescription: 'Read this UPSC preparation article.',
};

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
function main() {
  console.log('🚀 Starting blog index + sitemap update...\n');

  // Step 1: Scan blog posts
  const posts = scanBlogPosts();
  console.log(`📚 Found ${posts.length} blog posts\n`);

  if (posts.length === 0) {
    console.log('⚠️  No blog posts found. Exiting.');
    return;
  }

  // Step 2: Load template
  const template = loadTemplate();

  // Step 3: Build new index.html
  const newIndex = buildIndexHtml(template, posts);

  // Step 4: Write index.html
  fs.writeFileSync(path.join(CONFIG.blogDir, CONFIG.indexFile), newIndex, 'utf8');
  console.log(`✅ Blog index updated with ${posts.length} posts`);

  // Step 5: Update sitemap.xml
  updateSitemap(posts);
  console.log(`✅ Sitemap updated with ${posts.length} blog posts`);

  console.log('\n🎉 Done!\n');
}

// ═══════════════════════════════════════════════════════════════
// STEP 1: SCAN BLOG POSTS
// ═══════════════════════════════════════════════════════════════
function scanBlogPosts() {
  const files = fs.readdirSync(CONFIG.blogDir).filter((f) => {
    // Only .html files
    if (!f.endsWith('.html')) return false;
    // Exclude main index
    if (f === CONFIG.indexFile) return false;
    // Exclude template and any index-* files
    if (f.startsWith('index-')) return false;
    // Everything else is a blog post
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

  // Sort: latest first
  posts.sort((a, b) => b.date.localeCompare(a.date));

  return posts;
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTORS
// ═══════════════════════════════════════════════════════════════

/**
 * Extract title from blog post
 * Priority: <title> tag → <h1> tag → filename
 */
function extractTitle(content, fallbackFile) {
  // Try <title> first
  let match = content.match(/<title>([^<]+)<\/title>/i);
  if (match) {
    return match[1]
      .replace(/\s*\|\s*UPSC.*$/i, '') // Remove "| UPSC Tracker..." suffix
      .replace(/\s*[-—]\s*UPSC.*$/i, '') // Remove "- UPSC..." suffix
      .trim();
  }

  // Fallback: <h1>
  match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (match) {
    return match[1].trim();
  }

  // Final fallback: filename (without .html)
  return fallbackFile.replace(/\.html$/, '').replace(/-/g, ' ');
}

/**
 * Extract description from <meta name="description">
 */
function extractDescription(content) {
  const match = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (match) {
    return match[1].slice(0, 200).trim();
  }
  return CONFIG.defaultDescription;
}

/**
 * Extract publish date
 * Priority:
 *   1. JSON-LD "datePublished"
 *   2. <meta property="article:published_time">
 *   3. First YYYY-MM-DD match in content
 *   4. Default date
 */
function extractDate(content) {
  // 1. JSON-LD datePublished (most reliable)
  let match = content.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"/i);
  if (match) return match[1];

  // 2. Meta tag
  match = content.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i);
  if (match) return match[1].slice(0, 10);

  // 3. Fallback: first YYYY-MM-DD in content
  match = content.match(/(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  // 4. Default
  return CONFIG.defaultDate;
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: LOAD TEMPLATE
// ═══════════════════════════════════════════════════════════════
function loadTemplate() {
  const templatePath = path.join(CONFIG.blogDir, CONFIG.templateFile);

  if (fs.existsSync(templatePath)) {
    console.log(`📋 Using template: ${CONFIG.templateFile}`);
    return fs.readFileSync(templatePath, 'utf8');
  }

  // Fallback: use existing index.html (works but 2nd run pe risky)
  const indexPath = path.join(CONFIG.blogDir, CONFIG.indexFile);
  if (fs.existsSync(indexPath)) {
    console.log(`⚠️  Template not found — using existing ${CONFIG.indexFile} as base`);
    console.log(`💡 Tip: Run "cp ${indexPath} ${templatePath}" to create template\n`);
    return fs.readFileSync(indexPath, 'utf8');
  }

  throw new Error(`Neither ${CONFIG.templateFile} nor ${CONFIG.indexFile} exists!`);
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: BUILD NEW INDEX HTML
// ═══════════════════════════════════════════════════════════════
function buildIndexHtml(template, posts) {
  let html = template;

  // ─── Replace hero stat count ───
  // Matches: <strong>8</strong> Articles  →  <strong>N</strong> Articles
  html = html.replace(/<strong>\d+<\/strong>\s*Articles/i, `<strong>${posts.length}</strong> Articles`);

  // ─── Replace posts count badge ───
  // Matches: <span class="posts-count">8 posts</span>  →  <span class="posts-count">N posts</span>
  html = html.replace(
    /<span\s+class="posts-count">\d+\s+posts<\/span>/i,
    `<span class="posts-count">${posts.length} posts</span>`,
  );

  // ─── Replace posts grid ───
  // Matches: <div class="posts-grid">...</div> followed by <!-- CTA Banner -->
  const cardsHtml = posts.map((post) => buildCardHtml(post)).join('\n');

  html = html.replace(
    /<div\s+class="posts-grid">[\s\S]*?<\/div>\s*(?=<!--\s*CTA Banner\s*-->)/i,
    `<div class="posts-grid">\n${cardsHtml}\n        </div>\n\n        `,
  );

  return html;
}

/**
 * Build a single premium post card HTML
 */
function buildCardHtml(post) {
  const prettyDate = formatDate(post.date);

  return `          <a href="/blog/${post.file}" class="post-card">
            <span class="post-tag">📖 UPSC</span>
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <p class="post-excerpt">${escapeHtml(post.description)}</p>
            <div class="post-footer">
              <span class="post-date">📅 ${prettyDate}</span>
              <span class="post-read"
                >Read
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </a>`;
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: UPDATE SITEMAP.XML
// ═══════════════════════════════════════════════════════════════
function updateSitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);

  // ─── Main URLs ───
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

  // ─── Blog Post URLs ───
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

  // ─── Static / Legal Pages ───
  const staticPages = `  <!-- Static Pages -->
  <url>
    <loc>${CONFIG.siteUrl}/about.html</loc>
    <lastmod>2026-09-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${CONFIG.siteUrl}/contact.html</loc>
    <lastmod>2026-09-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${CONFIG.siteUrl}/privacy.html</loc>
    <lastmod>2026-09-11</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${CONFIG.siteUrl}/terms.html</loc>
    <lastmod>2026-09-11</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`;

  // ─── Assemble Sitemap ───
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

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Format ISO date → "12 Sep 2026"
 */
function formatDate(isoDate) {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return isoDate;
  }
}

/**
 * Escape HTML entities in text
 */
function escapeHtml(str) {
  return String(str || '').replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c],
  );
}

// ═══════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════
try {
  main();
} catch (err) {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
}
