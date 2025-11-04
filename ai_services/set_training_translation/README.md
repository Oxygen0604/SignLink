# 手语翻译系统

一个基于深度学习的实时手语翻译系统，支持双手识别和灰度处理，减少环境干扰。

## 📋 项目功能

1. **模型训练** - 使用 MediaPipe 手部跟踪和深度神经网络
2. **数据采集** - 前端页面支持连拍和数据集管理
3. **实时翻译** - 实时视频流手语识别翻译

## 🚀 快速开始

### 环境要求

- Python 3.8+
- 现代浏览器（Chrome/Firefox/Edge）

### 安装依赖

```bash
pip install tensorflow opencv-python mediapipe numpy scikit-learn flask flask-cors pillow
```

### 使用步骤

#### 1️⃣ 数据采集

1. 在浏览器中打开 `data_collection.html`
2. 输入要训练的英文单词（如 hello, thank you, goodbye）
3. 设置连拍数量（建议每个单词 50-100 张）
4. 点击"启动摄像头"
5. 点击"开始连拍"进行数据采集
6. 对多个单词重复以上步骤
7. 点击"下载数据集"保存为 ZIP 文件

#### 2️⃣ 准备训练数据

1. 解压下载的数据集 ZIP 文件
2. 将解压后的文件夹重命名为 `sign_language_dataset`
3. 将文件夹放置在：`c:\Users\86135\Desktop\my\sign_language_dataset`
4. 目录结构应该是：
   ```
   sign_language_dataset/
   ├── hello/
   │   ├── hello_1234567890.jpg
   │   ├── hello_1234567891.jpg
   │   └── ...
   ├── thank_you/
   │   ├── thank_you_1234567890.jpg
   │   └── ...
   └── goodbye/
       └── ...
   ```

#### 3️⃣ 训练模型

```bash
python train_sign_language_model.py
```

训练完成后会生成：

- `sign_language_model.h5` - 训练好的模型
- `sign_language_labels.json` - 标签映射文件

#### 4️⃣ 实时翻译

1. 启动后端服务：

   ```bash
   python translation_server.py
   ```

2. 在浏览器中打开 `realtime_translation.html`
3. 点击"启动摄像头"
4. 点击"开始翻译"

## 📁 文件说明

| 文件名                         | 说明                       |
| ------------------------------ | -------------------------- |
| `train_sign_language_model.py` | 模型训练脚本               |
| `data_collection.html`         | 数据采集前端页面           |
| `realtime_translation.html`    | 实时翻译前端页面           |
| `translation_server.py`        | Flask 后端服务             |
| `sign_language_model.h5`       | 训练好的模型（训练后生成） |
| `sign_language_labels.json`    | 标签映射（训练后生成）     |

## 🔧 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **后端**：Flask, Python
- **深度学习**：TensorFlow/Keras
- **计算机视觉**：OpenCV, MediaPipe
- **手部跟踪**：MediaPipe Hands（支持双手，21 个关键点/手）

## 🎯 模型特点

1. **双手支持** - 同时识别两只手的手势
2. **灰度处理** - 减少光照和颜色影响
3. **关键点提取** - 每只手 21 个关键点（x, y, z 坐标）
4. **深度网络** - 多层全连接网络 + BatchNormalization + Dropout
5. **早停机制** - 防止过拟合
6. **学习率调整** - 自动降低学习率优化训练

## 📊 模型架构

```
输入层 (126维特征)
    ↓
Dense(256) + ReLU + BatchNorm + Dropout(0.4)
    ↓
Dense(512) + ReLU + BatchNorm + Dropout(0.4)
    ↓
Dense(256) + ReLU + BatchNorm + Dropout(0.3)
    ↓
Dense(128) + ReLU + BatchNorm + Dropout(0.3)
    ↓
输出层 (Softmax)
```

## 💡 使用建议

1. **数据采集**：

   - 每个单词至少拍摄 50 张照片
   - 变换不同的角度和位置
   - 在不同光照条件下拍摄
   - 保持手势清晰可见

2. **模型训练**：

   - 至少准备 5-10 个不同的单词
   - 每个单词 50-100 张图片
   - 训练时间取决于数据量（通常 5-30 分钟）

3. **实时翻译**：
   - 确保光线充足
   - 手势尽量放在画面中央
   - 手势保持稳定 1-2 秒以获得最佳识别

## 🔍 常见问题

**Q: 识别准确率低？**
A: 增加训练数据量，确保每个单词有足够多样化的样本

**Q: 无法检测到手部？**
A: 检查光照条件，确保手部清晰可见，背景不要太复杂

**Q: 服务器连接失败？**
A: 确保 `translation_server.py` 正在运行，检查端口 5000 是否被占用

## 📝 扩展功能

可以通过以下方式扩展：

- 添加更多手语词汇
- 支持手语句子识别
- 添加语音输出功能
- 支持多语言翻译
- 优化模型结构提高准确率

## 📄 许可证

MIT License

## 👨‍💻 作者

手语翻译系统开发团队

---

**享受使用！如有问题欢迎反馈。** 🤟
