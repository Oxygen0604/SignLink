# SignLink · 图像识别手语翻译系统

SignLink 是一个集成图像识别与 3D 可视化的手语、盲文翻译系统，支持**手语盲文实时识别翻译、视频图像翻译**以及**自然语言文本转手语动画、盲文图像**功能，致力于打造健听人士与听障人士之间无障碍沟通的智能桥梁。

---

## 项目简介

SignLink 提供了**即时翻译能力**：

- **手语 -> 文字 -> 盲文**：通过摄像头实时捕捉手势，识别手语并翻译为文字。也支持上传视频或图片翻译。将文字转化为盲文坐标序列并在硬件、虚拟机中反馈

---

## 核心功能

-  **实时摄像头识别**：通过设备摄像头捕捉手势动作、麦克风捕捉对话信息，实时进行翻译。
-  **视频/图片上传识别**：上传含有手语的视频或图片，系统识别并输出对应文字翻译。
-  **语音听写**： 实时语音听写并在前端显示。
-  **语义映射与自然语言处理**：集成大模型与 LSTM 网络，实现手语、盲文到自然语言之间的高质量语义转换。
-  **多平台支持**：支持 Android、iOS 和 Web 端部署。

---
## 核心功能实现方案

### 视频流处理

- **硬件** 推送rtsp视频流到服务端
- **后端** 运行rtsp服务器接收摄像头流，使用CoralReefPlayer拉取并解码rtsp流，将视频流转码为浏览器支持的格式
- **前端** 播放实时视频流

### 手语->自然语言的转化

- **后端** openCV从rtsp源拉取实并预处理实时视频流，用mediaPipe进行手部关键点检测
- **AI** 将手语序列转为自然语言（
可参考harshbg/Sign-Language-Interpreter-using-Deep-Learning
sign-language-translator
MediaPipe Sign Language Detection
WLASL 数据集）

### 语音听写

- **前端** 利用js-audio-recorder的方式实现语音文本听写，多语言支持
- **AI** 提供识别语言类型功能
- **硬件** 推送音频到服务端

### 盲文->自然语言
待完善...


---

## 技术栈

| 层级       | 技术方案                           |  
|------------|----------------------------------|  
| 前端       | Rspack, lynx, TypeScript          |  
| 后端       | Python, Flask / FastAPI           |  
| 图像识别   | MediaPipe，openCV                  |  
| NLP       |   LSTM, spaCy / NLTK              |  
| 渲染引擎   | Three.js（3D 手势动画）              |  
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
- **聋哑人士日常交流沟通** SignLink提供了高效、即时的语言转化功能。摄像头能实时识别用户手语并转化为自然语言，并能听写自然人所说的话并显示在前端页面中供用户观看，能极大程度的促进聋哑人士日常生活中的正常沟通
- **手语、盲文学习交流** SignLink提供了准确的手语、盲文翻译功能，便于手语、盲文的学习

## 开发阶段
1. 搭建用户页面，实现 RTSP 服务器视频流接收，硬件视频/音频流传输。
2. 部署 CoralReefPlayer，实现音视频流解码与预处理，了解手语转化相关开源项目及思考处理方法。
3. 实现手语转文字功能。
4. 实现语音听写功能（前端显示、智能语种识别），搭建盲文板虚拟环境。
5. 实现自然语言到盲文序列的转化，并在前端显示。
6. 后续尝试盲文板实体化开发。


## 贡献者
    
......文档待补充