#!/usr/bin/env python3
"""
AI Outreach Bot — Reddit Monitor + Backlink Discovery
Fixed: better Reddit headers + Groq error logging
"""

import os
import json
import httpx
import re
import time
from datetime import datetime
from pathlib import Path

GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
GROQ_MODEL = 'llama-3.3-70b-versatile'  # Updated model

APP_URL = 'https://upscstudytracker.co.in'
APP_DESC = 'UPSC Tracker is a free study tracking app for UPSC aspirants with timer, syllabus tracker, spaced-repetition revisions, and PYQ analytics.'

KEYWORDS = [
    'study tracker', 'preparation app', 'study timer',
    'revision app', 'syllabus tracker', 'study app',
]

SUBREDDITS = ['UPSC', 'Indian_Academia', 'GetStudying', 'productivity']

REPORT_DIR = Path('outreach-reports')
REPORT_DIR.mkdir(exist_ok=True)

# ─── Proper Reddit Headers ───
REDDIT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
}


def fetch_reddit_posts(subreddit):
    """Reddit public JSON API with proper headers + retry"""
    urls = [
        f'https://old.reddit.com/r/{subreddit}/new.json?limit=25',
        f'https://www.reddit.com/r/{subreddit}/new.json?limit=25',
    ]
    
    for url in urls:
        try:
            print(f'    Trying: {url[:60]}...')
            r = httpx.get(url, headers=REDDIT_HEADERS, timeout=20, follow_redirects=True)
            print(f'    Status: {r.status_code}')
            
            if r.status_code != 200:
                time.sleep(2)
                continue
            
            # Check if response is actually JSON
            content_type = r.headers.get('content-type', '')
            if 'json' not in content_type.lower():
                print(f'    Not JSON, got: {content_type}')
                continue
            
            data = r.json()
            posts = []
            for p in data.get('data', {}).get('children', []):
                post = p.get('data', {})
                posts.append({
                    'title': post.get('title', ''),
                    'selftext': (post.get('selftext', '') or '')[:500],
                    'url': f"https://reddit.com{post.get('permalink', '')}",
                    'score': post.get('score', 0),
                    'num_comments': post.get('num_comments', 0),
                    'subreddit': subreddit,
                })
            print(f'    ✅ Got {len(posts)} posts from r/{subreddit}')
            return posts
        except Exception as e:
            print(f'    ❌ Failed: {e}')
            time.sleep(2)
    
    return []


def score_post(post):
    text = (post['title'] + ' ' + post['selftext']).lower()
    score = 0
    for kw in KEYWORDS:
        if kw.lower() in text:
            score += 25
    if post['num_comments'] >= 5: score += 15
    if post['num_comments'] >= 20: score += 15
    if post['score'] >= 5: score += 10
    if post['score'] >= 20: score += 15
    return min(score, 100)


def call_groq(prompt, max_tokens=500):
    """Central Groq call with proper error handling"""
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
            print(f'    Groq error body: {r.text[:300]}')
            return None, f'Status {r.status_code}: {r.text[:200]}'
        
        data = r.json()
        if 'choices' not in data:
            print(f'    Groq response missing choices: {json.dumps(data)[:300]}')
            return None, f"No choices: {json.dumps(data)[:200]}"
        
        return data['choices'][0]['message']['content'].strip(), None
    except Exception as e:
        print(f'    Groq exception: {e}')
        return None, str(e)


def generate_reply(post):
    prompt = f"""You are helping UPSC aspirants on Reddit. Reply to this post:

Title: {post['title']}
Content: {post['selftext'][:400]}

Generate a genuinely helpful reply:
1. First gives real value/advice (no promotion)
2. Mentions {APP_URL} only if it fits naturally — as "I built this", NOT spam
3. Casual Reddit tone, under 100 words
4. If app doesn't fit, just give advice without mention

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
        print(f'    ⚠️ Backlink discovery failed: {err}')
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
        print('❌ GROQ_API_KEY env variable not set!')
        print('   Add secret: GROQ_API_KEY_AI_OUTREACH')
        return
    
    print(f'✅ GROQ_API_KEY loaded (length: {len(GROQ_API_KEY)})')
    print(f'✅ Model: {GROQ_MODEL}\n')
    
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
    
    print(f'\n📊 Total posts fetched: {len(all_posts)}')
    
    if all_posts:
        scored = [(score_post(p), p) for p in all_posts]
        scored = [(s, p) for s, p in scored if s >= 25]
        scored.sort(key=lambda x: x[0], reverse=True)
        top_posts = scored[:10]
        print(f'🎯 Relevant posts (score >= 25): {len(top_posts)}\n')
        
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
    else:
        print('⚠️ No posts fetched — Reddit may be blocking GitHub IPs')
    
    # ═══ BACKLINK DISCOVERY ═══
    print('\n🔗 Discovering backlink opportunities...')
    backlinks = find_backlink_opportunities()
    report['backlink_opportunities'] = backlinks
    print(f'  Found {len(backlinks)} opportunities')
    
    # ═══ SAVE ═══
    report_path = REPORT_DIR / f'report-{now}.json'
    report_path.write_text(json.dumps(report, indent=2))
    (REPORT_DIR / 'latest.json').write_text(json.dumps(report, indent=2))
    
    # ═══ MARKDOWN SUMMARY ═══
    md = f'# 🤖 AI Outreach Report — {now}\n\n'
    
    md += f"## 📡 Reddit Opportunities ({len(report['reddit_opportunities'])})\n\n"
    if report['reddit_opportunities']:
        for i, opp in enumerate(report['reddit_opportunities'], 1):
            md += f"### {i}. [{opp['title']}]({opp['url']})\n"
            md += f"**Score:** {opp['score']} | **r/{opp['subreddit']}**\n\n"
            md += f"**Suggested reply:**\n> {opp['suggested_reply']}\n\n---\n\n"
    else:
        md += "_No relevant posts found. Reddit may be rate-limiting. Will retry next run._\n\n"
    
    md += f"## 🔗 Backlink Opportunities ({len(report['backlink_opportunities'])})\n\n"
    if report['backlink_opportunities']:
        for bl in report['backlink_opportunities']:
            md += f"- **[{bl.get('name', '?')}]({bl.get('url', '#')})** — {bl.get('why', '')}\n"
    else:
        md += "_No backlink opportunities. Check Groq API key._\n"
    
    (REPORT_DIR / 'latest.md').write_text(md)
    print(f'\n✅ Report saved: {report_path}')
    print(f'📄 Summary: {REPORT_DIR}/latest.md')


if __name__ == '__main__':
    main()