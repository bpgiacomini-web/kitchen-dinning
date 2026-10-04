import datetime as dt
import email.utils
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "news.json"

QUERIES = [
    "St. Louis restaurant dining food when:7d",
    "Alton Illinois restaurant dining food when:7d",
    "Metro East Illinois restaurant food dining when:7d",
]
ALLOWED_SOURCES = {
    "Sauce Magazine",
    "St. Louis Magazine",
    "The Telegraph",
    "Belleville News-Democrat",
    "EdGlenToday",
    "RiverBender",
    "St. Louis Business Journal",
}
FOOD_TERMS = re.compile(
    r"\b(restaurant|restaurants|dining|food|drink|bar|bars|brewery|breweries|brewpub|"
    r"cafe|coffee|chef|menu|menus|pizza|burger|burgers|breakfast|brunch|chicken|bbq|"
    r"barbecue|dessert|ice\s*cream|taco|tacos|steak|seafood|bakery|culinary|eatery|"
    r"opens|opening|closes|closing|reopens|reopen|food\s*truck|hospitality|wine|"
    r"cocktail|cocktails|bloody\s*mary|tasting|food\s*event)\b", re.I
)
BAD_TERMS = re.compile(
    r"\b(chicago|springfield|peoria|rockford|champaign|urbana|naperville|joliet|"
    r"quad\s*cities|carbondale|decatur|indianapolis|kansas\s*city|nashville|"
    r"new\s*york|los\s*angeles|miami|denver|seattle|portland|national|nationwide|"
    r"travel|vacation|cruise|disney)\b", re.I
)

def fetch_feed(query):
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({
        "q": query, "hl": "en-US", "gl": "US", "ceid": "US:en"
    })
    req = urllib.request.Request(url, headers={"User-Agent": "Metro-Eats-News-Updater/1.0"})
    with urllib.request.urlopen(req, timeout=20) as response:
        return ET.fromstring(response.read())

items = []
seen = set()

for query in QUERIES:
    try:
        root = fetch_feed(query)
    except Exception as exc:
        print("Feed failed:", query, exc)
        continue

    for item in root.findall("./channel/item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        source_el = item.find("source")
        source = (source_el.text or "").strip() if source_el is not None else ""
        raw_date = item.findtext("pubDate") or ""

        try:
            published = email.utils.parsedate_to_datetime(raw_date).astimezone(dt.timezone.utc)
        except Exception:
            continue

        if source not in ALLOWED_SOURCES:
            continue
        if not FOOD_TERMS.search(title) or BAD_TERMS.search(title):
            continue

        key = re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()
        if not key or key in seen:
            continue

        seen.add(key)
        items.append({
            "title": title,
            "source": source,
            "date": published.strftime("%B %-d, %Y"),
            "url": link,
            "_published": published.isoformat(),
        })

items.sort(key=lambda x: x["_published"], reverse=True)
items = items[:12]
for item in items:
    item.pop("_published", None)

payload = {
    "updated": dt.datetime.now(dt.timezone.utc).isoformat(),
    "items": items,
}
OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {len(items)} stories to {OUT}")
