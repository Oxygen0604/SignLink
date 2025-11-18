"""
简化的摄像头测试脚本
避免Unicode编码问题
"""

import base64
import cv2
import json
import websocket
import time
import sys

def to_base64(frame):
    """将OpenCV帧转换为Base64字符串"""
    ok, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not ok:
        return None
    b64 = base64.b64encode(buf).decode('utf-8')
    return f"data:image/jpeg;base64,{b64}"

def main():
    print("=== 摄像头识别测试 ===")

    # 测试摄像头硬件
    print("1. 测试摄像头硬件...")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("无法打开摄像头")
        return False

    # 读取测试帧
    ret, frame = cap.read()
    if not ret:
        print("无法读取摄像头画面")
        cap.release()
        return False

    print(f"摄像头正常工作，画面尺寸: {frame.shape}")

    # 测试WebSocket连接
    print("2. 测试WebSocket连接...")
    try:
        ws = websocket.create_connection('ws://localhost:8001/ws')
        print("WebSocket连接成功")
    except Exception as e:
        print(f"WebSocket连接失败: {e}")
        cap.release()
        return False

    # 进行识别测试
    print("3. 进行识别测试（3秒）...")
    success_count = 0
    start_time = time.time()

    try:
        while time.time() - start_time < 3:  # 运行3秒
            ret, frame = cap.read()
            if not ret:
                print("无法读取帧")
                continue

            # 转换为base64
            data = to_base64(frame)
            if not data:
                print("无法编码帧")
                continue

            # 发送识别请求
            try:
                ws.send(json.dumps({"type": "image", "data": data}))
                msg = ws.recv()
                result = json.loads(msg)

                if result.get("type") == "recognition_result":
                    predicted = result.get("signInput", "")
                    confidence = result.get("data", {}).get("confidence", 0)

                    if predicted:
                        success_count += 1
                        print(f"识别成功: {predicted} (置信度: {confidence:.2f})")
                    else:
                        print("未检测到手势")

            except Exception as e:
                print(f"识别请求失败: {e}")

            # 短暂延迟
            time.sleep(0.2)

    except KeyboardInterrupt:
        print("用户中断测试")

    finally:
        cap.release()
        ws.close()

    # 统计结果
    print(f"\n=== 测试结果统计 ===")
    print(f"成功识别次数: {success_count}")

    return success_count > 0

if __name__ == '__main__':
    success = main()
    if success:
        print("\n摄像头识别测试通过！")
        sys.exit(0)
    else:
        print("\n摄像头识别测试失败！")
        sys.exit(1)