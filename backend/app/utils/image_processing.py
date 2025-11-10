"""
图像处理工具模块
提供各种图像处理和转换功能
"""

import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Optional
import base64
from io import BytesIO

def base64_to_image(base64_str: str) -> np.ndarray:
    """
    将Base64字符串转换为OpenCV图像格式

    Args:
        base64_str: Base64编码的图像字符串（可能包含data:image前缀）

    Returns:
        OpenCV图像格式 (BGR)

    Raises:
        ValueError: 如果Base64字符串无效
    """
    try:
        # 去除data:image前缀
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]

        # 解码Base64
        image_bytes = base64.b64decode(base64_str)

        # 转换为PIL Image
        pil_image = Image.open(BytesIO(image_bytes))

        # 转换为numpy数组
        image_np = np.array(pil_image)

        # 转换颜色空间：RGB -> BGR (OpenCV格式)
        if len(image_np.shape) == 3:
            if image_np.shape[2] == 4:  # RGBA
                image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGBA2BGR)
            else:  # RGB
                image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        else:  # 灰度图
            image_bgr = cv2.cvtColor(image_np, cv2.COLOR_GRAY2BGR)

        return image_bgr

    except Exception as e:
        raise ValueError(f"无法解析Base64图像: {str(e)}")

def image_to_base64(image: np.ndarray, format: str = "jpeg", quality: int = 80) -> str:
    """
    将OpenCV图像转换为Base64字符串

    Args:
        image: OpenCV图像格式 (BGR)
        format: 输出格式 ('jpeg', 'png')
        quality: 图像质量（1-100）

    Returns:
        Base64编码的图像字符串（包含data:image前缀）
    """
    try:
        # 转换颜色空间：BGR -> RGB
        if len(image.shape) == 3:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image

        # 转换为PIL Image
        pil_image = Image.fromarray(image_rgb)

        # 转换为Base64
        buffer = BytesIO()
        pil_image.save(buffer, format=format.upper(), quality=quality)
        image_bytes = buffer.getvalue()

        base64_str = base64.b64encode(image_bytes).decode('utf-8')

        # 添加data:image前缀
        return f"data:image/{format};base64,{base64_str}"

    except Exception as e:
        raise ValueError(f"无法转换图像为Base64: {str(e)}")

def resize_image(image: np.ndarray, max_width: int = 640, max_height: int = 480) -> np.ndarray:
    """
    按比例缩放图像

    Args:
        image: 输入图像
        max_width: 最大宽度
        max_height: 最大高度

    Returns:
        缩放后的图像
    """
    h, w = image.shape[:2]

    # 计算缩放比例
    scale_w = max_width / w
    scale_h = max_height / h
    scale = min(scale_w, scale_h, 1.0)  # 只能缩小，不能放大

    if scale < 1.0:
        new_w = int(w * scale)
        new_h = int(h * scale)
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return resized

    return image

def enhance_image_contrast(image: np.ndarray, alpha: float = 1.2, beta: int = 10) -> np.ndarray:
    """
    增强图像对比度
    公式：new_pixel = alpha * pixel + beta

    Args:
        image: 输入图像
        alpha: 对比度控制 (1.0-3.0)
        beta: 亮度控制 (0-100)

    Returns:
        增强后的图像
    """
    return cv2.convertScaleAbs(image, alpha=alpha, beta=beta)

def apply_gaussian_blur(image: np.ndarray, kernel_size: int = 5) -> np.ndarray:
    """
    应用高斯模糊，减少噪声

    Args:
        image: 输入图像
        kernel_size: 核大小（必须是奇数）

    Returns:
        模糊后的图像
    """
    if kernel_size % 2 == 0:
        kernel_size += 1  # 确保是奇数

    return cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)

def normalize_image(image: np.ndarray) -> np.ndarray:
    """
    归一化图像到0-1范围

    Args:
        image: 输入图像

    Returns:
        归一化后的图像
    """
    normalized = image.astype(np.float32) / 255.0
    return normalized

def preprocess_image_for_model(image: np.ndarray,
                               target_size: Tuple[int, int] = (224, 224),
                               enhance: bool = True,
                               normalize: bool = True) -> np.ndarray:
    """
    为模型预处理图像

    Args:
        image: 输入图像 (BGR)
        target_size: 目标尺寸 (width, height)
        enhance: 是否增强对比度
        normalize: 是否归一化

    Returns:
        预处理后的图像
    """
    # 1. 缩放
    processed = resize_image(image, max_width=target_size[0], max_height=target_size[1])

    # 2. 增强对比度
    if enhance:
        processed = enhance_image_contrast(processed, alpha=1.1, beta=5)

    # 3. 应用轻微模糊
    processed = apply_gaussian_blur(processed, kernel_size=3)

    # 4. 归一化
    if normalize:
        processed = normalize_image(processed)

    return processed

def create_visualization_image(image: np.ndarray,
                               hand_landmarks_list: list,
                               predicted_text: Optional[str] = None,
                               confidence: Optional[float] = None) -> np.ndarray:
    """
    创建可视化图像，在原图上绘制手部关键点

    Args:
        image: 原始图像
        hand_landmarks_list: MediaPipe手部关键点列表
        predicted_text: 预测文本
        confidence: 置信度

    Returns:
        可视化后的图像
    """
    import mediapipe as mp

    # 绘制手部关键点和连接线
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

    for hand_landmarks in hand_landmarks_list:
        mp_drawing.draw_landmarks(
            image,
            hand_landmarks,
            mp_hands.HAND_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
            mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
        )

    # 在图像上添加预测结果文本
    if predicted_text:
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 1
        color = (0, 255, 0)  # 绿色
        thickness = 2

        # 准备文本
        text = predicted_text
        if confidence is not None:
            text += f" ({confidence:.2%})"

        # 获取文本尺寸
        (text_width, text_height), baseline = cv2.getTextSize(text, font, font_scale, thickness)

        # 在图像顶部添加文本背景
        cv2.rectangle(image, (10, 10),
                     (10 + text_width, 10 + text_height + baseline),
                     (0, 0, 0), -1)

        # 添加文本
        cv2.putText(image, text, (10, 10 + text_height),
                   font, font_scale, color, thickness)

    return image

def validate_base64_image(base64_str: str) -> bool:
    """
    验证Base64图像字符串是否有效

    Args:
        base64_str: Base64图像字符串

    Returns:
        是否有效
    """
    try:
        image = base64_to_image(base64_str)
        return image is not None and image.size > 0
    except:
        return False
