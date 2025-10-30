
注意：现在这个WebSocket模块仅供测试使用，延迟巨高。最终实际成品应该会切换到使用WebRTC。其中已附上可以正常运行的index.html以供测试。
----
# IP Camera WebSocket Streamer

这是一个使用 FastAPI 和 OpenCV 构建的高性能后端服务。它的核心功能是接收来自IP摄像头的RTSP视频流，并将其通过WebSocket实时转发给前端客户端。

## 简介 (Introduction)

此项目旨在解决浏览器无法直接播放RTSP流的问题。通过部署此后端服务，前端应用可以通过标准的WebSocket连接，从任何支持RTSP协议的IP摄像头获取实时视频流，而无需复杂的浏览器插件。

该服务是无状态的，每个客户端连接都会创建一个独立的视频流拉取进程，客户端断开连接后资源会自动释放。

## 环境要求 (Prerequisites)

- Python 3.7+
- OpenCV
- FastAPI
- Uvicorn (ASGI服务器)
- WebSockets

你可以通过以下步骤安装所有依赖：

1.创建一个虚拟环境并激活它（当然不创建也行）
  

2.  运行以下命令安装依赖：
    ```bash
    pip install -r requirements.txt
    ```

## 如何运行 (How to Run)

在项目根目录下，使用 Uvicorn 启动服务。

**开发模式 (带热重载):**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**生产模式:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

服务启动后，将在 `http://0.0.0.0:8000` 上监听请求。

---

## API 接口说明 (API Documentation)

### 1. 健康检查 (Health Check)

此端点用于确认服务是否正在正常运行。

- **URL** : `/`
- **Method** : `GET`
- **Parameters** : 无
- **Success Response** :
    - **Code** : `200 OK`
    - **Content** :
      ```json
      {
        "status": "ok",
        "message": "Video Streaming Server is running."
      }
      ```

### 2. 视频流WebSocket端点

这是用于建立视频流传输的核心WebSocket端点。

- **URL** : `/ws/stream`
- **Protocol** : `WebSocket (ws)`
- **Query Parameters** :
    - `rtsp_url` (`string`, **必需**): IP摄像头的RTSP流地址。**此参数值必须经过URL编码 (URL-encoded)**。

      **示例**:
        - **原始RTSP地址**: `rtsp://admin:password123@192.168.1.108:554/stream1`
        - **编码后的地址**: `rtsp%3A%2F%2Fadmin%3Apassword123%40192.168.1.108%3A554%2Fstream1`

      **完整的连接URL示例**:
      ```
      ws://127.0.0.1:8000/ws/stream?rtsp_url=rtsp%3A%2F%2Fadmin%3Apassword123%40192.168.1.108%3A554%2Fstream1
      ```

#### 数据流

- **后端 -> 前端 (Server to Client)**:
    1.  **视频帧 (Binary Message)**:
        - **类型**: 二进制数据。
        - **内容**: 单个经过JPEG编码的视频帧。前端接收后可直接用于 `<img>` 标签的 `src` 或在 `<canvas>` 上绘制。

    2.  **错误信息 (Text Message)**:
        - **类型**: 文本数据 (JSON字符串)。
        - **内容**: 当无法连接到指定的RTSP地址时，服务器会发送一条JSON格式的错误信息，随后关闭连接。
        - **示例**:
          ```json
          {
            "error": "无法打开RTSP流: rtsp://..."
          }
          ```

- **前端 -> 后端 (Client to Server)**:
    - 在当前实现中，客户端在建立连接后无需向服务器发送任何数据。连接的生命周期由客户端主动关闭或网络中断来控制。