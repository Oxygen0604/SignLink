"""
Pydantic数据模型
定义API请求和响应的数据结构
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# ========== 请求模型 ==========

class RecognitionRequest(BaseModel):
    """手语识别请求基类"""
    pass

class Base64ImageRequest(RecognitionRequest):
    """
    基于Base64图像的识别请求
    前端将视频帧转换为Base64格式后发送
    """
    image: str = Field(..., description="Base64编码的图像数据，需包含'data:image'前缀")
    format: str = Field(default="jpeg", description="图像格式，如'jpeg', 'png'")
    quality: int = Field(default=80, description="图像质量，1-100之间")

class UploadFileRequest(RecognitionRequest):
    """
    上传文件识别请求
    支持图片和视频文件
    """
    pass

class BatchRecognitionRequest(RecognitionRequest):
    """
    批量识别请求
    一次性处理多张图像
    """
    images: List[str] = Field(..., description="Base64编码的图像列表")
    format: str = Field(default="jpeg", description="图像格式")
    quality: int = Field(default=80, description="图像质量")

# ========== 响应模型 ==========

class HandLandmark(BaseModel):
    """单个手部关键点数据"""
    x: float = Field(..., description="X坐标（归一化到0-1）")
    y: float = Field(..., description="Y坐标（归一化到0-1）")
    z: float = Field(..., description="Z坐标（相对深度）")

class HandData(BaseModel):
    """单手数据"""
    landmarks: List[HandLandmark] = Field(..., description="21个关键点坐标")
    handedness: str = Field(..., description="手势类型：'Left' 或 'Right'")

class RecognitionResult(BaseModel):
    """手语识别结果"""
    success: bool = Field(..., description="是否识别成功")
    detected: bool = Field(default=False, description="是否检测到手语手势")
    predicted_class: Optional[str] = Field(None, description="预测的手语类别")
    confidence: Optional[float] = Field(None, description="预测置信度，0-1之间")
    message: str = Field(default="", description="提示信息")

    # 检测到的手部数据
    hands_count: Optional[int] = Field(None, description="检测到的手部数量")
    hands: Optional[List[HandData]] = Field(None, description="手部关键点数据")

    # 处理时间（毫秒）
    processing_time_ms: Optional[float] = Field(None, description="图像处理耗时")

    # 时间戳
    timestamp: datetime = Field(default_factory=datetime.now, description="识别时间戳")

class ModelInfo(BaseModel):
    """模型信息"""
    loaded: bool = Field(..., description="模型是否已加载")
    model_path: str = Field(..., description="模型文件路径")
    labels_path: str = Field(..., description="标签文件路径")
    num_classes: int = Field(..., description="支持的手语类别数量")
    classes: List[str] = Field(..., description="支持的手语类别列表")
    input_shape: Optional[str] = Field(None, description="模型输入形状")

class HealthCheck(BaseModel):
    """健康检查响应"""
    status: str = Field(..., description="服务状态：'healthy' 或 'unhealthy'")
    service: str = Field(..., description="服务名称")
    version: str = Field(..., description="服务版本")
    timestamp: datetime = Field(default_factory=datetime.now, description="检查时间戳")

    # 组件状态
    model_loaded: bool = Field(default=False, description="AI模型是否已加载")
    components: Dict[str, str] = Field(
        default_factory=dict,
        description="各组件状态：'healthy', 'warning', 'error'"
    )

class ErrorResponse(BaseModel):
    """错误响应"""
    success: bool = Field(default=False, description="请求是否成功")
    error_code: str = Field(..., description="错误代码")
    error_message: str = Field(..., description="错误信息")
    details: Optional[Dict[str, Any]] = Field(None, description="详细错误信息")
    timestamp: datetime = Field(default_factory=datetime.now, description="错误发生时间")

class SuccessResponse(BaseModel):
    """成功响应基类"""
    success: bool = Field(default=True, description="请求是否成功")
    message: str = Field(default="操作成功", description="提示信息")
    timestamp: datetime = Field(default_factory=datetime.now, description="响应时间")

# ========== WebSocket消息模型 ==========

class WSRecognitionMessage(BaseModel):
    """WebSocket实时识别消息"""
    type: str = Field(..., description="消息类型：'recognition_result'")
    data: RecognitionResult = Field(..., description="识别结果")

class WSErrorMessage(BaseModel):
    """WebSocket错误消息"""
    type: str = Field(default="error", description="消息类型")
    error_code: str = Field(..., description="错误代码")
    message: str = Field(..., description="错误信息")
