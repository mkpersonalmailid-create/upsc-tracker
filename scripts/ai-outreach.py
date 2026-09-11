#!/usr/bin/env python3
"""
AI Outreach Bot — Reddit Monitor + Backlink Discovery
Runs free on GitHub Actions with Groq API
"""

import os
import json
import httpx
import re
from datetime import datetime
from pathlib import Path

GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
GROQ_MODEL = 'llama-3.1-8b-instant'  # Free tier

APP_URL = 'https://upscstudytracker.co.in'
APP_DESC = 'UPSC Tracker is a free study tracking app for UPSC aspirants with timer, syllabus tracker, spaced-repetition revisions, and PYQ analytics.'

KEYWORDS = [
    'UPSC study tracker',
    'UPSC preparation app',
    'UPSC study timer',
    'IAS preparation tool',
    'study tracker for UPSC',
    'UPSC revision app',
    'UPSC syllabus tracker',
]

SUBREDDITS = ['UPSC', 'Indian_Academia', 'GetStudying', 'productivity']

REPORT_DIR = Path('outreach-reports')
REPORT_DIR.mkdir(exist_ok=True)


def fetch_reddit_posts(subreddit, query=None):
    """Reddit public JSON API — no auth needed"""
    try:
        url = f'https://www.reddit.com/r/{subreddit}/new.json?limit=25'
        if query:
            url = f'https://www.reddit.com/r/{subreddit}/search.json?q={query}&restrict_sr=1&sort=new&limit=25'
        
        headers = {'User-Agent': 'UPSC-Tracker-Bot/1.0'}
        r = httpx.get(url, headers=headers, timeout=15)
        if r.status_code != 200:
            return []
        
        data = r.json()
        posts = []
        for p in data.get('data', {}).get('children', []):
            post = p.get('data', {})
            posts.append({
                'title': post.get('title', ''),
                'selftext': post.get('selftext', '')[:500],
                'url': f"https://reddit.com{post.get('permalink', '')}",
                'score': post.get('score', 0),
                'num_comments': post.get('num_comments', 0),
                'subreddit': subreddit,
                'created_utc': post.get('created_utc', 0),
            })
        return posts
    except Exception as e:
        print(f'  ⚠️ Reddit fetch failed for r/{subreddit}: {e}')
        return []


def score_post(post):
    """Score a post for relevance (0-100)"""
    text = (post['title'] + ' ' + post['selftext']).lower()
    score = 0
    
    for kw in KEYWORDS:
        if kw.lower() in text:
            score += 25
    
    if post['num_comments'] >= 5:
        score += 15
    if post['num_comments'] >= 20:
        score += 15
    if post['score'] >= 5:
        score += 10
    if post['score'] >= 20:
        score += 15
    
    return min(score, 100)


def generate_reply(post):
    """Use Groq to generate a helpful, human reply"""
    prompt = f"""You are helping UPSC aspirants on Reddit. Someone posted this:

Title: {post['title']}
Content: {post['selftext'][:400]}

Generate a genuinely helpful reply that:
1. First gives real value/advice (no promotion)
2. Mentions {APP_URL} only if it naturally fits — as a "I built this" mention, NOT spam
3. Uses a casual, helpful Reddit tone (not corporate)
4. Keeps it under 100 words

If mentioning the app doesn't fit naturally, just give the helpful advice without any mention.
Return ONLY the reply text, no explanations."""

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
                'max_tokens': 300,
            },
            timeout=30,
        )
        if r.status_code != 200:
            return f"[Groq error {r.status_code}]"
        
        data = r.json()
        return data['choices'][0]['message']['content'].strip()
    except Exception as e:
        return f'[Failed: {e}]'


def find_backlink_opportunities():
    """Use Groq to suggest backlink sources"""
    prompt = f"""List 10 specific FREE places to submit a UPSC study tracker app ({APP_URL}) for backlinks.

App: {APP_DESC}

Return ONLY as JSON array, each item has "name" and "url" and "why":
[
  {{"name": "Product Hunt", "url": "https://www.producthunt.com", "why": "..."}},
  ...
]

Focus on free directories, forums, subreddits, and community sites. No paid options."""

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
                'temperature': 0.5,
                'max_tokens': 800,
            },
            timeout=30,
        )
        data = r.json()
        content = data['choices'][0]['message']['content'].strip()
        
        # Extract JSON
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except Exception as e:
        print(f'  ⚠️ Backlink discovery failed: {e}')
    return []


def main():
    print('🚀 AI Outreach Bot started\n')
    now = datetime.now().strftime('%Y-%m-%d_%H-%M')
    report = {
        'run_at': now,
        'reddit_opportunities': [],
        'backlink_opportunities': [],
    }
    
    # ═══ REDDIT MONITORING ═══
    print('📡 Scanning Reddit...')
    all_posts = []
    for sub in SUBREDDITS:
        print(f'  → r/{sub}')
        posts = fetch_reddit_posts(sub)
        all_posts.extend(posts)
    
    # Score and filter
    scored = [(score_post(p), p) for p in all_posts]
    scored = [(s, p) for s, p in scored if s >= 25]
    scored.sort(key=lambda x: x[0], reverse=True)
    top_posts = scored[:10]
    
    print(f'\n🎯 Found {len(top_posts)} relevant posts\n')
    
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
    
    # ═══ BACKLINK DISCOVERY ═══
    print('\n🔗 Discovering backlink opportunities...')
    backlinks = find_backlink_opportunities()
    report['backlink_opportunities'] = backlinks
    print(f'  Found {len(backlinks)} opportunities')
    
    # ═══ SAVE REPORT ═══
    report_path = REPORT_DIR / f'report-{now}.json'
    report_path.write_text(json.dumps(report, indent=2))
    
    # Also save latest
    (REPORT_DIR / 'latest.json').write_text(json.dumps(report, indent=2))
    
    # ═══ HUMAN-READABLE SUMMARY ═══
    summary = f"""# 🤖 AI Outreach Report — {now}

## 📡 Reddit Opportunities (Top {len(report['reddit_opportunities'])})

"""
    for i, opp in enumerate(report['reddit_opportunities'], 1):
        summary += f"""### {i}. [{opp['title']}]({opp['url']})
**Score:** {opp['score']} | **r/{opp['subreddit']}**

**Suggested reply:**
> {opp['suggested_reply']}

---

"""
    
    summary += f"""## 🔗 Backlink Opportunities

"""
    for bl in report['backlink_opportunities']:
        summary += f"- **[{bl.get('name', 'Unknown')}]({bl.get('url', '#')})** — {bl.get('why', '')}\n"
    
    (REPORT_DIR / 'latest.md').write_text(summary)
    print(f'\n✅ Report saved: {report_path}')
    print(f'📄 Summary: {REPORT_DIR}/latest.md')


if __name__ == '__main__':
    if not GROQ_API_KEY:
        print('❌ GROQ_API_KEY not set')
        exit(1)
    main()