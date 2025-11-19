# SignLink 手语翻译后端

基于 FastAPI 构建的手语识别与翻译服务，提供 RESTful API 和 WebSocket 实时通信接口。

## 🚀 快速开始

### 1. 环境要求

- **Python**: 3.9
- **内存**: 至少 4GB（TensorFlow 模型需求）
- **系统**: Windows / Linux / macOS

### 2. 环境安装

#### 使用 Conda（推荐）
```bash
# 创建并激活环境
conda create -n signlink-backend python=3.9
conda activate signlink-backend

# 安装依赖
pip install -r requirements.txt
```

### 3. 模型文件准备

确保以下文件存在：
- `ai_services/set_training_translation/sign_language_model.h5` - 训练好的模型
- `ai_services/set_training_translation/sign_language_labels.json` - 标签文件

如果模型文件不存在，请先训练模型：
```bash
cd ai_services/set_training_translation/
python train_sign_language_model.py
```

### 4. 环境配置

复制环境配置示例文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 服务配置
APP_NAME=SignLink 手语翻译后端
APP_VERSION=1.0.0
DEBUG=false
HOST=0.0.0.0
PORT=8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# 日志配置
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# CORS 配置（逗号分隔）
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://127.0.0.1:19006,http://127.0.0.1:3000

# AI 模型路径
SIGNLANG_MODEL_PATH=ai_services/set_training_translation/sign_language_model.h5
SIGNLANG_LABELS_PATH=ai_services/set_training_translation/sign_language_labels.json
```

### 5. 启动服务

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 6. 验证服务

- **服务地址**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs（需要 DEBUG=true）

## 📡 API 接口


### HTTP 端点

#### 1. 服务状态
```http
GET /
```

**响应示例**:
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
```http
GET /api/health
```

**响应示例**:
```json
{
  "status": "healthy",
  "service": "SignLink 后端服务",
  "version": "1.0.0",
  "model_loaded": true,
  "timestamp": "2025-11-19T10:30:00.000000",
  "components": {
    "model": "healthy",
    "recognizer": "healthy"
  }
}
```

#### 3. 实时手语识别（推荐）
```http
POST /recognize/realtime
Content-Type: application/json
```

**请求体**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "format": "jpeg",      // 可选：jpeg|png
  "quality": 80          // 可选：1-100
}
```

**响应示例**:
```json
{
  "success": true,
  "detected": true,
  "predicted_class": "hello",
  "confidence": 0.85,
  "message": "识别成功",
  "processing_time_ms": 45.2,
  "timestamp": "2025-11-19T10:30:00.000000",
  "hands_count": 1,
  "hands": [
    {
      "landmarks": [{"x": 0.1, "y": 0.2, "z": 0.0}, ...],
      "handedness": "Right"
    }
  ]
}
```

#### 4. 批量识别
```http
POST /recognize/batch
Content-Type: application/json
```

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

**响应示例**:
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "detected": true,
      "predicted_class": "hello",
      "confidence": 0.85
    },
    {
      "success": true,
      "detected": false,
      "predicted_class": null,
      "confidence": 0.0
    }
  ]
}
```

#### 5. 获取识别历史
```http
GET /recognize/history
```

**响应示例**:
```json
{
  "success": true,
  "history": [
    {
      "signInput": "hello",
      "signTranslation": "hello",
      "timestamp": "2025-11-19T10:30:00.000000"
    }
  ]
}
```

### ❌ 错误响应示例

#### 服务未就绪（503）
```json
{
  "success": false,
  "message": "服务未初始化",
  "error_type": "service_unavailable",
  "status_code": 503
}
```

#### 参数错误（400）
```json
{
  "success": false,
  "message": "缺少图像数据",
  "error_type": "bad_request",
  "status_code": 400
}
```

#### 服务器错误（500）
```json
{
  "success": false,
  "message": "识别过程失败",
  "error_type": "internal_error",
  "status_code": 500
}
```

#### 6. 兼容 ai_services 接口
```http
POST /api/init
```

**响应示例**:
```json
{
  "success": true,
  "message": "模型加载成功",
  "num_classes": 5,
  "classes": ["hello", "thank", "goodbye", "yes", "no"]
}
```

```http
POST /api/predict
Content-Type: application/json
```

**请求体**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**响应示例**:
```json
{
  "success": true,
  "detected": true,
  "word": "hello",
  "confidence": 0.85,
  "annotated_image": "data:image/jpeg;base64,..."
}
```

### WebSocket 接口

**连接地址**: `ws://localhost:8000/ws`

#### 请求消息
```json
{
  "type": "image",
  "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

#### 成功响应
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
    "timestamp": "2025-11-19T10:30:00.000000"
  },
  "signInput": "hello",
  "signTranslation": "hello"
}
```

#### 错误响应
```json
{
  "type": "error",
  "message": "无效的图像格式"
}
```

#### 服务未就绪响应
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

### 🚦 WebSocket状态说明

WebSocket连接的状态处理与HTTP类似，但通过消息类型区分：

**连接状态流程**
1. **连接建立** - WebSocket握手成功
2. **服务状态检查** - 每条消息处理前检查`service_manager.is_service_ready()`
3. **消息处理** - 根据消息类型分发处理
4. **状态响应** - 返回相应的消息格式

**状态对应关系**
- 服务就绪 → 返回`recognition_result`类型消息
- 服务未就绪 → 返回`recognition_result`类型但`success=false`
- 消息格式错误 → 返回`error`类型消息
- 连接断开 → 客户端触发`onclose`事件

## 🧪 测试示例

### HTTP 测试
```bash
# 测试实时识别
curl -X POST http://localhost:8000/recognize/realtime \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "format": "jpeg",
    "quality": 80
  }'
```

### WebSocket 测试（Python）
```python
import websocket
import json

ws = websocket.create_connection('ws://localhost:8000/ws')

# 发送图像
image_data = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
ws.send(json.dumps({
    'type': 'image',
    'data': image_data
}))

# 接收响应
result = ws.recv()
print(json.loads(result))

ws.close()
```

### WebSocket 测试（JavaScript）
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
    console.log('WebSocket连接成功');

    const imageData = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...";
    ws.send(JSON.stringify({
        type: 'image',
        data: imageData
    }));
};

ws.onmessage = (event) => {
    const result = JSON.parse(event.data);
    if (result.type === 'recognition_result') {
        if (result.data.detected) {
            console.log('识别结果:', result.data.predicted_class);
            console.log('置信度:', result.data.confidence);
        }
    }
};
```

## 🔧 项目结构

```
backend/
├── app/
│   ├── main.py                    # FastAPI 主应用
│   ├── api/
│   │   └── routes/
│   │       ├── flask_compat.py    # 兼容 ai_services 的 API
│   │       └── recognition.py     # 标准 API 路由
│   ├── core/
│   │   ├── config.py              # 配置管理
│   │   └── recognizer.py          # 核心识别器
│   ├── models/
│   │   └── schemas.py             # Pydantic 数据模型
│   ├── services/
│   │   └── translator.py          # 翻译服务
│   └── utils/
│       ├── error_handler.py       # 错误处理
│       ├── logger_config.py       # 日志配置
│       └── common_utils.py        # 公共工具
├── test/                          # 测试脚本
├── requirements.txt               # Python 依赖
├── .env                          # 环境配置
└── .env.example                  # 配置示例
```

## 🔍 故障排除

### 1. 依赖兼容性问题
**错误**: `ml_dtypes` 属性错误或 TensorFlow 导入失败
**解决方案**:
- 使用 Docker 容器化部署隔离环境
- 使用 conda 创建独立 Python 环境
- 运行简化测试版本验证基础架构

### 2. 模型加载失败
**错误**: `模型文件不存在`
**解决方案**:
- 检查 `.env` 中的模型路径配置
- 确保模型文件存在且路径正确
- 运行模型训练脚本生成模型

### 3. 端口占用
**错误**: `端口已被占用`
**解决方案**:
- 更换端口：`PORT=8001`
- 查找占用进程并终止

### 4. CORS 跨域问题
**错误**: `CORS 阻止请求`
**解决方案**:
- 检查 `.env` 中的 `CORS_ORIGINS` 配置
- 确保前端地址在允许列表中

### 5. 内存不足
**错误**: `OOM` (Out of Memory)
**解决方案**:
- 关闭其他占用内存的程序
- 使用更小的 batch size
- 增加系统内存

## 📋 开发说明

### 日志配置
服务运行日志输出到：
- 控制台（stdout）
- 文件：`backend.log`

日志级别在 `.env` 中配置：`LOG_LEVEL=INFO`

### 调试模式
开发环境建议开启调试模式：
```env
DEBUG=true
```

这将启用：
- 详细的错误信息
- API 文档访问
- 代码热重载

### 测试
```bash
# 运行测试脚本
python test/health_check.py
python test/run_http_realtime.py
python test/run_ws_realtime.py
```

## 📄 许可证

MIT License

## 🤝 支持

如有问题，请联系后端开发团队或提交 Issue。