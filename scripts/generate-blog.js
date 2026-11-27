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
  'openai/gpt-oss-20b', // added: current Groq model, used if the older ones are retired
];

/* ═══════════════════════════════════════════════════════════
   TOPICS: library across 24 categories

   Notes:
   - Topics from the earlier version of this file are kept word for word,
     so already-published posts are still recognised by the duplicate check.
   - Every topic should answer one distinct question or learning need.
   - Avoid quotes, ampersands and apostrophes in titles (they go into
     HTML attributes and URL slugs).
   ═══════════════════════════════════════════════════════════ */
const TOPICS = [
  // ── 1. UPSC Preparation Strategy ──
  'Effective Time Management for UPSC Preparation',
  'How to Reduce Screen Time During UPSC Prep',
  'Daily Study Timetable for UPSC Aspirants',
  'Early Morning Study Routine for UPSC CSE',
  'How to Stay Consistent in UPSC Preparation',
  'Best Books for UPSC Prelims 2026',
  'Best Books for UPSC Mains GS Papers',
  'Standard Reference Books for UPSC Preparation',
  'Free Online Resources for UPSC Aspirants',
  'How to Choose the Right UPSC Coaching',
  'Understanding the UPSC Civil Services Exam Pattern and Stages',
  'How to Read the UPSC Syllabus Line by Line',
  'How to Start UPSC Preparation from Scratch',
  'How Many Hours Should You Study for UPSC',
  'Making a Realistic One Year UPSC Study Plan',
  'How to Plan the Last Three Months Before Prelims',
  'How to Divide Time Between Prelims and Mains Preparation',
  'How to Read NCERT Books Efficiently for UPSC',
  'How to Avoid Resource Hoarding in UPSC Preparation',
  'How to Set Monthly Targets and Review Your UPSC Progress',
  'How to Prepare for the UPSC Interview and Personality Test',
  'How to Fill the Detailed Application Form for the UPSC Interview',

  // ── 2. Indian Polity and Constitution ──
  'How to Prepare Indian Polity for UPSC Prelims',
  'Fundamental Rights in the Indian Constitution',
  'Directive Principles of State Policy and Fundamental Rights',
  'Fundamental Duties and Their Relevance',
  'The Preamble of the Indian Constitution Explained',
  'Basic Structure Doctrine and Landmark Supreme Court Cases',
  'How Parliament Works in India',
  'Parliamentary Committees and Their Role',
  'Powers and Limitations of the President of India',
  'Role of the Governor in the Indian States',
  'Centre State Relations in India',
  'Emergency Provisions in the Indian Constitution',
  'Constitutional Amendment Procedure Under Article 368',
  'Panchayati Raj and the 73rd Constitutional Amendment',
  'Urban Local Government and the 74th Constitutional Amendment',
  'Structure of the Indian Judiciary',
  'Judicial Review, Judicial Activism and Judicial Overreach',
  'Constitutional Bodies and Statutory Bodies Compared',
  'Election Commission of India and Electoral Reforms',
  'Anti Defection Law and the Tenth Schedule',
  'Writs in the Indian Constitution',
  'Finance Commission and Fiscal Federalism',
  'Comptroller and Auditor General of India',

  // ── 3. Modern Indian History ──
  'Best Approach to Study Modern Indian History for UPSC',
  'Revolt of 1857: Causes, Nature and Consequences',
  'Formation of the Indian National Congress and the Early Nationalists',
  'Moderates and Extremists in the Freedom Struggle',
  'Swadeshi Movement and the Partition of Bengal',
  'Gandhi in Champaran, Kheda and Ahmedabad',
  'Non Cooperation Movement and the Khilafat Issue',
  'Civil Disobedience Movement and the Dandi March',
  'Quit India Movement of 1942',
  'Constitutional Developments in British India from 1909 to 1935',
  'Cabinet Mission Plan and the Partition of India',
  'Social and Religious Reform Movements of the Nineteenth Century',

  // ── 4. Ancient and Medieval Indian History ──
  'Indus Valley Civilisation: Features and Decline',
  'Early and Later Vedic Society',
  'Mauryan Administration and Ashoka Dhamma',
  'Gupta Period: Polity, Economy and Culture',
  'Buddhism and Jainism: Origins and Teachings',
  'Chola Administration and Maritime Trade',
  'Delhi Sultanate: Dynasties and Administration',
  'Mughal Administration: Mansabdari and Land Revenue',
  'Bhakti and Sufi Movements Compared',
  'Vijayanagara Empire and the Bahmani Kingdom',

  // ── 5. Art and Culture ──
  'Indian Temple Architecture: Nagara, Dravida and Vesara Styles',
  'Classical Dances of India for UPSC',
  'Indian Painting Traditions from Mural to Miniature',
  'Buddhist Architecture: Stupas, Chaityas and Viharas',
  'Indo Islamic Architecture in India',
  'Hindustani and Carnatic Music for UPSC',
  'UNESCO World Heritage Sites in India',
  'Intangible Cultural Heritage of India',
  'Geographical Indications and Handicrafts of India',

  // ── 6. Indian Geography ──
  'How to Master Geography for UPSC CSE',
  'Physiographic Divisions of India',
  'Himalayan Rivers and Peninsular Rivers Compared',
  'Indian Monsoon: Mechanism and Onset',
  'ENSO and the Indian Ocean Dipole and Their Effect on the Monsoon',
  'Soils of India and Their Classification',
  'Natural Vegetation and Forest Types of India',
  'Seasons and Regional Climate Variations in India',
  'Mineral and Energy Resources of India',
  'Population Distribution and Census Concepts in India',
  'Industrial Regions and Location Factors in India',
  'Ports and Transport Networks of India',

  // ── 7. World Geography ──
  'Plate Tectonics, Earthquakes and Volcanoes',
  'Atmospheric Circulation, Winds and Cyclones',
  'Ocean Currents and Their Effects on Climate',
  'Climatic Regions of the World',
  'Major Mountains, Deserts and Rivers of the World',
  'How to Prepare World Geography Maps for UPSC Prelims',
  'Straits, Seas and Strategic Locations in the News',

  // ── 8. Indian Economy ──
  'Economics Preparation Strategy for UPSC Prelims',
  'Basic Macroeconomic Concepts: GDP, GNP and Growth',
  'Inflation in India: Types, Causes and Measurement',
  'Monetary Policy and the Reserve Bank of India',
  'Fiscal Policy and the Union Budget Explained',
  'Banking in India and the Problem of NPAs',
  'Financial Inclusion in India',
  'Balance of Payments and Exchange Rates',
  'Goods and Services Tax: Structure and Challenges',
  'Poverty and Unemployment Measurement in India',
  'From Planning Commission to NITI Aayog',
  'Capital Market and the Role of SEBI',
  'How to Read the Economic Survey and Union Budget for UPSC',

  // ── 9. Environment and Ecology ──
  'Environment and Ecology Preparation for UPSC',
  'Biodiversity Hotspots and Conservation Strategies',
  'Protected Areas in India: National Parks and Sanctuaries',
  'Climate Change Negotiations: UNFCCC and the Paris Agreement',
  'Types of Pollution and Control Measures in India',
  'Environmental Laws and Institutions in India',
  'How to Prepare Species in News for Prelims',
  'Ecosystems, Food Chains and Biogeochemical Cycles',
  'Wetlands and Ramsar Sites in India',
  'Environmental Impact Assessment in India',

  // ── 10. Science and Technology ──
  'Science and Technology for UPSC Prelims',
  'Space Technology and ISRO Missions for UPSC',
  'Biotechnology Basics for UPSC',
  'Defence Technology and DRDO Programmes',
  'Artificial Intelligence: Applications and Governance Issues',
  'Intellectual Property Rights in India',
  'Health and Diseases for UPSC Prelims',
  'Nuclear Energy and the Indian Nuclear Programme',

  // ── 11. International Relations ──
  'How to Prepare International Relations for UPSC Mains',
  'The Neighbourhood First Policy of India',
  'India and China Relations: Issues and Approaches',
  'India and the United States: Strategic Partnership',
  'India and Russia Relations: Past and Present',
  'Quad and the Indo Pacific Strategy',
  'BRICS, SCO and G20 and the Role of India',
  'United Nations and the Debate on Its Reform',
  'India Act East Policy and ASEAN',
  'India and West Asia: Energy, Diaspora and Strategy',
  'From Non Alignment to Multi Alignment in Indian Foreign Policy',

  // ── 12. Internal Security ──
  'Internal Security Preparation Strategy for UPSC',
  'Left Wing Extremism in India',
  'Cyber Security Challenges and the Indian Framework',
  'Border Management and Security Challenges',
  'Terrorism and Counter Terrorism Architecture in India',
  'Insurgency in North East India',
  'Money Laundering and Organised Crime',
  'Coastal and Maritime Security of India',

  // ── 13. Ethics and Integrity ──
  'Ethics and Integrity Preparation for UPSC Mains',
  'GS Paper 4 Syllabus Decoded Topic by Topic',
  'How to Approach Ethics Case Studies Step by Step',
  'Attitude, Aptitude and Emotional Intelligence',
  'Probity in Governance and Public Service Values',
  'Thinkers and Philosophers for the Ethics Paper',
  'Utilitarianism, Deontology and Virtue Ethics in Answers',

  // ── 14. Essay Writing ──
  'Essay Writing Strategy for UPSC',
  'How to Choose the Right Topic in the UPSC Essay Paper',
  'Essay Structure: Introduction, Body and Conclusion',
  'How to Write Philosophical and Abstract Essays',
  'Building a Content Bank for the UPSC Essay',
  'Time Management in the Essay Paper',

  // ── 15. Mains Answer Writing ──
  'UPSC Mains Answer Writing Tips for Beginners',
  'How to Structure UPSC Mains Answers Effectively',
  'Common Mistakes in UPSC Mains Answer Writing',
  'How to Improve Answer Writing Speed for UPSC Mains',
  'Using Diagrams in UPSC Mains Answers',
  'How to Write Introductions in UPSC Mains',
  'Role of Examples in UPSC Answer Writing',
  'How to Write Conclusions in UPSC Mains Answers',
  'Understanding Directive Words in UPSC Questions',
  'Answer Writing Differences Between GS1, GS2, GS3 and GS4',
  'Using Flowcharts and Maps in Mains Answers',
  'How to Self Evaluate Your Mains Answers',
  'Using Data and Committee Reports in Mains Answers',

  // ── 16. Current Affairs Preparation ──
  'Newspaper Reading Strategy for UPSC',
  'Role of Current Affairs in UPSC CSE',
  'How to Prepare Current Affairs for UPSC 2026',
  'Best Sources for UPSC Current Affairs',
  'How to Make Notes from Current Affairs',
  'Monthly Current Affairs Compilation Strategy',
  'Current Affairs Revision Techniques',
  'Linking the Static Syllabus with Current Affairs',
  'How to Read The Hindu Editorials for UPSC',
  'Using PIB and Government Websites for Current Affairs',
  'Reports and Indices Important for UPSC',
  'Using Yojana and Kurukshetra Effectively',

  // ── 17. UPSC Prelims Strategy ──
  'How to Analyze UPSC Previous Year Questions',
  'Why PYQs Are Essential for UPSC Preparation',
  'How to Use UPSC PYQs for Revision',
  'Subject-wise PYQ Analysis for UPSC Prelims',
  'Common Patterns in UPSC Prelims Questions',
  'How to Track UPSC PYQ Progress Effectively',
  'UPSC Prelims Exam Pattern and Cut Off Trends',
  'Elimination Techniques for Prelims MCQs',
  'Negative Marking Strategy in UPSC Prelims',
  'How to Solve Statement Based Questions in Prelims',
  'Last Month Revision Plan for UPSC Prelims',
  'Exam Day Strategy for UPSC Prelims',
  'Common Factual Traps in UPSC Prelims',

  // ── 18. CSAT Preparation ──
  'CSAT Syllabus and the Qualifying Standard',
  'CSAT Reading Comprehension Strategy',
  'CSAT Basic Numeracy and Data Interpretation',
  'Logical Reasoning and Analytical Ability in CSAT',
  'CSAT Preparation for Aspirants Without a Maths Background',

  // ── 19. Optional Subject Preparation ──
  'UPSC Optional Subject Selection Guide',
  'How to Prepare Sociology Optional for UPSC',
  'Political Science Optional Strategy for UPSC',
  'History Optional Preparation Guide',
  'Geography Optional Strategy for UPSC',
  'How to Score High in Optional Subject',
  'Public Administration Optional Strategy',
  'Anthropology Optional Preparation',
  'Philosophy Optional Preparation',
  'Law Optional Preparation for UPSC',
  'Overlap Between Optional Subjects and GS Papers',
  'How Your Educational Background Should Influence Optional Choice',

  // ── 20. Revision and Mock Tests ──
  'Importance of Revision in UPSC Preparation',
  'How to Use Mock Tests for UPSC Prelims',
  'Full-Length Test Strategy for UPSC',
  'Spaced Repetition for UPSC Revision',
  'How to Analyze Mock Test Performance',
  'Best Time to Start Mock Tests',
  'Building a Revision Cycle for the UPSC Syllabus',
  'How to Make Short Notes for Revision',
  'Active Recall Versus Re Reading',
  'How to Use a Mains Test Series',
  'Weekly Review Method for UPSC Aspirants',

  // ── 21. Working Aspirants ──
  'Balancing Job and UPSC Preparation',
  'Weekend Study Strategy for Working Aspirants',
  'Studying for UPSC After a Nine to Five Job',
  'Should You Quit Your Job for UPSC Preparation',
  'Using Commute Time for UPSC Preparation',
  'UPSC Preparation with Shift Duty Jobs',
  'Planning Leave for Prelims and Mains',
  'Managing Energy After Work Hours for UPSC Study',

  // ── 22. Mental Health and Preparation Challenges ──
  'How to Avoid Burnout During Long UPSC Preparation',
  'Handling Failure in UPSC Preparation',
  'How to Stay Motivated During UPSC Journey',
  'Mental Health Tips for UPSC Aspirants',
  'Dealing with Peer Pressure During UPSC Prep',
  'How to Handle Family Expectations in UPSC',
  'Building Resilience for Long UPSC Preparation',
  'Handling Anxiety Before UPSC Prelims',
  'Dealing with Comparison and Social Media During Preparation',
  'How to Overcome Procrastination in UPSC Preparation',
  'Sleep and Memory in UPSC Preparation',
  'Dealing with Isolation During UPSC Preparation',
  'How to Review Your Result and Plan the Next Attempt',

  // ── 23. Government Schemes and Governance ──
  'How to Study Government Schemes for UPSC',
  'E Governance and Digital India',
  'Good Governance and Citizen Charters',
  'Right to Information Act: Provisions and Limitations',
  'Role of Civil Society and NGOs in Governance',
  'Direct Benefit Transfer and the JAM Trinity',
  'Public Health System and Ayushman Bharat',
  'Welfare Schemes for Vulnerable Sections',

  // ── 24. Agriculture and Social Issues ──
  'Indian Society and Social Justice Preparation',
  'Indian Agriculture: Cropping Patterns and Irrigation',
  'Minimum Support Price and Agricultural Marketing',
  'Land Reforms in India',
  'Food Processing and Storage Challenges in India',
  'Women Empowerment and Gender Issues in India',
  'Communalism, Regionalism and Secularism in India',
  'Caste and Social Stratification in India',
  'National Education Policy 2020 and UPSC',
  'Disaster Management in India',
  'Urbanisation and Its Challenges in India',
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

/* Topic picker: only unused topics. When the library is exhausted it returns
   null and the script stops safely instead of inventing variations. */
function pickTopic() {
  // Warn about accidental duplicate topics in the library (same slug)
  const seen = new Set();
  TOPICS.forEach((t) => {
    const s = topicToSlug(t);
    if (seen.has(s)) console.warn(`⚠️ Duplicate topic slug in TOPICS: ${s}`);
    seen.add(s);
  });

  const usedSlugs = getUsedTopicSlugs();
  const available = TOPICS.filter((t) => !usedSlugs.includes(topicToSlug(t)));

  if (available.length === 0) {
    console.log(`🛑 All ${TOPICS.length} topics in the library already have a published post.`);
    console.log('   No article was generated, to avoid duplicate or low-value content.');
    console.log('   Add new, distinct topics to the TOPICS array to continue.');
    return null;
  }

  console.log(`📊 ${available.length}/${TOPICS.length} topics unused`);
  return available[Math.floor(Math.random() * available.length)];
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
   PROMPT
   ═══════════════════════════════════════════════════════════ */
function buildPrompt(topic) {
  return `You are a senior Indian UPSC educator and editorial writer for a UPSC study blog. Readers are UPSC CSE aspirants, many of them beginners and working professionals.

Write one original, accurate, useful article on: "${topic}".

VOICE
- Natural Indian English, conversational but knowledgeable, like a thoughtful senior explaining to another aspirant. Practical, honest, specific. Simple language for hard ideas.
- Vary sentence length. Paragraphs of 2 to 4 sentences. No coaching-ad tone, no motivational-speaker tone, no repeated obvious advice.
- Use Indian examples from society, governance, economy, geography, history and the exam itself. No deliberate typos or slang.

NEVER USE
- These words and phrases: delve, moreover, furthermore, crucial, testament, tapestry, game-changer, "in today's fast-paced world", "in the realm of", "unlock your potential", "it is important to note", "embark on a journey", "let's dive deep", "this comprehensive guide will explore". Do not start the conclusion with "In conclusion". Avoid stock replacements too.
- The em dash character, or an en dash used as a dash. Use commas, full stops or brackets.
- Heavy motivational language ("never give up", "believe in yourself", "chase your dreams").

NO FABRICATED EXPERIENCE
- Write in the third person or address the reader as "you". Never use "I", "my" or "me".
- Do not invent personal stories, attempts, failures, results, talks with friends or teachers, testimonials, success stories, toppers' quotes, or claims of clearing UPSC. Do not attribute quotes to anyone unless it is a famous line you are certain of.

ACCURACY (more important than length)
- Follow the real UPSC CSE syllabus and keep GS-I, II, III, IV topics separate.
- Use correct article numbers, schedules, case names, laws, institutions, committees and schemes. If unsure of a number, year or name, leave it out or stay general.
- Never invent statistics, dates, reports, scheme names or citations. No "studies show" or "according to a recent survey". No percentages about aspirants or toppers.
- For anything that changes often (notification details, cut-offs, scheme allocations, latest reports), say so and point to the official source (UPSC notification, concerned ministry, PIB).
- Mark opinion as opinion. Mention common misconceptions and limits of the topic.

BE TOPIC-SPECIFIC
Do not write generic study tips with the topic name pasted on. Match the topic type:
- Polity, governance: Articles, Parts, Schedules, amendments, landmark cases, institutions, limitations, Prelims and Mains angles.
- History: chronology, personalities, causes, events, consequences. Geography, environment: mechanisms, causes, regional examples, map points.
- Economy: clear concepts, links between them, Indian examples, who does what. Art and culture: features, regional examples, ways to tell things apart.
- Science and technology: basic idea, Indian applications, policy issues. International relations: background, interests, frameworks, balanced analysis.
- Ethics: key concepts, a step-by-step case study approach, a short worked example.
- Essay and answer writing: real structures, sample outlines or opening lines, a worked example.
- Strategy, revision, CSAT, optional, working aspirants, mental health: concrete routines, realistic schedules, trade-offs, common mistakes.
- Current affairs: how to link news to the syllabus, with one example of turning a news item into notes.

PRODUCT
The page already has a call to action. Do not name any product, brand, website or app and add no links. At most once, in plain words, you may say a study tracker or spreadsheet can help track progress.

OUTPUT FORMAT
- Output only the article body as HTML. No DOCTYPE, html, head, body, style, script or h1 tags, no markdown, no code fences, no commentary.
- Allowed tags only: h2, h3, p, ul, ol, li, strong, em, blockquote. No attributes, classes, links or images. English only.
- About 1000 to 1300 words, no filler.

REQUIRED STRUCTURE: exactly these 7 h2 headings in this order. Replace the two bracketed titles with specific headings for this topic (never "Section 1" or "Section 2").
<h2>Introduction</h2> Two short paragraphs: what the topic is, why it matters for UPSC and which stage or paper, what the reader gets. No dramatic hook.
<h2>[Relevant Section 1 Title]</h2> The core of the topic, with h3 subsections, lists or a blockquote where useful.
<h2>My Personal Struggle</h2> An empathetic editorial section on a recognisable challenge aspirants face with this topic or this part of preparation (for example, a working aspirant who struggles to stay consistent after coming home tired). Present it as a common pattern ("Many aspirants...", "Consider an aspirant who..."), never as the author's own experience. Honest and relatable, then lead to what helps. Two to four short paragraphs.
<h2>[Relevant Section 2 Title]</h2> Practical application: how to study or revise it, how to answer questions on it, a sample structure or example, common mistakes, good sources.
<h2>Pro Tips</h2> An <ol> of five to seven specific tips for this topic, one or two sentences each.
<h2>Frequently Asked Questions</h2> Exactly three real questions, each as <h3>Question?</h3> followed by <p>answer in two or three sentences</p>.
<h2>Conclusion</h2> One or two short paragraphs ending with one concrete next step. No new facts. Do not start with "In conclusion".`;
}

/* ═══════════════════════════════════════════════════════════
   CONTENT CLEANING + QUALITY CONTROL
   ═══════════════════════════════════════════════════════════ */
const MAX_ATTEMPTS = 4;

function sanitizeContent(raw) {
  let content = String(raw)
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

  // Drop any chatter the model wrote before the first heading
  const firstH2 = content.search(/<h2[\s>]/i);
  if (firstH2 > 0) content = content.slice(firstH2);

  // No em dashes (and no spaced en dashes used as dashes)
  content = content
    .replace(/\s*(?:\u2014|&mdash;|&#8212;|&#x2014;)\s*/gi, ', ')
    .replace(/\s+\u2013\s+/g, ', ')
    .replace(/,\s*,/g, ',');

  return content.trim();
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(html) {
  const t = stripTags(html);
  return t ? t.split(' ').length : 0;
}

function getSection(html, startHeading, endHeading) {
  const startTag = `<h2>${startHeading}</h2>`;
  const start = html.indexOf(startTag);
  if (start === -1) return '';
  const from = start + startTag.length;
  const end = endHeading ? html.indexOf(`<h2>${endHeading}</h2>`, from) : -1;
  return end === -1 ? html.slice(from) : html.slice(from, end);
}

const AP = "['\u2019]"; // straight or curly apostrophe

const BANNED_PHRASES = [
  /\bdelv(?:e|es|ed|ing)\b/i,
  /\bmoreover\b/i,
  /\bfurthermore\b/i,
  new RegExp(`in today${AP}?s fast[- ]paced world`, 'i'),
  /in the realm of/i,
  /unlock(?:ing)? your (?:full )?potential/i,
  /game[- ]?changer/i,
  /it is important to note/i,
  /\btapestry\b/i,
  /\btestament\b/i,
  /\bcrucial(?:ly)?\b/i,
  /embark(?:ing)? on (?:a|your|this|the) journey/i,
  new RegExp(`let${AP}?s dive`, 'i'),
  /this comprehensive guide/i,
  /comprehensive guide will/i,
  /<p>\s*in conclusion\b/i,
];

const FIRST_PERSON_PATTERNS = [
  new RegExp(`\\bI${AP}(?:m|ve|d|ll)\\b`),
  /\bI (?:am|was|have|had|will|would|think|believe|feel|felt|remember|recall|failed|cleared|studied|started|used|learned|learnt|made|saw|met|spoke|joined|gave|attempted|know|suggest|recommend|can|did|got|took|tried|realised|realized|wrote|read|prepared|appeared|scored|quit|left|cried|panicked)\b/,
  /\b(?:my|our) (?:friend|friends|mentor|teacher|teachers|coach|colleague|batchmate|roommate|senior|brother|sister|parents|first attempt|second attempt|third attempt|journey|experience|story|struggle|preparation|result|score)\b/i,
  /\bwhen I\b/,
  /\b(?:he|she|they) told me\b/i,
  /\bas an aspirant myself\b/i,
  /\bI myself\b/,
];

const UNSUPPORTED_CLAIM_CRITICAL = [
  /\b\d{1,3}\s?(?:%|percent)\s+of\s+(?:the\s+)?(?:aspirants|candidates|toppers|students|selected)/i,
  /\b(?:most|many|majority of|all)\s+(?:the\s+)?(?:toppers|rank holders|successful candidates)\s+(?:say|said|follow|swear|recommend|use)/i,
];

const UNSUPPORTED_CLAIM_WARN = [
  /\b(?:studies|research|surveys?|data|statistics)\s+(?:show|shows|have shown|suggest|suggests|indicate|indicates|reveal|reveals)\b/i,
  /\baccording to (?:a|an|one) (?:recent |latest )?(?:study|survey|report|analysis)\b/i,
];

const MOTIVATIONAL_PATTERNS = [
  /never give up/i,
  /believe in yourself/i,
  /\byour dreams?\b/i,
  /dreams? (?:big|come true)/i,
  /hard work (?:always )?pays off/i,
  /stay positive/i,
  /you(?:'|\u2019)ve got this/i,
  /keep going/i,
  /every setback/i,
  /success (?:is|comes) (?:not|to)/i,
];

const ALLOWED_TAGS = ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'br'];
const BALANCED_TAGS = ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote'];

/* Returns { critical: [...], warnings: [...] }.
   Critical problems block publishing. Warnings trigger one retry, then are logged. */
function validateArticle(content, finishReason) {
  const critical = [];
  const warnings = [];

  if (!content || !content.trim()) {
    critical.push('The article is empty.');
    return { critical, warnings };
  }

  const words = countWords(content);
  if (words < 700) {
    critical.push(`The article is too short (${words} words). Write about 1000 to 1300 words of real content.`);
  } else if (words < 900 || words > 1500) {
    warnings.push(`The article has ${words} words. Aim for 1000 to 1300 words without filler.`);
  }
  if (words > 2000) critical.push(`The article is far too long (${words} words). Aim for 1000 to 1300 words.`);

  if (finishReason === 'length') {
    critical.push('The response was cut off before the end. Write a tighter article that finishes properly.');
  }

  // Markdown, code fences, document tags
  if (/```/.test(content)) critical.push('Remove markdown code fences.');
  if (/<\/?(?:html|head|body|style|script|h1)\b|<!doctype/i.test(content)) {
    critical.push('Remove full-document tags and the h1 tag. Output only the article body.');
  }
  if (/^\s{0,3}#{1,6}\s/m.test(content) || /\*\*[^*\n]+\*\*/.test(content)) {
    critical.push('Remove markdown syntax. Use HTML tags only.');
  }
  if (/[\u0900-\u097F]/.test(content)) critical.push('Write in English only, with no Devanagari text.');

  // Tags, attributes and balance
  const tagNames = [...content.matchAll(/<\/?([a-z][a-z0-9]*)\b/gi)].map((m) => m[1].toLowerCase());
  const badTags = [...new Set(tagNames.filter((t) => !ALLOWED_TAGS.includes(t)))];
  if (badTags.length)
    critical.push(`Remove these disallowed tags: ${badTags.join(', ')}. Allowed: ${ALLOWED_TAGS.join(', ')}.`);
  if (/<[a-z][a-z0-9]*\s+[^>]*>/i.test(content)) {
    critical.push('Remove all HTML attributes, classes, links and images. Use plain tags only.');
  }
  if (/faq-item|faq-a/i.test(content)) critical.push('Do not use the faq-item or faq-a classes.');
  for (const t of BALANCED_TAGS) {
    const opens = (content.match(new RegExp(`<${t}>`, 'gi')) || []).length;
    const closes = (content.match(new RegExp(`</${t}>`, 'gi')) || []).length;
    if (opens !== closes) critical.push(`Unbalanced <${t}> tags (${opens} opening, ${closes} closing).`);
  }
  if (!/<\/(?:p|ol|ul|blockquote)>\s*$/i.test(content)) {
    critical.push('The article does not end with a complete paragraph or list.');
  }

  // Required headings, in order
  const h2s = [...content.matchAll(/<h2>([\s\S]*?)<\/h2>/gi)].map((m) => m[1].trim());
  const fixed = {
    0: 'Introduction',
    2: 'My Personal Struggle',
    4: 'Pro Tips',
    5: 'Frequently Asked Questions',
    6: 'Conclusion',
  };
  if (h2s.length !== 7) {
    critical.push(`Use exactly 7 h2 headings in the required order (found ${h2s.length}).`);
  } else {
    for (const [i, name] of Object.entries(fixed)) {
      if (h2s[i] !== name) critical.push(`h2 number ${Number(i) + 1} must be exactly "${name}" (found "${h2s[i]}").`);
    }
    for (const i of [1, 3]) {
      if (/[\[\]]|^section\b/i.test(h2s[i]) || Object.values(fixed).includes(h2s[i])) {
        critical.push(`h2 number ${i + 1} must be a specific, topic-relevant title, not a placeholder.`);
      }
    }
    if (new Set(h2s.map((h) => h.toLowerCase())).size !== h2s.length) critical.push('Two h2 headings are identical.');
  }

  // Pro tips
  const tipsSection = getSection(content, 'Pro Tips', 'Frequently Asked Questions');
  const tipCount = (tipsSection.match(/<li>/gi) || []).length;
  if (h2s.includes('Pro Tips') && tipCount < 4)
    critical.push('Pro Tips must be a list of five to seven specific tips.');

  // FAQs: exactly three h3 + p pairs
  const faqSection = getSection(content, 'Frequently Asked Questions', 'Conclusion');
  const faqH3 = (faqSection.match(/<h3>/gi) || []).length;
  const faqPairs = (faqSection.match(/<h3>[\s\S]*?<\/h3>\s*<p>[\s\S]*?<\/p>/gi) || []).length;
  if (h2s.includes('Frequently Asked Questions') && (faqH3 !== 3 || faqPairs !== 3)) {
    critical.push('The FAQ section needs exactly three questions, each an h3 followed by one p answer.');
  }

  // Conclusion present
  const conclusion = getSection(content, 'Conclusion', null);
  if (h2s.includes('Conclusion') && countWords(conclusion) < 25) {
    critical.push('The Conclusion is missing or too short.');
  }

  // Banned phrases
  const foundBanned = BANNED_PHRASES.map((re) => (content.match(re) || [null])[0]).filter(Boolean);
  if (foundBanned.length) {
    critical.push(
      `Remove these banned phrases and do not replace them with similar stock phrases: ${[...new Set(foundBanned.map((s) => s.replace(/<p>\s*/i, '').trim()))].join(', ')}.`,
    );
  }
  if (/[\u2014]|&mdash;/.test(content)) critical.push('Remove em dashes.');

  // Fake personal experience
  const personalHits = FIRST_PERSON_PATTERNS.map((re) => (content.match(re) || [null])[0]).filter(Boolean);
  if (personalHits.length) {
    critical.push(
      `Remove all first-person or invented personal experience (found: "${personalHits.slice(0, 3).join('", "')}"). Write in the third person or address the reader as "you".`,
    );
  }

  // Unsupported claims
  const claimHits = UNSUPPORTED_CLAIM_CRITICAL.map((re) => (content.match(re) || [null])[0]).filter(Boolean);
  if (claimHits.length)
    critical.push(`Remove unsupported statistics or claims about toppers and aspirants (found: "${claimHits[0]}").`);
  const warnClaims = UNSUPPORTED_CLAIM_WARN.map((re) => (content.match(re) || [null])[0]).filter(Boolean);
  if (warnClaims.length)
    warnings.push(`Avoid vague appeals to unnamed studies or surveys (found: "${warnClaims[0]}").`);
  const percentCount = (content.match(/\d\s?%/g) || []).length;
  if (percentCount > 4) warnings.push('Too many percentage figures. Keep only figures you are certain are accurate.');

  // Repeated paragraphs and sentences
  const paras = [...content.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1]).toLowerCase());
  const seenParas = new Set();
  let dupPara = false;
  for (const p of paras) {
    if (p.length > 30 && seenParas.has(p)) dupPara = true;
    seenParas.add(p);
  }
  if (dupPara) critical.push('The article repeats a paragraph. Every paragraph must be different.');
  const sentences = stripTags(content)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 50);
  if (new Set(sentences).size < sentences.length) warnings.push('Some sentences are repeated. Remove repetition.');

  // Product promotion
  const productMentions = (content.match(/study tracker|upscstudytracker|upsc tracker/gi) || []).length;
  if (productMentions > 1)
    critical.push('Do not promote any product. Mention a study tracker at most once, in plain words.');
  if (/UPSC Study Tracker/.test(content)) warnings.push('Do not use the brand name. Say "a study tracker" if needed.');
  if (
    /start free now|try (?:it )?(?:free|now)|sign up (?:for|now|today)|download (?:our|the) app|our (?:free )?(?:app|tool|platform)/i.test(
      content,
    )
  ) {
    critical.push('Remove promotional language. The page already has a call to action.');
  }

  // Style warnings
  const motivational = MOTIVATIONAL_PATTERNS.filter((re) => re.test(content)).length;
  if (motivational >= 3)
    warnings.push('Too much generic motivational language. Replace it with specific, practical content.');
  const longParas = paras.filter((p) => (p.match(/[.!?](?:\s|$)/g) || []).length > 5).length;
  if (longParas > 2) warnings.push('Several paragraphs are too long. Keep paragraphs to 2 to 4 sentences.');
  const openers = {};
  sentences.forEach((s) => {
    const k = s.split(' ').slice(0, 2).join(' ');
    openers[k] = (openers[k] || 0) + 1;
  });
  if (Object.values(openers).some((n) => n >= 5))
    warnings.push('Too many sentences start the same way. Vary the sentence openings.');

  return { critical, warnings };
}

function buildCorrection(issues) {
  return `A previous draft of this article was rejected for these problems:
${issues.map((i) => `- ${i}`).join('\n')}

Write the complete article again from the beginning. Fix every problem, keep the exact required structure, and follow all the rules above. Output only the article body HTML.`;
}

/* ═══════════════════════════════════════════════════════════
   GROQ REQUEST (same endpoint, same model fallback order)
   ═══════════════════════════════════════════════════════════ */
async function requestCompletion(messages) {
  let lastError = null;

  for (const model of MODELS) {
    try {
      console.log(`🔄 Trying: ${model}`);
      const body = {
        model: model,
        messages: messages,
        temperature: 0.7,
        // Keeps prompt + output within per-minute token limits (a 1300 word article needs about 2500 tokens)
        max_tokens: 5000,
      };
      // gpt-oss models spend tokens on reasoning; keep it low so the article is not cut off
      if (model.startsWith('openai/gpt-oss')) body.reasoning_effort = 'low';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180000),
      });

      if (!response.ok) {
        let detail = '';
        try {
          const err = await response.json();
          detail = String((err && err.error && err.error.message) || '')
            .replace(/\s+/g, ' ')
            .slice(0, 200);
        } catch (_) {
          /* ignore body parse errors */
        }
        console.log(`❌ Failed: ${response.status}${detail ? ' - ' + detail : ''}`);
        lastError = `${model}: ${response.status}`;
        continue;
      }

      const data = await response.json();
      const choice = data && data.choices && data.choices[0];
      const text = choice && choice.message && choice.message.content;
      if (typeof text !== 'string' || !text.trim()) {
        console.log(`❌ Empty response from ${model}`);
        lastError = `${model}: empty response`;
        continue;
      }

      console.log(`✅ Success: ${model}`);
      return { text, finishReason: choice.finish_reason, model };
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
      lastError = e.message;
    }
  }

  throw new Error(`All models failed. Last: ${lastError}`);
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
async function main() {
  try {
    if (!API_KEY) throw new Error('GROQ_API_KEY environment variable is not set.');

    const topic = pickTopic();
    if (!topic) return; // library exhausted: stop safely (exit code 0)

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

    const PROMPT = buildPrompt(topic);

    // Generate, check, and retry with corrective feedback if needed
    let messages = [{ role: 'user', content: PROMPT }];
    let best = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`✍️ Generation attempt ${attempt}/${MAX_ATTEMPTS}`);
      const result = await requestCompletion(messages);
      const candidate = sanitizeContent(result.text);
      const { critical, warnings } = validateArticle(candidate, result.finishReason);

      console.log(`🔎 Quality check: ${critical.length} critical, ${warnings.length} warnings`);
      critical.forEach((c) => console.log(`   ✖ ${c}`));
      warnings.forEach((w) => console.log(`   ⚠ ${w}`));

      const better =
        !best ||
        critical.length < best.critical.length ||
        (critical.length === best.critical.length && warnings.length < best.warnings.length);
      if (better) best = { content: candidate, critical, warnings };

      if (critical.length === 0 && (warnings.length === 0 || attempt >= 2)) break;

      // Resend only the prompt plus the problem list (not the old draft), to stay under token limits
      messages = [{ role: 'user', content: PROMPT + '\n\n' + buildCorrection(critical.concat(warnings)) }];
    }

    if (!best || best.critical.length > 0) {
      throw new Error(
        `Article failed quality checks after ${MAX_ATTEMPTS} attempts, so nothing was published. Remaining problems: ${
          best ? best.critical.join(' | ') : 'no usable output'
        }`,
      );
    }
    if (best.warnings.length > 0) {
      console.log('⚠️ Publishing with minor style warnings (see above).');
    }

    let content = best.content;

    // Kept from the original generator: closes the article container before Read Next / CTA.
    content += `\n\n</div>`;

    const descMatch = best.content.match(/<p[^>]*>([^<]+)<\/p>/i);
    let description = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : '';
    if (description.length > 155) {
      description =
        description
          .slice(0, 155)
          .replace(/\s+\S*$/, '')
          .trim() + '...';
    }
    if (!description) description = `Complete guide on ${topic} for UPSC aspirants.`;
    // Description goes inside HTML attributes, so escape it
    description = description.replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/"/g, '&quot;');

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
