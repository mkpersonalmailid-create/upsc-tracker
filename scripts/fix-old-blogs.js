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

  // 1. Remove "My Personal Struggle" section
  const struggleRegex =
    /<h2[^>]*>\s*My Personal Struggle\s*<\/h2>[\s\S]*?(?=<h2[^>]*>|<div class="read-next"|<div class="cta-box"|<\/article>|<\/body>)/gi;
  content = content.replace(struggleRegex, '');

  // 2. Remove the rogue </div> right after Pro Tip (यही कंटेनर को जल्दी बंद कर रहा था)
  content = content.replace(/(<strong>💡 Pro Tip:<\/strong>[\s\S]*?)\n\s*<\/div>/gi, '$1');

  // 3. Remove any rogue </div> right before Read Next or CTA Box
  content = content.replace(/<\/div>\s*(?=<div class="(read-next|cta-box)">)/gi, '');

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
