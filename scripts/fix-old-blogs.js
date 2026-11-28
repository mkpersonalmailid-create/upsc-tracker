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
  let originalContent = content;

<<<<<<< HEAD
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
=======
  // 1. Remove "My Personal Struggle" section
  const struggleRegex =
    /<h2[^>]*>\s*My Personal Struggle\s*<\/h2>[\s\S]*?(?=<h2[^>]*>|<div class="read-next"|<div class="cta-box"|<\/article>|<\/body>)/gi;
  content = content.replace(struggleRegex, '');
>>>>>>> dev

  // 2. Remove the rogue </div> right after Pro Tip (यही कंटेनर को जल्दी बंद कर रहा था)
  content = content.replace(/(<strong>💡 Pro Tip:<\/strong>[\s\S]*?)\n\s*<\/div>/gi, '$1');

<<<<<<< HEAD
  // 3. (Backup fix) specifically for the Pro tip ending
  const badProTipRegex = /(<strong>💡 Pro Tip:<\/strong>[\s\S]*?)\n\s*<\/div>\s*(?=<\/body>|<\/article>)/gi;
  if (badProTipRegex.test(content)) {
    content = content.replace(badProTipRegex, '$1');
>>>>>>> dev
    changed = true;
  }
=======
  // 3. Remove any rogue </div> right before Read Next or CTA Box
  content = content.replace(/<\/div>\s*(?=<div class="(read-next|cta-box)">)/gi, '');
>>>>>>> dev

  // 4. Fix double closing divs before </article> and ensure Container is closed
  content = content.replace(/<\/div>\s*<\/div>\s*(?=<\/article>)/gi, '</div>\n');
  content = content.replace(/<\/article>/gi, '        </div>\n      </article>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed Layout: ${file}`);
    fixedCount++;
  }
});

console.log(`\n🎉 Done! Fixed ${fixedCount} files.`);
