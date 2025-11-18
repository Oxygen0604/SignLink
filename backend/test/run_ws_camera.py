import base64
import cv2
import json
import websocket

def to_base64(frame):
    ok, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not ok:
        return None
    b64 = base64.b64encode(buf).decode('utf-8')
    return f"data:image/jpeg;base64,{b64}"

def main():
    cap = cv2.VideoCapture(0)
    ws = websocket.create_connection('ws://localhost:8000/ws')
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            data = to_base64(frame)
            if not data:
                break
            ws.send(json.dumps({"type": "image", "data": data}))
            msg = ws.recv()
            print(msg)
            if cv2.waitKey(1) & 0xFF == 27:
                break
    finally:
        cap.release()
        ws.close()

if __name__ == '__main__':
    main()