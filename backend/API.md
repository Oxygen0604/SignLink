# 接口文档（SignLink 后端）

## 1. 认证与用户

所有 Token 均为 Access Token（HS256），有效期 10080 分钟（7 天）。需在请求头携带：`Authorization: Bearer <token>`。

- **POST /auth/register**  
  请求体：`{ email, password, username? }`  
  - 未提供 `username` 时，使用邮箱 `@` 前缀生成，若冲突自动追加随机数。  
  响应：`{ access_token, token_type, user }` (用户对象已脱敏)

- **POST /auth/login**  
  请求体：`{ email, password }`  
  响应：`{ access_token, token_type, user }` (用户对象已脱敏)

- **GET /auth/validate** (需登录)
  作用：快速验证 Token 有效性。
  - Token 有效：204 No Content
  - Token 无效：401 Unauthorized
  - 用户被禁用：403 Forbidden

- **POST /auth/request-password-reset**  
  请求体：`{ email }`  
  行为：若邮箱存在，生成一次性重置 Token，后台任务发送邮件；未配置 SMTP 时返回 500。总是返回 `{"message": "如果邮箱存在，我们已发送密码重置邮件"}`。

- **POST /auth/reset-password**  
  请求体：`{ token, new_password }`  
  行为：校验 Token 哈希和过期时间，成功后更新密码。

- **GET /users/me**（需登录）  
  返回当前用户公开信息。

- **PATCH /users/me**（需登录）  
  请求体：`{ username }`，校验唯一性后更新。

## 2. 答题与排行榜 (Quiz)

- **GET /quiz/questions**  
  作用：获取题目列表。  
  响应：`[{ "id": 1, "content": "...", "difficulty": "easy", ... }, ...]`

- **GET /quiz/questions/{question_id}**  
  作用：获取单题详情。

- **GET /quiz/rank**  
  作用：获取排行榜（默认前10名）。  
  响应：`[{ "rank": 1, "username": "user1", "score": 100 }, ...]`

- **GET /quiz/stats** (需登录)  
  作用：获取当前用户个人统计。  
  响应：`{ "user_id": 1, "total_questions": 50, "correct_answers": 40, "accuracy": 80.0, "rank": 5 }`

- **POST /quiz/submit** (需登录)  
  *注：此接口用于纯文本结果提交，若需基于视频帧的实时判定，请使用 WebSocket*  
  作用：提交答题结果（文本）。  
  请求体：`{ "question_id": 1, "user_gesture_result": "hello" }`  
  响应：`{ "is_correct": true, "correct_answer": "hello", "message": "恭喜你..." }`

- **GET /quiz/records** (需登录)  
  作用：获取当前用户的历史答题记录。

## 3. 手语识别（HTTP）

> 需确保模型文件存在且加载成功，否则返回「服务未初始化」。

- **POST /recognize/realtime**  
  请求体：`{ image, format?: "jpeg"|"png", quality?: 1-100 }`  
  响应示例：`{ "success": true, "detected": true, "word": "hello", "confidence": 0.85, "message": "识别成功" }`

- **POST /recognize/batch**  
  请求体：`{ images: [base64...], format?, quality? }`  
  响应：`{ "success": true, "results": [ {success, detected, word, confidence, message}, ... ] }`

- **GET /recognize/history**  
  响应：`{ "success": true, "history": [ { "signInput": "...", "signTranslation": "...", "timestamp": "..." }, ... ] }`

## 4. 手语识别与答题（WebSocket）

- **连接**：`ws://<host>:<port>/ws`
- **通用响应**：服务未就绪或格式错误时返回 `type: "error"` 或 `success: false`。

### 4.1 纯图像识别
- **发送**：  
  ```json
  { "type": "image", "data": "data:image/jpeg;base64,..." }
  ```
- **响应**：  
  ```json
  { 
      "type": "recognition_result", 
      "data": { "success": true, "detected": true, "predicted_class": "hello", ... }, 
      "signInput": "hello", 
      "signTranslation": "hello" 
  }
  ```

### 4.2 答题请求 (Secure Flow)
- **发送**：  
  ```json
  { 
      "type": "answer_request", 
      "frame": "data:image/jpeg;base64,...", 
      "question_id": 123,
      "user_id": 1  // 可选，用于记录成绩
  }
  ```
- **响应**：  
  ```json
  { 
      "type": "answer_response", 
      "is_correct": true, 
      "answer": "hello" 
  }
  ```

## 5. 兼容接口（ai_services）

- **POST /api/init**  
  作用：加载模型（若已加载则直接返回状态）。  
  响应示例：`{ "success": true, "message": "模型加载成功", "num_classes": 5, "classes": ["hello", ...] }`

- **POST /api/predict**  
  请求体：`{ "image": "data:image/jpeg;base64,..." }`  
  响应示例：`{ "success": true, "detected": true, "word": "hello", "confidence": 0.9, "annotated_image": "data:image/jpeg;base64,..." }`

## 6. 错误与限制
- 认证失败：401；用户被禁用：403；业务冲突（用户名占用等）：400/409。  
- 找回密码：未配置 SMTP 会直接返回 500。  
- 识别服务未初始化：返回 `success=false` 且提示「服务未初始化」。  
- Access Token 过期需重新登录获取。
