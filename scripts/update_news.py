import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

FEEDS = [
    ("Sauce Magazine", "site:saucemagazine.com (restaurant OR dining OR food OR bar OR brewery)"),
    ("St. Louis Magazine", "site:stlmag.com (restaurant OR dining OR food OR bar OR brewery)"),
    ("The Telegraph", "site:thetelegraph.com (restaurant OR dining OR food OR bar OR brewery OR Alton)"),
    ("Belleville News-Democrat", "site:bnd.com (restaurant OR dining OR food OR bar OR brewery OR breakfast)"),
    ("Local St. Louis / Metro East", '("St. Louis" OR "Metro East" OR Alton OR Belleville) (restaurant OR dining OR food OR brewery OR bar)')
]

def rss_url(query):
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode({
        "q": query, "hl": "en-US", "gl": "US", "ceid": "US:en"
    })

def clean(text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text or "")).strip()

def fetch(feed_name, query):
    req = urllib.request.Request(rss_url(query), headers={"User-Agent": "Metro-Eats-News-Updater/1.0"})
    with urllib.request.urlopen(req, timeout=20) as response:
        root = ET.fromstring(response.read())
    rows = []
    for item in root.findall(".//item"):
        title = clean(item.findtext("title"))
        link = item.findtext("link") or ""
        pub = item.findtext("pubDate") or ""
        source = item.find("source")
        source_name = clean(source.text if source is not None else feed_name) or feed_name
        if not title or not link:
            continue
        try:
            dt = datetime.strptime(pub, "%a, %d %b %Y %H:%M:%S %Z").replace(tzinfo=timezone.utc)
        except Exception:
            try:
                dt = datetime.strptime(pub[:25], "%a, %d %b %Y %H:%M:%S").replace(tzinfo=timezone.utc)
            except Exception:
                dt = datetime.now(timezone.utc)
        rows.append({"title": title, "source": source_name, "date": dt.strftime("%B %-d, %Y"), "url": link, "_dt": dt.isoformat()})
    return rows

all_rows = []
for name, query in FEEDS:
    try:
        all_rows.extend(fetch(name, query))
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
    if len(selected) >= 9:
        break

if not selected:
    raise SystemExit("No news items were retrieved; refusing to overwrite news.json.")

payload = {"updated": datetime.now(timezone.utc).isoformat(), "items": selected}
with open("news.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"Wrote {len(selected)} local news stories.")
