#!/usr/bin/env python
"""
SignLink后端API测试客户端
用于测试各个API接口
"""

import base64
import json
import requests
import sys
from pathlib import Path
from typing import Optional

# 配置
API_BASE = "http://localhost:8000"
TIMEOUT = 30

def test_health_check() -> bool:
    """测试健康检查接口"""
    try:
        response = requests.get(f"{API_BASE}/api/health", timeout=TIMEOUT)
        print(f"\n{'='*50}")
        print("🔍 测试: 健康检查")
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

        if response.status_code == 200:
            print("✅ 健康检查通过")
            return True
        else:
            print("❌ 健康检查失败")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到后端服务")
        print("请确保后端服务正在运行: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")
        return False
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def test_model_info() -> bool:
    """测试模型信息接口"""
    try:
        response = requests.get(f"{API_BASE}/api/model/info", timeout=TIMEOUT)
        print(f"\n{'='*50}")
        print("🔍 测试: 获取模型信息")
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"模型已加载: {data['loaded']}")
            print(f"支持类别数: {data['num_classes']}")
            print(f"支持类别: {data['classes']}")
            print("✅ 模型信息获取成功")
            return True
        else:
            print(f"❌ 获取失败: {response.text}")
            return False

    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def test_get_classes() -> bool:
    """测试获取手语类别接口"""
    try:
        response = requests.get(f"{API_BASE}/api/classes", timeout=TIMEOUT)
        print(f"\n{'='*50}")
        print("🔍 测试: 获取支持的手语类别")
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            classes = response.json()
            print(f"支持类别: {classes}")
            print("✅ 类别获取成功")
            return True
        else:
            print(f"❌ 获取失败: {response.text}")
            return False

    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def test_recognize_from_file(image_path: str) -> bool:
    """测试文件识别接口"""
    try:
        print(f"\n{'='*50}")
        print(f"🔍 测试: 文件识别 - {image_path}")

        if not Path(image_path).exists():
            print(f"❌ 文件不存在: {image_path}")
            return False

        with open(image_path, 'rb') as f:
            files = {'file': f}
            data = {'format': 'jpeg', 'quality': 80}
            response = requests.post(
                f"{API_BASE}/api/recognize/upload",
                files=files,
                data=data,
                timeout=TIMEOUT * 2  # 文件识别可能需要更长时间
            )

        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"识别结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            print("✅ 文件识别成功")
            return True
        else:
            print(f"❌ 识别失败: {response.text}")
            return False

    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def test_recognize_from_base64(image_path: str) -> bool:
    """测试Base64图像识别接口"""
    try:
        print(f"\n{'='*50}")
        print(f"🔍 测试: Base64识别 - {image_path}")

        if not Path(image_path).exists():
            print(f"❌ 文件不存在: {image_path}")
            return False

        # 读取图像并转换为Base64
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
            base64_string = f"data:image/jpeg;base64,{image_data}"

        # 发送请求
        payload = {
            "image": base64_string,
            "format": "jpeg",
            "quality": 80
        }

        response = requests.post(
            f"{API_BASE}/api/recognize/realtime",
            json=payload,
            timeout=TIMEOUT
        )

        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"识别结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            print("✅ Base64识别成功")
            return True
        else:
            print(f"❌ 识别失败: {response.text}")
            return False

    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def find_test_image() -> Optional[str]:
    """查找测试图像"""
    # 可能的测试图像位置
    possible_paths = [
        "test_image.jpg",
        "test_image.png",
        "test.jpg",
        "test.png",
        "../ai_services/set_training_translation/test.jpg",
        "../ai_services/set_training_translation/data_collection_samples/test.jpg"
    ]

    for path in possible_paths:
        if Path(path).exists():
            return path

    return None

def main():
    """主测试函数"""
    print("=" * 50)
    print("SignLink 后端API测试客户端")
    print("=" * 50)

    # 测试结果统计
    passed = 0
    failed = 0

    # 1. 健康检查
    if test_health_check():
        passed += 1
    else:
        failed += 1
        print("\n⚠️  健康检查失败，退出测试")
        sys.exit(1)

    # 2. 模型信息
    if test_model_info():
        passed += 1
    else:
        failed += 1

    # 3. 获取类别
    if test_get_classes():
        passed += 1
    else:
        failed += 1

    # 4. 文件识别
    test_image = find_test_image()
    if test_image:
        if test_recognize_from_file(test_image):
            passed += 1
        else:
            failed += 1
    else:
        print("\n⚠️  未找到测试图像，跳过文件识别测试")
        print("   可将测试图像命名为 test_image.jpg 并放在当前目录")

    # 5. Base64识别
    if test_image:
        if test_recognize_from_base64(test_image):
            passed += 1
        else:
            failed += 1
    else:
        print("\n⚠️  未找到测试图像，跳过Base64识别测试")

    # 总结
    print(f"\n{'='*50}")
    print("📊 测试总结")
    print(f"{'='*50}")
    print(f"✅ 通过: {passed}")
    print(f"❌ 失败: {failed}")
    print(f"总计: {passed + failed}")

    if failed == 0:
        print("\n🎉 所有测试通过！")
        sys.exit(0)
    else:
        print(f"\n⚠️  {failed} 个测试失败")
        sys.exit(1)

if __name__ == "__main__":
    main()
