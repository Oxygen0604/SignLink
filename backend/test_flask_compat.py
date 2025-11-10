#!/usr/bin/env python
"""
测试与ai_services兼容的API
模拟ai_services前端发送的请求
"""

import base64
import json
import requests
import sys
from pathlib import Path

# 配置
API_BASE = "http://localhost:8000"

def create_test_image_base64():
    """创建一个测试用的Base64图像（纯色图像）"""
    # 创建一个简单的100x100红色图像
    import numpy as np
    from PIL import Image

    # 创建100x100的红色图像
    img = Image.new('RGB', (100, 100), color='red')
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    img_bytes = buffer.getvalue()

    # 转换为Base64
    base64_str = base64.b64encode(img_bytes).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_str}"

def test_init_model():
    """测试模型初始化"""
    try:
        print("\n" + "="*50)
        print("测试: 初始化模型")
        print("="*50)

        response = requests.post(f"{API_BASE}/api/init")
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

        if response.status_code == 200:
            print("✅ 模型初始化成功")
            return True
        else:
            print("❌ 模型初始化失败")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到后端服务")
        print("请确保后端服务正在运行: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")
        return False
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def test_predict():
    """测试预测接口"""
    try:
        print("\n" + "="*50)
        print("测试: 预测单帧图像")
        print("="*50)

        # 创建测试图像
        test_image = create_test_image_base64()

        # 发送请求（与ai_services前端完全一致）
        payload = {
            "image": test_image
        }

        response = requests.post(
            f"{API_BASE}/api/predict",
            json=payload
        )

        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ 预测成功")
                print(f"   检测到手势: {result.get('detected')}")
                if result.get('detected'):
                    print(f"   预测单词: {result.get('word')}")
                    print(f"   置信度: {result.get('confidence')}")
                return True
            else:
                print("❌ 预测失败")
                return False
        else:
            print("❌ 预测请求失败")
            return False

    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def test_with_real_image(image_path):
    """使用真实图像测试"""
    try:
        print("\n" + "="*50)
        print(f"测试: 使用真实图像 - {image_path}")
        print("="*50)

        if not Path(image_path).exists():
            print(f"❌ 图像文件不存在: {image_path}")
            return False

        # 读取图像并转换为Base64
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
            base64_string = f"data:image/jpeg;base64,{image_data}"

        # 发送请求
        payload = {
            "image": base64_string
        }

        response = requests.post(
            f"{API_BASE}/api/predict",
            json=payload
        )

        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

        if response.status_code == 200:
            result = response.json()
            print("✅ 预测成功")
            return True
        else:
            print("❌ 预测失败")
            return False

    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def main():
    """主测试函数"""
    print("=" * 60)
    print("SignLink 后端 - ai_services兼容性测试")
    print("=" * 60)

    passed = 0
    failed = 0

    # 1. 测试模型初始化
    if test_init_model():
        passed += 1
    else:
        failed += 1
        print("\n⚠️  模型初始化失败，退出测试")
        sys.exit(1)

    # 2. 测试预测接口（使用测试图像）
    if test_predict():
        passed += 1
    else:
        failed += 1

    # 3. 测试预测接口（使用真实图像，如果有的话）
    test_image = find_test_image()
    if test_image:
        if test_with_real_image(test_image):
            passed += 1
        else:
            failed += 1
    else:
        print("\n⚠️  未找到真实测试图像，跳过真实图像测试")

    # 总结
    print("\n" + "="*60)
    print("测试总结")
    print("="*60)
    print(f"✅ 通过: {passed}")
    print(f"❌ 失败: {failed}")
    print(f"总计: {passed + failed}")

    if failed == 0:
        print("\n🎉 所有测试通过！")
        print("✅ 后端与ai_services完全兼容！")
        sys.exit(0)
    else:
        print(f"\n⚠️  {failed} 个测试失败")
        sys.exit(1)

def find_test_image():
    """查找测试图像"""
    possible_paths = [
        "test_image.jpg",
        "test_image.png",
        "test.jpg",
        "test.png",
        "../ai_services/set_training_translation/test.jpg",
        "sample.jpg"
    ]

    for path in possible_paths:
        if Path(path).exists():
            return path

    return None

if __name__ == "__main__":
    main()
