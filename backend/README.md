# SignLink 后端（FastAPI）

基于 FastAPI 的手语识别与用户认证服务。支持 AI 模型推理（TensorFlow + MediaPipe）、JWT 登录、邮箱找回密码（fastapi-mail），并保留与 `ai_services` 的兼容接口。

## 功能概览
- 用户注册/登录，Access Token 7 天有效（HS256），邮箱唯一，密码 bcrypt 哈希。
- 找回密码：生成一次性重置 Token，通过 SMTP 真实发送邮件（fastapi-mail + BackgroundTasks）。
- 用户名：注册时可选；未提供时自动从邮箱前缀生成并确保唯一；登录后可 PATCH /users/me 更新。
- 手语识别：`/recognize/realtime`、`/recognize/batch`、`/recognize/history` 和 WebSocket `/ws`。
- 兼容接口：`/api/init`、`/api/predict` 与 `ai_services` 请求格式保持一致。

## 快速开始
1) 安装依赖（建议 Python 3.9）  
```bash
pip install -r requirements.txt
```

2) 配置环境  
```bash
cp .env.example .env
```
按需填写：
- `SECRET_KEY`（必填，随机足够长）
- `DATABASE_URL`（默认 SQLite，本地文件 `app/db.sqlite3`）
- `MAIL_*`（真实 SMTP 配置，找回密码必需）
- `SIGNLANG_MODEL_PATH` / `SIGNLANG_LABELS_PATH`（识别模型与标签文件）

3) 运行服务  
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
`DEBUG=true` 时自动开启 `/docs`。

4) 模型文件  
确保 `.env` 中的模型/标签路径存在，否则识别类接口会返回“未初始化”。

## 目录结构
```
backend/
├── app/
│   ├── main.py                 # FastAPI 入口，CORS、路由注册、生命周期
│   ├── api/routes/flask_compat.py  # 与 ai_services 兼容的 /api/init、/api/predict
│   ├── core/
│   │   ├── config.py           # 配置加载（含数据库/JWT/邮件）
│   │   ├── recognizer.py       # 手语识别器封装
│   │   └── security.py         # 密码哈希、JWT
│   ├── crud/user.py            # 用户 CRUD
│   ├── database.py             # SQLAlchemy Engine/Session/Base
│   ├── deps.py                 # FastAPI 依赖（当前用户等）
│   ├── models/
│   │   ├── user.py             # 用户表模型（自增 Int）
│   │   └── schemas.py          # 手语识别相关 Pydantic 模型
│   ├── routers/
│   │   ├── auth.py             # 注册/登录/找回密码
│   │   └── users.py            # /users/me 获取与修改用户名
│   ├── schemas/auth.py         # 认证相关 Pydantic 模型
│   ├── services/
│   │   ├── translator.py       # 识别服务
│   │   └── email.py            # 邮件发送封装（fastapi-mail）
│   └── utils/                  # 通用工具、日志、错误封装
├── .env.example                # 环境变量示例
├── API.md                      # 详细接口文档
├── requirements.txt
└── ai_services兼容性说明.md
```

## 接口文档
详见 `backend/API.md`，涵盖认证、手语识别、兼容接口以及请求/响应示例。

## 常见问题
- **模型未初始化**：确认模型/标签路径正确且文件存在。
- **邮件发送失败**：检查 SMTP 主机/端口/TLS/凭证；未配置时 `request-password-reset` 将返回 500。
- **Token 失效**：Access Token 有效期 7 天，需重新登录获取新 Token。
