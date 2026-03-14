import json
import os

target_text = "어검술 킬러"
directory = r"C:\Users\Hoon\Desktop\카오스최신\이순신테스트\web"

for filename in os.listdir(directory):
    if filename.endswith(".json"):
        filepath = os.path.join(directory, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        item_str = json.dumps(item, ensure_ascii=False)
                        if target_text in item_str:
                            print(f"MATCH FOUND in {filename}")
                            # Scan fields
                            def find_field(obj, target):
                                if isinstance(obj, dict):
                                    for k, v in obj.items():
                                        if isinstance(v, str) and target in v:
                                            return k
                                        res = find_field(v, target)
                                        if res: return f"{k}.{res}"
                                elif isinstance(obj, list):
                                    for i, v in enumerate(obj):
                                        res = find_field(v, target)
                                        if res: return f"[{i}].{res}"
                                return None
                            
                            field_path = find_field(item, target_text)
                            print(f"Field Path: {field_path}")
                            print(f"Value: {target_text}")
                            # Also print the nickname to verify
                            nick = item.get('nick') or item.get('nickname') or (item.get('account') and item['account'].get('nickname'))
                            print(f"User: {nick}")
                            # exit after first match for brevity
                            import sys
                            sys.exit(0)
        except Exception as e:
            pass
