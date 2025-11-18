# SignLink 后端部署指南

## 🎯 概述

本指南提供了SignLink手语翻译后端的完整部署说明，包括修复后的新功能、依赖兼容性解决方案以及生产环境部署建议。

## 📋 修复内容总结

### ✅ 代码质量修复
- **跨平台兼容性**: 修复Windows路径分隔符，支持Linux/macOS部署
- **线程安全**: 添加全局变量线程锁，防止并发访问冲突
- **错误处理**: 统一错误响应格式，标准化HTTP状态码
- **资源管理**: 优化内存释放机制，防止资源泄漏
- **代码重构**: 提取公共工具函数，消除重复代码
- **日志统一**: 统一日志框架，支持文件轮转和UTF-8编码

### 🆕 新增模块
- `app/utils/error_handler.py` - 统一错误处理模块
- `app/utils/logger_config.py` - 统一日志配置模块
- `app/utils/common_utils.py` - 公共工具函数模块
- `test/simple_backend.py` - 简化测试服务
- `test/simple_backend_test.py` - 简化测试脚本

## ⚙️ 环境要求

### 系统要求
- **操作系统**: Windows 10+, Ubuntu 18.04+, macOS 10.15+
- **Python版本**: 3.8-3.11 (推荐3.11)
- **内存**: 最少4GB，推荐8GB
- **存储**: 至少2GB可用空间
- **网络**: 开放8000端口（可配置）

### Python环境
```bash
# 使用conda创建环境（推荐）
conda create -n signlink python=3.11
conda activate signlink

# 或使用venv
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate     # Windows
```

## 📦 依赖安装

### 1. 基础依赖安装
```bash
cd backend/
pip install -r requirements.txt
```

### 2. 依赖兼容性说明
⚠️ **重要**: TensorFlow 2.17.1与MediaPipe存在已知兼容性问题

**问题症状**:
```
AttributeError: module 'ml_dtypes' has no attribute 'float8_e3m4'
```

**解决方案**:

#### 方案A: Docker部署（推荐）
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 设置环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 方案B: Conda环境隔离
```bash
# 创建conda环境
conda create -n signlink python=3.11
conda activate signlink

# 按顺序安装依赖
conda install numpy=1.26.4
pip install tensorflow==2.17.1
pip install mediapipe==0.10.21
pip install -r requirements.txt
```

#### 方案C: 简化版本测试
```bash
# 运行简化版本（不依赖TensorFlow/MediaPipe）
python test/simple_backend.py
```

## 🔧 配置设置

### 1. 环境配置
复制环境配置文件：
```bash
cp .env.example .env
```

### 2. 关键配置项
```env
# 基础配置
APP_NAME=SignLink 手语翻译后端
APP_VERSION=1.0.0
DEBUG=false
HOST=0.0.0.0
PORT=8000

# 日志配置（已统一）
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# CORS配置
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://127.0.0.1:19006,http://127.0.0.1:3000

# 模型路径（已修复跨平台路径）
SIGNLANG_MODEL_PATH=ai_services/set_training_translation/sign_language_model.h5
SIGNLANG_LABELS_PATH=ai_services/set_training_translation/sign_language_labels.json
```

### 3. 模型文件检查
确保模型文件存在：
```bash
# 检查模型文件
ls -la ../ai_services/set_training_translation/sign_language_model.h5
ls -la ../ai_services/set_training_translation/sign_language_labels.json

# 如果不存在，需要训练模型
cd ../ai_services/set_training_translation/
python train_sign_language_model.py
```

## 🚀 启动服务

### 开发环境启动
```bash
# 使用uvicorn直接启动
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 或使用启动脚本
chmod +x start.sh
./start.sh
```

### 生产环境启动
```bash
# 使用gunicorn + uvicorn（推荐）
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# 或使用systemd服务（Linux）
sudo systemctl start signlink-backend
```

### Docker启动
```bash
# 构建镜像
docker build -t signlink-backend .

# 运行容器
docker run -d \
  --name signlink-backend \
  -p 8000:8000 \
  -v $(pwd)/../ai_services:/app/ai_services \
  -e SIGNLANG_MODEL_PATH=ai_services/set_training_translation/sign_language_model.h5 \
  -e SIGNLANG_LABELS_PATH=ai_services/set_training_translation/sign_language_labels.json \
  signlink-backend
```

## 🧪 测试验证

### 1. 健康检查测试
```bash
python test/health_check.py
```

### 2. HTTP接口测试
```bash
python test/run_http_realtime.py
```

### 3. WebSocket测试
```bash
# 安装websocket-client
pip install websocket-client

# 运行测试
python test/run_ws_realtime.py
```

### 4. 简化版本测试（无依赖）
```bash
# 启动简化服务
python test/simple_backend.py

# 运行简化测试
python test/simple_backend_test.py
```

## 📊 服务监控

### 1. 日志监控
```bash
# 实时查看日志
tail -f backend.log

# 查看错误日志
grep ERROR backend.log
```

### 2. 健康检查
```bash
# HTTP健康检查
curl http://localhost:8000/api/health

# 服务状态
curl http://localhost:8000/
```

### 3. 性能监控
```bash
# 查看系统资源
htop

# 查看网络连接
netstat -tulnp | grep 8000
```

## 🔒 安全配置

### 1. 防火墙配置
```bash
# Ubuntu/Debian
sudo ufw allow 8000/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

### 2. Nginx反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 3. SSL证书（Let's Encrypt）
```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

## ⚡ 性能优化

### 1. 模型优化
```python
# 在 recognizer.py 中启用量化
# 减少模型大小，提高推理速度
```

### 2. 缓存配置
```python
# 在 config.py 中配置缓存
CACHE_ENABLED = True
CACHE_TTL = 300  # 5分钟
```

### 3. 连接池优化
```python
# 数据库连接池（如使用）
DB_POOL_SIZE = 20
DB_MAX_OVERFLOW = 40
```

## 🔄 更新和维护

### 1. 平滑更新
```bash
# 使用蓝绿部署
# 1. 启动新版本
# 2. 验证新版本
# 3. 切换流量
# 4. 停止旧版本
```

### 2. 日志轮转
```bash
# 配置logrotate
sudo nano /etc/logrotate.d/signlink

# 添加配置
/path/to/backend.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 user group
}
```

### 3. 备份策略
```bash
# 模型文件备份
cp -r ai_services/ /backup/ai_services_$(date +%Y%m%d)

# 配置文件备份
cp .env /backup/env_$(date +%Y%m%d)
```

## 🆘 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 检查端口占用
netstat -tulnp | grep 8000

# 检查Python错误
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level debug
```

#### 2. 模型加载失败
```bash
# 检查模型文件
ls -la ai_services/set_training_translation/

# 检查文件权限
chmod 644 *.h5 *.json
```

#### 3. 内存泄漏
```bash
# 监控内存使用
ps aux | grep uvicorn

# 检查日志中的错误
grep -i error backend.log
```

#### 4. 高并发问题
```bash
# 检查线程锁状态
# 查看 common_utils.py 中的服务管理器日志
```

### 紧急处理

#### 服务崩溃
```bash
# 立即重启服务
sudo systemctl restart signlink-backend

# 检查崩溃原因
tail -100 backend.log
```

#### 性能下降
```bash
# 重启服务释放内存
sudo systemctl restart signlink-backend

# 检查系统资源
top -p $(pgrep -f uvicorn)
```

## 📞 支持联系

### 技术支持
- **邮箱**: support@signlink.com
- **电话**: 400-123-4567
- **工单系统**: https://support.signlink.com

### 文档资源
- **API文档**: http://your-domain/docs
- **GitHub**: https://github.com/your-org/signlink-backend
- **Wiki**: https://wiki.signlink.com

---

*最后更新: 2025年11月*
*版本: 1.0.0*