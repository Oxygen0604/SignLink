import asyncio
import cv2
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import urllib.parse

# 初始化FastAPI应用
app = FastAPI()

# 配置CORS中间件，允许所有来源的请求
# 在生产环境中，为了安全，你应该将其限制为你的前端域名
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有头部
)


class ConnectionManager:
    """管理WebSocket连接"""
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

    async def send_binary_data(self, data: bytes, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_bytes(data)

# 创建一个全局的连接管理器
manager = ConnectionManager()


@app.get("/")
def read_root():
    """根路径，用于健康检查"""
    return {"status": "ok", "message": "Video Streaming Server is running."}


@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket, rtsp_url: str):
    """
    WebSocket端点，用于处理视频流。
    前端通过查询参数 `rtsp_url` 提供IP摄像头的地址。
    例如: ws://localhost:8000/ws/stream?rtsp_url=rtsp%3A%2F%2F...
    """
    client_id = websocket.client.host + ":" + str(websocket.client.port)
    await manager.connect(websocket, client_id)
    
    # URL解码，因为查询参数可能会被编码
    decoded_rtsp_url = urllib.parse.unquote(rtsp_url)
    print(f"客户端 {client_id} 连接成功，尝试拉取视频流: {decoded_rtsp_url}")

    # 使用OpenCV打开RTSP视频流
    cap = cv2.VideoCapture(decoded_rtsp_url, cv2.CAP_FFMPEG)

    if not cap.isOpened():
        error_message = f"无法打开RTSP流: {decoded_rtsp_url}"
        print(error_message)
        await manager.send_personal_message(f'{{"error": "{error_message}"}}', client_id)
        manager.disconnect(client_id)
        return

    try:
        while True:
            # 读取一帧视频
            success, frame = cap.read()
            if not success:
                # 如果读取失败，可能是流的末尾或摄像头断开
                print(f"客户端 {client_id} 的视频流读取失败，关闭连接。")
                break

            # 将帧编码为JPEG格式
            ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if not ret:
                continue

            # 通过WebSocket发送二进制数据
            await manager.send_binary_data(buffer.tobytes(), client_id)

            # 控制帧率，避免后端CPU占用过高和前端处理不过来
            # 0.033秒约等于30fps
            await asyncio.sleep(0.033)

    except WebSocketDisconnect:
        print(f"客户端 {client_id} 主动断开连接。")
    except Exception as e:
        print(f"发生未知错误: {e}")
    finally:
        print(f"清理资源，关闭与客户端 {client_id} 的连接。")
        # 释放摄像头资源
        cap.release()
        # 从管理器中移除连接
        manager.disconnect(client_id)


# 启动应用的命令入口
if __name__ == "__main__":
    # 建议在生产环境中使用Gunicorn + Uvicorn工人模式
    uvicorn.run(app, host="0.0.0.0", port=8000)