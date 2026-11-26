const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '..', 'blog');

if (!fs.existsSync(blogDir)) {
  console.error('❌ blog folder not found');
  process.exit(1);
}

const files = fs
  .readdirSync(blogDir)
  .filter((f) => f.endsWith('.html') && f !== 'index.html' && !f.startsWith('index-'));
let fixedCount = 0;

files.forEach((file) => {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Fix the rogue </div> after Pro Tip
  if (content.includes('Pro Tip:') && content.includes('</div>')) {
    // Remove trailing </div> if it's exactly at the end
    content = content.replace(/<\/div>\s*$/, '');
    changed = true;
  }

  // 2. Remove "My Personal Struggle" section and its paragraph
  const struggleRegex = /<h2>My Personal Struggle<\/h2>\s*<p>[\s\S]*?<\/p>/gi;
  if (struggleRegex.test(content)) {
    content = content.replace(struggleRegex, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\n🎉 Done! Fixed ${fixedCount} blog files.`);
