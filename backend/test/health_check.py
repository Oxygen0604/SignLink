import json
import requests

def main():
    r1 = requests.get("http://localhost:8000/recognize/history", timeout=10)
    print(r1.status_code)
    print(json.dumps(r1.json(), ensure_ascii=False))
    r2 = requests.post("http://localhost:8000/api/init", json={}, timeout=10)
    print(r2.status_code)
    print(json.dumps(r2.json(), ensure_ascii=False))

if __name__ == "__main__":
    main()