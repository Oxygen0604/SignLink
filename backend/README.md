# SignLink 后端（FastAPI）

基于 FastAPI 的手语识别与用户认证服务。支持 AI 模型推理（TensorFlow + MediaPipe）、JWT 登录、邮箱找回密码（fastapi-mail），以及互动答题模块。

## 功能概览
- **用户认证**：JWT 登录/注册，Access Token 7 天有效（HS256），密码 bcrypt 哈希加密。支持 `/auth/validate` 快速验证。
- **找回密码**：生成一次性重置 Token，通过 SMTP 真实发送邮件（fastapi-mail + BackgroundTasks）。
- **用户管理**：自动生成用户名，支持后续修改。
- **手语识别**：提供 `/recognize/realtime`、`/ws` (WebSocket) 等接口，基于 TensorFlow + MediaPipe。
- **答题模块**：
    - 获取题目列表 (`GET /quiz/questions`)
    - 提交答题结果 (`POST /quiz/submit`)
    - 查看答题记录 (`GET /quiz/records`)

## 快速开始

### 1. 安装依赖
建议使用 Conda 环境（Python 3.9+）：
```bash
conda create -n signlink-backend python=3.9
conda activate signlink-backend
pip install -r requirements.txt
```

### 2. 配置环境
复制配置文件并填写必要信息（如 `SECRET_KEY`, `DATABASE_URL`）：
```bash
cp .env.example .env
```
*默认使用 SQLite 数据库，数据文件将生成在 `backend/app/db.sqlite3`。*

### 3. 初始化数据库与数据
首次运行时，建议运行种子脚本以创建表结构并预填测试题目：
```bash
# 在 backend 目录下运行
python scripts/seed_questions.py
```

### 4. 运行服务
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
启动后访问 `http://127.0.0.1:8000/docs` 查看交互式 API 文档。

## 目录结构
```
backend/
├── app/
│   ├── main.py                 # FastAPI 入口
│   ├── api/routes/             # 兼容旧版 ai_services 路由
│   ├── core/                   # 核心配置与安全逻辑
│   ├── crud/                   # 数据库 CRUD 操作
│   ├── database.py             # SQLAlchemy 会话管理
│   ├── deps.py                 # 依赖注入（如 get_current_user）
│   ├── models/                 # SQLAlchemy 数据库模型 (user.py, quiz.py)
│   ├── routers/                # 业务路由 (auth.py, users.py, quiz.py)
│   ├── schemas/                # Pydantic 数据校验模型
│   ├── services/               # 业务服务（AI, Email）
│   └── utils/                  # 工具函数
├── scripts/
│   └── seed_questions.py       # 数据库初始化与种子数据脚本
├── tests/                      # 测试用例
├── .env.example                # 环境变量示例
├── API.md                      # 详细接口文档
└── requirements.txt
```