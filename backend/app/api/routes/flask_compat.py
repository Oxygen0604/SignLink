"""
与ai_services兼容的API路由
完全按照ai_services的Flask服务实现
"""

import json
import base64
import os
import threading
from io import BytesIO
from typing import Optional, TYPE_CHECKING

import cv2
import numpy as np
from PIL import Image
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

if TYPE_CHECKING:
    from ...core.recognizer import SignLanguageRecognizer

from ...core.config import config
from ...utils.error_handler import ErrorResponse, ServiceError, RecognitionError, ImageProcessingError

# 配置日志
from ...utils.logger_config import get_module_logger
logger = get_module_logger(__name__)

# 创建路由器
router = APIRouter()

# 全局翻译器实例（与ai_services保持一致）
translator: Optional["SignLanguageRecognizer"] = None
# 线程锁，保护全局变量
translator_lock = threading.Lock()

def init_translator() -> bool:
    """
    启动时自动初始化翻译器（与ai_services保持一致）
    """
    global translator
    # 延迟导入以避免在应用启动早期初始化TensorFlow
    from ...core.recognizer import SignLanguageRecognizer
    
    with translator_lock:  # 使用线程锁保护
        try:
            model_path = config.get_model_path()
            labels_path = config.get_labels_path()

            logger.info(f"正在加载模型: {model_path}")
            logger.info(f"标签文件: {labels_path}")

            if not os.path.exists(model_path):
                logger.error(f"⚠️ 模型文件不存在: {model_path}")
                return False
            if not os.path.exists(labels_path):
                logger.error(f"⚠️ 标签文件不存在: {labels_path}")
                return False

            translator = SignLanguageRecognizer(model_path, labels_path)

            if not translator.is_ready():
                logger.error("❌ 翻译器初始化失败")
                return False

            logger.info(f"✅ 模型加载成功！")
            logger.info(f"   - 类别数: {len(translator.labels)}")
            logger.info(f"   - 类别: {translator.labels}")

            return True

        except Exception as e:
            logger.error(f"❌ 模型加载失败: {str(e)}")
            return False

@router.post("/api/init")
async def init_model():
    """
    初始化模型
    与ai_services的Flask服务保持一致
    """
    global translator

    with translator_lock:  # 使用线程锁保护
        if translator is not None:
            return {
                "success": True,
                "message": "模型已加载",
                "num_classes": len(translator.labels),
                "classes": translator.labels
            }

    try:
        if init_translator():
            with translator_lock:  # 再次获取锁以确保线程安全
                return {
                    "success": True,
                    "message": "模型加载成功",
                    "num_classes": len(translator.labels),
                    "classes": translator.labels
                }
        else:
            return ErrorResponse.service_unavailable("模型加载失败")

    except Exception as e:
        logger.error(f"模型初始化异常: {str(e)}")
        return ErrorResponse.internal_error(f"模型加载失败: {str(e)}")

@router.post("/api/predict")
async def predict(request: dict):
    """
    处理单帧图像并返回预测结果
    与ai_services的Flask服务完全一致
    """
    global translator

    with translator_lock:  # 使用线程锁保护
        if translator is None:
            return ErrorResponse.service_unavailable("模型未初始化")

    try:
        # 获取base64图像数据（与ai_services一致）
        data = request
        if 'image' not in data:
            raise ValueError("缺少image字段")

        image_data = data['image'].split(',')[1]

        # 解码图像
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        image_np = np.array(image)

        # 转换颜色空间
        if image_np.shape[2] == 4:  # RGBA
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2BGR)
        else:  # RGB
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

        # 预测（使用我们移植的recognizer）
        with translator_lock:  # 线程安全地访问翻译器
            predicted_label, confidence, hand_landmarks = translator.predict(image_np)

        if predicted_label is None:
            return {
                "success": True,
                "detected": False,
                "message": "未检测到手势"
            }

        # 绘制关键点（与ai_services一致）
        if hand_landmarks:
            with translator_lock:  # 线程安全地访问翻译器
                image_np = translator.draw_landmarks(image_np, hand_landmarks)

        # 转换回base64（与ai_services一致）
        _, buffer = cv2.imencode('.jpg', image_np)
        annotated_image = base64.b64encode(buffer).decode('utf-8')

        # 返回与ai_services完全一致的格式
        return {
            "success": True,
            "detected": True,
            "word": predicted_label,  # ai_services使用'word'字段
            "confidence": float(confidence),
            "annotated_image": f"data:image/jpeg;base64,{annotated_image}"
        }

    except ValueError as e:
        logger.warning(f"图像解析错误: {str(e)}")
        return ErrorResponse.bad_request(f"图像格式错误: {str(e)}")
    except Exception as e:
        logger.error(f"预测失败: {str(e)}")
        return ErrorResponse.internal_error(f"预测失败: {str(e)}")
