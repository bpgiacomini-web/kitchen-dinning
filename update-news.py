import json, re, html, urllib.request, time
from html.parser import HTMLParser
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

# Food remains the primary Metro Eats news category. Event/news feeds are
# deliberately separated so Bars, Comedy, and Music can populate independently.
SOURCES = [
    ("Sauce Magazine", "https://www.saucemagazine.com/", ["restaurant","food","coffee","chef","menu","dining","Alton","Metro East"], "food"),
    ("St. Louis Magazine Dining", "https://www.stlmag.com/dining/", ["restaurant","food","drink","chef","menu","dining"], "food"),
    ("The Telegraph", "https://www.thetelegraph.com/", ["restaurant","food","drink","chef","menu","dining","Alton","Edwardsville","Godfrey","Wood River"], "food"),
    ("Belleville News-Democrat", "https://www.bnd.com/news/local/", ["restaurant","food","drink","dining","breakfast","Belleville","Edwardsville"], "food"),
    ("St. Louis Business Journal Food & Lifestyle", "https://www.bizjournals.com/stlouis/news/food-and-lifestyle", ["bar","bars","brewery","pub","nightlife","cocktail","tavern","reopens","reopen","opens","opening","closes","closing"], "bars"),
    ("Explore St. Louis — Food & Drink", "https://explorestlouis.com/events/category/food-drink/", ["beer","brewery","bar","bars","cocktail","cocktails","happy hour","taproom","spirits","wine","brew","pub","tavern","nightlife","drink"], "bars"),
    ("Explore St. Louis — Comedy", "https://explorestlouis.com/events/category/comedy/", [], "comedy"),
    ("Explore St. Louis — Music", "https://explorestlouis.com/events/category/music/", [], "music"),
]

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_a = False
        self.href = ''
        self.text = []
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.in_a = True
            self.href = dict(attrs).get('href', '')
            self.text = []
    def handle_data(self, data):
        if self.in_a:
            self.text.append(data)
    def handle_endtag(self, tag):
        if tag == 'a' and self.in_a:
            t = re.sub(r'\s+', ' ', html.unescape(' '.join(self.text))).strip()
            if self.href and t:
                self.links.append((t, self.href))
            self.in_a = False


def fetch(url):
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; Metro-Eats-News-Updater/2.0; +https://bpgiacomini-web.github.io/kitchen-dinning/)'
            })
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode('utf-8', 'ignore')
        except Exception as exc:
            last = exc
            time.sleep(1 + attempt)
    raise last


def classify(title, default):
    t = title.lower()
    if re.search(r'\b(comedy|comedian|stand[- ]?up|comic)\b', t):
        return 'comedy'
    if re.search(r'\b(concert|live music|live band|musician|music festival|singer|band|dj|orchestra|symphony|jazz|blues)\b', t):
        return 'music'
    if re.search(r'\b(bar|bars|brewery|pub|tavern|cocktail|nightlife|happy hour|taproom|spirits|distill|beer|wine bar|saloon|lounge)\b', t):
        return 'bars'
    return default


def useful_event_title(title):
    bad = {
        'list', 'day', 'search', 'submit an event', 'collapse filters',
        'narrow your results', 'show only the first instance of recurring events',
        'view as', 'upcoming events', 'featured events', 'read more', 'next events'
    }
    return title.lower() not in bad and not title.lower().startswith(('monday','tuesday','wednesday','thursday','friday','saturday','sunday'))

items = []
seen_global = set()
for source, url, terms, default_cat in SOURCES:
    try:
        parser = LinkParser()
        parser.feed(fetch(url))
        count = 0
        for title, href in parser.links:
            title = re.sub(r'\s+', ' ', title).strip()
            if len(title) < 12 or len(title) > 180 or not useful_event_title(title):
                continue
            full = urljoin(url, href)
            if full.rstrip('/') == url.rstrip('/') or full in seen_global:
                continue
            low = title.lower()
            if default_cat == 'food' and terms and not any(t.lower() in low for t in terms):
                continue
            if default_cat == 'bars' and terms and not any(t.lower() in low for t in terms):
                continue
            # Event-category pages are already scoped to comedy/music; don't require
            # the word "comedy" or "music" to appear in every event title.
            category = classify(title, default_cat)
            if default_cat == 'bars' and category != 'bars':
                continue
            if default_cat == 'comedy' and category not in ('comedy',):
                # The source page is the comedy category, so keep the event even when
                # the performer's name doesn't contain the word comedy.
                category = 'comedy'
            if default_cat == 'music' and category not in ('music',):
                category = 'music'
            seen_global.add(full)
            items.append({
                'title': title,
                'source': source,
                'date': datetime.now().strftime('%B %-d, %Y'),
                'url': full,
                'category': category,
            })
            count += 1
            if count >= 12:
                break
    except Exception:
        continue

# De-duplicate by title/category, then keep food first while guaranteeing room for
# the three newer local categories whenever their sources return stories.
unique = {}
for item in items:
    key = (re.sub(r'\W+', '', item['title'].lower()), item['category'])
    unique.setdefault(key, item)
items = list(unique.values())

priority = {
    'Sauce Magazine': 0,
    'St. Louis Magazine Dining': 1,
    'The Telegraph': 2,
    'Belleville News-Democrat': 3,
    'St. Louis Business Journal Food & Lifestyle': 4,
    'Explore St. Louis — Food & Drink': 5,
    'Explore St. Louis — Comedy': 6,
    'Explore St. Louis — Music': 7,
}
cat_priority = {'food': 0, 'bars': 1, 'comedy': 2, 'music': 3}
items.sort(key=lambda x: (cat_priority.get(x['category'], 9), priority.get(x['source'], 9), x['title']))

food = [x for x in items if x['category'] == 'food'][:8]
bars = [x for x in items if x['category'] == 'bars'][:4]
comedy = [x for x in items if x['category'] == 'comedy'][:4]
music = [x for x in items if x['category'] == 'music'][:4]
items = food + bars + comedy + music

if not items:
    raise SystemExit('No stories retrieved; keeping existing news.json')

Path('news.json').write_text(
    json.dumps({'updated': datetime.now(timezone.utc).isoformat(), 'items': items}, indent=2, ensure_ascii=False),
    encoding='utf-8'
)
