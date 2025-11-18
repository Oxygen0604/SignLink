"""
统一错误处理工具模块
提供标准化的错误响应格式和处理逻辑
"""

from ..utils.logger_config import get_module_logger
import logging
from typing import Dict, Any, Optional
from fastapi.responses import JSONResponse
from fastapi import status

logger = get_module_logger(__name__)

class ErrorResponse:
    """标准化错误响应类"""

    @staticmethod
    def create(
        message: str,
        error_type: str = "error",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ) -> JSONResponse:
        """
        创建标准化的错误响应

        Args:
            message: 错误消息
            error_type: 错误类型
            status_code: HTTP状态码
            details: 额外的错误详情

        Returns:
            JSONResponse: 标准化的错误响应
        """
        response_data = {
            "success": False,
            "message": message,
            "error_type": error_type,
            "status_code": status_code
        }

        if details:
            response_data["details"] = details

        logger.error(f"错误响应: {message} (类型: {error_type}, 状态码: {status_code})")

        return JSONResponse(
            status_code=status_code,
            content=response_data
        )

    @staticmethod
    def service_unavailable(message: str = "服务未就绪") -> JSONResponse:
        """服务不可用错误"""
        return ErrorResponse.create(
            message=message,
            error_type="service_unavailable",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    @staticmethod
    def bad_request(message: str = "请求参数错误") -> JSONResponse:
        """请求参数错误"""
        return ErrorResponse.create(
            message=message,
            error_type="bad_request",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    @staticmethod
    def internal_error(message: str = "服务器内部错误") -> JSONResponse:
        """服务器内部错误"""
        return ErrorResponse.create(
            message=message,
            error_type="internal_error",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    @staticmethod
    def not_found(message: str = "资源未找到") -> JSONResponse:
        """资源未找到错误"""
        return ErrorResponse.create(
            message=message,
            error_type="not_found",
            status_code=status.HTTP_404_NOT_FOUND
        )

class ServiceError(Exception):
    """服务层自定义异常"""

    def __init__(self, message: str, error_type: str = "service_error", details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.error_type = error_type
        self.details = details or {}
        super().__init__(self.message)

class RecognitionError(ServiceError):
    """识别相关错误"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "recognition_error", details)

class ModelError(ServiceError):
    """模型相关错误"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "model_error", details)

class ImageProcessingError(ServiceError):
    """图像处理错误"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "image_processing_error", details)

def handle_service_error(error: ServiceError) -> JSONResponse:
    """
    处理服务层异常

    Args:
        error: 服务层异常

    Returns:
        JSONResponse: 对应的错误响应
    """
    error_map = {
        "recognition_error": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "model_error": status.HTTP_503_SERVICE_UNAVAILABLE,
        "image_processing_error": status.HTTP_400_BAD_REQUEST,
        "service_error": status.HTTP_500_INTERNAL_SERVER_ERROR
    }

    status_code = error_map.get(error.error_type, status.HTTP_500_INTERNAL_SERVER_ERROR)

    return ErrorResponse.create(
        message=error.message,
        error_type=error.error_type,
        status_code=status_code,
        details=error.details
    )