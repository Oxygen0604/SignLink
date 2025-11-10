# 真正的视频流处理方案

## 当前问题
- API设计不支持连续视频流
- 每次请求独立处理，无状态管理
- HTTP轮询延迟高，稳定性差
- 无法理解连续手势序列

## 改进方案

### 方案1：WebSocket实时流（推荐）
```python
# WebSocket连接处理
@router.websocket("/ws/recognize")
async def websocket_recognize(websocket: WebSocket):
    await websocket.accept()
    recognizer = SignLanguageRecognizer(model_path, labels_path)

    # 连续处理视频流
    frame_buffer = []
    while True:
        # 接收Base64图像帧
        data = await websocket.receive_text()
        frame = base64_to_image(data)

        frame_buffer.append(frame)
        if len(frame_buffer) > 10:  # 保持10帧缓冲区
            frame_buffer.pop(0)

        # 每5帧处理一次
        if len(frame_buffer) % 5 == 0:
            # 批处理
            results = []
            for frame in frame_buffer[-5:]:
                result = recognizer.predict(frame)
                results.append(result)

            # 序列分析（新增）
            sequence_result = analyze_sequence(results)

            # 返回结果
            await websocket.send_text(json.dumps({
                "type": "recognition",
                "frame": len(frame_buffer),
                "result": sequence_result
            }))
```

### 方案2：HTTP批量处理
```python
@router.post("/api/recognize/batch")
async def recognize_batch(request: BatchRecognitionRequest):
    """
    批量识别一段视频
    一次处理多帧图像
    """
    recognizer = SignLanguageRecognizer(...)

    # 解码所有图像
    images = [base64_to_image(img) for img in request.images]

    # 批量预测
    predictions = []
    for image in images:
        label, confidence, _ = recognizer.predict(image)
        predictions.append({
            "frame": i,
            "label": label,
            "confidence": confidence
        })

    # 序列分析
    sequence = analyze_sequence(predictions)

    return {
        "success": True,
        "sequence": sequence,
        "frame_count": len(images),
        "duration": request.duration
    }
```

### 方案3：状态机模式（最佳）
```python
class SequenceRecognizer:
    def __init__(self, model):
        self.model = model
        self.state = "IDLE"  # IDLE -> DETECTING -> RECOGNIZING -> COMPLETE
        self.current_sequence = []
        self.min_frames = 5  # 最少帧数
        self.max_frames = 30  # 最多帧数
        self.threshold = 0.8  # 置信度阈值

    def process_frame(self, frame):
        """处理每一帧"""
        label, confidence = self.model.predict(frame)

        if confidence > self.threshold:
            self.current_sequence.append({
                "label": label,
                "confidence": confidence,
                "frame": len(self.current_sequence)
            })

            # 检查是否完成
            if len(self.current_sequence) >= self.min_frames:
                result = self.analyze_sequence()
                if result:
                    self.state = "COMPLETE"
                    return result

        return None

    def analyze_sequence(self):
        """分析连续手势序列"""
        if not self.current_sequence:
            return None

        # 统计最频繁的标签
        labels = [f["label"] for f in self.current_sequence]
        most_common = max(set(labels), key=labels.count)

        # 计算平均置信度
        avg_confidence = sum(f["confidence"] for f in self.current_sequence) / len(self.current_sequence)

        return {
            "sequence": most_common,
            "confidence": avg_confidence,
            "frame_count": len(self.current_sequence),
            "duration": len(self.current_sequence) * 0.1  # 假设10fps
        }
```

## 实现建议

### 前端集成（WebSocket）
```javascript
// 建立WebSocket连接
const ws = new WebSocket('ws://localhost:8000/ws/recognize');

// 打开连接
ws.onopen = () => {
    console.log('WebSocket已连接');
};

// 接收消息
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'recognition') {
        console.log('识别结果:', data.result.sequence);
        // 更新UI
        updateUI(data.result);
    }
};

// 发送视频帧
function sendFrame(base64Image) {
    ws.send(base64Image);
}

// 摄像头循环
function startCamera() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();

            // 每100ms发送一帧（10fps）
            setInterval(() => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                const base64 = canvas.toDataURL('image/jpeg', 0.8);
                sendFrame(base64);
            }, 100);
        });
}
```

### 状态管理
```python
# 全局状态管理
recognizer_states = {}  # {connection_id: SequenceRecognizer}

@router.websocket("/ws/recognize")
async def websocket_recognize(websocket: WebSocket):
    await websocket.accept()
    connection_id = str(uuid.uuid4())

    # 创建状态实例
    recognizer = SequenceRecognizer(model)
    recognizer_states[connection_id] = recognizer

    try:
        while True:
            data = await websocket.receive_text()
            frame = base64_to_image(data)

            # 处理帧
            result = recognizer.process_frame(frame)

            if result:
                await websocket.send_text(json.dumps({
                    "type": "result",
                    "data": result
                }))

    except WebSocketDisconnect:
        # 清理状态
        recognizer_states.pop(connection_id, None)
```

## 性能优化

1. **帧率控制**：10-15fps足够，30fps太高
2. **缓冲区管理**：保持10-20帧历史
3. **置信度过滤**：避免误识别
4. **批处理**：每5帧处理一次
5. **状态重置**：长时间无手势自动重置

## 总结

当前的API设计确实有问题，**无法实现连续视频流识别**。需要：

1. **WebSocket实现**：实时双向通信
2. **状态管理**：保持连续性
3. **序列分析**：理解手势序列
4. **批处理**：提高效率
5. **前端配合**：循环发送帧

这是真正能实现"连续一段视频给AI模型识别"的设计！
