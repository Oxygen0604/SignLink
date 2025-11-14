import axiosInstance from './axiosInstance';
import { WS_URL } from '@env';

// 定义CloseEvent接口以支持WebSocket关闭事件
export interface CloseEvent {
  code?: number;
  reason?: string;
  wasClean?: boolean;
}

// 定义API返回类型
export interface RealtimeRecognizeResponse {
  detected?: string;
  word?: string;
  input?: string;
  translated?: string;
  text?: string;
  translation?: string;
  signInput?: string;
  signTranslation?: string;
}

// 定义聊天消息类型
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

// WebSocket管理器
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private messageHandlers: Array<(message: any) => void> = [];
  private errorHandlers: Array<(error: Event) => void> = [];
  private closeHandlers: Array<(event: CloseEvent) => void> = [];
  private openHandlers: Array<() => void> = [];

  constructor(private url: string) {}

  // 连接WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          this.openHandlers.forEach(handler => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(message));
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error);
          this.errorHandlers.forEach(handler => handler(error));
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket连接已关闭:', event.code, event.reason);
          this.closeHandlers.forEach(handler => handler(event));
        };
      } catch (error) {
        console.error('创建WebSocket连接失败:', error);
        reject(error);
      }
    });
  }

  // 发送消息
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket未连接，无法发送消息');
    }
  }

  // 关闭连接
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // 注册消息处理函数
  onMessage(handler: (message: any) => void): void {
    this.messageHandlers.push(handler);
  }

  // 注册错误处理函数
  onError(handler: (error: Event) => void): void {
    this.errorHandlers.push(handler);
  }

  // 注册打开处理函数
  onOpen(handler: () => void): void {
    this.openHandlers.push(handler);
  }

  // 注册关闭处理函数
  onClose(handler: (event: CloseEvent) => void): void {
    this.closeHandlers.push(handler);
  }

  // 移除消息处理函数
  offMessage(handler: (message: any) => void): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  // 移除错误处理函数
  offError(handler: (error: Event) => void): void {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }

  // 移除打开处理函数
  offOpen(handler: () => void): void {
    this.openHandlers = this.openHandlers.filter(h => h !== handler);
  }

  // 移除关闭处理函数
  offClose(handler: (event: Event) => void): void {
    this.closeHandlers = this.closeHandlers.filter(h => h !== handler);
  }

  // 检查连接状态
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// 导出聊天WebSocket实例
export const chatWebSocketManager = new WebSocketManager(WS_URL || 'ws://localhost:8000/ws');

// 导出翻译WebSocket实例
export const translationWebSocketManager = new WebSocketManager(WS_URL || 'ws://localhost:8000/ws');

/**
 * 手语识别API服务
 */
export const signRecognitionApi = {
  /**
   * 实时手语识别
   * @param imageData 图像的Base64数据
   * @param format 图像格式
   * @param quality 图像质量
   */
  realtimeRecognize: async (imageData: string, format: string = 'jpeg', quality: number = 80): Promise<RealtimeRecognizeResponse> => {
    return await axiosInstance.post('/recognize/realtime', {
      image: imageData,
      format,
      quality,
    });
  },
  
  /**
   * 批量手语识别
   * @param images 图像数组
   */
  batchRecognize: async (images: string[]) => {
    return await axiosInstance.post('/recognize/batch', {
      images,
    });
  },
  
  /**
   * 获取识别历史
   */
  getHistory: async () => {
    return await axiosInstance.get('/recognize/history');
  },
};

/**
 * 聊天API服务（HTTP方式）
 */
export const chatApi = {
  /**
   * 发送聊天消息
   * @param message 消息内容
   */
  sendMessage: async (message: string): Promise<ChatMessage> => {
    return await axiosInstance.post('/chat/message', {
      text: message,
    });
  },
  
  /**
   * 获取聊天历史记录
   */
  getChatHistory: async (): Promise<ChatMessage[]> => {
    return await axiosInstance.get('/chat/history');
  },
  
  /**
   * 清除聊天历史
   */
  clearChatHistory: async (): Promise<void> => {
    return await axiosInstance.delete('/chat/history');
  },
};

/**
 * 其他API服务可以在这里继续添加
 */
export const otherApi = {
};

export default {
  signRecognitionApi,
  chatApi,
  otherApi,
  chatWebSocketManager,
  translationWebSocketManager,
};