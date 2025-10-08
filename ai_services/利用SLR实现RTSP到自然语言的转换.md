# 利用SLR实现RTSP到自然语言的转换

备选模型

1.[0aqz0](https://github.com/0aqz0)[SLR](https://github.com/0aqz0/SLR)（中文手语）

2.[hthuwal](https://github.com/hthuwal)[sign-language-gesture-recognition](https://github.com/hthuwal/sign-language-gesture-recognition)（阿根廷手语）

## 模型介绍

### [0aqz0](https://github.com/0aqz0)[SLR](https://github.com/0aqz0/SLR) 孤立手语识别

选择这个模型不是一个好选择，在这里介绍是为了说明完成单个手语到单词的转换不利于实时翻译

#### 预处理要求

**输入张量形状**: `(batch_size, channels=3, time=16, height=128, width=128)` 

- **帧数**: 
- **空间分辨率**: 128×128像素 
- **颜色通道**: 3通道RGB图像
- **维度顺序**: (B, C, T, H, W) - 批次、通道、时间、高度、宽度

所有输入帧必须经过以下预处理步骤:

1. **Resize**: 调整到128×128像素
2. **ToTensor**: 转换为PyTorch张量,值域[0,1] 
3. **Normalize**: 归一化到[-1,1],使用mean=[0.5], std=[0.5]

缺点：

对单词处理对整个句子的含义不敏感，要求单个手语的帧序列，需要精确的分割点，导致手语视频边界划分困难，RTSP处理复杂。同时需要后期对单词再加工，不符合翻译的实时性要求。

优点：

适用于词汇级别分类和词典，如果需要扩展该方面

### [0aqz0](https://github.com/0aqz0)[SLR](https://github.com/0aqz0/SLR)连续手语识别

#### 预处理要求

**输入张量形状**: `(batch_size, channels=3, time=48, height=128, width=128)` 

- **帧数**: 固定48帧 CSL_Continuous_Seq2Seq.py:41
- **空间分辨率**: 128×128像素 CSL_Continuous_Seq2Seq.py:40
- **颜色通道**: 3通道RGB图像 Seq2Seq.py:44
- **维度顺序**: (B, C, T, H, W) Seq2Seq.py:114

所有输入帧必须经过以下预处理步骤: 

1. **Resize**: 调整到128×128像素
2. **ToTensor**: 转换为PyTorch张量,值域[0,1] 
3. **Normalize**: 归一化到[-1,1],使用mean=[0.5], std=[0.5]

#### 精确度

支持词级别（WER 1.01%）和字符级别（WER 1.19%）【每100个词语出错一个】

### [hthuwal](https://github.com/hthuwal)[sign-language-gesture-recognition](https://github.com/hthuwal/sign-language-gesture-recognition)

#### 预处理要求

**图片序列长度：**固定序列长度201 帧

每一帧图像需要满足以下要求

- **尺寸**: 299×299 像素(Inception v3 标准输入)
- **归一化**: 减去均值 0,除以标准差 255
- **格式**: 支持 JPEG、PNG、GIF 或 BMP

**手部分割**：原始帧需要经过手部分割处理,转换为灰度图像。



## RTSP预处理（基于0aqz0）

### 1. **RTSP 流捕获模块（目前未实现）**

您需要添加：

- OpenCV 连接到 RTSP 流`cv2.VideoCapture()`
- 用于收集帧进行处理的帧缓冲区
- 实时抽帧逻辑

### 2. **RTSP 流的帧预处理**

应用数据集中使用的相同转换管道：

- 将帧大小调整为 128×128
- 应用归一化（平均值=0.5，标准=0.5）
- 保持模型预期的张量格式

### 3. **处理签名速度变化**

鉴于固定的 48 帧输入要求，以下是处理速度变化的策略：

**策略 A：具有自适应采样的固定时间窗口**

- 从 RTSP 流中捕获固定时间窗口（例如 2-4 秒）
- 如果捕获的帧< 48：使用插值或帧复制
- 如果捕获的帧> 48：应用类似于现有方法的均匀时间采样 

**策略 B：滑动窗口方法**

- 保持帧的滚动缓冲区
- 每当您想要进行预测时，使用均匀采样提取 48 帧
- 这模仿了现有的统一采样逻辑

**策略 C：动态缓冲**

- 使用运动检测或手部位置跟踪来识别标志边界
- 检测到完整的手势后，从该片段中精确采样 48 帧
- 这种方法适应自然的签名速度

### 4. **推理管道**

对于实时推理，需要：

- 通过设置（如在验证中所做的那样） 来禁用教师强制
- 通过编码器-解码器架构处理 48 帧输入 
- 使用贪婪解码生成预测（当前实现使用 argmax 进行标记选择）

## RTSP预处理（基于sign-language-gesture-recognition）

###  从 RTSP 流捕获帧

```
# 伪代码示例  
cap = cv2.VideoCapture("rtsp://your-stream-url")
```

关键点:

- 需要实现**手势边界检测**,确定何时开始和结束一个手势
- 根据手势持续时间,**均匀采样到 201 帧**(如果手势有 300 帧,则每 1.49 帧取一帧)

### 手部分割和灰度转换

对每一帧应用

```
frame = hs.handsegment(frame)  # 手部分割  
frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)  # 灰度转换
```

###  保存为图片文件

将 201 帧保存为 JPEG 文件,按手势类别组织:

```
frames_folder/  
└── gesture_name/  
    ├── frame_0.jpeg  
    ├── frame_1.jpeg  
    ...  
    └── frame_200.jpeg  
```

###  CNN 特征提取

使用 `predict_spatial.py` 提取空间特征

```
python3 predict_spatial.py retrained_graph.pb frames_folder --batch_size=100
```

这会:

- 将图片调整到 299×299
- 归一化像素值
- 通过 Inception v3 提取特征(softmax 或 GlobalPool 层)
- 输出 pickle 文件

### LSTM 序列处理

特征序列被组织成固定长度输入

`get_data()` 函数使用 `deque` 累积恰好 201 个帧的特征向量,形成一个完整的手势样本。



## 训练集

### 0aqz0

- **名称**: Argentinian Sign Language Gestures
- **下载链接**: <https://facundoq.github.io/datasets/lsa64/>

### 2.sign-language-gesture-recognition

http://home.ustc.edu.cn/~pjh/openresources/cslr-dataset-2015/index.html（github给的貌似中科大的不给用）

