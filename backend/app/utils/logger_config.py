"""
日志配置模块
统一配置和管理应用程序的日志系统
"""

import logging
import logging.handlers
import sys
import os
from typing import Optional

def setup_logging(
    logger_name: Optional[str] = None,
    level: str = "INFO",
    format_string: Optional[str] = None,
    log_to_file: bool = True,
    log_file: str = "backend.log",
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> logging.Logger:
    """
    配置日志系统

    Args:
        logger_name: 日志记录器名称
        level: 日志级别
        format_string: 日志格式字符串
        log_to_file: 是否写入文件
        log_file: 日志文件路径
        max_bytes: 日志文件最大字节数（用于轮转）
        backup_count: 备份文件数量

    Returns:
        配置好的日志记录器
    """
    # 默认日志格式
    if format_string is None:
        format_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # 创建日志记录器
    logger = logging.getLogger(logger_name)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # 清除现有的处理器
    logger.handlers.clear()

    # 创建格式化器
    formatter = logging.Formatter(format_string)

    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 文件处理器（如果启用）
    if log_to_file:
        try:
            # 确保日志目录存在
            log_dir = os.path.dirname(log_file)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir)

            # 使用轮转文件处理器
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=max_bytes,
                backupCount=backup_count,
                encoding='utf-8'
            )
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.warning(f"无法创建文件日志处理器: {str(e)}")

    return logger

def get_module_logger(module_name: str) -> logging.Logger:
    """
    获取模块专用的日志记录器

    Args:
        module_name: 模块名称

    Returns:
        模块日志记录器
    """
    return logging.getLogger(module_name)

# 通用的日志级别配置
LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL
}