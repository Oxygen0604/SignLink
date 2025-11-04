"""
手语识别模型训练代码
使用 MediaPipe 进行手部关键点检测，结合深度学习模型实现手语到英文的翻译
"""

import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import os
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

class SignLanguageModel:
    def __init__(self, num_classes):
        self.num_classes = num_classes
        self.model = None
        self.label_encoder = LabelEncoder()
        
        # 初始化 MediaPipe 手部检测
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    def preprocess_image(self, image_path):
        """
        预处理图像：灰度化、手部关键点提取
        返回手部关键点特征向量
        """
        # 读取图像
        image = cv2.imread(image_path)
        if image is None:
            return None
        
        # 转换为灰度图（减少光照影响）
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 转回RGB用于MediaPipe处理
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # 检测手部关键点
        results = self.hands.process(image_rgb)
        
        if not results.multi_hand_landmarks:
            return None
        
        # 提取特征：每只手21个关键点，每个点3个坐标(x, y, z)
        features = []
        
        for hand_landmarks in results.multi_hand_landmarks:
            hand_features = []
            for landmark in hand_landmarks.landmark:
                hand_features.extend([landmark.x, landmark.y, landmark.z])
            features.extend(hand_features)
        
        # 如果只有一只手，填充零向量
        if len(results.multi_hand_landmarks) == 1:
            features.extend([0] * 63)  # 21 * 3 = 63
        
        return np.array(features[:126])  # 最多2只手，共126个特征
    
    def load_dataset(self, dataset_dir):
        """
        从数据集目录加载训练数据
        目录结构: dataset_dir/word_label/image_files.jpg
        """
        X = []
        y = []
        
        if not os.path.exists(dataset_dir):
            print(f"数据集目录不存在: {dataset_dir}")
            return np.array([]), np.array([])
        
        for word_label in os.listdir(dataset_dir):
            word_path = os.path.join(dataset_dir, word_label)
            if not os.path.isdir(word_path):
                continue
            
            print(f"加载标签: {word_label}")
            
            for img_file in os.listdir(word_path):
                if not img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    continue
                
                img_path = os.path.join(word_path, img_file)
                features = self.preprocess_image(img_path)
                
                if features is not None:
                    X.append(features)
                    y.append(word_label)
        
        if len(X) == 0:
            print("警告：没有加载到任何有效数据")
            return np.array([]), np.array([])
        
        X = np.array(X)
        y = np.array(y)
        
        # 标签编码
        y_encoded = self.label_encoder.fit_transform(y)
        
        return X, y_encoded
    
    def build_model(self, input_shape):
        """
        构建深度学习模型
        使用多层全连接网络 + Dropout防止过拟合
        """
        model = keras.Sequential([
            layers.Input(shape=input_shape),
            
            # 第一层
            layers.Dense(256, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.4),
            
            # 第二层
            layers.Dense(512, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.4),
            
            # 第三层
            layers.Dense(256, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.3),
            
            # 第四层
            layers.Dense(128, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.3),
            
            # 输出层
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        return model
    
    def train(self, X_train, y_train, X_val, y_val, epochs=100, batch_size=32):
        """
        训练模型
        """
        if self.model is None:
            self.build_model((X_train.shape[1],))
        
        # 回调函数
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=15,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7
            ),
            keras.callbacks.ModelCheckpoint(
                'c:/Users/86135/Desktop/my/sign_language_model_best.h5',
                monitor='val_accuracy',
                save_best_only=True,
                mode='max'
            )
        ]
        
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        return history
    
    def save_model(self, model_path, label_path):
        """
        保存模型和标签编码器
        """
        self.model.save(model_path)
        
        # 保存标签映射
        label_mapping = {
            'classes': self.label_encoder.classes_.tolist()
        }
        with open(label_path, 'w', encoding='utf-8') as f:
            json.dump(label_mapping, f, ensure_ascii=False, indent=2)
        
        print(f"模型已保存到: {model_path}")
        print(f"标签映射已保存到: {label_path}")
    
    def load_model(self, model_path, label_path):
        """
        加载训练好的模型
        """
        self.model = keras.models.load_model(model_path)
        
        with open(label_path, 'r', encoding='utf-8') as f:
            label_mapping = json.load(f)
        
        self.label_encoder.classes_ = np.array(label_mapping['classes'])
        print(f"模型已加载: {model_path}")
    
    def predict(self, image_path):
        """
        预测单张图片
        """
        features = self.preprocess_image(image_path)
        if features is None:
            return None, 0.0
        
        features = features.reshape(1, -1)
        predictions = self.model.predict(features, verbose=0)
        
        predicted_class = np.argmax(predictions[0])
        confidence = predictions[0][predicted_class]
        
        predicted_label = self.label_encoder.inverse_transform([predicted_class])[0]
        
        return predicted_label, confidence


def main():
    """
    主训练流程
    """
    print("=" * 60)
    print("手语识别模型训练程序")
    print("=" * 60)
    
    # 数据集路径
    dataset_dir = 'c:/Users/86135/Desktop/my/sign_language_dataset'
    
    # 创建模型实例（类别数会在加载数据后更新）
    model = SignLanguageModel(num_classes=10)
    
    # 加载数据集
    print("\n[1/5] 加载数据集...")
    X, y = model.load_dataset(dataset_dir)
    
    if len(X) == 0:
        print("错误：没有找到训练数据！")
        print(f"请确保数据集存在于: {dataset_dir}")
        print("目录结构应为: dataset_dir/word_label/image_files.jpg")
        return
    
    # 更新类别数
    model.num_classes = len(np.unique(y))
    print(f"数据集大小: {len(X)} 样本")
    print(f"类别数: {model.num_classes}")
    print(f"类别: {model.label_encoder.classes_}")
    
    # 划分训练集和验证集
    print("\n[2/5] 划分训练集和验证集...")
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"训练集: {len(X_train)} 样本")
    print(f"验证集: {len(X_val)} 样本")
    
    # 构建模型
    print("\n[3/5] 构建神经网络模型...")
    model.build_model((X_train.shape[1],))
    model.model.summary()
    
    # 训练模型
    print("\n[4/5] 开始训练...")
    history = model.train(X_train, y_train, X_val, y_val, epochs=100, batch_size=32)
    
    # 保存模型
    print("\n[5/5] 保存模型...")
    model.save_model(
        'c:/Users/86135/Desktop/my/sign_language_model.h5',
        'c:/Users/86135/Desktop/my/sign_language_labels.json'
    )
    
    # 评估模型
    print("\n" + "=" * 60)
    print("训练完成！")
    print("=" * 60)
    val_loss, val_accuracy = model.model.evaluate(X_val, y_val, verbose=0)
    print(f"验证集准确率: {val_accuracy * 100:.2f}%")
    print(f"验证集损失: {val_loss:.4f}")
    
    print("\n模型文件:")
    print("  - sign_language_model.h5")
    print("  - sign_language_labels.json")
    print("\n可以使用实时翻译页面进行测试！")


if __name__ == "__main__":
    main()
