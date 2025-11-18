"""
生产级手语识别 API 服务
- 标准 RESTful API 设计
- 完整的错误处理
- 请求日志记录
- 支持跨域访问 (CORS)
- 健康检查端点
- API 文档
"""

from flask import Flask, request, jsonify
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
import logging
from datetime import datetime
from functools import wraps
import traceback

# ============================================================================
# 配置部分
# ============================================================================

# 获取当前文件所在目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(BASE_DIR, 'api_server.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Flask 应用配置
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # 支持中文
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 限制上传文件最大 16MB

# CORS 配置 - 允许所有来源访问 (生产环境应该限制特定域名)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # 生产环境改为具体域名，如 ["https://yourdomain.com"]
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ============================================================================
# 手语识别核心类
# ============================================================================

class SignLanguageRecognizer:
    """手语识别器 - 封装模型和预处理逻辑"""
    
    def __init__(self, model_path, label_path):
        """
        初始化识别器
        
        Args:
            model_path: 模型文件路径 (.h5)
            label_path: 标签文件路径 (.json)
        """
        logger.info(f"加载模型: {model_path}")
        self.model = keras.models.load_model(model_path)
        
        logger.info(f"加载标签: {label_path}")
        with open(label_path, 'r', encoding='utf-8') as f:
            label_mapping = json.load(f)
        self.labels = label_mapping['classes']
        
        # 初始化 MediaPipe 手部检测
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        
        logger.info(f"模型加载成功，支持 {len(self.labels)} 个类别: {self.labels}")
    
    def extract_features(self, image):
        """
        提取手部关键点特征
        
        Args:
            image: OpenCV 格式的图像 (BGR)
            
        Returns:
            features: 126维特征向量，如果未检测到手部则返回 None
            hand_landmarks: MediaPipe 手部关键点对象
        """
        # 转换为 RGB (MediaPipe 需要)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # 手部检测
        results = self.hands.process(image_rgb)
        
        if not results.multi_hand_landmarks:
            return None, None
        
        # 提取特征向量
        features = []
        for hand_landmarks in results.multi_hand_landmarks:
            hand_features = []
            for landmark in hand_landmarks.landmark:
                hand_features.extend([landmark.x, landmark.y, landmark.z])
            features.extend(hand_features)
        
        # 填充到固定长度 (单手63维，双手126维)
        if len(results.multi_hand_landmarks) == 1:
            features.extend([0] * 63)
        
        return np.array(features[:126]), results.multi_hand_landmarks
    
    def predict(self, image, return_all_probs=False):
        """
        预测手语含义
        
        Args:
            image: OpenCV 格式的图像 (BGR)
            return_all_probs: 是否返回所有类别的概率
            
        Returns:
            dict: 包含预测结果的字典
        """
        # 提取特征
        features, hand_landmarks = self.extract_features(image)
        
        if features is None:
            return {
                'detected': False,
                'message': '未检测到手部'
            }
        
        # 模型预测
        features = features.reshape(1, -1)
        predictions = self.model.predict(features, verbose=0)[0]
        
        # 获取预测结果
        predicted_class = int(np.argmax(predictions))
        confidence = float(predictions[predicted_class])
        predicted_label = self.labels[predicted_class]
        
        result = {
            'detected': True,
            'word': predicted_label,
            'confidence': confidence,
            'hand_landmarks': hand_landmarks
        }
        
        # 如果需要返回所有类别的概率
        if return_all_probs:
            result['all_predictions'] = {
                self.labels[i]: float(predictions[i])
                for i in range(len(self.labels))
            }
        
        return result
    
    def draw_landmarks(self, image, hand_landmarks):
        """
        在图像上绘制手部关键点
        
        Args:
            image: OpenCV 格式的图像 (BGR)
            hand_landmarks: MediaPipe 手部关键点对象
            
        Returns:
            image: 绘制了关键点的图像
        """
        for landmarks in hand_landmarks:
            self.mp_drawing.draw_landmarks(
                image,
                landmarks,
                self.mp_hands.HAND_CONNECTIONS,
                self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                self.mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
            )
        return image

# ============================================================================
# 全局变量
# ============================================================================

recognizer = None  # 全局识别器实例
request_count = 0  # 请求计数
start_time = datetime.now()  # 服务启动时间

# ============================================================================
# 装饰器 - 请求日志和错误处理
# ============================================================================

def log_request(f):
    """记录 API 请求日志"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        global request_count
        request_count += 1
        
        logger.info(f"请求 #{request_count} - {request.method} {request.path} - IP: {request.remote_addr}")
        
        try:
            response = f(*args, **kwargs)
            return response
        except Exception as e:
            logger.error(f"请求处理失败: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': str(e),
                'message': '服务器内部错误'
            }), 500
    
    return decorated_function

# ============================================================================
# API 路由
# ============================================================================

@app.route('/')
def index():
    """API 根路径 - 返回 API 文档"""
    return jsonify({
        'service': 'Sign Language Recognition API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': {
                'method': 'GET',
                'path': '/api/health',
                'description': '健康检查'
            },
            'info': {
                'method': 'GET',
                'path': '/api/info',
                'description': '获取模型信息'
            },
            'predict': {
                'method': 'POST',
                'path': '/api/predict',
                'description': '手语识别',
                'body': {
                    'image': 'base64 编码的图像 (必需)',
                    'draw_landmarks': '是否绘制关键点 (可选, 默认 false)',
                    'return_all_probs': '是否返回所有类别概率 (可选, 默认 false)'
                }
            }
        },
        'documentation': 'https://github.com/yourusername/sign-language-api'
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    uptime = (datetime.now() - start_time).total_seconds()
    
    return jsonify({
        'status': 'healthy',
        'model_loaded': recognizer is not None,
        'uptime_seconds': uptime,
        'request_count': request_count,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/info', methods=['GET'])
@log_request
def get_info():
    """获取模型信息"""
    if recognizer is None:
        return jsonify({
            'success': False,
            'message': '模型未加载'
        }), 503
    
    return jsonify({
        'success': True,
        'model_info': {
            'num_classes': len(recognizer.labels),
            'classes': recognizer.labels,
            'input_shape': [126],  # 126维特征向量
            'description': '基于 MediaPipe 和 TensorFlow 的手语识别模型'
        }
    })

@app.route('/api/predict', methods=['POST'])
@log_request
def predict():
    """
    手语识别 API
    
    请求示例:
    {
        "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
        "draw_landmarks": true,
        "return_all_probs": false
    }
    
    响应示例:
    {
        "success": true,
        "detected": true,
        "word": "hello",
        "confidence": 0.92,
        "annotated_image": "data:image/jpeg;base64,..."
    }
    """
    # 检查模型是否已加载
    if recognizer is None:
        return jsonify({
            'success': False,
            'message': '模型未加载，请先启动服务'
        }), 503
    
    # 检查请求数据
    if not request.json or 'image' not in request.json:
        return jsonify({
            'success': False,
            'message': '请求数据格式错误，需要 JSON 格式且包含 image 字段'
        }), 400
    
    try:
        # 获取参数
        image_data = request.json['image']
        draw_landmarks = request.json.get('draw_landmarks', False)
        return_all_probs = request.json.get('return_all_probs', False)
        
        # 解码 base64 图像
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        image_np = np.array(image)
        
        # 转换颜色空间
        if len(image_np.shape) == 2:  # 灰度图
            image_np = cv2.cvtColor(image_np, cv2.COLOR_GRAY2BGR)
        elif image_np.shape[2] == 4:  # RGBA
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2BGR)
        elif image_np.shape[2] == 3:  # RGB
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # 调用识别器
        result = recognizer.predict(image_np, return_all_probs=return_all_probs)
        
        # 如果未检测到手部
        if not result['detected']:
            return jsonify({
                'success': True,
                'detected': False,
                'message': result['message']
            })
        
        # 构建响应
        response = {
            'success': True,
            'detected': True,
            'word': result['word'],
            'confidence': result['confidence']
        }
        
        # 添加所有类别概率
        if return_all_probs:
            response['all_predictions'] = result['all_predictions']
        
        # 绘制关键点
        if draw_landmarks and result['hand_landmarks']:
            image_np = recognizer.draw_landmarks(image_np, result['hand_landmarks'])
            
            # 转换回 base64
            _, buffer = cv2.imencode('.jpg', image_np, [cv2.IMWRITE_JPEG_QUALITY, 85])
            annotated_image = base64.b64encode(buffer).decode('utf-8')
            response['annotated_image'] = f'data:image/jpeg;base64,{annotated_image}'
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"预测失败: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'预测失败: {str(e)}'
        }), 500

@app.errorhandler(404)
def not_found(error):
    """404 错误处理"""
    return jsonify({
        'success': False,
        'message': '请求的端点不存在',
        'available_endpoints': [
            '/api/health',
            '/api/info',
            '/api/predict'
        ]
    }), 404

@app.errorhandler(413)
def request_entity_too_large(error):
    """请求体过大错误处理"""
    return jsonify({
        'success': False,
        'message': '上传的图像过大，最大支持 16MB'
    }), 413

# ============================================================================
# 服务启动
# ============================================================================

def initialize_service():
    """初始化服务 - 加载模型"""
    global recognizer
    
    model_path = os.path.join(BASE_DIR, 'sign_language_model.h5')
    label_path = os.path.join(BASE_DIR, 'sign_language_labels.json')
    
    # 检查文件是否存在
    if not os.path.exists(model_path):
        logger.error(f"模型文件不存在: {model_path}")
        return False
    
    if not os.path.exists(label_path):
        logger.error(f"标签文件不存在: {label_path}")
        return False
    
    try:
        recognizer = SignLanguageRecognizer(model_path, label_path)
        logger.info("✅ 服务初始化成功")
        return True
    except Exception as e:
        logger.error(f"❌ 服务初始化失败: {str(e)}")
        logger.error(traceback.format_exc())
        return False

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 手语识别 API 服务")
    print("="*70)
    
    # 初始化服务
    print("\n📦 正在加载模型...")
    if initialize_service():
        print("\n✅ 服务启动成功！")
        print("\n📍 API 端点:")
        print("   - 健康检查:  http://localhost:5000/api/health")
        print("   - 模型信息:  http://localhost:5000/api/info")
        print("   - 手语识别:  http://localhost:5000/api/predict")
        print("\n📝 API 文档:   http://localhost:5000/")
        print("\n💡 提示:")
        print("   - 所有端点支持跨域访问 (CORS)")
        print("   - 日志保存在: api_server.log")
        print("   - 使用 Ctrl+C 停止服务")
        print("="*70 + "\n")
        
        # 启动 Flask 服务
        app.run(
            host='0.0.0.0',  # 允许外部访问
            port=5000,
            debug=False,      # 生产环境关闭 debug
            threaded=True     # 支持多线程
        )
    else:
        print("\n❌ 服务启动失败，请检查模型文件是否存在")
        print("="*70 + "\n")
