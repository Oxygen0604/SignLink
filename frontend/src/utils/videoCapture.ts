/**
 * 视频帧捕获工具
 * 用于从 MediaStream 中捕获视频帧并转换为 Base64
 * 
 * 注意：React Native 环境需要使用 react-native-view-shot 库
 * 或通过原生模块实现帧捕获
 */

import { Platform } from 'react-native';

// 添加浏览器 API 类型声明
declare const window: any;
declare const ImageCapture: any;
declare const document: any;

/**
 * 从 MediaStream 中捕获视频帧并转换为 Base64
 * 
 * React Native 实现说明：
 * 1. React Native 中不能直接使用 ImageCapture API 或 Canvas API
 * 2. 需要使用 react-native-view-shot 库从 RTCView 截图
 * 3. 或者通过原生模块从 VideoTrack 捕获帧
 * 
 * @param stream MediaStream 对象
 * @param viewRef React Native 视图引用（用于截图）
 * @returns Promise<string> Base64 编码的图像数据
 */
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

        // React Native 环境：尝试使用 VideoTrack
        if (stream && stream.getVideoTracks) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                // 这里需要原生模块支持
                // 暂时返回 null，需要实现原生模块
                console.warn('React Native 需要原生模块支持或视图引用来捕获帧');
                return null;
            }
        }

        console.warn('无法捕获视频帧：缺少必要的参数或环境不支持');
        return null;

    } catch (error) {
        console.error('捕获视频帧失败:', error);
        return null;
    }
}

/**
 * Web 环境：使用 ImageCapture API 或 Canvas 捕获帧
 */
async function captureFrameWeb(stream: any): Promise<string | null> {
    try {
        // 方法1: 使用 ImageCapture API (如果支持)
        if (typeof window !== 'undefined' && window.ImageCapture && stream.getVideoTracks().length > 0) {
            try {
                const videoTrack = stream.getVideoTracks()[0];
                const imageCapture = new window.ImageCapture(videoTrack);
                const bitmap = await imageCapture.grabFrame();
                
                // 将 ImageBitmap 转换为 Blob，再转换为 Base64
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(bitmap, 0, 0);
                    const blob = await new Promise<any>((resolve) => {
                        canvas.toBlob((canvasBlob: any) => {
                            if (canvasBlob) {
                                resolve(canvasBlob);
                            }
                        }, 'image/jpeg', 0.8);
                    });
                    return await blobToBase64(blob);
                }
            } catch (error) {
                console.warn('ImageCapture API 不可用，尝试其他方法:', error);
            }
        }

        // 方法2: 使用 Video 元素和 Canvas
        if (typeof window !== 'undefined' && window.document) {
            try {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;
                video.muted = true;

                return new Promise((resolve, reject) => {
                    video.onloadedmetadata = () => {
                        video.play().then(() => {
                            setTimeout(() => {
                                try {
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
                                } catch (error) {
                                    reject(error);
                                }
                            }, 100);
                        }).catch(reject);
                    };
                    video.onerror = reject;
                });
            } catch (error) {
                console.warn('Video/Canvas 方法失败:', error);
            }
        }

        return null;
    } catch (error) {
        console.error('Web 环境捕获帧失败:', error);
        return null;
    }
}

/**
 * React Native 环境：使用视图截图捕获帧
 * 需要 react-native-view-shot 库
 * 
 * 注意：react-native-view-shot 可能不支持直接捕获 RTCView
 * 如果遇到问题，建议使用原生模块或 react-native-vision-camera
 */
async function captureFrameNative(viewRef: React.RefObject<any>): Promise<string | null> {
    try {
        // 动态导入 react-native-view-shot
        let viewShot: any;
        try {
            viewShot = require('react-native-view-shot');
        } catch (error) {
            console.warn('react-native-view-shot 未安装，无法捕获帧');
            return null;
        }
        
        if (!viewRef || !viewRef.current) {
            console.warn('视图引用不可用');
            return null;
        }
        
        try {
            // 尝试捕获视图截图（直接返回 Base64）
            const base64 = await viewShot.default.captureRef(viewRef.current, {
                format: 'jpg',
                quality: 0.8,
                result: 'base64', // 直接返回 Base64 字符串
            });
            
            // 如果返回的是 Base64 字符串，添加 data URI 前缀
            if (base64 && typeof base64 === 'string') {
                if (base64.startsWith('data:')) {
                    return base64;
                } else {
                    return `data:image/jpeg;base64,${base64}`;
                }
            }
            
            // 如果返回的是文件 URI，需要读取文件
            if (base64 && base64.startsWith('file://')) {
                try {
                    // 使用 react-native-fs 读取文件
                    const RNFS = require('react-native-fs');
                    const fileBase64 = await RNFS.readFile(base64, 'base64');
                    return `data:image/jpeg;base64,${fileBase64}`;
                } catch (error) {
                    console.warn('读取文件失败:', error);
                    // 如果无法读取文件，尝试直接使用 URI
                    // 注意：后端需要支持 file:// URI
                    return base64;
                }
            }
            
            return base64;
        } catch (error) {
            // 如果捕获失败，可能是 RTCView 不支持截图
            console.warn('视图截图失败，RTCView 可能不支持直接截图:', error);
            console.warn('建议使用原生模块或 react-native-vision-camera 来捕获帧');
            return null;
        }
    } catch (error) {
        console.error('捕获帧失败:', error);
        return null;
    }
}

/**
 * 将 Blob 转换为 Base64
 */
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

/**
 * 从 VideoTrack 创建 ImageCapture 对象并捕获帧
 * @param videoTrack VideoTrack 对象
 * @returns Promise<string> Base64 编码的图像数据
 */
export async function captureFrameFromTrack(videoTrack: any): Promise<string | null> {
    try {
        // 检查是否支持 ImageCapture API
        if (typeof ImageCapture === 'undefined') {
            console.warn('ImageCapture API 不支持');
            return null;
        }

        const imageCapture = new ImageCapture(videoTrack);
        const bitmap = await imageCapture.grabFrame();
        
        // 创建 Canvas 并绘制帧
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            console.error('无法获取 Canvas 上下文');
            return null;
        }
        
        ctx.drawImage(bitmap, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        
        return base64;
    } catch (error) {
        console.error('从 VideoTrack 捕获帧失败:', error);
        return null;
    }
}

