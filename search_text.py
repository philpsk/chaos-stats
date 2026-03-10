import json
import os

target_text = "어검술 킬러"
directory = r"C:\Users\Hoon\Desktop\카오스최신\이순신테스트\web"

found = False
for filename in os.listdir(directory):
    if filename.endswith(".json"):
        filepath = os.path.join(directory, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if target_text in content:
                    print(f"--- Found in {filename} ---")
                    # Try to find the specific object
                    f.seek(0)
                    data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            if target_text in str(item):
                                print(json.dumps(item, indent=2, ensure_ascii=False))
                    found = True
        except Exception as e:
            # Skip errors (some files might be too large or not UTF-8)
            pass

if not found:
    print("Not found in any UTF-8 JSON files.")
