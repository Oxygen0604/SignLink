import { create } from 'zustand';
import { signRecognitionApi, translationWebSocketManager } from '../api';

interface TranslationState {
    // 状态
    signInput: string;
    signTranslation: string;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    connect: () => Promise<void>;
    disconnect: () => void;
    updateSignInput: (input: string) => void;
    updateSignTranslation: (translation: string) => void;
    setError: (error: string | null) => void;
    sendImage: (imageData: string) => Promise<boolean>;
    getWsManager: () => typeof translationWebSocketManager;
}

export const useTranslationStore = create<TranslationState>((set, get) => {
    // 注册WebSocket事件监听
    translationWebSocketManager.onMessage((data) => {
        try {
            if (data.signInput !== undefined) {
                set({ signInput: data.signInput });
            }
            if (data.signTranslation !== undefined) {
                set({ signTranslation: data.signTranslation });
            }
        } catch (err) {
            console.error('解析 WebSocket 消息失败:', err);
            set({ error: '解析消息失败' });
        }
    });

    translationWebSocketManager.onOpen(() => {
        console.log('翻译WebSocket 连接已建立');
        set({ 
            isConnected: true, 
            isLoading: false,
            error: null 
        });
    });

    translationWebSocketManager.onError((error) => {
        console.error('翻译WebSocket 错误:', error);
        set({ 
            error: 'WebSocket 连接错误',
            isConnected: false,
            isLoading: false 
        });
    });

    translationWebSocketManager.onClose((event) => {
        console.log('翻译WebSocket 连接已关闭', event.code, event.reason);
        set({ 
            isConnected: false,
            isLoading: false
        });
    });

    return {
        // 初始状态
        signInput: '等待手语输入...',
        signTranslation: '等待翻译结果...',
        isConnected: false,
        isLoading: false,
        error: null,

        // 连接 WebSocket
        connect: async () => {
            if (translationWebSocketManager.isConnected()) {
                console.log('翻译WebSocket 已经连接');
                set({ isConnected: true });
                return;
            }

            set({ isLoading: true, error: null });

            try {
                await translationWebSocketManager.connect();
            } catch (error: any) {
                console.error('翻译WebSocket 连接失败:', error);
                set({ 
                    error: 'WebSocket 连接失败',
                    isLoading: false 
                });
            }
        },

        // 断开 WebSocket
        disconnect: () => {
            translationWebSocketManager.close();
            set({ 
                isConnected: false,
                error: null 
            });
        },

        // 更新手语输入
        updateSignInput: (input: string) => {
            set({ signInput: input });
        },

        // 更新手语翻译
        updateSignTranslation: (translation: string) => {
            set({ signTranslation: translation });
        },

        // 设置错误信息
        setError: (error: string | null) => {
            set({ error });
        },

        // 发送图像数据到WebSocket（仅使用WebSocket）
        sendImage: async (imageData: string): Promise<boolean> => {
            const { isConnected } = get();
            
            if (isConnected && translationWebSocketManager.isConnected()) {
                try {
                    translationWebSocketManager.send({
                        type: 'image',
                        data: imageData
                    });
                    return true;
                } catch (error) {
                    console.error('翻译WebSocket 发送图像数据失败:', error);
                    return false;
                }
            } else {
                console.warn('WebSocket未连接，无法发送图像数据');
                return false;
            }
        },

        // 获取WebSocket管理器实例，用于CameraComponent
        getWsManager: () => translationWebSocketManager,
    };
});



