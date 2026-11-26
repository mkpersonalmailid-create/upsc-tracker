const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '..', 'blog');

const files = fs
  .readdirSync(blogDir)
  .filter((f) => f.endsWith('.html') && f !== 'index.html' && !f.startsWith('index-'));
let fixedCount = 0;

files.forEach((file) => {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Remove "My Personal Struggle" and everything until next H2 or Read Next/CTA
  if (content.includes('My Personal Struggle')) {
    const regex =
      /<h2[^>]*>\s*My Personal Struggle\s*<\/h2>[\s\S]*?(?=<h2|<\/article>|<div class="read-next">|<div class="cta-box">)/gi;
    if (regex.test(content)) {
      content = content.replace(regex, '');
      changed = true;
    }
  }

  // 2. Fix double </div> (The Layout breaker)
  // It specifically looks for two closing divs right before Read Next, CTA box, or Article end
  const rogueDivRegex = /<\/div>\s*<\/div>\s*(?=<div class="(read-next|cta-box)">|<\/article>)/gi;
  if (rogueDivRegex.test(content)) {
    content = content.replace(rogueDivRegex, '</div>\n');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Locally Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\n🎉 Done! Fixed ${fixedCount} files locally.`);
