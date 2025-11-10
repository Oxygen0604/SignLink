# SignLink 手语翻译后端

## 概述

SignLink后端是基于FastAPI构建的手语识别翻译服务，**完全兼容ai_services的Flask服务**。提供简单的RESTful API接口，支持实时手语识别，单帧图像处理。

## 功能特性

- ✅ **实时手语识别** - 接收Base64图像，单帧识别返回结果
- ✅ **可视化结果** - 返回带有手部关键点标注的可视化图像
- ✅ **ai_services兼容** - 与ai_services的Flask服务100%兼容
- ✅ **CORS支持** - 完整支持跨域请求
- ✅ **错误处理** - 完善的异常处理和错误响应
- ✅ **日志记录** - 完整的运行日志和调试信息

## 技术栈

- **Web框架**: FastAPI 0.104.1
- **机器学习**: TensorFlow 2.15.0
- **计算机视觉**: OpenCV 4.8.1, MediaPipe 0.10.7
- **数据处理**: NumPy, Pillow
- **兼容性**: 与ai_services的Flask服务完全兼容

## 项目结构

```
backend/
├── app/
│   ├── main.py                    # FastAPI主应用
│   ├── api/
│   │   └── routes/
│   │       ├── flask_compat.py    # 与ai_services兼容的API路由
│   │       └── recognition.py     # 原始API路由（已注释）
│   ├── core/
│   │   ├── config.py              # 配置管理
│   │   └── recognizer.py          # 核心识别器（从ai_services移植）
│   ├── models/
│   │   └── schemas.py             # Pydantic数据模型
│   ├── services/
│   │   └── translator.py          # 翻译服务
│   └── utils/
│       └── image_processing.py    # 图像处理工具
├── requirements.txt               # Python依赖
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

### 1. 模型加载失败

**错误**: `模型文件不存在`

**解决方案**:
1. 检查模型文件路径是否正确
2. 运行模型训练脚本生成模型
3. 确认标签文件存在

### 2. 内存不足

**错误**: `OOM` (Out of Memory)

**解决方案**:
1. 关闭其他占用内存的程序
2. 使用更小的batch size
3. 使用更小的模型

### 3. 依赖安装失败

**错误**: `pip install` 失败

**解决方案**:
1. 升级pip: `pip install --upgrade pip`
2. 使用国内镜像: `pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/`
3. 使用虚拟环境避免包冲突

## 许可证

MIT License

## 支持

如有问题，请联系后端开发团队或提交Issue。
