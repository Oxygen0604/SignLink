# SignLink 手语翻译后端

> 本节为"识别功能"的权威说明，覆盖依赖安装、启动、配置、HTTP/WS 接口与验证。下方历史章节保留兼容参考。

## 🔧 2025年11月重要更新

本次更新修复了以下关键问题，显著提升了代码质量和稳定性：

### ✅ 修复内容
- **跨平台兼容性**: 修复Windows路径分隔符问题，支持Linux/macOS部署
- **线程安全**: 添加全局变量线程锁保护，防止并发访问冲突
- **错误处理**: 统一错误响应格式，标准化HTTP状态码
- **资源管理**: 优化内存释放机制，防止资源泄漏
- **代码重构**: 提取公共工具函数，消除重复代码
- **日志统一**: 统一日志框架，支持文件轮转和UTF-8编码

### ⚠️ 依赖兼容性说明
- TensorFlow 2.17.1与MediaPipe存在版本兼容问题（ml_dtypes冲突）
- 建议使用Docker容器化部署或conda独立环境
- 提供简化测试版本用于基础功能验证

## 识别功能权威指南

### 环境与依赖
- 推荐使用 Conda：`conda create -n Signlink python=3.11 && conda activate Signlink`
- 安装锁定依赖：`pip install tensorflow==2.17.1 mediapipe==0.10.21 fastapi==0.104.1 uvicorn==0.24.0 python-multipart python-dotenv`

### 配置（backend/.env）
- 变量：`APP_NAME, APP_VERSION, DEBUG, HOST, PORT, LOG_LEVEL, LOG_FORMAT, CORS_ORIGINS, SIGNLANG_MODEL_PATH, SIGNLANG_LABELS_PATH`
- 示例（详见 backend/.env.example）：
```
APP_NAME=SignLink 手语翻译后端
APP_VERSION=1.0.0
DEBUG=false
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://127.0.0.1:19006,http://127.0.0.1:3000
SIGNLANG_MODEL_PATH=ai_services/set_training_translation/sign_language_model.h5
SIGNLANG_LABELS_PATH=ai_services/set_training_translation/sign_language_labels.json
```

### 启动
```
conda activate Signlink
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
- 文档：`http://localhost:8000/docs`（需 `.env` 设置 `DEBUG=true`）

### HTTP 接口（仅识别）
- POST `/recognize/realtime`
  - 请求：`{ image: Base64, format: 'jpeg', quality: 80 }`
  - 响应：`{ success, detected, word, confidence }`
- POST `/recognize/batch`
  - 请求：`{ images: Base64[], format: 'jpeg', quality: 80 }`
  - 响应：`{ success, results: Array<{ success, detected, word, confidence }> }`
- GET `/recognize/history`
  - 响应：`{ success, history }`
- 兼容保留：`POST /api/init`、`POST /api/predict`

### WebSocket 接口
- 端点：`ws://<host>:<port>/ws`
- 请求：`{ type: 'image', data: 'data:image/<fmt>;base64,...' }`
- 响应（双格式兼容）：
  - 标准：`{ type: 'recognition_result', data: RecognitionResult }`
  - 旧字段：`{ signInput, signTranslation }`
- 错误示例：`{ type: 'error', message: 'invalid json' }`
- 未就绪示例：`{ type:'recognition_result', data:{ success:false, message:'service not ready' }, signInput:'', signTranslation:'' }`

### 验证示例
- HTTP：
```
curl -X POST http://localhost:8000/recognize/realtime \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,/9j/...","format":"jpeg","quality":80}'
```
- WebSocket（Python）：
```
import websocket, json
ws = websocket.create_connection('ws://localhost:8000/ws')
ws.send(json.dumps({ 'type':'image', 'data':'data:image/jpeg;base64,/9j/...' }))
print(ws.recv())
ws.close()
```

### 故障排除
- 模型未就绪：设置 `.env` 的 `SIGNLANG_MODEL_PATH` 与 `SIGNLANG_LABELS_PATH`
- 依赖安装失败：锁定版本或升级 pip；必要时使用镜像源
- 端口占用：更换端口，例如 `--port 8001`
- 文档不可访问：`.env` 设置 `DEBUG=true`

## 概述

SignLink后端是基于FastAPI构建的手语识别翻译服务，**完全兼容ai_services的Flask服务**。提供简单的RESTful API接口，支持实时手语识别，单帧图像处理。

## 功能特性

- ✅ **实时手语识别** - 接收Base64图像，单帧识别返回结果
- ✅ **可视化结果** - 返回带有手部关键点标注的可视化图像
- ✅ **ai_services兼容** - 与ai_services的Flask服务100%兼容
- ✅ **CORS支持** - 完整支持跨域请求
- ✅ **错误处理** - 统一的异常处理和标准化错误响应
- ✅ **日志记录** - 统一的日志框架，支持文件轮转和UTF-8编码
- ✅ **线程安全** - 全局变量线程锁保护，支持并发访问
- ✅ **资源管理** - 优化的内存释放和资源清理机制
- ✅ **跨平台** - 支持Windows、Linux、macOS部署

## 技术栈

- **Web框架**: FastAPI 0.104.1
- **机器学习**: TensorFlow 2.17.1
- **计算机视觉**: OpenCV, MediaPipe 0.10.21
- **数据处理**: NumPy, Pillow
- **兼容性**: 与ai_services的Flask服务完全兼容

## 项目结构

```
backend/
├── app/
│   ├── main.py                    # FastAPI主应用
│   ├── api/
│   │   └── routes/
│   │       ├── flask_compat.py    # 与ai_services兼容的API路由（已修复线程安全）
│   │       └── recognition.py     # 原始API路由（目前以兼容路由为主）
│   ├── core/
│   │   ├── config.py              # 配置管理（已修复跨平台路径）
│   │   └── recognizer.py          # 核心识别器（已优化资源管理）
│   ├── models/
│   │   └── schemas.py             # Pydantic数据模型
│   ├── services/
│   │   └── translator.py          # 翻译服务
│   └── utils/
│       ├── __init__.py
│       ├── error_handler.py       # ✅ 统一错误处理模块（新增）
│       ├── logger_config.py       # ✅ 统一日志配置模块（新增）
│       ├── common_utils.py        # ✅ 公共工具函数模块（新增）
│       └── image_processing.py    # 图像处理工具
├── test/                          # ✅ 测试脚本目录（已完善）
│   ├── health_check.py           # 健康检查测试
│   ├── run_http_realtime.py      # HTTP实时识别测试
│   ├── run_ws_realtime.py        # WebSocket实时测试
│   ├── run_ws_camera.py          # 摄像头实时测试
│   ├── simple_backend.py         # ✅ 简化测试服务（新增）
│   └── simple_backend_test.py    # ✅ 简化测试脚本（新增）
├── requirements.txt               # Python依赖（已更新版本）
├── .env                          # 环境配置文件（已修复路径）
├── .env.example                  # 环境配置示例（已修复路径）
├── start.sh                      # 启动脚本
├── test_flask_compat.py          # 兼容性测试脚本
├── ai_services兼容性说明.md       # 兼容性说明文档
└── README.md                     # 本文档
```

## 快速开始

### 环境要求

- Python 3.8+
- pip包管理器
- 至少4GB内存（用于TensorFlow模型）

### 1. 安装依赖

```bash
# 进入后端目录
cd backend/

# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 检查AI模型文件

确保以下文件存在：
- `../ai_services/set_training_translation/sign_language_model.h5` - 训练好的模型
- `../ai_services/set_training_translation/sign_language_labels.json` - 标签文件

如果模型文件不存在，请先运行模型训练：
```bash
cd ../ai_services/set_training_translation/
python train_sign_language_model.py
```

### 3. 启动服务

```bash
# 使用启动脚本（推荐）
./start.sh

# 或直接使用uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. 验证服务

访问以下地址：
- **服务地址**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

## API接口（与ai_services完全一致）

### 1. 初始化模型

```http
POST /api/init
```

**响应示例**：
```json
{
  "success": true,
  "message": "模型加载成功",
  "num_classes": 5,
  "classes": ["hello", "thank", "goodbye", "yes", "no"]
}
```

### 2. 预测单帧图像

```http
POST /api/predict
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."  # Base64图像数据
}
```

**响应示例**：
```json
{
  "success": true,
  "detected": true,
  "word": "hello",
  "confidence": 0.95,
  "annotated_image": "data:image/jpeg;base64,..."
}
```

## 工作原理

1. **前端循环**: 前端每100ms截取一帧视频，转换为Base64格式
2. **发送请求**: 发送HTTP POST请求到 `/api/predict`
3. **单帧识别**: 后端对单帧图像进行识别
4. **返回结果**: 返回识别单词和可视化图像
5. **本地组合**: 前端本地维护历史记录，组合成句子

## 响应格式

### 成功响应

```json
{
  "success": true,
  "detected": true,
  "word": "hello",
  "confidence": 0.95,
  "annotated_image": "data:image/jpeg;base64,..."
}
```

### 错误响应

```json
{
  "success": false,
  "message": "预测失败: ..."
}
```

## 前端集成示例

### 与ai_services前端集成

```javascript
// 与ai_services的realtime_translation.html完全一致
setInterval(async () => {
  if (!isTranslating) return;

  // 1. 截取当前帧
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL("image/jpeg", 0.8);

  // 2. 发送到后端
  const response = await fetch("http://localhost:8000/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageData }),
  });

  // 3. 显示结果
  const result = await response.json();
  if (result.success && result.detected) {
    console.log("识别结果:", result.word, result.confidence);
    displayResult(result);
  }
}, 100); // 100ms间隔（10 FPS）
```

## 配置

在 `app/core/config.py` 中修改配置：

```python
# 服务配置
HOST = "0.0.0.0"  # 绑定地址
PORT = 8000       # 端口

# CORS配置
CORS_ORIGINS = [
    "http://localhost:3000",  # React开发服务器
    "http://localhost:19006",  # React Native Metro
]

# 模型路径
MODEL_PATH = "path/to/your/model.h5"
LABELS_PATH = "path/to/your/labels.json"
```

## 日志

服务运行日志会输出到：
- 控制台（stdout）
- 文件：`backend.log`

日志级别可在 `config.py` 中配置。

## 开发

### 运行测试

```bash
# 安装测试依赖
pip install pytest pytest-asyncio

# 运行测试
pytest tests/
```

### 代码格式化

```bash
# 安装格式化工具
pip install black isort

# 格式化代码
black app/
isort app/
```

## 故障排除

### 1. 依赖兼容性问题

**错误**: `ml_dtypes` 属性错误或TensorFlow导入失败

**解决方案**:
1. 使用Docker容器化部署隔离环境
2. 使用conda创建独立Python环境
3. 运行简化测试版本验证基础架构：`python test/simple_backend.py`

### 2. 模型加载失败

**错误**: `模型文件不存在`

**解决方案**:
1. 检查模型文件路径是否正确（已修复跨平台路径问题）
2. 运行模型训练脚本生成模型
3. 确认标签文件存在

### 3. 并发访问问题

**错误**: 多线程环境下的竞争条件

**解决方案**:
- ✅ 已修复：添加了线程锁保护全局变量
- 确保使用最新版本的flask_compat.py

### 4. 内存不足

**错误**: `OOM` (Out of Memory)

**解决方案**:
1. 关闭其他占用内存的程序
2. 使用更小的batch size
3. 使用更小的模型

### 5. 依赖安装失败

**错误**: `pip install` 失败

**解决方案**:
1. 升级pip: `pip install --upgrade pip`
2. 使用国内镜像: `pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/`
3. 使用虚拟环境避免包冲突

## 许可证

MIT License

## 支持

如有问题，请联系后端开发团队或提交Issue。
## 🌐 完整API规范（前端开发指南）

### 📋 API端点总览

| 类型 | 端点 | 方法 | 描述 |
|------|------|------|------|
| HTTP | `/` | GET | 服务状态检查 |
| HTTP | `/api/health` | GET | 健康检查 |
| HTTP | `/api/init` | POST | 初始化模型 |
| HTTP | `/api/predict` | POST | 兼容ai_services的预测接口 |
| HTTP | `/recognize/realtime` | POST | 实时识别（推荐） |
| HTTP | `/recognize/batch` | POST | 批量识别 |
| HTTP | `/recognize/history` | GET | 获取识别历史 |
| WS | `/ws` | WebSocket | 实时双向通信（推荐） |

### 🔵 HTTP API详细规范

#### 1. 服务状态检查
**端点**: `GET /`
**响应**:
```json
{
  "service": "SignLink 手语翻译后端",
  "version": "1.0.0",
  "status": "running",
  "message": "SignLink手语翻译后端服务正在运行",
  "docs": "/docs",
  "health": "/api/health"
}
```

#### 2. 健康检查
**端点**: `GET /api/health`
**响应**:
```json
{
  "status": "healthy",
  "service_ready": true,
  "timestamp": "2025-11-18T22:56:05.257268"
}
```

#### 3. 实时识别（推荐）
**端点**: `POST /recognize/realtime`
**请求体**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "format": "jpeg",      // 可选：jpeg|png
  "quality": 80          // 可选：1-100
}
```
**响应**:
```json
{
  "success": true,
  "detected": true,
  "word": "hello",
  "confidence": 0.85,
  "message": "识别成功"
}
```

#### 4. 批量识别
**端点**: `POST /recognize/batch`
**请求体**:
```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  ],
  "format": "jpeg",
  "quality": 80
}
```
**响应**:
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "detected": true,
      "word": "hello",
      "confidence": 0.85
    },
    {
      "success": true,
      "detected": false,
      "word": null,
      "confidence": 0.0
    }
  ]
}
```

#### 5. 获取识别历史
**端点**: `GET /recognize/history`
**响应**:
```json
{
  "success": true,
  "history": [
    {
      "signInput": "hello",
      "signTranslation": "hello",
      "timestamp": "2025-11-18T22:56:05.257268"
    }
  ]
}
```

#### 6. 兼容ai_services接口
**端点**: `POST /api/init`
**响应**:
```json
{
  "success": true,
  "message": "模型加载成功",
  "num_classes": 2,
  "classes": ["hello", "thank"]
}
```

**端点**: `POST /api/predict`
**请求体**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```
**响应**:
```json
{
  "success": true,
  "detected": true,
  "word": "hello",
  "confidence": 0.85,
  "annotated_image": "data:image/jpeg;base64,..."
}
```

### 🟢 WebSocket API详细规范

#### 连接信息
- **端点**: `ws://localhost:8001/ws`
- **协议**: WebSocket (RFC 6455)
- **心跳**: 客户端可定期发送 `{ "type": "ping" }` 保持连接

#### 消息格式

##### 请求消息
```json
{
  "type": "image",
  "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

##### 成功响应
```json
{
  "type": "recognition_result",
  "data": {
    "success": true,
    "detected": true,
    "predicted_class": "hello",
    "confidence": 0.85,
    "message": "识别成功",
    "processing_time_ms": 45.2,
    "timestamp": "2025-11-18T22:56:05.257268"
  },
  "signInput": "hello",
  "signTranslation": "hello"
}
```

##### 错误响应
```json
{
  "type": "error",
  "message": "无效的图像格式"
}
```

##### 服务未就绪响应
```json
{
  "type": "recognition_result",
  "data": {
    "success": false,
    "detected": false,
    "predicted_class": null,
    "confidence": 0.0,
    "message": "服务未就绪"
  },
  "signInput": "",
  "signTranslation": ""
}
```

#### 前端集成示例

##### JavaScript WebSocket客户端
```javascript
// 创建WebSocket连接
const ws = new WebSocket('ws://localhost:8001/ws');

// 连接打开
ws.onopen = () => {
  console.log('WebSocket连接成功');

  // 发送测试图像
  const imageData = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";
  ws.send(JSON.stringify({
    type: 'image',
    data: imageData
  }));
};

// 接收响应
ws.onmessage = (event) => {
  const result = JSON.parse(event.data);

  if (result.type === 'recognition_result') {
    if (result.data.detected) {
      console.log('识别结果:', result.data.predicted_class);
      console.log('置信度:', result.data.confidence);

      // 兼容旧格式
      console.log('兼容字段:', result.signInput, result.signTranslation);
    } else {
      console.log('未检测到手势');
    }
  } else if (result.type === 'error') {
    console.error('识别错误:', result.message);
  }
};

// 连接关闭
ws.onclose = () => {
  console.log('WebSocket连接关闭');
};

// 连接错误
ws.onerror = (error) => {
  console.error('WebSocket错误:', error);
  // 回退到HTTP API
  fallbackToHTTP();
};
```

##### React Hook示例
```typescript
import { useEffect, useState } from 'react';

interface RecognitionResult {
  success: boolean;
  detected: boolean;
  predicted_class: string | null;
  confidence: number;
  message: string;
}

interface WebSocketResult {
  type: string;
  data: RecognitionResult;
  signInput: string;
  signTranslation: string;
}

function useSignRecognition() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8001/ws');

    websocket.onopen = () => {
      setConnected(true);
      console.log('WebSocket已连接');
    };

    websocket.onmessage = (event) => {
      const data: WebSocketResult = JSON.parse(event.data);
      if (data.type === 'recognition_result') {
        setResult(data.data);
      }
    };

    websocket.onclose = () => {
      setConnected(false);
      console.log('WebSocket已断开');
    };

    websocket.onerror = (error) => {
      console.error('WebSocket错误:', error);
      setConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const sendImage = (imageData: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'image',
        data: imageData
      }));
    }
  };

  return { result, connected, sendImage };
}
```

## WebSocket与双通道策略

- 服务端点：`ws://localhost:8000/ws`
- 前端策略：优先使用WebSocket；连接失败或发送异常则回退HTTP
- WebSocket 消息
  - 请求：`{ "type": "image", "data": "data:image/jpeg;base64,..." }`
  - 响应：
    - 兼容旧格式：`{ "signInput": "...", "signTranslation": "..." }`
    - 新增结构：`{ "type": "recognition_result", "data": RecognitionResult }`

## 前端对齐的HTTP端点

- `POST /recognize/realtime`
  - 请求体：`{ image: Base64, format?: 'jpeg'|'png', quality?: number }`
  - 响应：`{ success, detected, word, confidence }`
- `POST /recognize/batch`
  - 请求体：`{ images: Base64[], format?: string, quality?: number }`
  - 响应：`{ success, results: Array<{ success, detected, word, confidence }> }`
- `GET /recognize/history`
  - 响应：`{ success, history }`
- 兼容路由保留：`POST /api/init`、`POST /api/predict`

## .env 配置（后端）

- 位置：`backend/.env`，自动加载于 `app/core/config.py`
- 支持变量：
  - `APP_NAME`、`APP_VERSION`、`DEBUG`
  - `HOST`、`PORT`
  - `LOG_LEVEL`、`LOG_FORMAT`
  - `CORS_ORIGINS`（逗号分隔）
  - `SIGNLANG_MODEL_PATH`、`SIGNLANG_LABELS_PATH`
- 示例：
```
APP_NAME=SignLink 手语翻译后端
APP_VERSION=1.0.0
DEBUG=false
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://127.0.0.1:19006,http://127.0.0.1:3000
SIGNLANG_MODEL_PATH=
SIGNLANG_LABELS_PATH=
```

## 使用 Conda 环境

- 创建或使用现有环境：`Signlink` 或 `signlink-backend`
```
conda create -n Signlink python=3.11
conda activate Signlink
pip install -r backend/requirements.txt # 如遇版本兼容，可按下列锁定
pip install tensorflow==2.17.1 mediapipe fastapi==0.104.1 uvicorn==0.24.0 python-multipart python-dotenv
```
 - 启动服务：`python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`
 - 文档：`http://localhost:8000/docs`

## 验证示例

### HTTP 单帧识别
```
curl -X POST http://localhost:8000/recognize/realtime \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,/9j/...","format":"jpeg","quality":80}'
```

### WebSocket 发送图像
```
# 伪代码
ws = new WebSocket('ws://localhost:8000/ws')
ws.onmessage = (e) => console.log(e.data)
ws.onopen = () => ws.send(JSON.stringify({ type: 'image', data: 'data:image/jpeg;base64,/9j/...' }))
```
