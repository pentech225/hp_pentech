# schools.json で lat/lng が無い教室だけ、国土地理院の住所検索APIで座標を付ける
# 使い方: python -I naraigoto/tools/geocode.py
import json, pathlib, time, urllib.parse, urllib.request, re

API = "https://msearch.gsi.go.jp/address-search/AddressSearch?q="
p = pathlib.Path(__file__).resolve().parent.parent/"data"/"schools.json"
data = json.loads(p.read_text(encoding="utf-8"))
for s in data:
    if s.get("lat"):
        continue
    # 建物名を落として番地までで引く
    q = re.split(r"\s", s["address"])[0]
    with urllib.request.urlopen(API+urllib.parse.quote(q), timeout=15) as r:
        hits = json.load(r)
    if hits:
        s["lng"], s["lat"] = hits[0]["geometry"]["coordinates"]
        s["geoMatch"] = hits[0]["properties"]["title"]
    else:
        print("見つからない:", s["name"], q)
    time.sleep(0.5)
p.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
print("done", sum(1 for s in data if s.get("lat")), "/", len(data))
