import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

MIN_STORIES = 10
LOOKBACK_DAYS = 60

FEEDS = [
    ("Sauce Magazine", 'site:saucemagazine.com "St. Louis" (restaurant OR dining OR food OR bar OR brewery)', "stl"),
    ("St. Louis Magazine", 'site:stlmag.com/dining "St. Louis" (restaurant OR dining OR food OR bar OR brewery)', "stl"),
    ("The Telegraph", 'site:thetelegraph.com (Alton OR Godfrey OR "East Alton" OR "Wood River" OR Bethalto OR Edwardsville OR "Glen Carbon" OR Grafton) (restaurant OR dining OR food OR bar OR brewery)', "metroEast"),
    ("Belleville News-Democrat", 'site:bnd.com (Belleville OR Collinsville OR "Fairview Heights" OR "O\'Fallon" OR Shiloh OR Edwardsville OR "Metro East") (restaurant OR dining OR food OR breakfast OR bar OR brewery)', "metroEast"),
    ("Local & Regional", '("St. Louis" OR "Metro East" OR Alton OR Belleville OR Edwardsville OR Collinsville) (restaurant OR dining OR food OR brewery OR bar)', "regional"),
]

LOCAL_TERMS = re.compile(
    r"\b(st\.?\s*louis|saint\s*louis|metro\s*east|alton|godfrey|east\s*alton|wood\s*river|"
    r"bethalto|grafton|edwardsville|glen\s*carbon|granite\s*city|collinsville|belleville|"
    r"fairview\s*heights|shiloh|o'?fallon|ofallon|maryville|pontoon\s*beach|roxana|highland|"
    r"millstadt|waterloo|columbia|creve\s*coeur|university\s*city|maplewood|kirkwood|"
    r"brentwood|central\s*west\s*end|soulard|cherokee\s*street|the\s*hill)\b",
    re.I,
)

FOOD_TERMS = re.compile(
    r"\b(restaurant|restaurants|dining|food|drink|bar|bars|brewery|breweries|brewpub|cafe|cafes|"
    r"coffee|chef|menu|menus|pizza|burger|burgers|breakfast|brunch|chicken|bbq|barbecue|dessert|"
    r"ice\s*cream|taco|tacos|steak|seafood|bakery|baking|culinary|eatery|eateries|opens|opening|"
    r"closes|closing|reopens|reopen|food\s*truck|hospitality|wine|cocktail|cocktails)\b",
    re.I,
)

BAD_TERMS = re.compile(
    r"\b(chicago|springfield|peoria|rockford|champaign|urbana|naperville|joliet|quad\s*cities|"
    r"carbondale|decatur|indianapolis|kansas\s*city|nashville|new\s*york|los\s*angeles|miami|"
    r"denver|seattle|portland|national|nationwide|travel|vacation|cruise|disney)\b",
    re.I,
)

TRUSTED_LOCAL = {
    "Sauce Magazine",
    "St. Louis Magazine",
    "The Telegraph",
    "Belleville News-Democrat",
}

def rss_url(query):
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode({
        "q": query,
        "hl": "en-US",
        "gl": "US",
        "ceid": "US:en",
    })

def clean(text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text or "")).strip()

def parse_date(value):
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc)
    except Exception:
        return None

def is_local_story(title, source, scope):
    text = title or ""
    if not FOOD_TERMS.search(text) or BAD_TERMS.search(text):
        return False
    if LOCAL_TERMS.search(text):
        return True
    if scope == "stl" and source in {"Sauce Magazine", "St. Louis Magazine"}:
        return True
    if scope == "metroEast" and source in {"The Telegraph", "Belleville News-Democrat"}:
        return True
    return False

def fetch(feed_name, query, scope):
    req = urllib.request.Request(
        rss_url(query),
        headers={"User-Agent": "Metro-Eats-News-Updater/2.0"},
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        root = ET.fromstring(response.read())

    rows = []
    cutoff = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)

    for item in root.findall(".//item"):
        title = clean(item.findtext("title"))
        link = item.findtext("link") or ""
        pub = item.findtext("pubDate") or ""
        dt = parse_date(pub)
        source_node = item.find("source")
        source_name = clean(source_node.text if source_node is not None else feed_name) or feed_name

        if not title or not link or not dt or dt < cutoff or dt > datetime.now(timezone.utc) + timedelta(days=1):
            continue

        # Keep the feed's known-local publication identity instead of a Google News wrapper name.
        source_name = feed_name
        if not is_local_story(title, source_name, scope):
            continue

        rows.append({
            "title": title,
            "source": source_name,
            "date": dt.strftime("%B %-d, %Y"),
            "url": link,
            "_dt": dt,
        })

    return rows

all_rows = []
for name, query, scope in FEEDS:
    try:
        all_rows.extend(fetch(name, query, scope))
    except Exception as exc:
        print(f"Feed failed: {name}: {exc}")

seen = set()
selected = []

for row in sorted(all_rows, key=lambda x: x["_dt"], reverse=True):
    key = re.sub(r"[^a-z0-9]+", "", row["title"].lower())
    if key in seen:
        continue
    seen.add(key)
    row.pop("_dt", None)
    selected.append(row)
    if len(selected) >= MIN_STORIES:
        break

if not selected:
    raise SystemExit("No qualifying local food/dining stories were retrieved; refusing to overwrite news.json.")

payload = {
    "updated": datetime.now(timezone.utc).isoformat(),
    "items": selected,
}

with open("news.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"Wrote {len(selected)} qualifying St. Louis / Metro East food and dining stories.")
