import base64
import io
import json
import requests
from PIL import Image

def create_base64_image():
    img = Image.new("RGB", (320, 240), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def main():
    payload = {"image": create_base64_image(), "format": "jpeg", "quality": 80}
    r = requests.post("http://localhost:8000/recognize/realtime", json=payload, timeout=10)
    print(r.status_code)
    print(json.dumps(r.json(), ensure_ascii=False))

if __name__ == "__main__":
    main()