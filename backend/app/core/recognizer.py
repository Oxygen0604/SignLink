"""
手语识别核心模块
负责加载模型、提取特征和进行预测
"""

import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from tensorflow import keras
import json
import os
import logging
from typing import List, Tuple, Optional
from datetime import datetime

# 配置日志
logger = logging.getLogger(__name__)

class SignLanguageRecognizer:
    """
    手语识别器
    核心功能：使用MediaPipe检测手部关键点，使用深度学习模型进行分类
    """

    def __init__(self, model_path: str, labels_path: str):
        """
        初始化识别器

        Args:
            model_path: 模型文件路径 (.h5格式)
            labels_path: 标签文件路径 (.json格式)
        """
        self.model = None
        self.labels = []
        self.model_path = model_path
        self.labels_path = labels_path

        # MediaPipe配置
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,  # 视频流模式
            max_num_hands=2,  # 最大检测2只手
            min_detection_confidence=0.5,  # 最小检测置信度
            min_tracking_confidence=0.5  # 最小跟踪置信度
        )
        self.mp_drawing = mp.solutions.drawing_utils

        # 加载模型和标签
        self._load_model()
        self._load_labels()

    def _load_model(self) -> bool:
        """
        加载TensorFlow模型

        Returns:
            是否加载成功
        """
        try:
            if not os.path.exists(self.model_path):
                logger.error(f"模型文件不存在: {self.model_path}")
                return False

            self.model = keras.models.load_model(self.model_path)
            logger.info(f"✅ 模型加载成功: {self.model_path}")
            logger.info(f"   模型输入形状: {self.model.input_shape}")
            logger.info(f"   模型输出形状: {self.model.output_shape}")

            return True

        except Exception as e:
            logger.error(f"❌ 模型加载失败: {str(e)}")
            return False

    def _load_labels(self) -> bool:
        """
        加载手语标签

        Returns:
            是否加载成功
        """
        try:
            if not os.path.exists(self.labels_path):
                logger.error(f"标签文件不存在: {self.labels_path}")
                return False

            with open(self.labels_path, 'r', encoding='utf-8') as f:
                label_data = json.load(f)
                self.labels = label_data.get('classes', [])

            logger.info(f"✅ 标签加载成功: {self.labels_path}")
            logger.info(f"   支持类别: {self.labels}")
            logger.info(f"   类别数量: {len(self.labels)}")

            return True

        except Exception as e:
            logger.error(f"❌ 标签加载失败: {str(e)}")
            return False

    def extract_features(self, image: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[List]]:
        """
        从图像中提取手部关键点特征

        Args:
            image: OpenCV格式的图像 (BGR)

        Returns:
            Tuple[特征向量, 手部关键点列表]
            - 特征向量: shape=(126,) 的numpy数组
            - 手部关键点列表: MediaPipe手部对象列表
            - 如果未检测到手，返回 (None, None)
        """
        try:
            # 将BGR转换为RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # 使用MediaPipe检测手部
            results = self.hands.process(image_rgb)

            # 如果没有检测到手部关键点
            if not results.multi_hand_landmarks:
                return None, None

            # 提取特征
            features = []
            hand_landmarks_list = []

            for hand_landmarks in results.multi_hand_landmarks:
                # 存储手部关键点
                hand_landmarks_list.append(hand_landmarks)

                # 提取该手的特征
                hand_features = []
                for landmark in hand_landmarks.landmark:
                    # 每个关键点有x, y, z三个坐标
                    hand_features.extend([landmark.x, landmark.y, landmark.z])

                # 将该手的特征添加到总特征中
                features.extend(hand_features)

            # 如果只检测到一只手，用零填充第二只手的特征
            if len(results.multi_hand_landmarks) == 1:
                features.extend([0.0] * 63)  # 21个关键点 * 3个坐标 = 63维

            # 确保特征向量长度不超过126维（2只手 * 21关键点 * 3坐标）
            features = features[:126]

            logger.debug(f"特征提取完成: 维度={len(features)}, 手部数={len(hand_landmarks_list)}")

            return np.array(features, dtype=np.float32), hand_landmarks_list

        except Exception as e:
            logger.error(f"特征提取失败: {str(e)}")
            return None, None

    def predict(self, image: np.ndarray) -> Tuple[Optional[str], Optional[float], Optional[List]]:
        """
        预测图像中的手语

        Args:
            image: OpenCV格式的图像 (BGR)

        Returns:
            Tuple[预测类别, 置信度, 手部关键点列表]
            - 预测类别: 手语标签字符串，如果未检测到手则为None
            - 置信度: 0-1之间的浮点数
            - 手部关键点列表: 用于可视化的关键点数据
        """
        try:
            # 检查模型是否加载
            if self.model is None or len(self.labels) == 0:
                logger.error("模型或标签未加载，无法进行预测")
                return None, None, None

            # 提取特征
            features, hand_landmarks = self.extract_features(image)

            # 如果没有检测到手部
            if features is None:
                return None, 0.0, None

            # 准备模型输入：添加batch维度
            features_input = features.reshape(1, -1)

            # 进行预测
            predictions = self.model.predict(features_input, verbose=0)

            # 获取最高概率的类别
            predicted_index = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_index])
            predicted_label = self.labels[predicted_index]

            logger.debug(f"预测结果: {predicted_label} (置信度: {confidence:.4f})")

            return predicted_label, confidence, hand_landmarks

        except Exception as e:
            logger.error(f"预测失败: {str(e)}")
            return None, None, None

    def draw_landmarks(self, image: np.ndarray, hand_landmarks_list: List) -> np.ndarray:
        """
        在图像上绘制手部关键点

        Args:
            image: OpenCV格式的图像 (BGR)
            hand_landmarks_list: MediaPipe手部关键点列表

        Returns:
            绘制关键点后的图像
        """
        try:
            for hand_landmarks in hand_landmarks_list:
                self.mp_drawing.draw_landmarks(
                    image,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    # 关键点样式：绿色小圆点
                    self.mp_drawing.DrawingSpec(
                        color=(0, 255, 0), thickness=2, circle_radius=2
                    ),
                    # 连接线样式：红色线条
                    self.mp_drawing.DrawingSpec(
                        color=(255, 0, 0), thickness=2
                    )
                )
            return image

        except Exception as e:
            logger.error(f"绘制关键点失败: {str(e)}")
            return image

    def get_model_info(self) -> dict:
        """
        获取模型信息

        Returns:
            包含模型信息的字典
        """
        return {
            "model_loaded": self.model is not None,
            "labels_loaded": len(self.labels) > 0,
            "model_path": self.model_path,
            "labels_path": self.labels_path,
            "num_classes": len(self.labels) if self.labels else 0,
            "classes": self.labels,
            "input_shape": str(self.model.input_shape) if self.model else None,
            "output_shape": str(self.model.output_shape) if self.model else None,
            "max_num_hands": self.hands.max_num_hands,
            "detection_confidence": self.hands.min_detection_confidence,
            "tracking_confidence": self.hands.min_tracking_confidence,
            "timestamp": datetime.now().isoformat()
        }

    def is_ready(self) -> bool:
        """
        检查识别器是否已准备好

        Returns:
            是否可以用于预测
        """
        return self.model is not None and len(self.labels) > 0

    def __del__(self):
        """析构函数，释放资源"""
        try:
            # 清理MediaPipe资源
            if hasattr(self, 'hands'):
                self.hands.close()
        except:
            pass
