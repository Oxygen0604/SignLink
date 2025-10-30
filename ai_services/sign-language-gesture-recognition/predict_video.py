"""
使用训练好的模型对新视频进行手势识别预测
"""
import tensorflow as tf
import numpy as np
import cv2
import argparse
from pathlib import Path
import handsegment as hs

def load_labels(label_file='retrained_labels.txt'):
    """加载类别标签"""
    labels = []
    with open(label_file, 'r') as f:
        for line in f:
            labels.append(line.strip())
    return labels

def extract_frames_from_video(video_path, max_frames=201):
    """从视频中提取帧"""
    cap = cv2.VideoCapture(video_path)
    frames = []
    count = 0
    
    while count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        
        # 应用手部分割
        frame = hs.handsegment(frame)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        frames.append(frame)
        count += 1
    
    # 如果帧数不足，重复最后一帧
    if len(frames) > 0:
        last_frame = frames[-1]
        while len(frames) < max_frames:
            frames.append(last_frame)
    
    cap.release()
    return frames

def preprocess_frames(frames, image_size=299):
    """预处理帧用于CNN"""
    processed = []
    for frame in frames:
        # 转换为RGB
        if len(frame.shape) == 2:
            frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2RGB)
        
        # 调整大小
        frame = cv2.resize(frame, (image_size, image_size))
        
        # 归一化
        frame = frame.astype(np.float32) / 255.0
        processed.append(frame)
    
    return np.array(processed)

def predict_gesture(video_path, cnn_model_path, rnn_model_path, label_file='retrained_labels.txt'):
    """对单个视频进行手势预测"""
    
    # 加载标签
    labels = load_labels(label_file)
    print(f"类别: {labels}\n")
    
    # 加载模型
    print("加载CNN模型...")
    cnn_model = tf.keras.models.load_model(cnn_model_path)
    
    print("加载RNN模型...")
    rnn_model = tf.keras.models.load_model(rnn_model_path)
    
    # 提取帧
    print(f"\n从视频提取帧: {video_path}")
    frames = extract_frames_from_video(video_path)
    print(f"提取了 {len(frames)} 帧")
    
    if len(frames) == 0:
        print("错误: 无法从视频提取帧")
        return None
    
    # 预处理帧
    print("预处理帧...")
    processed_frames = preprocess_frames(frames)
    
    # 使用CNN提取特征
    print("使用CNN提取特征...")
    features = cnn_model.predict(processed_frames, verbose=0)
    
    # 重塑为RNN输入格式 (1, num_frames, num_features)
    rnn_input = features.reshape(1, len(features), -1)
    
    # 使用RNN进行预测
    print("使用RNN进行预测...")
    prediction = rnn_model.predict(rnn_input, verbose=0)
    
    # 获取预测结果
    predicted_class = np.argmax(prediction[0])
    confidence = prediction[0][predicted_class]
    predicted_label = labels[predicted_class]
    
    print("\n" + "="*50)
    print("预测结果:")
    print("="*50)
    print(f"手势: {predicted_label}")
    print(f"置信度: {confidence:.4f}")
    print("="*50)
    
    # 显示所有类别的概率
    print("\n所有类别的概率:")
    for i, label in enumerate(labels):
        prob = prediction[0][i]
        print(f"  {label}: {prob:.4f}")
    
    return predicted_label, confidence

def main():
    parser = argparse.ArgumentParser(description='对视频进行手势识别')
    parser.add_argument('video_path', help='视频文件路径')
    parser.add_argument('--cnn_model', default='gesture_model_best.h5',
                        help='CNN模型路径')
    parser.add_argument('--rnn_model', default='checkpoints/gesture_rnn.h5',
                        help='RNN模型路径')
    parser.add_argument('--label_file', default='retrained_labels.txt',
                        help='标签文件路径')
    
    args = parser.parse_args()
    
    # 检查文件是否存在
    if not Path(args.video_path).exists():
        print(f"错误: 视频文件不存在: {args.video_path}")
        return
    
    if not Path(args.cnn_model).exists():
        print(f"错误: CNN模型不存在: {args.cnn_model}")
        return
    
    if not Path(args.rnn_model).exists():
        print(f"错误: RNN模型不存在: {args.rnn_model}")
        return
    
    # 进行预测
    predict_gesture(args.video_path, args.cnn_model, args.rnn_model, args.label_file)

if __name__ == '__main__':
    main()
