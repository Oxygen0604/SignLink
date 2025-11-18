"""
简化后端服务
用于测试基础架构，不依赖TensorFlow和MediaPipe
"""

import uvicorn
from fastapi import FastAPI, WebSocket, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import base64
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title="SignLink 简化后端测试",
    version="1.0.0",
    description="简化版本的后端服务，用于测试基础架构"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局状态
class MockService:
    def __init__(self):
        self.ready = True
        self.history: List[Dict[str, Any]] = []
        self.labels = ["你好", "谢谢", "再见", "我爱你", "帮助"]

    def recognize_from_base64(self, image_data: str) -> Dict[str, Any]:
        """模拟识别功能"""
        # 简单的模拟：随机返回一个标签
        import random
        predicted = random.choice(self.labels)
        confidence = random.uniform(0.7, 0.95)

        return {
            "success": True,
            "detected": True,
            "predicted_class": predicted,
            "confidence": confidence,
            "message": "识别成功",
            "processing_time_ms": 50.0,
            "timestamp": datetime.now().isoformat()
        }

mock_service = MockService()

@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "SignLink 简化后端测试",
        "version": "1.0.0",
        "status": "running",
        "message": "简化后端服务正在运行",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service_ready": mock_service.ready,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/recognize/history")
async def get_history():
    """获取历史记录"""
    return {
        "success": True,
        "history": mock_service.history[-100:]
    }

@app.post("/api/init")
async def init_model():
    """初始化模型"""
    return {
        "success": True,
        "message": "模型初始化成功（模拟）",
        "num_classes": len(mock_service.labels),
        "classes": mock_service.labels
    }

@app.post("/api/predict")
async def predict(request: dict = Body(...)):
    """预测接口"""
    try:
        # 模拟预测
        result = mock_service.recognize_from_base64("dummy_image_data")

        return {
            "success": True,
            "detected": result["detected"],
            "word": result["predicted_class"],
            "confidence": result["confidence"],
            "annotated_image": "data:image/jpeg;base64,dummy_image"
        }
    except Exception as e:
        logger.error(f"预测失败: {e}")
        return {
            "success": False,
            "message": f"预测失败: {str(e)}"
        }

@app.post("/recognize/realtime")
async def recognize_realtime(payload: dict = Body(...)):
    """实时识别"""
    try:
        image = payload.get("image")
        if not image:
            return {"success": False, "message": "缺少图像数据"}

        result = mock_service.recognize_from_base64(image)

        # 添加到历史记录
        if result["detected"] and result["predicted_class"]:
            mock_service.history.append({
                "signInput": result["predicted_class"],
                "signTranslation": result["predicted_class"],
                "timestamp": datetime.now().isoformat()
            })

        return {
            "success": result["success"],
            "detected": result["detected"],
            "word": result["predicted_class"],
            "confidence": result["confidence"]
        }
    except Exception as e:
        logger.error(f"实时识别失败: {e}")
        return {"success": False, "message": f"识别失败: {str(e)}"}

@app.post("/recognize/batch")
async def recognize_batch(payload: dict = Body(...)):
    """批量识别"""
    try:
        images = payload.get("images", [])
        if not images:
            return {"success": False, "message": "缺少图像数据"}

        results = []
        for img in images:
            result = mock_service.recognize_from_base64(img)
            results.append({
                "success": result["success"],
                "detected": result["detected"],
                "word": result["predicted_class"],
                "confidence": result["confidence"]
            })

            # 添加到历史记录
            if result["detected"] and result["predicted_class"]:
                mock_service.history.append({
                    "signInput": result["predicted_class"],
                    "signTranslation": result["predicted_class"],
                    "timestamp": datetime.now().isoformat()
                })

        return {"success": True, "results": results}
    except Exception as e:
        logger.error(f"批量识别失败: {e}")
        return {"success": False, "message": f"批量识别失败: {str(e)}"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket端点"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "message": "invalid json"}))
                continue

            if isinstance(payload, dict) and payload.get("type") == "image":
                img = payload.get("data")
                result = mock_service.recognize_from_base64(img)

                # 添加到历史记录
                if result["detected"] and result["predicted_class"]:
                    mock_service.history.append({
                        "signInput": result["predicted_class"],
                        "signTranslation": result["predicted_class"],
                        "timestamp": datetime.now().isoformat()
                    })

                resp = {
                    "type": "recognition_result",
                    "data": result,
                    "signInput": result["predicted_class"] or "",
                    "signTranslation": result["predicted_class"] or ""
                }
                await websocket.send_text(json.dumps(resp, ensure_ascii=False))

            elif isinstance(payload, dict) and "message" in payload:
                msg = str(payload.get("message"))
                await websocket.send_text(json.dumps({"response": msg}, ensure_ascii=False))

            else:
                await websocket.send_text(json.dumps({"type": "error", "message": "unsupported payload"}))

    except Exception as e:
        logger.error(f"WebSocket错误: {e}")
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": f"服务器错误: {str(e)}"}))
        except:
            pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")