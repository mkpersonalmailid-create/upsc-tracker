#!/usr/bin/env python3
"""
AI Outreach Bot v3 — Reddit RSS + Groq (auto model fallback)
Runs free on GitHub Actions
"""

import os
import json
import httpx
import re
import time
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET

GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

# ═══ Model Fallback List — script khud try karega ═══
GROQ_MODELS = [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'meta-llama/llama-4-maverick-17b-128e-instruct',
    'qwen/qwen3-32b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
]

# Runtime pe best model set hoga
WORKING_MODEL = None

APP_URL = 'https://upscstudytracker.co.in'
APP_DESC = 'UPSC Tracker is a free study tracking app for UPSC aspirants with timer, syllabus tracker, spaced-repetition revisions, and PYQ analytics.'

KEYWORDS = [
    'study tracker', 'preparation app', 'study timer',
    'revision app', 'syllabus tracker', 'study app',
    'productivity app', 'study plan', 'time management',
]

SUBREDDITS = ['UPSC', 'Indian_Academia', 'GetStudying', 'productivity']

REPORT_DIR = Path('outreach-reports')
REPORT_DIR.mkdir(exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml',
}

NS = {
    'atom': 'http://www.w3.org/2005/Atom',
    'media': 'http://search.yahoo.com/mrss/',
}


# ═══════════════ GROQ — Auto Model Discovery ═══════════════

def find_working_model():
    """Pehle available model list fetch karo, phir pehla working try karo"""
    global WORKING_MODEL
    if WORKING_MODEL:
        return WORKING_MODEL
    
    # Step 1: Available models list fetch karo
    available = []
    try:
        print('🔍 Fetching available Groq models...')
        r = httpx.get(
            'https://api.groq.com/openai/v1/models',
            headers={'Authorization': f'Bearer {GROQ_API_KEY}'},
            timeout=15,
        )
        if r.status_code == 200:
            data = r.json()
            available = [m['id'] for m in data.get('data', [])]
            print(f'✅ Available models ({len(available)}):')
            for m in available:
                print(f'   - {m}')
        else:
            print(f'⚠️ Could not fetch models list: {r.status_code}')
    except Exception as e:
        print(f'⚠️ Models list fetch failed: {e}')
    
    # Step 2: Pehle from available list try karo
    if available:
        for model in available:
            if test_model(model):
                WORKING_MODEL = model
                print(f'✅ Working model found: {model}\n')
                return model
    
    # Step 3: Fallback — predefined list try karo
    print('⚠️ Trying fallback model list...')
    for model in GROQ_MODELS:
        if test_model(model):
            WORKING_MODEL = model
            print(f'✅ Working model found (fallback): {model}\n')
            return model
    
    print('❌ No working model found!')
    return None


def test_model(model):
    """Test if a model works with a tiny request"""
    try:
        r = httpx.post(
            GROQ_URL,
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'model': model,
                'messages': [{'role': 'user', 'content': 'Say OK'}],
                'max_tokens': 5,
            },
            timeout=15,
        )
        if r.status_code == 200:
            data = r.json()
            return 'choices' in data
        return False
    except Exception:
        return False


def call_groq(prompt, max_tokens=500):
    """Groq API call with working model"""
    if not GROQ_API_KEY:
        return None, 'GROQ_API_KEY not set'
    
    if not WORKING_MODEL:
        return None, 'No working model'
    
    try:
        r = httpx.post(
            GROQ_URL,
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'model': WORKING_MODEL,
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': 0.7,
                'max_tokens': max_tokens,
            },
            timeout=30,
        )
        
        if r.status_code != 200:
            print(f'    Groq error {r.status_code}: {r.text[:200]}')
            return None, f'Status {r.status_code}'
        
        data = r.json()
        if 'choices' not in data:
            return None, 'No choices in response'
        
        return data['choices'][0]['message']['content'].strip(), None
    except Exception as e:
        return None, str(e)


# ═══════════════ REDDIT RSS ═══════════════

def fetch_reddit_rss(subreddit):
    """Reddit RSS feed — never blocked"""
    url = f'https://www.reddit.com/r/{subreddit}/new/.rss'
    try:
        print(f'    Fetching: {url}')
        r = httpx.get(url, headers=HEADERS, timeout=20, follow_redirects=True)
        print(f'    Status: {r.status_code}')
        
        if r.status_code != 200:
            return []
        
        root = ET.fromstring(r.text)
        posts = []
        for entry in root.findall('atom:entry', NS):
            title_el = entry.find('atom:title', NS)
            link_el = entry.find('atom:link', NS)
            content_el = entry.find('atom:content', NS)
            
            title = title_el.text if title_el is not None else ''
            link = link_el.get('href') if link_el is not None else ''
            content = content_el.text if content_el is not None else ''
            content = re.sub(r'<[^>]+>', ' ', content or '')
            content = re.sub(r'\s+', ' ', content).strip()
            
            posts.append({
                'title': title,
                'selftext': content[:500],
                'url': link,
                'score': 0,
                'num_comments': 0,
                'subreddit': subreddit,
            })
        
        print(f'    ✅ Got {len(posts)} posts')
        return posts
    except Exception as e:
        print(f'    ❌ Failed: {e}')
        return []


def score_post(post):
    """Score post relevance 0-100"""
    text = (post['title'] + ' ' + post['selftext']).lower()
    score = 0
    for kw in KEYWORDS:
        if kw.lower() in text:
            score += 30
    return min(score, 100)


# ═══════════════ AI GENERATION ═══════════════

def generate_reply(post):
    """Generate helpful reply via Groq"""
    prompt = f"""You are helping UPSC aspirants on Reddit. Reply to this post:

Title: {post['title']}
Content: {post['selftext'][:300]}

Generate a genuinely helpful reply:
1. FIRST give real value/advice (no promotion)
2. If fits naturally, mention {APP_URL} as "I built this"
3. Casual Reddit tone, under 100 words
4. If app doesn't fit naturally, just give advice without mention

Return ONLY the reply text, no explanations."""
    
    content, err = call_groq(prompt, max_tokens=300)
    if err:
        return f'[AI error: {err}]'
    return content


def find_backlink_opportunities():
    """Discover free backlink sites via Groq"""
    prompt = f"""List 10 specific FREE places to submit a UPSC study tracker app for backlinks.

App info: {APP_DESC}

Return ONLY a JSON array (no markdown, no explanation):
[
  {{"name": "Product Hunt", "url": "https://www.producthunt.com", "why": "Popular launch platform"}},
  {{"name": "AlternativeTo", "url": "https://alternativeto.net", "why": "Alternative listings"}}
]

Focus on free directories, forums, communities, subreddits, GitHub-related sites. No paid options."""
    
    content, err = call_groq(prompt, max_tokens=800)
    if err:
        print(f'    ⚠️ Failed: {err}')
        return []
    
    try:
        match = re.search(r'\[[\s\S]*\]', content)
        if match:
            return json.loads(match.group(0))
    except Exception as e:
        print(f'    JSON parse failed: {e}')
    
    return []


# ═══════════════ MAIN ═══════════════

def main():
    print('🚀 AI Outreach Bot started\n')
    
    if not GROQ_API_KEY:
        print('❌ GROQ_API_KEY not set!')
        return
    
    print(f'✅ API key loaded (length: {len(GROQ_API_KEY)})\n')
    
    # Step 1: Working model dhoondho
    model = find_working_model()
    if not model:
        print('❌ No Groq model available. Exiting.')
        return
    
    now = datetime.now().strftime('%Y-%m-%d_%H-%M')
    report = {
        'run_at': now,
        'model_used': model,
        'reddit_opportunities': [],
        'backlink_opportunities': [],
    }
    
    # ═══ STEP 1: REDDIT SCAN ═══
    print('📡 Scanning Reddit (RSS)...')
    all_posts = []
    for sub in SUBREDDITS:
        print(f'  → r/{sub}')
        posts = fetch_reddit_rss(sub)
        all_posts.extend(posts)
        time.sleep(1)
    
    print(f'\n📊 Total fetched: {len(all_posts)}\n')
    
    if all_posts:
        scored = [(score_post(p), p) for p in all_posts]
        scored = [(s, p) for s, p in scored if s >= 30]
        scored.sort(key=lambda x: x[0], reverse=True)
        top_posts = scored[:10]
        print(f'🎯 Relevant posts: {len(top_posts)}\n')
        
        for i, (score, post) in enumerate(top_posts, 1):
            print(f'  {i}. [{score}] r/{post["subreddit"]}: {post["title"][:60]}')
            reply = generate_reply(post)
            report['reddit_opportunities'].append({
                'score': score,
                'subreddit': post['subreddit'],
                'title': post['title'],
                'url': post['url'],
                'suggested_reply': reply,
            })
            time.sleep(1)
    else:
        print('⚠️ No posts fetched — Reddit may be rate-limiting')
    
    # ═══ STEP 2: BACKLINK DISCOVERY ═══
    print('\n🔗 Discovering backlink opportunities...')
    backlinks = find_backlink_opportunities()
    report['backlink_opportunities'] = backlinks
    print(f'  Found: {len(backlinks)}')
    
    # ═══ STEP 3: SAVE REPORT ═══
    report_path = REPORT_DIR / f'report-{now}.json'
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    (REPORT_DIR / 'latest.json').write_text(json.dumps(report, indent=2, ensure_ascii=False))
    
    # ═══ STEP 4: MARKDOWN SUMMARY ═══
    md = f'# 🤖 AI Outreach Report\n\n'
    md += f'**Run at:** {now}  \n'
    md += f'**Model:** {model}  \n'
    md += f'**Total fetched:** {len(all_posts)} posts\n\n'
    
    md += f'---\n\n## 📡 Reddit Opportunities ({len(report["reddit_opportunities"])})\n\n'
    if report['reddit_opportunities']:
        for i, opp in enumerate(report['reddit_opportunities'], 1):
            md += f'### {i}. [{opp["title"]}]({opp["url"]})\n\n'
            md += f'**Score:** {opp["score"]} | **r/{opp["subreddit"]}**\n\n'
            md += f'**Suggested reply:**\n\n> {opp["suggested_reply"].replace(chr(10), chr(10) + "> ")}\n\n'
            md += f'---\n\n'
    else:
        md += '_No relevant posts found. Reddit may be rate-limiting. Will retry next run._\n\n'
    
    md += f'## 🔗 Backlink Opportunities ({len(report["backlink_opportunities"])})\n\n'
    if report['backlink_opportunities']:
        for bl in report['backlink_opportunities']:
            name = bl.get('name', '?')
            url = bl.get('url', '#')
            why = bl.get('why', '')
            md += f'- **[{name}]({url})** — {why}\n'
    else:
        md += '_No backlink opportunities found._\n'
    
    md += f'\n---\n\n## 📋 Your Next Steps\n\n'
    md += f'1. Pick top 2-3 Reddit posts from above\n'
    md += f'2. **Edit the suggested reply** in your own words (do NOT copy-paste)\n'
    md += f'3. Post the reply manually on Reddit\n'
    md += f'4. Pick 1-2 backlink sites and submit your app\n'
    md += f'5. Repeat next run (tomorrow)\n'
    
    (REPORT_DIR / 'latest.md').write_text(md)
    
    print(f'\n✅ Report saved: {report_path}')
    print(f'📄 Summary: {REPORT_DIR}/latest.md')
    print(f'🎯 Model used: {model}')


if __name__ == '__main__':
    main()