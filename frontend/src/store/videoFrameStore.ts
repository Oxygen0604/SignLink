import { create } from 'zustand';
import { WebSocketManager } from '../api';

interface VideoFrameStore {
  // 状态
  isCapturing: boolean;
  captureInterval: number;
  lastCaptureTime: number;
  webSocketManager: WebSocketManager | null;
  error: string | null;
  
  // 方法
  setWebSocketManager: (manager: WebSocketManager) => void;
  startCapture: () => void;
  stopCapture: () => void;
  setCaptureInterval: (interval: number) => void;
  captureFrame: (base64Image: string | null, frameProcessor?: (image: string) => Promise<void>) => void;
  clearError: () => void;
}

export const useVideoFrameStore = create<VideoFrameStore>((set, get) => ({
  // 初始状态
  isCapturing: false,
  captureInterval: 500, // 默认500ms捕获一次
  lastCaptureTime: 0,
  webSocketManager: null,
  error: null,

  // 设置WebSocket管理器
  setWebSocketManager: (manager: WebSocketManager) => {
    set({ webSocketManager: manager });
  },

  // 开始捕获视频帧
  startCapture: () => {
    const { webSocketManager } = get();
    
    // 只有当WebSocket管理器存在且连接成功时才开始捕获
    if (!webSocketManager) {
      set({ error: 'WebSocket管理器未初始化' });
      return;
    }
    
    if (!webSocketManager.isConnected()) {
      set({ error: 'WebSocket未连接，无法开始捕获视频帧' });
      return;
    }
    
    set({ isCapturing: true });
  },

  // 停止捕获视频帧
  stopCapture: () => {
    set({ isCapturing: false });
  },

  // 设置捕获间隔
  setCaptureInterval: (interval: number) => {
    set({ captureInterval: interval });
  },

  // 捕获并处理视频帧
  captureFrame: async (base64Image: string | null, frameProcessor?: (image: string) => Promise<void>) => {
    const { isCapturing, lastCaptureTime, captureInterval, webSocketManager } = get();
    
    // 检查是否正在捕获
    if (!isCapturing) return;
    
    // 检查是否到了捕获间隔
    const now = Date.now();
    if (now - lastCaptureTime < captureInterval) return;
    
    // 检查base64Image是否为null
    if (!base64Image) {
      console.warn('无法发送视频帧：捕获的图像为null');
      return;
    }
    
    // 更新最后捕获时间
    set({ lastCaptureTime: now });
    
    // 检查WebSocket连接状态
    if (!webSocketManager || !webSocketManager.isConnected()) {
      set({ error: 'WebSocket未连接，无法发送视频帧' });
      return;
    }
    
    try {
      // 如果有自定义处理器，使用自定义处理器
      if (frameProcessor) {
        await frameProcessor(base64Image);
      } else {
        // 默认发送到WebSocket
        webSocketManager.send(JSON.stringify({
          type: 'detect_sign',
          data: base64Image
        }));
      }
      
      // 清除错误
      if (get().error) {
        set({ error: null });
      }
    } catch (error) {
      set({ error: `发送视频帧失败: ${error instanceof Error ? error.message : '未知错误'}` });
      console.error('Error capturing frame:', error);
    }
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  }
}));
