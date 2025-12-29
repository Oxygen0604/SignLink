"""
配置管理模块
用于管理后端服务的所有配置参数
"""

import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)


def _str_to_bool(value: str, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() == "true"


class Config:
    """应用配置类"""

    # 服务配置
    APP_NAME: str = os.environ.get("APP_NAME", "SignLink 手语翻译后端")
    APP_VERSION: str = os.environ.get("APP_VERSION", "1.0.0")
    DEBUG: bool = _str_to_bool(os.environ.get("DEBUG", "false"))

    # 服务器配置
    HOST: str = os.environ.get("HOST", "0.0.0.0")
    PORT: int = int(os.environ.get("PORT", "8000"))

    # 数据库配置
    DATABASE_URL: str = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'app', 'db.sqlite3')}"
    )

    # JWT配置
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "CHANGE_ME_SECRET")
    ALGORITHM: str = os.environ.get("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
    RESET_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("RESET_TOKEN_EXPIRE_MINUTES", "30"))

    # CORS配置
    CORS_ORIGINS: List[str] = [
        *(origin.strip() for origin in os.environ.get("CORS_ORIGINS", "").split(",") if origin.strip()),
        *([] if os.environ.get("CORS_ORIGINS") else [
            "http://localhost:3000",
            "http://localhost:19006",
            "http://127.0.0.1:19006",
            "http://127.0.0.1:3000",
        ])
    ]

    # 邮件配置
    MAIL_USERNAME: str = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.environ.get("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.environ.get("MAIL_FROM", "")
    MAIL_FROM_NAME: str = os.environ.get("MAIL_FROM_NAME", "SignLink 密码找回")
    MAIL_SERVER: str = os.environ.get("MAIL_SERVER", "")
    MAIL_PORT: int = int(os.environ.get("MAIL_PORT", "587"))
    MAIL_TLS: bool = _str_to_bool(os.environ.get("MAIL_TLS", "true"), True)
    MAIL_SSL: bool = _str_to_bool(os.environ.get("MAIL_SSL", "false"), False)

    # AI模型配置
    MODEL_PATH: str = os.path.join(
        BASE_DIR,
        "ai_services",
        "set_training_translation",
        "sign_language_model.h5"
    )

    LABELS_PATH: str = os.path.join(
        BASE_DIR,
        "ai_services",
        "set_training_translation",
        "sign_language_labels.json"
    )

    # MediaPipe配置
    MAX_NUM_HANDS: int = 2
    MIN_DETECTION_CONFIDENCE: float = 0.5
    MIN_TRACKING_CONFIDENCE: float = 0.5

    # API限流配置
    API_RATE_LIMIT: int = 100

    # 日志配置
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.environ.get("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")

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


config = Config()
