# 手语手势识别模型训练总结

## 项目概述

使用 CNN(MobileNetV2) + RNN(LSTM)组合模型进行手语手势识别

## 数据集

- **训练集**: 2 个手势类别 (Accept, Appear)，每类 3 个视频
- **测试集**: 2 个手势类别 (Accept, Appear)，每类 3 个视频
- **每个视频**: 提取 201 帧

## 模型架构

### 1. 空间特征提取器 (CNN)

- **模型**: MobileNetV2 (预训练于 ImageNet)
- **输入尺寸**: 299 x 299 x 3
- **输出**: 每帧 2 维 softmax 概率分布
- **训练结果**:
  - 训练准确率: ~100%
  - 验证准确率: 100% (第 14 轮)
  - 总参数: 2,260,546
  - 可训练参数: 2,562

### 2. 时序特征学习器 (RNN)

- **模型**: LSTM (256 单元)
- **输入**: 201 帧 x 2 维特征
- **架构**:
  - LSTM 层 (256 单元, dropout=0.2)
  - 全连接层 (2 类, softmax 激活)
- **训练结果**:
  - 训练准确率: 100%
  - 验证准确率: 100%
  - 总参数: 265,730

## 训练步骤

1. **视频帧提取** (`video-to-frame.py`)

   - 从训练和测试视频中提取帧
   - 应用手部分割
   - 每个视频提取 201 帧

2. **CNN 训练** (`retrain_tf2.py`)

   - 使用 MobileNetV2 进行迁移学习
   - 15 个训练轮次
   - 批大小: 32
   - 优化器: Adam

3. **特征提取** (`predict_spatial_tf2.py`)

   - 使用训练好的 CNN 提取每帧的 softmax 概率
   - 训练集: 1206 个帧特征
   - 测试集: 1206 个帧特征

4. **RNN 训练** (`rnn_train_tf2.py`)

   - 使用提取的特征训练 LSTM
   - 20 个训练轮次
   - 批大小: 32
   - 学习率: 0.001 (带自适应调整)

5. **模型评估** (`rnn_eval_tf2.py`)
   - 在测试集上评估
   - 最终准确率: **100%**

## 测试结果

| 视频 ID | 预测类别 | 实际类别 | 正确? | 置信度 |
| ------- | -------- | -------- | ----- | ------ |
| 1       | accept   | accept   | ✓     | 0.5193 |
| 2       | accept   | accept   | ✓     | 0.5182 |
| 3       | accept   | accept   | ✓     | 0.5182 |
| 4       | appear   | appear   | ✓     | 0.5515 |
| 5       | appear   | appear   | ✓     | 0.5504 |
| 6       | appear   | appear   | ✓     | 0.5513 |

**测试准确率**: 6/6 = 100.00%

## 文件结构

```
sign-language-gesture-recognition/
├── train_videos/          # 训练视频
├── test_videos/           # 测试视频
├── train_frames/          # 提取的训练帧
├── test_frames/           # 提取的测试帧
├── checkpoints/           # 保存的模型
│   ├── gesture_rnn.h5    # RNN模型
├── gesture_model_best.h5  # 最佳CNN模型
├── retrained_labels.txt   # 类别标签
├── predicted-frames-final_result-train.pkl  # 训练特征
├── predicted-frames-final_result-test.pkl   # 测试特征
├── results.txt            # 测试结果
└── [训练脚本...]
```

## 依赖项

- Python 3.11
- TensorFlow 2.20.0
- OpenCV 4.12.0
- scikit-learn 1.7.2
- numpy 2.1.3
- tqdm 4.67.1

## 使用方法

### 训练新模型

```bash
# 1. 提取帧
python video-to-frame.py train_videos train_frames
python video-to-frame.py test_videos test_frames

# 2. 训练CNN
python retrain_tf2.py --image_dir train_frames --epochs 15

# 3. 提取特征
python predict_spatial_tf2.py gesture_model_best.h5 train_frames --batch_size 100
python predict_spatial_tf2.py gesture_model_best.h5 test_frames --batch_size 100 --test

# 4. 训练RNN
python rnn_train_tf2.py predicted-frames-final_result-train.pkl gesture_rnn.model --batch_size 32 --epochs 20

# 5. 评估模型
python rnn_eval_tf2.py predicted-frames-final_result-test.pkl gesture_rnn.model
```

## 性能总结

✅ **CNN 模型**: 验证准确率 100%
✅ **RNN 模型**: 验证准确率 100%
✅ **最终测试**: 准确率 100%

## 改进建议

1. 增加更多手势类别和样本
2. 使用数据增强技术
3. 尝试不同的 CNN 架构（如 Inception V3, ResNet）
4. 调整 LSTM 层数和单元数
5. 添加注意力机制

---

**训练完成时间**: 2025-10-30
**状态**: ✅ 成功
