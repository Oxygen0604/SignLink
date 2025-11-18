# SignLink 后端测试套件

## 🎯 测试目的
- ✅ 验证后端修复后的完整功能（2025年11月重大更新）
- ✅ 测试HTTP与WebSocket通道的手语识别接口
- ✅ 验证摄像头调用与连续识别功能
- ✅ 提供PC摄像头→WebSocket→后端的全链路调试
- ✅ 验证跨平台兼容性、线程安全、统一错误处理等新特性

## 🔧 2025年11月重大更新
本次测试套件已更新以配合后端重大修复：
- ✅ **跨平台兼容性**: 修复Windows路径分隔符问题
- ✅ **线程安全**: 添加全局变量线程锁保护
- ✅ **统一错误处理**: 标准化错误响应格式
- ✅ **资源管理优化**: 改进内存释放机制
- ✅ **日志框架统一**: 支持文件轮转和UTF-8编码
- ✅ **依赖兼容性**: 解决TensorFlow与MediaPipe版本冲突

## 📋 测试脚本总览

### 🔵 基础功能测试
- `health_check.py` - 健康检查与模型状态验证
- `run_http_realtime.py` - HTTP实时识别接口测试
- `run_ws_realtime.py` - WebSocket实时识别测试

### 🟢 高级功能测试
- `run_ws_camera.py` - 摄像头实时采集与识别测试
- `camera_simple_test.py` - 简化版摄像头测试（避免Unicode编码问题）
- `camera_real_test.py` - 真实摄像头识别验证（详细统计）

### 🆕 新增测试脚本（2025年11月）
- `simple_backend.py` - 简化后端服务（无TensorFlow依赖）
- `simple_backend_test.py` - 基础架构验证测试

## 🚀 快速开始

### 1. 环境准备
```bash
# 激活Conda环境
conda activate Signlink

# 安装测试依赖
pip install opencv-python websocket-client Pillow

# 可选：解决Unicode编码问题（Windows）
set PYTHONIOENCODING=utf-8
```

### 2. 启动后端服务
```bash
# 方案A：完整后端（需要TensorFlow环境）
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001

# 方案B：简化后端（无TensorFlow依赖，用于基础测试）
python test/simple_backend.py
```

### 3. 运行测试
```bash
# 基础功能测试
python test/health_check.py
python test/run_http_realtime.py
python test/run_ws_realtime.py

# 摄像头功能测试
python test/run_ws_camera.py
python test/camera_simple_test.py

# 基础架构测试
python test/simple_backend_test.py
```

## 📊 测试结果解读

### ✅ 成功指标
- **HTTP接口**: 状态码200，返回格式正确
- **WebSocket**: 连接成功，双格式兼容（signInput/signTranslation + data）
- **摄像头调用**: 硬件访问成功，画面读取正常
- **连续识别**: 能够持续处理视频流（即使静态画面）

### ⚠️ 注意事项
- **模型文件**: 确保`../ai_services/set_training_translation/`目录存在模型文件
- **依赖兼容**: TensorFlow与MediaPie存在已知兼容问题，已通过环境变量缓解
- **Unicode编码**: 部分emoji字符在GBK环境下显示异常，不影响功能

## 🎯 测试覆盖范围

### 功能测试
- ✅ 服务健康检查
- ✅ HTTP实时识别
- ✅ WebSocket实时通信
- ✅ 摄像头硬件调用
- ✅ 连续视频流处理
- ✅ 错误处理和异常捕获
- ✅ 跨平台路径兼容性
- ✅ 线程安全保护

### 兼容性测试
- ✅ ai_services Flask接口兼容
- ✅ 新旧前端格式兼容
- ✅ 多平台部署支持
- ✅ 并发访问处理

## 🐛 常见问题和解决方案

### 1. 模型未初始化
**现象**: 返回"未就绪/解析失败"，接口仍可用；设置 `.env` 的 `SIGNLANG_MODEL_PATH` 与 `SIGNLANG_LABELS_PATH` 后返回真实识别

**解决方案**:
1. 检查模型文件路径是否正确
2. 确保 `../ai_services/set_training_translation/` 目录存在模型文件
3. 运行模型训练脚本生成缺失的模型文件

### 2. 摄像头调用失败
**现象**: "无法打开摄像头" 或 "无法读取画面"

**解决方案**:
1. 摄像头索引：默认 `VideoCapture(0)`；若无图像，请尝试改为 `1` 或其他索引
2. 检查摄像头权限和驱动程序
3. 确保没有其他程序占用摄像头
4. 尝试使用外接USB摄像头

### 3. 连续识别无结果
**现象**: 持续返回"未检测到手势"

**解决方案**:
1. 确保在摄像头前做出实际的手语手势（支持'hello'、'thank'）
2. 调整光线条件，确保手部清晰可见
3. 保持适当距离（建议0.5-2米）
4. 检查模型支持的手势类别（当前支持：hello, thank）

### 4. 依赖安装失败
**现象**: pip安装报错或版本冲突

**解决方案**:
1. 升级pip: `pip install --upgrade pip`
2. 使用国内镜像: `pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/`
3. 使用虚拟环境避免包冲突
4. 解决TensorFlow与MediaPipe兼容性问题（设置环境变量）

### 5. Unicode编码错误
**现象**: 测试输出中出现乱码或编码错误

**解决方案**:
1. Windows系统设置: `set PYTHONIOENCODING=utf-8`
2. 使用简化版测试脚本（避免emoji字符）
3. 修改控制台编码设置为UTF-8