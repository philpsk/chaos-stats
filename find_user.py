import json
import os

target = "와꾸대장봉준"
files = ["V82_FINAL_RANK_PREMIUM.json", "V88_FINAL_RANK_DEEP.json", "DB.json"]

for fname in files:
    path = os.path.join(r"C:\Users\Hoon\Desktop\카오스최신\이순신테스트\web", fname)
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    name = ""
                    if 'account' in item:
                        name = item['account'].get('nickname', '')
                    elif 'nickname' in item:
                        name = item['nickname']
                    elif 'nick' in item:
                        name = item['nick']
                    
                    if target in str(name):
                        print(f"Found in {fname}:")
                        print(json.dumps(item, indent=2, ensure_ascii=False))
                        break
        except Exception as e:
            print(f"Error reading {fname}: {e}")
