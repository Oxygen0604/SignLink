"""
真实的摄像头测试脚本
用于验证连续识别功能的实际运行情况
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

def test_camera_with_recognition():
    """测试摄像头调用和连续识别"""
    print("=== 真实摄像头识别测试 ===")

    # 测试摄像头硬件
    print("1. 测试摄像头硬件...")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ 无法打开摄像头")
        return False

    # 读取测试帧
    ret, frame = cap.read()
    if not ret:
        print("❌ 无法读取摄像头画面")
        cap.release()
        return False

    print(f"摄像头正常工作，画面尺寸: {frame.shape}")

    # 测试WebSocket连接
    print("2. 测试WebSocket连接...")
    try:
        ws = websocket.create_connection('ws://localhost:8001/ws')
        print("✅ WebSocket连接成功")
    except Exception as e:
        print(f"❌ WebSocket连接失败: {e}")
        cap.release()
        return False

    # 进行连续识别测试
    print("3. 进行连续识别测试（5秒）...")
    success_count = 0
    error_count = 0
    start_time = time.time()

    try:
        while time.time() - start_time < 5:  # 运行5秒
            ret, frame = cap.read()
            if not ret:
                print("❌ 无法读取帧")
                error_count += 1
                continue

            # 转换为base64
            data = to_base64(frame)
            if not data:
                print("❌ 无法编码帧")
                error_count += 1
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
                error_count += 1

            # 短暂延迟，避免过于频繁的请求
            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\n用户中断测试")

    finally:
        cap.release()
        ws.close()

    # 统计结果
    print(f"\n=== 测试结果统计 ===")
    print(f"成功识别次数: {success_count}")
    print(f"失败次数: {error_count}")
    print(f"识别成功率: {success_count/(success_count+error_count)*100:.1f}%" if (success_count+error_count) > 0 else "0%")

    return success_count > 0

if __name__ == '__main__':
    success = test_camera_with_recognition()
    if success:
        print("\n✅ 摄像头连续识别测试通过！")
        sys.exit(0)
    else:
        print("\n❌ 摄像头连续识别测试失败！")
        sys.exit(1)