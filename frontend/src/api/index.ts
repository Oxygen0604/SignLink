import axiosInstance from './axiosInstance';
import { WS_URL } from '@env';
import { Alert } from 'react-native';

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

// 定义认证相关的返回类型
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role?: string;
  };
}

export interface RegisterResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role?: string;
  };
}

export interface SendCodeResponse {
  success: boolean;
  message?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
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
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 2000; // 2秒延迟
  private reconnectTimer: number | null = null;
  private isManualClose: boolean = false;
  private hasShownReconnectError: boolean = false;

  constructor(private url: string) {}

  // 连接WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          this.reconnectAttempts = 0; // 重置重连计数
          this.hasShownReconnectError = false; // 重置错误显示标志
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
          
          // 如果不是手动关闭，尝试重连
          if (!this.isManualClose) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('创建WebSocket连接失败:', error);
        
        // 创建连接失败，也尝试重连
        this.attemptReconnect();
        reject(error);
      }
    });
  }
  
  // 尝试重连
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`WebSocket重连失败，已尝试${this.maxReconnectAttempts}次`);
      
      // 重连失败，显示提示框，但只显示一次
      if (!this.hasShownReconnectError) {
        this.hasShownReconnectError = true;
        Alert.alert(
          '连接失败',
          'WebSocket重连失败，请检查网络设置或稍后重试。',
          [{ text: '确定', style: 'default' }]
        );
      }
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`WebSocket尝试重连 ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
    
    // 清除之前的重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // 设置新的重连定时器
    this.reconnectTimer = setTimeout(() => {
      try {
        this.connect();
      } catch (error) {
        console.error('WebSocket重连失败:', error);
      }
    }, this.reconnectDelay);
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
    // 标记为手动关闭
    this.isManualClose = true;
    
    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
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

// 导出答题WebSocket实例
export const answerWebSocketManager = new WebSocketManager(WS_URL || 'ws://localhost:8000/ws');

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
 * 认证API服务
 */
export const authApi = {
  /**
   * 用户登录
   * @param email 邮箱
   * @param password 密码
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return await axiosInstance.post('/auth/login', {
      email,
      password,
    });
  },
  
  /**
   * 用户注册
   * @param name 用户名
   * @param email 邮箱
   * @param phone 手机号
   * @param password 密码
   */
  register: async (name: string, email: string, password: string): Promise<RegisterResponse> => {
    return await axiosInstance.post('/auth/register', {
      name,
      email,
      password,
    });
  },
  
  /**
   * 发送验证码
   * @param email 邮箱
   */
  sendVerificationCode: async (email: string): Promise<SendCodeResponse> => {
    return await axiosInstance.post('/auth/send-code', {
      email,
    });
  },
  
  /**
   * 重置密码
   * @param email 邮箱
   * @param code 验证码
   * @param newPassword 新密码
   */
  resetPassword: async (email: string, code: string, newPassword: string): Promise<ResetPasswordResponse> => {
    return await axiosInstance.post('/auth/reset-password', {
      email,
      code,
      newPassword,
    });
  },

  getUserinformation:async (): Promise<UserInformationResponse> => {
    return await axiosInstance.get('/auth/user');
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
  authApi,
  otherApi,
  chatWebSocketManager,
  translationWebSocketManager,
  answerWebSocketManager,
};