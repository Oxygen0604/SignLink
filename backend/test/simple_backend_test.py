"""
简化后端测试脚本
不依赖TensorFlow和MediaPipe，仅测试基础功能
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import requests
import time
import base64
from io import BytesIO
from PIL import Image

def create_test_image():
    """创建测试图像"""
    img = Image.new("RGB", (320, 240), color=(255, 255, 255))
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=80)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def test_health_endpoints():
    """测试健康检查端点"""
    print("=== 测试健康检查端点 ===")

    base_url = "http://localhost:8000"

    try:
        # 测试根路径
        print("测试根路径...")
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"服务信息: {json.dumps(data, ensure_ascii=False, indent=2)}")
        else:
            print("根路径测试失败")
            return False

    except Exception as e:
        print(f"健康检查失败: {e}")
        return False

    return True

def test_recognition_without_model():
    """测试无需模型的识别端点"""
    print("\n=== 测试识别端点（无需模型） ===")

    base_url = "http://localhost:8000"
    test_image = create_test_image()

    try:
        # 测试实时识别端点
        print("测试实时识别端点...")
        payload = {
            "image": test_image,
            "format": "jpeg",
            "quality": 80
        }
        response = requests.post(f"{base_url}/recognize/realtime", json=payload, timeout=10)
        print(f"状态码: {response.status_code}")

        if response.status_code in [200, 503]:  # 200成功，503服务未就绪
            data = response.json()
            print(f"响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
            return True
        else:
            print(f"实时识别测试失败，状态码: {response.status_code}")
            return False

    except Exception as e:
        print(f"识别测试失败: {e}")
        return False

def test_websocket_connection():
    """测试WebSocket连接"""
    print("\n=== 测试WebSocket连接 ===")

    try:
        import websocket
        ws = websocket.WebSocket()
        ws.connect("ws://localhost:8000/ws")

        # 发送测试消息
        test_message = json.dumps({"type": "image", "data": create_test_image()})
        ws.send(test_message)

        # 接收响应
        response = ws.recv()
        print(f"WebSocket响应: {response}")

        ws.close()
        return True

    except ImportError:
        print("websocket-client 未安装，跳过WebSocket测试")
        return True
    except Exception as e:
        print(f"WebSocket测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("SignLink 后端简化测试")
    print("=" * 50)

    # 等待服务启动
    print("等待服务启动...")
    time.sleep(3)

    results = []

    # 运行各项测试
    results.append(("健康检查", test_health_endpoints()))
    results.append(("识别测试", test_recognition_without_model()))
    results.append(("WebSocket测试", test_websocket_connection()))

    # 总结结果
    print("\n" + "=" * 50)
    print("测试结果总结:")
    all_passed = True
    for test_name, passed in results:
        status = "通过" if passed else "失败"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False

    print("=" * 50)
    if all_passed:
        print("✅ 所有测试通过！")
        return 0
    else:
        print("❌ 部分测试失败！")
        return 1

if __name__ == "__main__":
    exit(main())