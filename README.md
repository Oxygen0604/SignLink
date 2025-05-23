# SignLink · 图像识别手语翻译系统

SignLink 是一个集成图像识别与 3D 可视化的手语翻译系统，支持**手语实时识别翻译、视频图像翻译**以及**自然语言文本转手语动画**功能，致力于打造健听人士与听障人士之间无障碍沟通的智能桥梁。

---

## 项目简介

SignLink 提供了**双向翻译能力**：

1. **手语 → 文字**：通过摄像头实时捕捉手势，识别手语并翻译为文字。也支持上传视频或图片翻译。
2. **文字 → 手语**：将输入的自然语言文本转化为手语语义，输出为驱动 3D 手势模型的视频动画。

---

## 核心功能

-  **实时摄像头识别**：通过设备摄像头捕捉手势动作，实时翻译为对应的文字内容。
-  **视频/图片上传识别**：上传含有手语的视频或图片，系统识别并输出对应文字翻译。
-  **文字转手语动画**：输入文字后，系统生成手语语义，并驱动 3D 手部模型（基于 Three.js）生成手语动作。
-  **语义映射与自然语言处理**：集成蓝心大模型与 LSTM 网络，实现手语到自然语言之间的高质量语义转换。
-  **多平台支持**：支持 Android、iOS 和 Web 端部署。

---

## 页面设计说明

系统分为**两大主页面**，每页包含不同功能子页：

### 1. 手语翻译为文字页

用于将手势识别为文字，分为两种方式：

- **实时翻译**  
  - 上方：摄像头画面实时显示手势识别过程  
  - 下方：实时翻译的文本输出区域

- **上传翻译**  
  - 用户可以上传视频或图片  
  - 系统自动识别并输出对应的手语含义（文字）

### 2. 文字翻译为手语页

用于将文字转化为手语视频：

- 上方：基于 Three.js 渲染的大型 3D 手势模型区域  
- 下方：文本输入框，输入需翻译的自然语言句子  
- 系统将文字解析为语义信息，绑定对应手势特征点并生成手语视频

---

## 技术栈

| 层级       | 技术方案                         |  
|------------|----------------------------------|  
| 前端       | React Native, Three.js, TypeScript |  
| 后端       | Python, Flask / FastAPI          |  
| 图像识别   | MediaPipe                        |  
| NLP        | 蓝心大模型, LSTM, spaCy / NLTK   |  
| 渲染引擎   | Three.js（3D 手势动画）          |  
| 部署平台   | Android, iOS, Web(后续)                |  

---

## 项目目录结构

SignLink/  
├── frontend/ # React Native 前端代码  
│ ├── pages/  
│ │ ├── SignToText/ # 手语翻译为文字页  
│ │ └── TextToSign/ # 文字翻译为手语页  
│ ├── components/  
│ │ └── HandModel3D/ # Three.js 3D 模型组件  
│ └── assets/  
├── backend/ # Python 后端服务  
│ ├── app.py  
│ ├── mediapipe_module/ # 图像识别  
│ └── nlp_module/ # LSTM + 语义模型  
├── public/ # 公共图像/视频资源  
├── models/ # 模型权重文件  
├── requirements.txt # Python 依赖  
└── README.md  

---

## 快速开始

### 后端运行
cd backend/  
pip install -r requirements.txt  
python app.py  
### 前端运行（React Native）
cd frontend/  
npm install  
npx react-native run-android   # 或 npx react-native run-ios  

---

## 应用场景
- 听障人士日常沟通辅助

- 医疗、政务、交通等公共服务场景无障碍交流

- 教育场景中的手语教学工具

- 手语识别与语义分析研究平台

## 贡献者
    
......文档待补充