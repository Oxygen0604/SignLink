"""
实时手语翻译后端服务
使用 Flask 提供 API 接口，支持实时视频流处理
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from tensorflow import keras
import json
import base64
from io import BytesIO
from PIL import Image
import os

# 获取当前文件所在目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
CORS(app)

class SignLanguageTranslator:
    def __init__(self, model_path, label_path):
        # 加载模型
        self.model = keras.models.load_model(model_path)
        
        # 加载标签
        with open(label_path, 'r', encoding='utf-8') as f:
            label_mapping = json.load(f)
        self.labels = label_mapping['classes']
        
        # 初始化 MediaPipe
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        
    def extract_features(self, image):
        """提取手部关键点特征"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.hands.process(image_rgb)
        
        if not results.multi_hand_landmarks:
            return None, None
        
        features = []
        for hand_landmarks in results.multi_hand_landmarks:
            hand_features = []
            for landmark in hand_landmarks.landmark:
                hand_features.extend([landmark.x, landmark.y, landmark.z])
            features.extend(hand_features)
        
        # 填充到固定长度
        if len(results.multi_hand_landmarks) == 1:
            features.extend([0] * 63)
        
        return np.array(features[:126]), results.multi_hand_landmarks
    
    def predict(self, image):
        """预测手语含义"""
        features, hand_landmarks = self.extract_features(image)
        
        if features is None:
            return None, 0.0, None
        
        features = features.reshape(1, -1)
        predictions = self.model.predict(features, verbose=0)
        
        predicted_class = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class])
        predicted_label = self.labels[predicted_class]
        
        return predicted_label, confidence, hand_landmarks
    
    def draw_landmarks(self, image, hand_landmarks):
        """在图像上绘制手部关键点"""
        for landmarks in hand_landmarks:
            self.mp_drawing.draw_landmarks(
                image,
                landmarks,
                self.mp_hands.HAND_CONNECTIONS,
                self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                self.mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
            )
        return image

# 全局翻译器实例
translator = None

def init_translator():
    """启动时自动初始化翻译器"""
    global translator
    try:
        model_path = os.path.join(BASE_DIR, 'sign_language_model.h5')
        label_path = os.path.join(BASE_DIR, 'sign_language_labels.json')
        
        if not os.path.exists(model_path):
            print(f"⚠️ 模型文件不存在: {model_path}")
            return False
        if not os.path.exists(label_path):
            print(f"⚠️ 标签文件不存在: {label_path}")
            return False
            
        translator = SignLanguageTranslator(model_path, label_path)
        print(f"✅ 模型加载成功！")
        print(f"   - 类别数: {len(translator.labels)}")
        print(f"   - 类别: {translator.labels}")
        return True
    except Exception as e:
        print(f"❌ 模型加载失败: {str(e)}")
        return False

@app.route('/')
def index():
    """主页，返回实时翻译页面"""
    return send_from_directory(BASE_DIR, 'realtime_translation.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """提供静态文件"""
    return send_from_directory(BASE_DIR, filename)

@app.route('/api/init', methods=['POST'])
def init_model():
    """初始化模型"""
    global translator
    if translator is not None:
        return jsonify({
            'success': True,
            'message': '模型已加载',
            'num_classes': len(translator.labels),
            'classes': translator.labels
        })
    
    try:
        model_path = os.path.join(BASE_DIR, 'sign_language_model.h5')
        label_path = os.path.join(BASE_DIR, 'sign_language_labels.json')
        
        translator = SignLanguageTranslator(model_path, label_path)
        
        return jsonify({
            'success': True,
            'message': '模型加载成功',
            'num_classes': len(translator.labels),
            'classes': translator.labels
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'模型加载失败: {str(e)}'
        })

@app.route('/api/predict', methods=['POST'])
def predict():
    """处理单帧图像并返回预测结果"""
    global translator
    
    if translator is None:
        return jsonify({
            'success': False,
            'message': '模型未初始化'
        })
    
    try:
        # 获取base64图像数据
        data = request.json
        image_data = data['image'].split(',')[1]
        
        # 解码图像
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        image_np = np.array(image)
        
        # 转换颜色空间
        if image_np.shape[2] == 4:  # RGBA
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2BGR)
        else:  # RGB
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # 预测
        predicted_label, confidence, hand_landmarks = translator.predict(image_np)
        
        if predicted_label is None:
            return jsonify({
                'success': True,
                'detected': False,
                'message': '未检测到手势'
            })
        
        # 绘制关键点
        if hand_landmarks:
            image_np = translator.draw_landmarks(image_np, hand_landmarks)
        
        # 转换回base64
        _, buffer = cv2.imencode('.jpg', image_np)
        annotated_image = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'success': True,
            'detected': True,
            'word': predicted_label,
            'confidence': confidence,
            'annotated_image': f'data:image/jpeg;base64,{annotated_image}'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'预测失败: {str(e)}'
        })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("手语翻译服务器启动中...")
    print("="*60)
    
    # 启动时自动加载模型
    print("\n正在加载模型...")
    init_translator()
    
    print("\n服务器地址:")
    print("  - 实时翻译: http://127.0.0.1:5000/realtime_translation.html")
    print("  - 数据采集: http://127.0.0.1:5000/data_collection.html")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

