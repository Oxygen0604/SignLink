"""
配置管理模块
用于管理后端服务的所有配置参数
"""

import os
from typing import List
from functools import lru_cache

class Config:
    """应用配置类"""

    # 服务配置
    APP_NAME: str = "SignLink 手语翻译后端"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS配置
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React开发服务器
        "http://localhost:19006",  # React Native Metro
        "http://127.0.0.1:19006",
        "http://127.0.0.1:3000",
    ]

    # AI模型配置
    # 模型文件路径 - 可以根据环境变量调整
    MODEL_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "ai_services",
        "set_training_translation",
        "sign_language_model.h5"
    )

    # 标签文件路径
    LABELS_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "ai_services",
        "set_training_translation",
        "sign_language_labels.json"
    )

    # MediaPipe配置
    MAX_NUM_HANDS: int = 2  # 最大检测手部数量
    MIN_DETECTION_CONFIDENCE: float = 0.5  # 最小检测置信度
    MIN_TRACKING_CONFIDENCE: float = 0.5  # 最小跟踪置信度

    # API限流配置
    API_RATE_LIMIT: int = 100  # 每分钟最大请求数

    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    @classmethod
    @lru_cache()
    def get_model_path(cls) -> str:
        """获取模型文件路径，支持环境变量覆盖"""
        return os.environ.get("SIGNLANG_MODEL_PATH", cls.MODEL_PATH)

    @classmethod
    @lru_cache()
    def get_labels_path(cls) -> str:
        """获取标签文件路径，支持环境变量覆盖"""
        return os.environ.get("SIGNLANG_LABELS_PATH", cls.LABELS_PATH)

# 创建配置实例
config = Config()
