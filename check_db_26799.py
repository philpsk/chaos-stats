import json

with open('DB.json', 'r', encoding='utf-8', errors='ignore') as f:
    data = json.load(f)

# If data is a dict list, or dict of dicts
items = data if isinstance(data, list) else data.values() if isinstance(data, dict) else []

for item in items:
    if isinstance(item, dict) and str(item.get('ano', '')) == '26799':
        print(f"[{item.get('name')}] Season Records:")
        print("  win:", item.get('win'))
        print("  lose:", item.get('lose'))
        print("  winCount:", item.get('winCount'))
        print("  loseCount:", item.get('loseCount'))
        print("  rank_all_wl:", item.get('rank_all_wl'))
        print("  winLoseTendency type:", type(item.get('winLoseTendency')))
        print("  Keys:", list(item.keys()))
        break
