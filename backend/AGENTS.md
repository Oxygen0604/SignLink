# SignLink Backend Architecture & Guidelines

> **Last Updated**: 2026-01-17
> **Status**: Active
> **Role**: Reference for AI Agents & Developers

## 1. Project Overview
SignLink Backend is a **FastAPI-based** service providing sign language recognition, user authentication, and interactive quiz features. It replaces the original Node.js/Flask plans with a unified, high-performance Python asynchronous server.

## 2. Directory Structure (Key Paths)
```
backend/
├── app/
│   ├── assets/                 # [NEW] Static assets
│   │   └── models/             # [NEW] Self-contained model storage (.h5, .json)
│   ├── main.py                 # Application Entrypoint & WebSocket Handler
│   ├── core/                   # Configuration & AI Inference Logic
│   │   ├── config.py           # Handles Env Vars & Asset Paths
│   │   └── recognizer.py       # MediaPipe + TensorFlow Wrapper
│   ├── models/                 # SQLAlchemy ORM Models
│   │   ├── user.py             # User Account
│   │   └── quiz.py             # Questions & UserQuizRecord
│   ├── routers/                # API Endpoints
│   │   ├── quiz.py             # Quiz, Rank, Stats
│   │   └── ...
│   └── ...
├── ai_services/                # (Legacy/Reference) Original training scripts
└── ...
```

## 3. Key Architecture Decisions

### 3.1. AI Model Deployment (Self-Contained)
- **Change**: Models are NO LONGER loaded from `ai_services/`.
- **Current**: Models are deployed to `backend/app/assets/models/`.
- **Config**: `app/core/config.py` points to these internal assets by default.
- **Reason**: Ensures the backend is a self-contained deployable unit.

### 3.2. Secure Quiz Flow (WebSocket)
- **Protocol**: WebSocket (`/ws`)
- **Message Type**: `answer_request`
- **Flow**:
  1. Client sends Frame + QuestionID.
  2. **Server** runs recognition on the frame.
  3. **Server** fetches correct answer from DB.
  4. **Server** compares results (case-insensitive).
  5. **Server** saves result to `UserQuizRecord`.
  6. **Server** returns `{ type: "answer_response", is_correct: bool, ... }`.
- **Security**: Prevents client-side score manipulation.

### 3.3. Ranking & Statistics
- **Implementation**: No separate "Leaderboard" table.
- **Logic**: Real-time aggregation via SQL (`func.count`, `group_by`) in `routers/quiz.py`.
- **Endpoints**:
  - `GET /quiz/rank`: Top users by correct answer count.
  - `GET /quiz/stats`: User's personal stats (Accuracy, Rank, Total).

### 3.4. AI Q&A (Visual Only)
- **Status**: No LLM (Large Language Model) integration.
- **Function**: "AI Q&A" strictly refers to "Visual Sign Recognition" -> "Text Output".
- **Interface**: Reuses the core recognition logic.

## 4. Development Guidelines

### 4.1. Environment Setup
```bash
# Backend Root
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4.2. Model Verification
- Use `backend/tests/test_inference.py` (to be created) to verify model loading and prediction without starting the full server.
- Ensure `.env` does NOT override `SIGNLANG_MODEL_PATH` with invalid paths.

### 4.3. Code Style
- **Type Hints**: Required.
- **Async**: Prefer `async def` for routes and DB operations where possible (currently using synchronous `Session` dependency, likely blocking - future optimization point).
- **Logging**: Use `app.utils.logger_config`.

## 5. API Quick Reference
- **Auth**: `/auth/login`, `/auth/register`
- **Quiz**: `/quiz/questions`, `/quiz/rank`, `/quiz/stats`
- **Recognition**: `/recognize/realtime` (REST), `/ws` (WebSocket)
