import json, re, html, urllib.request
from html.parser import HTMLParser
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

# Food is intentionally the highest-priority category. The other feeds broaden
# the local daily pulse to bars/nightlife, comedy, and live music.
SOURCES = [
    ("Sauce Magazine", "https://www.saucemagazine.com/", ["restaurant","food","coffee","bar","chef","menu","dining","drink","Alton","Metro East"], "food"),
    ("St. Louis Magazine", "https://www.stlmag.com/dining/", ["restaurant","food","drink","chef","menu","bar","dining"], "food"),
    ("The Telegraph", "https://www.thetelegraph.com/", ["restaurant","food","drink","chef","menu","bar","dining","Alton","Edwardsville","Godfrey","Wood River"], "food"),
    ("Belleville News-Democrat", "https://www.bnd.com/news/local/", ["restaurant","food","drink","dining","breakfast","Belleville","Edwardsville"], "food"),
    ("St. Louis Magazine Events", "https://www.stlmag.com/events/", ["comedy","concert","music","live music","show","festival","performance"], "events"),
    ("Riverfront Times", "https://www.riverfronttimes.com/stlouis/EventSearch", ["comedy","concert","music","live music","bar","nightlife","show"], "events"),
]

class LinkParser(HTMLParser):
    def __init__(self): super().__init__(); self.in_a=False; self.href=''; self.text=[]; self.links=[]
    def handle_starttag(self, tag, attrs):
        if tag=='a': self.in_a=True; self.href=dict(attrs).get('href',''); self.text=[]
    def handle_data(self,data):
        if self.in_a: self.text.append(data)
    def handle_endtag(self,tag):
        if tag=='a' and self.in_a:
            t=re.sub(r'\s+',' ',html.unescape(' '.join(self.text))).strip()
            if self.href and t: self.links.append((t,self.href))
            self.in_a=False

def fetch(url):
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 Metro-Eats-News-Updater/1.1'})
    with urllib.request.urlopen(req,timeout=25) as r: return r.read().decode('utf-8','ignore')

def classify(title, default):
    t=title.lower()
    if re.search(r'\b(comedy|comedian|stand[- ]?up|comic)\b',t): return 'comedy'
    if re.search(r'\b(concert|live music|live band|musician|music festival|singer|band|dj|orchestra)\b',t): return 'music'
    if re.search(r'\b(bar|brewery|pub|tavern|cocktail|nightlife|happy hour|taproom)\b',t): return 'bars'
    return default

items=[]
for source,url,terms,default_cat in SOURCES:
    try:
        parser=LinkParser(); parser.feed(fetch(url))
        seen=set(); count=0
        for title,href in parser.links:
            low=title.lower()
            if len(title)<18 or len(title)>180: continue
            if not any(t.lower() in low for t in terms): continue
            full=urljoin(url,href)
            if full in seen or full.rstrip('/')==url.rstrip('/'): continue
            seen.add(full)
            category=classify(title, 'food' if default_cat=='food' else 'music')
            items.append({'title':title,'source':source,'date':datetime.now().strftime('%B %-d, %Y'),'url':full,'category':category})
            count+=1
            if count>=8: break
    except Exception:
        continue

# Food first, then bars/comedy/music. Within each category, preserve source priority.
priority={'Sauce Magazine':0,'St. Louis Magazine':1,'The Telegraph':2,'Belleville News-Democrat':3,'St. Louis Magazine Events':4,'Riverfront Times':5}
cat_priority={'food':0,'bars':1,'comedy':2,'music':3}
items.sort(key=lambda x:(cat_priority.get(x['category'],9),priority.get(x['source'],9),x['title']))
# Keep a useful mix when event sources are available while still giving food the most room.
food=[x for x in items if x['category']=='food'][:8]
bars=[x for x in items if x['category']=='bars'][:3]
comedy=[x for x in items if x['category']=='comedy'][:3]
music=[x for x in items if x['category']=='music'][:3]
items=food+bars+comedy+music
if not items: raise SystemExit('No stories retrieved; keeping existing news.json')
Path('news.json').write_text(json.dumps({'updated':datetime.now(timezone.utc).isoformat(),'items':items},indent=2,ensure_ascii=False),encoding='utf-8')
