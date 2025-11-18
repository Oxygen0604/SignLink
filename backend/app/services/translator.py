"""
翻译服务模块
提供高级翻译功能和服务层逻辑
"""

import time
import logging
from typing import Optional, Tuple, Dict, Any
from datetime import datetime
import traceback

# 配置日志
from ..utils.logger_config import get_module_logger

from ..core.recognizer import SignLanguageRecognizer
from ..utils.image_processing import (
    base64_to_image,
    image_to_base64,
    preprocess_image_for_model,
    create_visualization_image
)
from ..models.schemas import RecognitionResult, HandLandmark, HandData

logger = logging.getLogger(__name__)

class TranslationService:
    """
    手语翻译服务
    封装识别器的功能，提供更高级的翻译接口
    """

    def __init__(self, recognizer: SignLanguageRecognizer):
        """
        初始化翻译服务

        Args:
            recognizer: 已初始化的手语识别器
        """
        self.recognizer = recognizer
        self.translation_count = 0  # 翻译次数统计
        self.start_time = datetime.now()

    def recognize_from_base64(self, base64_image: str, format: str = "jpeg", quality: int = 80) -> RecognitionResult:
        """
        从Base64图像进行手语识别

        Args:
            base64_image: Base64编码的图像字符串
            format: 图像格式
            quality: 图像质量

        Returns:
            RecognitionResult: 识别结果
        """
        start_time = time.time()

        try:
            # 1. 解析Base64图像
            logger.debug("正在解析Base64图像...")
            image = base64_to_image(base64_image)

            # 2. 预处理图像
            logger.debug("正在预处理图像...")
            processed_image = preprocess_image_for_model(image)

            # 3. 进行识别
            logger.debug("正在进行手语识别...")
            predicted_label, confidence, hand_landmarks = self.recognizer.predict(processed_image)

            # 4. 计算处理时间
            processing_time = (time.time() - start_time) * 1000  # 毫秒

            # 5. 统计翻译次数
            self.translation_count += 1

            # 6. 构建手部数据
            hands_data = None
            hands_count = 0

            if hand_landmarks:
                hands_count = len(hand_landmarks)
                hands_data = []

                # 假设每只手都是右手（MediaPipe不直接提供handedness信息）
                for landmarks in hand_landmarks:
                    landmark_list = []
                    for landmark in landmarks.landmark:
                        landmark_list.append(
                            HandLandmark(
                                x=float(landmark.x),
                                y=float(landmark.y),
                                z=float(landmark.z)
                            )
                        )
                    hands_data.append(
                        HandData(
                            landmarks=landmark_list,
                            handedness="Right"  # 默认值，实际应用中可能需要从MediaPipe获取
                        )
                    )

            # 7. 检查是否检测到手语
            detected = predicted_label is not None and confidence > 0.5

            # 8. 构建结果
            result = RecognitionResult(
                success=True,
                detected=detected,
                predicted_class=predicted_label,
                confidence=confidence,
                message=(
                    "识别成功"
                    if detected
                    else ("未检测到手语手势" if confidence == 0.0 else "置信度太低")
                ),
                hands_count=hands_count,
                hands=hands_data,
                processing_time_ms=processing_time,
                timestamp=datetime.now()
            )

            logger.info(
                f"识别完成: {predicted_label} (置信度: {confidence:.2%}, "
                f"处理时间: {processing_time:.1f}ms, 手部数: {hands_count})"
            )

            return result

        except ValueError as e:
            logger.error(f"Base64图像解析失败: {str(e)}")
            return RecognitionResult(
                success=False,
                detected=False,
                predicted_class=None,
                confidence=0.0,
                message=f"图像解析失败: {str(e)}",
                processing_time_ms=(time.time() - start_time) * 1000,
                timestamp=datetime.now()
            )

        except Exception as e:
            logger.error(f"识别过程出错: {str(e)}")
            logger.debug(traceback.format_exc())
            return RecognitionResult(
                success=False,
                detected=False,
                predicted_class=None,
                confidence=0.0,
                message=f"识别失败: {str(e)}",
                processing_time_ms=(time.time() - start_time) * 1000,
                timestamp=datetime.now()
            )

    def recognize_with_visualization(self, base64_image: str) -> Tuple[RecognitionResult, str]:
        """
        识别手语并返回可视化结果

        Args:
            base64_image: Base64编码的图像字符串

        Returns:
            Tuple[识别结果, 可视化图像的Base64字符串]
        """
        start_time = time.time()

        try:
            # 1. 解析图像
            image = base64_to_image(base64_image)

            # 2. 预处理
            processed_image = preprocess_image_for_model(image)

            # 3. 识别
            predicted_label, confidence, hand_landmarks = self.recognizer.predict(processed_image)

            # 4. 创建可视化图像
            if hand_landmarks:
                visualization_image = create_visualization_image(
                    processed_image.copy(),
                    hand_landmarks,
                    predicted_label,
                    confidence
                )
            else:
                visualization_image = processed_image

            # 5. 转换为Base64
            visualization_base64 = image_to_base64(visualization_image)

            # 6. 计算处理时间
            processing_time = (time.time() - start_time) * 1000

            # 7. 构建结果
            result = RecognitionResult(
                success=True,
                detected=predicted_label is not None and confidence > 0.5,
                predicted_class=predicted_label,
                confidence=confidence,
                message=(
                    "识别成功"
                    if predicted_label
                    else "未检测到手语手势"
                ),
                hands_count=len(hand_landmarks) if hand_landmarks else 0,
                processing_time_ms=processing_time,
                timestamp=datetime.now()
            )

            return result, visualization_base64

        except Exception as e:
            logger.error(f"可视化识别失败: {str(e)}")
            error_result = RecognitionResult(
                success=False,
                detected=False,
                predicted_class=None,
                confidence=0.0,
                message=f"识别失败: {str(e)}",
                processing_time_ms=(time.time() - start_time) * 1000,
                timestamp=datetime.now()
            )
            return error_result, ""

    def get_service_info(self) -> Dict[str, Any]:
        """
        获取服务信息

        Returns:
            包含服务信息的字典
        """
        uptime = datetime.now() - self.start_time

        return {
            "service_name": "SignLink Translation Service",
            "service_version": "1.0.0",
            "uptime_seconds": uptime.total_seconds(),
            "translation_count": self.translation_count,
            "average_translations_per_minute": (
                self.translation_count / (uptime.total_seconds() / 60)
                if uptime.total_seconds() > 0
                else 0
            ),
            "recognizer_ready": self.recognizer.is_ready(),
            "model_info": self.recognizer.get_model_info(),
            "timestamp": datetime.now().isoformat()
        }

    def reset_statistics(self):
        """重置统计信息"""
        self.translation_count = 0
        self.start_time = datetime.now()
        logger.info("翻译服务统计信息已重置")

    def health_check(self) -> Dict[str, Any]:
        """
        健康检查

        Returns:
            包含健康状态信息的字典
        """
        return {
            "status": "healthy" if self.recognizer.is_ready() else "unhealthy",
            "recognizer_ready": self.recognizer.is_ready(),
            "model_loaded": self.recognizer.model is not None,
            "labels_loaded": len(self.recognizer.labels) > 0,
            "components": {
                "recognizer": "healthy" if self.recognizer.is_ready() else "error",
                "model": "healthy" if self.recognizer.model is not None else "error",
                "labels": "healthy" if len(self.recognizer.labels) > 0 else "error"
            },
            "timestamp": datetime.now().isoformat()
        }
