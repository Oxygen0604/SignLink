"""
公共工具函数模块
提供通用的工具函数和公共逻辑
"""

from typing import Optional, Dict, Any, List
from datetime import datetime

from ..utils.logger_config import get_module_logger
from ..services.translator import TranslationService
from ..models.schemas import RecognitionResult

logger = get_module_logger(__name__)

class ServiceManager:
    """服务管理器，统一管理翻译服务实例"""

    def __init__(self):
        self._translation_service: Optional[TranslationService] = None
        self._history: List[Dict[str, Any]] = []
        self._max_history_size = 100

    def set_service(self, service: TranslationService):
        """设置翻译服务实例"""
        self._translation_service = service
        logger.info("翻译服务实例已设置")

    def get_service(self) -> Optional[TranslationService]:
        """获取翻译服务实例"""
        return self._translation_service

    def is_service_ready(self) -> bool:
        """检查服务是否已就绪"""
        return self._translation_service is not None and self._translation_service.recognizer.is_ready()

    def add_to_history(self, sign_input: str, sign_translation: str):
        """添加到历史记录"""
        entry = {
            "signInput": sign_input,
            "signTranslation": sign_translation,
            "timestamp": datetime.now().isoformat()
        }
        self._history.append(entry)

        # 限制历史记录大小
        if len(self._history) > self._max_history_size:
            self._history = self._history[-self._max_history_size:]

    def get_history(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """获取历史记录"""
        if limit is None:
            return self._history.copy()
        return self._history[-limit:].copy()

    def clear_history(self):
        """清空历史记录"""
        self._history.clear()
        logger.info("历史记录已清空")

# 全局服务管理器实例
service_manager = ServiceManager()

def get_service_response(result: RecognitionResult) -> Dict[str, Any]:
    """
    将识别结果转换为标准的服务响应格式

    Args:
        result: 识别结果

    Returns:
        标准格式的响应字典
    """
    return {
        "success": result.success,
        "detected": result.detected,
        "word": result.predicted_class,
        "confidence": result.confidence,
        "message": result.message
    }

def validate_base64_image(image_data: str) -> bool:
    """
    验证Base64图像数据格式

    Args:
        image_data: Base64图像数据

    Returns:
        是否有效
    """
    if not image_data:
        return False

    # 检查是否包含数据URI前缀
    if image_data.startswith("data:image/"):
        # 检查是否有逗号分隔符
        if "," not in image_data:
            return False
        # 获取实际的数据部分
        image_data = image_data.split(",")[1]

    # 检查Base64数据长度（最小合理长度）
    if len(image_data) < 100:  # 假设最小有效图像数据长度
        return False

    return True

def parse_websocket_payload(data: str) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    解析WebSocket消息负载

    Args:
        data: WebSocket消息数据

    Returns:
        (解析后的负载, 错误消息) 元组
    """
    try:
        import json
        payload = json.loads(data)
        if not isinstance(payload, dict):
            return None, "消息格式错误：需要JSON对象"
        return payload, None
    except json.JSONDecodeError:
        return None, "无效的JSON格式"
    except Exception as e:
        return None, f"解析消息时出错: {str(e)}"

def create_websocket_response(
    predicted_class: Optional[str] = None,
    service_ready: bool = True,
    error_message: Optional[str] = None
) -> Dict[str, Any]:
    """
    创建WebSocket响应消息

    Args:
        predicted_class: 预测的类别
        service_ready: 服务是否就绪
        error_message: 错误消息（如果有）

    Returns:
        WebSocket响应消息
    """
    if error_message:
        return {
            "type": "error",
            "message": error_message
        }

    if not service_ready:
        return {
            "type": "recognition_result",
            "data": {
                "success": False,
                "detected": False,
                "predicted_class": None,
                "confidence": 0.0,
                "message": "服务未就绪"
            },
            "signInput": "",
            "signTranslation": ""
        }

    return {
        "type": "recognition_result",
        "data": {
            "success": True,
            "detected": predicted_class is not None,
            "predicted_class": predicted_class,
            "confidence": 0.0 if predicted_class is None else 1.0,  # 简化处理
            "message": "识别成功" if predicted_class else "未检测到手势"
        },
        "signInput": predicted_class or "",
        "signTranslation": predicted_class or ""
    }