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

<<<<<<< HEAD
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
=======
  // 1. Remove "My Personal Struggle" section (From h2 to next h2)
  const struggleRegex = /<h2>My Personal Struggle<\/h2>[\s\S]*?(?=<h2>|<\/article>)/gi;
  if (struggleRegex.test(content)) {
    content = content.replace(struggleRegex, '');
    changed = true;
  }

  // 2. Remove the rogue </div> tags around Pro Tip / Read Next / CTA Box
  // This finds double closing tags like </div></div> and replaces them with a single </div>
  const doubleDivRegex = /(<\/div>)\s*<\/div>\s*(?=<div class="(read-next|cta-box)">)/gi;
  if (doubleDivRegex.test(content)) {
    content = content.replace(doubleDivRegex, '$1\n');
    changed = true;
  }

  // 3. (Backup fix) specifically for the Pro tip ending
  const badProTipRegex = /(<strong>💡 Pro Tip:<\/strong>[\s\S]*?)\n\s*<\/div>\s*(?=<\/body>|<\/article>)/gi;
  if (badProTipRegex.test(content)) {
    content = content.replace(badProTipRegex, '$1');
>>>>>>> dev
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\n🎉 Done! Fixed ${fixedCount} blog files.`);
