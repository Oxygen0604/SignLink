"""
SignLink 手语翻译后端服务
基于FastAPI构建的RESTful API服务
"""

import logging
import sys
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

# 配置日志格式
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("backend.log", encoding="utf-8")
    ]
)

logger = logging.getLogger(__name__)

# 导入配置和模块
from .core.config import config
from .core.recognizer import SignLanguageRecognizer
from .services.translator import TranslationService

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

    # 初始化识别器（使用ai_services的方式）
    try:
        logger.info("正在初始化手语识别器...")
        # 与ai_services保持一致：使用全局变量
        from .api.routes.flask_compat import translator as global_translator
        if init_translator():
            app.state.translation_service = TranslationService(global_translator)
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
        if hasattr(app.state, 'translation_service'):
            # 重置统计信息
            app.state.translation_service.reset_statistics()
            logger.info("✅ 翻译服务已清理")

        # 关闭识别器
        if 'recognizer' in locals():
            recognizer.__del__()
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
 

@app.post("/recognize/realtime")
async def recognize_realtime_root(payload: dict = Body(...)):
    service = getattr(app.state, 'translation_service', None)
    if service is None:
        return {"success": False, "message": "服务未初始化"}
    image = payload.get("image")
    fmt = payload.get("format", "jpeg")
    quality = int(payload.get("quality", 80))
    result = service.recognize_from_base64(image, format=fmt, quality=quality)
    return {
        "success": result.success,
        "detected": result.detected,
        "word": result.predicted_class,
        "confidence": result.confidence,
    }

@app.post("/recognize/batch")
async def recognize_batch_root(payload: dict = Body(...)):
    service = getattr(app.state, 'translation_service', None)
    if service is None:
        return {"success": False, "message": "服务未初始化"}
    images = payload.get("images", [])
    fmt = payload.get("format", "jpeg")
    quality = int(payload.get("quality", 80))
    outputs = []
    for img in images:
        r = service.recognize_from_base64(img, format=fmt, quality=quality)
        outputs.append({
            "success": r.success,
            "detected": r.detected,
            "word": r.predicted_class,
            "confidence": r.confidence,
        })
    return {"success": True, "results": outputs}

_history = []

@app.get("/recognize/history")
async def recognize_history_root():
    return {"success": True, "history": _history[-100:]}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            try:
                import json
                payload = json.loads(data)
            except Exception:
                await ws.send_text('{"type":"error","message":"invalid json"}')
                continue
            service = getattr(app.state, 'translation_service', None)
            if isinstance(payload, dict) and payload.get("type") == "image":
                img = payload.get("data")
                if service:
                    r = service.recognize_from_base64(img)
                    resp = {
                        "type": "recognition_result",
                        "data": r.model_dump() if hasattr(r, "model_dump") else r.dict(),
                        "signInput": r.predicted_class or "",
                        "signTranslation": r.predicted_class or "",
                    }
                else:
                    resp = {
                        "type": "recognition_result",
                        "data": {
                            "success": False,
                            "detected": False,
                            "predicted_class": None,
                            "confidence": 0.0,
                            "message": "service not ready",
                        },
                        "signInput": "",
                        "signTranslation": "",
                    }
                _history.append({
                    "signInput": resp["signInput"],
                    "signTranslation": resp["signTranslation"],
                })
                await ws.send_text(json.dumps(resp, ensure_ascii=False))
            elif isinstance(payload, dict) and "message" in payload:
                msg = str(payload.get("message"))
                await ws.send_text(json.dumps({"response": msg}, ensure_ascii=False))
            else:
                await ws.send_text('{"type":"error","message":"unsupported payload"}')
    except WebSocketDisconnect:
        return

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
