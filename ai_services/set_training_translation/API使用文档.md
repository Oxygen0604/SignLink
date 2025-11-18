# 🚀 手语识别 API 使用文档

## 📋 目录

- [快速开始](#快速开始)
- [API 端点](#api-端点)
- [前端调用示例](#前端调用示例)
- [错误处理](#错误处理)
- [部署指南](#部署指南)

---

## 🚀 快速开始

### 1. 启动 API 服务

```bash
# 激活虚拟环境
venv\Scripts\activate

# 启动优化的 API 服务器
python api_server.py
```

服务将在 `http://localhost:5000` 启动

### 2. 测试服务是否正常

访问: http://localhost:5000/api/health

---

## 📡 API 端点

### 1️⃣ 健康检查

**端点**: `GET /api/health`

**描述**: 检查服务是否正常运行

**请求示例**:

```bash
curl http://localhost:5000/api/health
```

**响应示例**:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "uptime_seconds": 1234.56,
  "request_count": 42,
  "timestamp": "2025-11-18T10:30:00.123456"
}
```

---

### 2️⃣ 获取模型信息

**端点**: `GET /api/info`

**描述**: 获取模型支持的手语词汇等信息

**请求示例**:

```bash
curl http://localhost:5000/api/info
```

**响应示例**:

```json
{
  "success": true,
  "model_info": {
    "num_classes": 2,
    "classes": ["hello", "thank"],
    "input_shape": [126],
    "description": "基于 MediaPipe 和 TensorFlow 的手语识别模型"
  }
}
```

---

### 3️⃣ 手语识别 (核心 API)

**端点**: `POST /api/predict`

**描述**: 识别图像中的手语手势

#### 请求参数

| 参数               | 类型    | 必需 | 默认值 | 说明                             |
| ------------------ | ------- | ---- | ------ | -------------------------------- |
| `image`            | string  | ✅   | -      | base64 编码的图像                |
| `draw_landmarks`   | boolean | ❌   | false  | 是否在返回的图像上绘制手部关键点 |
| `return_all_probs` | boolean | ❌   | false  | 是否返回所有类别的概率           |

#### 请求示例 (JavaScript)

```javascript
// 基本用法
const response = await fetch("http://localhost:5000/api/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    image: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    draw_landmarks: true,
    return_all_probs: false,
  }),
});

const result = await response.json();
console.log(result);
```

#### 响应示例 (检测到手势)

```json
{
  "success": true,
  "detected": true,
  "word": "hello",
  "confidence": 0.92,
  "annotated_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

#### 响应示例 (未检测到手势)

```json
{
  "success": true,
  "detected": false,
  "message": "未检测到手部"
}
```

#### 响应示例 (包含所有概率)

```json
{
  "success": true,
  "detected": true,
  "word": "hello",
  "confidence": 0.92,
  "all_predictions": {
    "hello": 0.92,
    "thank": 0.08
  }
}
```

---

## 💻 前端调用示例

### 示例 1: 纯 HTML + JavaScript

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>手语识别测试</title>
  </head>
  <body>
    <h1>手语识别 API 测试</h1>

    <!-- 视频显示 -->
    <video id="video" width="640" height="480" autoplay></video>
    <br />

    <!-- 控制按钮 -->
    <button onclick="startCamera()">启动摄像头</button>
    <button onclick="recognizeSign()">识别手语</button>

    <!-- 结果显示 -->
    <h2>识别结果:</h2>
    <p>单词: <span id="word">-</span></p>
    <p>置信度: <span id="confidence">-</span></p>

    <script>
      const video = document.getElementById("video");
      const API_URL = "http://localhost:5000/api/predict";

      // 启动摄像头
      async function startCamera() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          video.srcObject = stream;
        } catch (error) {
          alert("无法访问摄像头: " + error.message);
        }
      }

      // 识别手语
      async function recognizeSign() {
        // 捕获当前帧
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        // 转换为 base64
        const imageData = canvas.toDataURL("image/jpeg", 0.8);

        try {
          // 调用 API
          const response = await fetch(API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image: imageData,
              draw_landmarks: true,
            }),
          });

          const result = await response.json();

          // 显示结果
          if (result.success && result.detected) {
            document.getElementById("word").textContent = result.word;
            document.getElementById("confidence").textContent =
              (result.confidence * 100).toFixed(1) + "%";
          } else {
            document.getElementById("word").textContent = "未检测到";
            document.getElementById("confidence").textContent = "-";
          }
        } catch (error) {
          alert("API 调用失败: " + error.message);
        }
      }
    </script>
  </body>
</html>
```

---

### 示例 2: React 组件

```jsx
import React, { useRef, useState, useEffect } from "react";

const SignLanguageRecognizer = () => {
  const videoRef = useRef(null);
  const [result, setResult] = useState({ word: "-", confidence: 0 });
  const [isRecognizing, setIsRecognizing] = useState(false);

  const API_URL = "http://localhost:5000/api/predict";

  // 启动摄像头
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("无法访问摄像头:", error);
      }
    };

    startCamera();
  }, []);

  // 启动/停止识别
  const toggleRecognition = () => {
    setIsRecognizing(!isRecognizing);
  };

  // 持续识别
  useEffect(() => {
    if (!isRecognizing) return;

    const recognizeLoop = setInterval(async () => {
      await recognizeSign();
    }, 200); // 每 200ms 识别一次

    return () => clearInterval(recognizeLoop);
  }, [isRecognizing]);

  // 识别手语
  const recognizeSign = async () => {
    const video = videoRef.current;
    if (!video) return;

    // 捕获帧
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // 转换为 base64
    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();

      if (data.success && data.detected) {
        setResult({
          word: data.word,
          confidence: (data.confidence * 100).toFixed(1),
        });
      } else {
        setResult({ word: "未检测到", confidence: 0 });
      }
    } catch (error) {
      console.error("API 调用失败:", error);
    }
  };

  return (
    <div>
      <h1>手语识别</h1>
      <video ref={videoRef} width="640" height="480" autoPlay />
      <br />
      <button onClick={toggleRecognition}>
        {isRecognizing ? "停止识别" : "开始识别"}
      </button>
      <div>
        <h2>识别结果:</h2>
        <p>单词: {result.word}</p>
        <p>置信度: {result.confidence}%</p>
      </div>
    </div>
  );
};

export default SignLanguageRecognizer;
```

---

### 示例 3: Python 客户端

```python
import requests
import base64
import cv2

def recognize_sign_from_file(image_path):
    """从图像文件识别手语"""
    # 读取图像并转为 base64
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')

    # 调用 API
    response = requests.post(
        'http://localhost:5000/api/predict',
        json={
            'image': f'data:image/jpeg;base64,{image_data}',
            'draw_landmarks': True,
            'return_all_probs': True
        }
    )

    result = response.json()
    return result

def recognize_sign_from_camera():
    """从摄像头实时识别手语"""
    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # 显示原始画面
        cv2.imshow('Camera', frame)

        # 转换为 base64
        _, buffer = cv2.imencode('.jpg', frame)
        image_data = base64.b64encode(buffer).decode('utf-8')

        # 调用 API
        try:
            response = requests.post(
                'http://localhost:5000/api/predict',
                json={'image': f'data:image/jpeg;base64,{image_data}'}
            )
            result = response.json()

            if result['success'] and result['detected']:
                word = result['word']
                confidence = result['confidence']
                print(f"识别结果: {word} (置信度: {confidence:.2%})")
        except Exception as e:
            print(f"API 调用失败: {e}")

        # 按 'q' 退出
        if cv2.waitKey(200) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    # 测试 1: 识别图像文件
    # result = recognize_sign_from_file('test_image.jpg')
    # print(result)

    # 测试 2: 实时识别
    recognize_sign_from_camera()
```

---

## ⚠️ 错误处理

### 常见错误码

| 状态码 | 说明           | 解决方案                        |
| ------ | -------------- | ------------------------------- |
| 200    | 成功           | -                               |
| 400    | 请求参数错误   | 检查 JSON 格式和必需参数        |
| 404    | 端点不存在     | 检查 URL 路径                   |
| 413    | 请求体过大     | 图像大小不能超过 16MB           |
| 500    | 服务器内部错误 | 查看服务器日志 `api_server.log` |
| 503    | 服务不可用     | 模型未加载，重启服务            |

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述信息"
}
```

---

## 🌍 跨域访问 (CORS)

API 默认**允许所有来源**访问。如果需要限制特定域名，修改 `api_server.py`:

```python
# 限制只允许特定域名访问
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://yourdomain.com", "https://app.yourdomain.com"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

---

## 🚀 部署指南

### 1. 本地开发环境

```bash
# 启动开发服务器
python api_server.py
```

### 2. 生产环境 (使用 Gunicorn)

```bash
# 安装 Gunicorn
pip install gunicorn

# 启动生产服务器 (4个工作进程)
gunicorn -w 4 -b 0.0.0.0:5000 api_server:app
```

### 3. Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 复制文件
COPY requirements.txt .
COPY api_server.py .
COPY sign_language_model.h5 .
COPY sign_language_labels.json .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 暴露端口
EXPOSE 5000

# 启动服务
CMD ["python", "api_server.py"]
```

构建和运行:

```bash
# 构建镜像
docker build -t sign-language-api .

# 运行容器
docker run -p 5000:5000 sign-language-api
```

### 4. 使用 Nginx 反向代理

`/etc/nginx/sites-available/sign-language-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # CORS 头部
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    }
}
```

---

## 📊 性能优化建议

1. **图像压缩**: 前端发送前将图像压缩到适当大小 (建议 640x480)
2. **批量处理**: 如果需要处理多张图像，考虑添加批量 API
3. **缓存**: 对于重复的请求，可以在前端添加缓存
4. **CDN**: 如果有大量用户，使用 CDN 分发静态资源
5. **负载均衡**: 使用多个服务器实例 + 负载均衡器

---

## 📝 日志

服务会自动记录日志到 `api_server.log`:

```
2025-11-18 10:30:00 [INFO] 加载模型: sign_language_model.h5
2025-11-18 10:30:01 [INFO] 模型加载成功，支持 2 个类别: ['hello', 'thank']
2025-11-18 10:30:05 [INFO] 请求 #1 - POST /api/predict - IP: 127.0.0.1
2025-11-18 10:30:05 [INFO] 请求 #2 - POST /api/predict - IP: 127.0.0.1
```

---

## 🔒 安全建议

1. **API 密钥**: 生产环境添加 API 密钥认证
2. **速率限制**: 使用 Flask-Limiter 限制请求频率
3. **HTTPS**: 生产环境使用 HTTPS
4. **输入验证**: 严格验证所有输入参数
5. **日志脱敏**: 不要记录敏感信息

---

## 📞 技术支持

- 问题反馈: GitHub Issues
- 文档: 本文档
- 示例代码: `examples/` 目录

---

## 📄 许可证

MIT License

---

**祝你使用愉快！** 🎉
