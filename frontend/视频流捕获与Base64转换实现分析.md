# 视频流捕获与Base64转换实现分析

## 1. 整体架构

项目采用**跨平台设计**，通过 `react-native-webrtc` 获取视频流，使用 `captureFrameFromStream` 核心函数实现视频帧捕获，并将其转换为 Base64 格式用于后续处理。

### 1.1 核心组件

- **SignHomeScreen**：实现摄像头权限请求、视频流获取和预览、定时帧捕获
- **videoCapture.ts**：提供跨平台的视频帧捕获和 Base64 转换工具函数
- **translationStore**：管理视频帧发送和翻译结果

## 2. 详细实现流程

### 2.1 视频流获取与预览（SignHomeScreen）

```typescript
// 1. 请求摄像头权限
const requestCameraPermission = async () => {
    // 使用 PermissionsAndroid 请求摄像头权限
    // ...
};

// 2. 获取本地视频流
const startCamera = async () => {
    // 请求权限后，使用 mediaDevices.getUserMedia 获取视频流
    const stream = await mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    });
    setLocalStream(stream);
};

// 3. 显示摄像头预览
<RTCView
    streamURL={localStream.toURL()}
    style={StyleSheet.absoluteFillObject}
    objectFit="cover"
    mirror={true}
/>
```

### 2.2 定时视频帧捕获

```typescript
// 每200ms捕获一帧
captureIntervalRef.current = setInterval(async () => {
    if (!localStream) {
        return;
    }

    try {
        // 捕获视频帧（传入视图引用）
        const base64Image = await captureFrameFromStream(localStream, cameraViewRef);
        
        if (base64Image) {
            // 发送到WebSocket或HTTP API
            await sendImage(base64Image);
        }
    } catch (error) {
        console.error('捕获视频帧失败:', error);
    }
}, 200);
```

## 3. 视频帧捕获核心实现（videoCapture.ts）

### 3.1 跨平台适配策略

```typescript
export async function captureFrameFromStream(
    stream: any, 
    viewRef?: React.RefObject<any>
): Promise<string | null> {
    try {
        // Web 环境：使用 ImageCapture API 或 Canvas
        if (Platform.OS === 'web') {
            return await captureFrameWeb(stream);
        }

        // React Native 环境：使用视图截图
        if (viewRef && viewRef.current) {
            return await captureFrameNative(viewRef);
        }

        // 其他情况...
        
    } catch (error) {
        console.error('捕获视频帧失败:', error);
        return null;
    }
}
```

### 3.2 Web环境实现（captureFrameWeb）

**方案1：使用ImageCapture API**（现代浏览器支持）
```typescript
if (window.ImageCapture && stream.getVideoTracks().length > 0) {
    const videoTrack = stream.getVideoTracks()[0];
    const imageCapture = new window.ImageCapture(videoTrack);
    const bitmap = await imageCapture.grabFrame();
    
    // 将 ImageBitmap 转换为 Blob
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(bitmap, 0, 0);
    
    const blob = await new Promise<any>((resolve) => {
        canvas.toBlob((canvasBlob: any) => {
            if (canvasBlob) {
                resolve(canvasBlob);
            }
        }, 'image/jpeg', 0.8);
    });
    
    return await blobToBase64(blob);
}
```

**方案2：使用Video元素和Canvas**（兼容性更好）
```typescript
const video = document.createElement('video');
video.srcObject = stream;
video.autoplay = true;
video.playsInline = true;
video.muted = true;

return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => {
        video.play().then(() => {
            setTimeout(() => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    const base64 = canvas.toDataURL('image/jpeg', 0.8);
                    video.srcObject = null;
                    resolve(base64);
                } else {
                    reject(new Error('无法获取 Canvas 上下文'));
                }
            }, 100);
        }).catch(reject);
    };
    video.onerror = reject;
});
```

### 3.3 React Native环境实现（captureFrameNative）

```typescript
async function captureFrameNative(viewRef: React.RefObject<any>): Promise<string | null> {
    try {
        // 动态导入 react-native-view-shot
        const viewShot = require('react-native-view-shot');
        
        // 捕获视图截图（直接返回 Base64）
        const base64 = await viewShot.default.captureRef(viewRef.current, {
            format: 'jpg',
            quality: 0.8,
            result: 'base64',
        });
        
        // 确保返回完整的 data URI
        if (base64 && typeof base64 === 'string') {
            if (base64.startsWith('data:')) {
                return base64;
            } else {
                return `data:image/jpeg;base64,${base64}`;
            }
        }
        
        // 处理文件 URI 情况
        if (base64 && base64.startsWith('file://')) {
            try {
                const RNFS = require('react-native-fs');
                const fileBase64 = await RNFS.readFile(base64, 'base64');
                return `data:image/jpeg;base64,${fileBase64}`;
            } catch (error) {
                console.warn('读取文件失败:', error);
                return base64;
            }
        }
        
        return base64;
        
    } catch (error) {
        console.error('捕获帧失败:', error);
        return null;
    }
}
```

### 3.4 Blob转Base64工具函数

```typescript
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('无法读取 Blob'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
```

## 4. 技术特点与优势

### 4.1 跨平台兼容性
- Web环境：优先使用现代API，提供降级方案
- React Native环境：利用第三方库实现视图截图

### 4.2 性能优化
- Web环境：使用ImageCapture API的grabFrame方法直接捕获帧，避免额外渲染
- 图像质量控制：通过0.8的压缩质量平衡图像质量和大小
- 资源清理：捕获后及时释放视频源和Canvas资源

### 4.3 错误处理
- 多层级错误捕获
- 详细的控制台日志
- 优雅的降级处理

## 5. 潜在问题与改进建议

### 5.1 React Native环境的局限性
- react-native-view-shot可能无法直接捕获RTCView的内容
- 建议考虑：
  1. 使用z替代
  2. 实现原生模块直接从VideoTrack捕获帧
  3. 检查视图层级和样式是否影响截图

### 5.2 性能优化建议ca
- 动态调整捕获帧率（根据设备性能和网络状况）
- 实现帧质量自适应（根据网络带宽调整图像质量）
- 考虑使用WebAssembly进行图像压缩（Web环境）

### 5.3 错误恢复机制
- 添加重试逻辑
- 实现降级到更低分辨率的机制
- 监控捕获成功率并进行自适应调整

## 6. 总结

项目通过模块化设计实现了跨平台的视频流捕获与Base64转换功能，采用了现代化的API和成熟的第三方库，确保了功能的稳定性和兼容性。虽然在React Native环境下存在一些局限性，但通过合理的架构设计和降级策略，整体实现了高效、可靠的视频帧处理流程。