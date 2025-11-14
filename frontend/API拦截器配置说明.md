# API 拦截器配置说明

## 概述
本项目使用 Axios 实现了 API 拦截器，用于统一处理 API 请求和响应，包括请求日志、错误处理、认证信息添加等。

## 目录结构
```
api/
├── axiosInstance.ts  # Axios 实例配置和拦截器
└── index.ts          # API 服务封装
```

## 文件说明

### 1. axiosInstance.ts
- 创建了 Axios 实例，配置了基础 URL 和超时时间
- 实现了请求拦截器，用于添加请求日志和认证信息
- 实现了响应拦截器，用于统一处理响应数据和错误

### 2. index.ts
- 定义了 API 返回类型接口
- 封装了手语识别相关的 API 请求
- 提供了统一的 API 服务调用方式

## 使用方法

### 导入 API 服务
```typescript
import { signRecognitionApi } from '../api';
```

### 调用 API
```typescript
// 实时手语识别
const result = await signRecognitionApi.realtimeRecognize(imageData);

// 批量手语识别
const result = await signRecognitionApi.batchRecognize(images);

// 获取识别历史
const history = await signRecognitionApi.getHistory();
```

## 拦截器功能

### 请求拦截器
- 打印请求日志（URL、方法、数据、参数）
- 可添加认证信息（如 token）

### 响应拦截器
- 打印响应日志（URL、状态码、数据）
- 直接返回响应数据，简化调用
- 统一处理错误（网络错误、401、403、404、500 等）

## 环境变量
API 基础 URL 通过环境变量 `HTTP_API_URL` 配置，确保了不同环境的灵活切换。

## 扩展建议
1. 根据业务需求添加更多 API 服务
2. 在请求拦截器中添加认证信息
3. 扩展错误处理逻辑，添加用户提示
4. 实现请求重试机制
5. 添加请求取消功能