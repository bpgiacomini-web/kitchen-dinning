import json, re, html, urllib.request
from html.parser import HTMLParser
from datetime import datetime, timezone
from pathlib import Path

SOURCES = [
    ("Sauce Magazine", "https://www.saucemagazine.com/", ["restaurant","food","coffee","bar","chef","menu","Alton","Metro East"]),
    ("St. Louis Magazine", "https://www.stlmag.com/dining/", ["restaurant","food","drink","chef","menu","bar","dining"]),
    ("The Telegraph", "https://www.thetelegraph.com/", ["restaurant","food","drink","chef","menu","bar","dining","Alton","Edwardsville","Godfrey","Wood River"]),
    ("Belleville News-Democrat", "https://www.bnd.com/news/local/", ["restaurant","food","drink","dining","breakfast","Belleville","Edwardsville"]),
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
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 Metro-Eats-News-Updater/1.0'})
    with urllib.request.urlopen(req,timeout=25) as r: return r.read().decode('utf-8','ignore')

def absolute(base, href):
    from urllib.parse import urljoin
    return urljoin(base,href)

items=[]
for source,url,terms in SOURCES:
    try:
        parser=LinkParser(); parser.feed(fetch(url))
        seen=set()
        for title,href in parser.links:
            low=title.lower()
            if len(title)<18 or len(title)>180: continue
            if not any(t.lower() in low for t in terms): continue
            full=absolute(url,href)
            if full in seen or full.rstrip('/')==url.rstrip('/'): continue
            seen.add(full)
            items.append({'title':title,'source':source,'date':datetime.now().strftime('%B %-d, %Y'),'url':full})
            if sum(1 for x in items if x['source']==source)>=6: break
    except Exception:
        continue

# Prefer Sauce and St. Louis Magazine, then Metro East sources.
priority={'Sauce Magazine':0,'St. Louis Magazine':1,'The Telegraph':2,'Belleville News-Democrat':3}
items.sort(key=lambda x:(priority.get(x['source'],9),x['title']))
items=items[:12]
if not items: raise SystemExit('No stories retrieved; keeping existing news.json')
Path('news.json').write_text(json.dumps({'updated':datetime.now(timezone.utc).isoformat(),'items':items},indent=2),encoding='utf-8')
