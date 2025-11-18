import base64
import io
import json
import websocket
from PIL import Image

def create_base64_image():
    img = Image.new("RGB", (320, 240), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def main():
    ws = websocket.create_connection("ws://localhost:8000/ws")
    ws.send(json.dumps({"type": "image", "data": create_base64_image()}))
    print(ws.recv())
    ws.close()

if __name__ == "__main__":
    main()