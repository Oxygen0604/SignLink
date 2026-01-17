"""
SignLink 手语翻译后端服务
基于FastAPI构建的RESTful API服务
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import Body, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

# 导入日志配置
from .utils.logger_config import setup_logging

# 配置主日志记录器
logger = setup_logging(
    logger_name=__name__,
    level="INFO",  # 默认级别，可以通过环境变量覆盖
    format_string="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    log_to_file=True,
    log_file="backend.log"
)

# 导入配置和模块
from .core.config import config
# from .core.recognizer import SignLanguageRecognizer  <-- Removed unused import
from .services.translator import TranslationService
from .utils.common_utils import service_manager, get_service_response
from .utils.error_handler import ErrorResponse
from .database import Base, engine
from .routers import auth as auth_router
from .routers import users as users_router
from .routers import quiz as quiz_router
from .models.quiz import Question, UserQuizRecord
from .database import SessionLocal

# 导入API路由
from .api.routes.flask_compat import router as flask_compat_router, init_translator

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    包含启动和关闭时的处理逻辑
    """
    # ========== 启动逻辑 ==========
    logger.info("=" * 60)
    logger.info(f"🚀 启动 {config.APP_NAME} v{config.APP_VERSION}")
    logger.info("=" * 60)

    # 初始化数据库
    try:
        logger.info("正在加载数据库模型...")
        from . import models
        logger.info("✅ 数据库模型加载完成")
        
        Base.metadata.create_all(bind=engine)
        logger.info("✅ 数据库表检查完成")
    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {str(e)}")

    # 初始化识别器（使用ai_services的方式）
    try:
        logger.info("正在初始化手语识别器...")
        # 与ai_services保持一致：使用全局变量
        from .api.routes.flask_compat import translator as global_translator
        if init_translator():
            translation_service = TranslationService(global_translator)
            service_manager.set_service(translation_service)
            logger.info("✅ 识别器初始化成功！")
        else:
            logger.warning("识别器未初始化，相关接口将返回未就绪")

    except Exception as e:
        logger.error(f"❌ 服务启动失败: {str(e)}")
        logger.error("详细错误信息:", exc_info=True)

    # 启动完成
    logger.info("=" * 60)
    logger.info("✅ 后端服务启动完成！")
    logger.info(f"📍 服务地址: http://{config.HOST}:{config.PORT}")
    logger.info(f"📖 API文档: http://{config.HOST}:{config.PORT}/docs")
    logger.info("=" * 60)
    

    yield  # 应用运行期间

    # ========== 关闭逻辑 ==========
    logger.info("🛑 正在关闭后端服务...")

    try:
        # 清理资源
        service = service_manager.get_service()
        if service:
            # 重置统计信息
            service.reset_statistics()
            logger.info("✅ 翻译服务统计信息已重置")

        # 关闭识别器
        service = service_manager.get_service()
        if service and hasattr(service, 'recognizer'):
            service.recognizer.close()
            logger.info("✅ 识别器已关闭")

    except Exception as e:
        logger.error(f"❌ 关闭服务时出错: {str(e)}")

    logger.info("👋 后端服务已关闭")

# 创建FastAPI应用实例
app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    description=(
        "SignLink手语翻译系统后端API服务\n\n"
        "功能特性：\n"
        "- 实时手语识别\n"
        "- 支持图片/视频上传识别\n"
        "- 返回可视化结果（手部关键点标注）\n"
        "- 健康检查和模型信息查询\n"
    ),
    lifespan=lifespan,
    docs_url="/docs" if config.DEBUG else None,  # 生产环境可关闭文档
    redoc_url="/redoc" if config.DEBUG else None
)

# ========== 中间件配置 ==========

# CORS中间件 - 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# GZip压缩中间件 - 压缩响应数据
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ========== 路由注册 ==========

# 根路径
@app.get("/", summary="根路径")
async def root():
    """
    根路径，返回服务基本信息
    """
    return {
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "status": "running",
        "message": "SignLink手语翻译后端服务正在运行",
        "docs": "/docs" if config.DEBUG else "文档已禁用",
        "health": "/api/health"
    }

# 注册API路由
# 注册与ai_services兼容的路由（优先级高，放在前面）
app.include_router(flask_compat_router)

# 注册新的API路由
app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(quiz_router.router)
 

@app.post("/recognize/realtime")
async def recognize_realtime_root(payload: dict = Body(...)):
    if not service_manager.is_service_ready():
        return ErrorResponse.service_unavailable("服务未初始化")

    image = payload.get("image")
    fmt = payload.get("format", "jpeg")
    quality = int(payload.get("quality", 80))

    if not image:
        return ErrorResponse.bad_request("缺少图像数据")

    service = service_manager.get_service()
    result = service.recognize_from_base64(image, format=fmt, quality=quality)

    # 添加到历史记录
    if result.detected and result.predicted_class:
        service_manager.add_to_history(result.predicted_class, result.predicted_class)

    return get_service_response(result)

@app.post("/recognize/batch")
async def recognize_batch_root(payload: dict = Body(...)):
    if not service_manager.is_service_ready():
        return ErrorResponse.service_unavailable("服务未初始化")

    images = payload.get("images", [])
    fmt = payload.get("format", "jpeg")
    quality = int(payload.get("quality", 80))

    if not images:
        return ErrorResponse.bad_request("缺少图像数据")

    service = service_manager.get_service()
    outputs = []

    for img in images:
        result = service.recognize_from_base64(img, format=fmt, quality=quality)
        outputs.append(get_service_response(result))

        # 添加到历史记录
        if result.detected and result.predicted_class:
            service_manager.add_to_history(result.predicted_class, result.predicted_class)

    return {"success": True, "results": outputs}

@app.get("/recognize/history")
async def recognize_history_root():
    history = service_manager.get_history()
    return {"success": True, "history": history}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    from .utils.common_utils import parse_websocket_payload, create_websocket_response
    import json

    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()

            # 解析消息
            payload, error_msg = parse_websocket_payload(data)
            if error_msg:
                await ws.send_text(json.dumps({"type": "error", "message": error_msg}, ensure_ascii=False))
                continue

            # 处理图像识别请求
            if isinstance(payload, dict) and payload.get("type") == "image":
                img = payload.get("data")
                if not img:
                    resp = create_websocket_response(error_message="缺少图像数据")
                elif not service_manager.is_service_ready():
                    resp = create_websocket_response(service_ready=False)
                else:
                    service = service_manager.get_service()
                    result = service.recognize_from_base64(img)
                    predicted_class = result.predicted_class if result.success else None
                    resp = create_websocket_response(predicted_class=predicted_class)

                    # 添加到历史记录
                    if result.detected and result.predicted_class:
                        service_manager.add_to_history(result.predicted_class, result.predicted_class)

                await ws.send_text(json.dumps(resp, ensure_ascii=False))

            # 处理答题请求 (Secure Flow)
            elif isinstance(payload, dict) and payload.get("type") == "answer_request":
                img = payload.get("frame") or payload.get("data")
                question_id = payload.get("question_id")
                user_id = payload.get("user_id")  # 临时方案：从payload获取用户ID

                if not img:
                    resp = {"type": "answer_response", "error": "缺少图像数据"}
                elif not question_id:
                    resp = {"type": "answer_response", "error": "缺少题目ID"}
                elif not service_manager.is_service_ready():
                    resp = {"type": "answer_response", "error": "服务未初始化"}
                else:
                    try:
                        # 1. 识别
                        service = service_manager.get_service()
                        result = service.recognize_from_base64(img)
                        predicted_word = result.predicted_class if (result.success and result.detected) else None

                        if not predicted_word:
                            resp = {
                                "type": "answer_response",
                                "is_correct": False,
                                "answer": None,
                                "message": "未检测到手势或识别失败"
                            }
                        else:
                            # 2. 验证与存库
                            with SessionLocal() as db:
                                question = db.query(Question).filter(Question.id == question_id).first()
                                if not question:
                                    resp = {"type": "answer_response", "error": "题目不存在"}
                                else:
                                    # 不区分大小写比对
                                    is_correct = (predicted_word.lower().strip() == question.answer.lower().strip())

                                    # 保存记录 (如果有user_id)
                                    if user_id:
                                        try:
                                            uid = int(user_id)
                                            new_record = UserQuizRecord(
                                                user_id=uid,
                                                question_id=question_id,
                                                is_correct=is_correct,
                                                user_gesture_result=predicted_word
                                            )
                                            db.add(new_record)
                                            db.commit()
                                        except ValueError:
                                            logger.warning(f"无效的user_id格式: {user_id}")

                                    resp = {
                                        "type": "answer_response",
                                        "is_correct": is_correct,
                                        "answer": predicted_word
                                    }
                    except Exception as e:
                        logger.error(f"答题处理错误: {str(e)}")
                        resp = {"type": "answer_response", "error": f"服务器错误: {str(e)}"}

                await ws.send_text(json.dumps(resp, ensure_ascii=False))

            # 处理普通消息
            elif isinstance(payload, dict) and "message" in payload:
                msg = str(payload.get("message"))
                await ws.send_text(json.dumps({"response": msg}, ensure_ascii=False))

            else:
                resp = create_websocket_response(error_message="不支持的消息类型")
                await ws.send_text(json.dumps(resp, ensure_ascii=False))

    except WebSocketDisconnect:
        logger.info("WebSocket客户端断开连接")
        return
    except Exception as e:
        logger.error(f"WebSocket处理错误: {str(e)}")
        try:
            error_resp = create_websocket_response(error_message=f"服务器错误: {str(e)}")
            await ws.send_text(json.dumps(error_resp, ensure_ascii=False))
        except:
            pass

# ========== 启动方式 ==========

if __name__ == "__main__":
    import uvicorn

    logger.info("使用uvicorn直接启动服务...")
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
        log_level=config.LOG_LEVEL.lower(),
        access_log=True
    )
