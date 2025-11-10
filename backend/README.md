# SignLink 手语翻译后端

## 概述

SignLink后端是基于FastAPI构建的手语识别翻译服务，提供RESTful API接口，支持实时手语识别、文件上传识别等功能。

## 功能特性

- ✅ **实时手语识别** - 接收Base64图像，实时返回识别结果
- ✅ **文件上传识别** - 支持图片和视频文件上传识别
- ✅ **可视化结果** - 返回带有手部关键点标注的可视化图像
- ✅ **健康检查** - 提供服务健康状态和模型信息查询
- ✅ **CORS支持** - 完整支持跨域请求
- ✅ **错误处理** - 完善的异常处理和错误响应
- ✅ **日志记录** - 完整的运行日志和调试信息

## 技术栈

- **Web框架**: FastAPI 0.104.1
- **机器学习**: TensorFlow 2.15.0
- **计算机视觉**: OpenCV 4.8.1, MediaPipe 0.10.7
- **数据处理**: NumPy, Pillow
- **API文档**: 自动生成Swagger UI

## 项目结构

```
backend/
├── app/
│   ├── main.py                    # FastAPI主应用
│   ├── api/
│   │   └── routes/
│   │       └── recognition.py     # 手语识别API路由
│   ├── core/
│   │   ├── config.py              # 配置管理
│   │   └── recognizer.py          # 核心识别器
│   ├── models/
│   │   └── schemas.py             # Pydantic数据模型
│   ├── services/
│   │   └── translator.py          # 翻译服务
│   └── utils/
│       └── image_processing.py    # 图像处理工具
├── requirements.txt               # Python依赖
├── start.sh                      # 启动脚本
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
- **健康检查**: http://localhost:8000/api/health

## API接口

### 1. 健康检查

```http
GET /api/health
```

返回服务健康状态和模型加载情况。

### 2. 获取模型信息

```http
GET /api/model/info
```

返回AI模型的详细信息（类别数量、支持的手语等）。

### 3. 实时手语识别

```http
POST /api/recognize/realtime
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",  # Base64图像数据
  "format": "jpeg",
  "quality": 80
}
```

### 4. 文件上传识别

```http
POST /api/recognize/upload
Content-Type: multipart/form-data

file: <图片或视频文件>
```

### 5. 可视化识别

```http
POST /api/recognize/visualize
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

返回识别结果和带有手部关键点标注的图像。

### 6. 获取支持的手语类别

```http
GET /api/classes
```

返回模型支持的所有手语类别列表。

## 响应格式

### 成功响应

```json
{
  "success": true,
  "detected": true,
  "predicted_class": "hello",
  "confidence": 0.95,
  "message": "识别成功",
  "hands_count": 1,
  "hands": [
    {
      "landmarks": [...],
      "handedness": "Right"
    }
  ],
  "processing_time_ms": 45.2,
  "timestamp": "2024-01-01T00:00:00.000000"
}
```

### 错误响应

```json
{
  "success": false,
  "error_code": "HTTP_400",
  "error_message": "图像格式错误: ..."
}
```

## 前端集成示例

### 发送Base64图像

```javascript
async function recognizeHandSign(imageFile) {
  // 转换为Base64
  const base64 = await fileToBase64(imageFile);

  // 发送请求
  const response = await fetch('/api/recognize/realtime', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64,
      format: 'jpeg',
      quality: 80
    })
  });

  const result = await response.json();
  return result;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
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
