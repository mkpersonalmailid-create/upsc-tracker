// scripts/generate-blog.js

const fs = require('fs');
const path = require('path');

// ---------- CONFIG ----------
const API_KEY = process.env.GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Daily blog topics — inme se random topic uthayega
const TOPICS = [
  'Effective Time Management for UPSC Preparation',
  'How to Analyze UPSC Previous Year Questions',
  'Best Books for UPSC Prelims 2026',
  'UPSC Mains Answer Writing Tips for Beginners',
  'How to Stay Consistent in UPSC Preparation',
  'Role of Current Affairs in UPSC CSE',
  'UPSC Optional Subject Selection Guide',
  'How to Reduce Screen Time During UPSC Prep',
  'Importance of Revision in UPSC Preparation',
  'Balancing Job and UPSC Preparation'
];

async function main() {
  try {
    // 1. Random topic select karo
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    
    // 2. Date nikalo
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateSlug = dateStr.replace(/-/g, ''); // YYYYMMDD
    
    // 3. File ka naam banao
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const fileName = `${slug}-${dateSlug}.html`;
    const filePath = path.join('blog', fileName);
    
    // 4. AI ko prompt bhejo
    const PROMPT = `Write a comprehensive, 1500-word blog post in English on the topic "${topic}".

IMPORTANT REQUIREMENTS:
- Output must be a complete, single HTML file with proper DOCTYPE, head, body
- Use inline CSS for styling (dark theme: background #0A0612, text #FFFFFF, accent #A855F7)
- Include proper SEO meta tags (title, description, keywords)
- Target keyword: "${topic}"
- Use heading structure: H1, H2, H3
- Include an FAQ section with 4-5 questions
- Add internal links to https://upscstudytracker.co.in and https://upscstudytracker.co.in/app.html
- Add 2 CTA boxes promoting the UPSC Study Tracker app
- Add breadcrumb navigation: Home > Blog > ${topic}
- Include author meta, date, reading time
- Make it mobile responsive
- Add structured data (JSON-LD BlogPosting schema)

Write in natural, helpful tone. Do not include markdown code fences. Output ONLY the HTML.`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: PROMPT }],
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    let blogHtml = data.choices[0].message.content;
    
    // Agar AI ne markdown code fences lagaye toh hata do
    blogHtml = blogHtml.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    
    // 5. Blog folder exists check
    if (!fs.existsSync('blog')) {
      fs.mkdirSync('blog');
    }
    
    // 6. File save karo
    fs.writeFileSync(filePath, blogHtml, 'utf8');
    console.log(`✅ Blog post created: ${filePath}`);
    console.log(`📝 Topic: ${topic}`);
    
  } catch (error) {
    console.error('❌ Error generating blog post:', error.message);
    process.exit(1);
  }
}

main();