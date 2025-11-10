"""
手语识别API路由
提供各种手语识别相关的HTTP接口
"""

import logging
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
import json

from ...models.schemas import (
    Base64ImageRequest,
    RecognitionResult,
    ModelInfo,
    HealthCheck,
    SuccessResponse,
    ErrorResponse
)
from ...services.translator import TranslationService

# 配置日志
logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter(prefix="/api", tags=["手语识别"])

def get_translation_service() -> TranslationService:
    """获取翻译服务实例（依赖注入）"""
    # 这里应该使用依赖注入框架，但为了简化，我们直接从应用实例获取
    from ....main import app
    return app.state.translation_service

@router.get("/health", response_model=HealthCheck, summary="健康检查")
async def health_check():
    """
    检查后端服务的健康状态

    返回服务状态、模型加载情况等信息
    """
    try:
        service = get_translation_service()
        health_info = service.health_check()

        return HealthCheck(
            status="healthy" if health_info["status"] == "healthy" else "unhealthy",
            service="SignLink 后端服务",
            version="1.0.0",
            model_loaded=health_info["model_loaded"],
            components=health_info["components"]
        )

    except Exception as e:
        logger.error(f"健康检查失败: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="服务不可用"
        )

@router.get("/model/info", response_model=ModelInfo, summary="获取模型信息")
async def get_model_info():
    """
    获取AI模型的相关信息

    包括模型路径、支持的手语类别、模型配置等
    """
    try:
        service = get_translation_service()
        model_info = service.recognizer.get_model_info()

        if not model_info["model_loaded"]:
            raise HTTPException(
                status_code=503,
                detail="模型未加载"
            )

        return ModelInfo(
            loaded=model_info["model_loaded"],
            model_path=model_info["model_path"],
            labels_path=model_info["labels_path"],
            num_classes=model_info["num_classes"],
            classes=model_info["classes"],
            input_shape=model_info["input_shape"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取模型信息失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"获取模型信息失败: {str(e)}"
        )

@router.get("/classes", response_model=List[str], summary="获取支持的手语类别")
async def get_supported_classes():
    """
    获取模型支持的所有手语类别列表

    Returns:
        支持的手语类别列表
    """
    try:
        service = get_translation_service()
        classes = service.recognizer.labels

        if not classes:
            raise HTTPException(
                status_code=503,
                detail="模型未加载或无标签"
            )

        return classes

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取手语类别失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"获取手语类别失败: {str(e)}"
        )

@router.post(
    "/recognize/realtime",
    response_model=RecognitionResult,
    summary="实时手语识别",
    description="接收前端传来的视频帧（Base64格式），返回手语识别结果"
)
async def recognize_realtime(request: Base64ImageRequest):
    """
    实时手语识别接口

    前端应定期发送视频帧（本接口不存储状态，每次请求独立处理）

    Args:
        request: 包含Base64图像的请求体

    Returns:
        RecognitionResult: 识别结果
    """
    try:
        logger.info("收到实时识别请求")
        logger.debug(f"图像大小: {len(request.image)} 字符")

        # 调用翻译服务进行识别
        service = get_translation_service()
        result = service.recognize_from_base64(
            base64_image=request.image,
            format=request.format,
            quality=request.quality
        )

        return result

    except ValueError as e:
        logger.warning(f"图像解析错误: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"图像格式错误: {str(e)}"
        )
    except Exception as e:
        logger.error(f"实时识别失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"识别过程失败: {str(e)}"
        )

@router.post(
    "/recognize/upload",
    response_model=RecognitionResult,
    summary="上传文件识别",
    description="接收上传的图片或视频文件，返回手语识别结果"
)
async def recognize_upload(
    file: UploadFile = File(..., description="上传的图片或视频文件"),
    format: str = Form("jpeg", description="输出图像格式"),
    quality: int = Form(80, description="图像质量（1-100）")
):
    """
    上传文件识别接口

    支持常见图片格式：jpg, jpeg, png
    支持常见视频格式：mp4, avi, mov

    Args:
        file: 上传的文件
        format: 输出格式（仅对视频有效）
        quality: 图像质量

    Returns:
        RecognitionResult: 识别结果
    """
    try:
        logger.info(f"收到文件上传识别请求: {file.filename}")

        # 检查文件类型
        if file.content_type and not file.content_type.startswith(('image/', 'video/')):
            raise HTTPException(
                status_code=400,
                detail="只支持图片和视频文件"
            )

        # 读取文件内容
        file_content = await file.read()

        # 这里可以添加对视频文件的处理逻辑
        # 目前简化处理：如果是视频，只处理第一帧

        # 将文件内容转换为Base64
        import base64
        base64_content = base64.b64encode(file_content).decode('utf-8')
        base64_string = f"data:{file.content_type};base64,{base64_content}"

        # 调用翻译服务进行识别
        service = get_translation_service()
        result = service.recognize_from_base64(
            base64_image=base64_string,
            format=format,
            quality=quality
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"文件识别失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"文件识别失败: {str(e)}"
        )

@router.post(
    "/recognize/visualize",
    response_model=dict,
    summary="识别并返回可视化图像",
    description="返回带有手部关键点标注的可视化图像"
)
async def recognize_with_visualization(request: Base64ImageRequest):
    """
    识别手语并返回可视化结果

    除了识别结果，还会返回绘制了手部关键点的图像

    Args:
        request: 包含Base64图像的请求体

    Returns:
        包含识别结果和可视化图像的字典
    """
    try:
        logger.info("收到可视化识别请求")

        # 调用翻译服务
        service = get_translation_service()
        result, visualization_base64 = service.recognize_with_visualization(
            base64_image=request.image
        )

        return {
            "success": result.success,
            "result": result.dict(),
            "visualization": visualization_base64
        }

    except ValueError as e:
        logger.warning(f"图像解析错误: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"图像格式错误: {str(e)}"
        )
    except Exception as e:
        logger.error(f"可视化识别失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"识别过程失败: {str(e)}"
        )

@router.get(
    "/service/info",
    response_model=dict,
    summary="获取服务信息",
    description="获取翻译服务的运行状态和统计信息"
)
async def get_service_info():
    """
    获取翻译服务的详细信息

    包括运行时间、翻译次数、模型信息等
    """
    try:
        service = get_translation_service()
        return service.get_service_info()

    except Exception as e:
        logger.error(f"获取服务信息失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"获取服务信息失败: {str(e)}"
        )

@router.post(
    "/service/reset-stats",
    response_model=SuccessResponse,
    summary="重置统计信息",
    description="重置翻译服务的统计计数器"
)
async def reset_statistics():
    """
    重置翻译服务的统计信息

    包括翻译次数计数器等
    """
    try:
        service = get_translation_service()
        service.reset_statistics()

        return SuccessResponse(message="统计信息已重置")

    except Exception as e:
        logger.error(f"重置统计信息失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"重置失败: {str(e)}"
        )

# ========== 错误处理器 ==========

@router.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP异常处理器"""
    from datetime import datetime
    logger.warning(f"HTTP异常: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error_code": f"HTTP_{exc.status_code}",
            "error_message": exc.detail
        }
    )

@router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """通用异常处理器"""
    from datetime import datetime
    logger.error(f"未处理异常: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error_code": "INTERNAL_SERVER_ERROR",
            "error_message": "服务器内部错误"
        }
    )
