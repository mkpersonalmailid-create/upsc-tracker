#!/usr/bin/env python3
"""
AI Outreach Bot v2 — RSS-based Reddit + Groq (free tier)
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
GROQ_MODEL = 'llama-3.1-8b-instant'  # Free tier

APP_URL = 'https://upscstudytracker.co.in'
APP_DESC = 'UPSC Tracker is a free study tracking app for UPSC aspirants with timer, syllabus tracker, spaced-repetition revisions, and PYQ analytics.'

KEYWORDS = [
    'study tracker', 'preparation app', 'study timer',
    'revision app', 'syllabus tracker', 'study app',
    'productivity app', 'study plan',
]

SUBREDDITS = ['UPSC', 'Indian_Academia', 'GetStudying', 'productivity']

REPORT_DIR = Path('outreach-reports')
REPORT_DIR.mkdir(exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml',
}

# RSS namespace
NS = {
    'atom': 'http://www.w3.org/2005/Atom',
    'media': 'http://search.yahoo.com/mrss/',
}


def fetch_reddit_rss(subreddit):
    """Fetch via RSS — never blocked"""
    url = f'https://www.reddit.com/r/{subreddit}/new/.rss'
    try:
        print(f'    Fetching RSS: {url}')
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
            updated_el = entry.find('atom:updated', NS)
            
            title = title_el.text if title_el is not None else ''
            link = link_el.get('href') if link_el is not None else ''
            content = content_el.text if content_el is not None else ''
            # Strip HTML tags from content
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
        
        print(f'    ✅ Got {len(posts)} posts from r/{subreddit}')
        return posts
    except Exception as e:
        print(f'    ❌ Failed: {e}')
        return []


def score_post(post):
    text = (post['title'] + ' ' + post['selftext']).lower()
    score = 0
    for kw in KEYWORDS:
        if kw.lower() in text:
            score += 30
    return min(score, 100)


def call_groq(prompt, max_tokens=500):
    if not GROQ_API_KEY:
        return None, 'GROQ_API_KEY not set'
    
    try:
        r = httpx.post(
            GROQ_URL,
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'model': GROQ_MODEL,
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': 0.7,
                'max_tokens': max_tokens,
            },
            timeout=30,
        )
        
        print(f'    Groq status: {r.status_code}')
        
        if r.status_code != 200:
            print(f'    Error: {r.text[:300]}')
            return None, f'Status {r.status_code}'
        
        data = r.json()
        if 'choices' not in data:
            return None, 'No choices in response'
        
        return data['choices'][0]['message']['content'].strip(), None
    except Exception as e:
        return None, str(e)


def generate_reply(post):
    prompt = f"""You are helping UPSC aspirants on Reddit. Reply to:

Title: {post['title']}
Content: {post['selftext'][:300]}

Generate a helpful reply:
1. First give real value/advice (no promotion)
2. If fits naturally, mention {APP_URL} as "I built this"
3. Casual Reddit tone, under 100 words
4. If app doesn't fit, just advice

Return ONLY the reply text."""
    
    content, err = call_groq(prompt, max_tokens=300)
    if err:
        return f'[Error: {err}]'
    return content


def find_backlink_opportunities():
    prompt = f"""List 10 FREE places to submit a UPSC study tracker app for backlinks.

App: {APP_DESC}

Return ONLY JSON array:
[{{"name": "Product Hunt", "url": "https://...", "why": "..."}}]

Focus on free directories, forums, communities. No paid options."""
    
    content, err = call_groq(prompt, max_tokens=800)
    if err:
        print(f'    ⚠️ Failed: {err}')
        return []
    
    try:
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except Exception as e:
        print(f'    JSON parse failed: {e}')
    return []


def main():
    print('🚀 AI Outreach Bot started\n')
    
    if not GROQ_API_KEY:
        print('❌ GROQ_API_KEY not set!')
        return
    
    print(f'✅ API key loaded (length: {len(GROQ_API_KEY)})')
    print(f'✅ Model: {GROQ_MODEL}\n')
    
    now = datetime.now().strftime('%Y-%m-%d_%H-%M')
    report = {
        'run_at': now,
        'reddit_opportunities': [],
        'backlink_opportunities': [],
    }
    
    # ═══ REDDIT ═══
    print('📡 Scanning Reddit (RSS)...')
    all_posts = []
    for sub in SUBREDDITS:
        print(f'  → r/{sub}')
        posts = fetch_reddit_rss(sub)
        all_posts.extend(posts)
        time.sleep(1)  # polite delay
    
    print(f'\n📊 Total fetched: {len(all_posts)}')
    
    if all_posts:
        scored = [(score_post(p), p) for p in all_posts]
        scored = [(s, p) for s, p in scored if s >= 30]
        scored.sort(key=lambda x: x[0], reverse=True)
        top_posts = scored[:10]
        print(f'🎯 Relevant posts: {len(top_posts)}\n')
        
        for score, post in top_posts:
            print(f'  [{score}] r/{post["subreddit"]}: {post["title"][:60]}')
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
        print('⚠️ No posts fetched')
    
    # ═══ BACKLINKS ═══
    print('\n🔗 Discovering backlinks...')
    backlinks = find_backlink_opportunities()
    report['backlink_opportunities'] = backlinks
    print(f'  Found {len(backlinks)}')
    
    # ═══ SAVE ═══
    report_path = REPORT_DIR / f'report-{now}.json'
    report_path.write_text(json.dumps(report, indent=2))
    (REPORT_DIR / 'latest.json').write_text(json.dumps(report, indent=2))
    
    md = f'# 🤖 AI Outreach Report — {now}\n\n'
    md += f"## 📡 Reddit Opportunities ({len(report['reddit_opportunities'])})\n\n"
    if report['reddit_opportunities']:
        for i, opp in enumerate(report['reddit_opportunities'], 1):
            md += f"### {i}. [{opp['title']}]({opp['url']})\n"
            md += f"**Score:** {opp['score']} | **r/{opp['subreddit']}**\n\n"
            md += f"**Suggested reply:**\n> {opp['suggested_reply']}\n\n---\n\n"
    else:
        md += "_No relevant posts._\n\n"
    
    md += f"## 🔗 Backlink Opportunities ({len(report['backlink_opportunities'])})\n\n"
    if report['backlink_opportunities']:
        for bl in report['backlink_opportunities']:
            md += f"- **[{bl.get('name','?')}]({bl.get('url','#')})** — {bl.get('why','')}\n"
    else:
        md += "_None found._\n"
    
    (REPORT_DIR / 'latest.md').write_text(md)
    print(f'\n✅ Report saved: {report_path}')
    print(f'📄 Summary: {REPORT_DIR}/latest.md')


if __name__ == '__main__':
    main()