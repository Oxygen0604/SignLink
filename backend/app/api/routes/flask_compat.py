"""
与ai_services兼容的API路由
完全按照ai_services的Flask服务实现
"""

import logging
import json
import base64
import os
from io import BytesIO
from typing import Optional

import cv2
import numpy as np
from PIL import Image
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from ...core.recognizer import SignLanguageRecognizer
from ...core.config import config

# 配置日志
logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter()

# 全局翻译器实例（与ai_services保持一致）
translator: Optional[SignLanguageRecognizer] = None

def init_translator() -> bool:
    """
    启动时自动初始化翻译器（与ai_services保持一致）
    """
    global translator
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

    if translator is not None:
        return {
            "success": True,
            "message": "模型已加载",
            "num_classes": len(translator.labels),
            "classes": translator.labels
        }

    try:
        if init_translator():
            return {
                "success": True,
                "message": "模型加载成功",
                "num_classes": len(translator.labels),
                "classes": translator.labels
            }
        else:
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "message": "模型加载失败"
                }
            )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"模型加载失败: {str(e)}"
            }
        )

@router.post("/api/predict")
async def predict(request: dict):
    """
    处理单帧图像并返回预测结果
    与ai_services的Flask服务完全一致
    """
    global translator

    if translator is None:
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "message": "模型未初始化"
            }
        )

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
        predicted_label, confidence, hand_landmarks = translator.predict(image_np)

        if predicted_label is None:
            return {
                "success": True,
                "detected": False,
                "message": "未检测到手势"
            }

        # 绘制关键点（与ai_services一致）
        if hand_landmarks:
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
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"图像格式错误: {str(e)}"
            }
        )
    except Exception as e:
        logger.error(f"预测失败: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"预测失败: {str(e)}"
            }
        )
