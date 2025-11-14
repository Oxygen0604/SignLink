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
        
        // 如果不是主动关闭，尝试重连
        if (event.code !== 1000) {
            console.log('尝试重新连接...');
            setTimeout(() => {
                const { connect } = get();
                connect();
            }, 3000); // 3秒后重连
        }
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

        // 发送图像数据到WebSocket
        sendImage: async (imageData: string) => {
            const { isConnected } = get();
            
            // 优先使用 WebSocket
            if (isConnected && translationWebSocketManager.isConnected()) {
                try {
                    translationWebSocketManager.send({
                        type: 'image',
                        data: imageData
                    });
                    return true;
                } catch (error) {
                    console.error('翻译WebSocket 发送图像数据失败:', error);
                    // WebSocket 发送失败，尝试使用 HTTP API
                    return await sendImageViaHTTP(imageData, set);
                }
            }
            
            // WebSocket 不可用，使用 HTTP API 作为后备
            console.warn('WebSocket未连接，使用HTTP API发送图像数据');
            return await sendImageViaHTTP(imageData, set);
        },
    };
});

/**
 * 通过 HTTP API 发送图像数据（后备方案）
 */
async function sendImageViaHTTP(
    imageData: string, 
    setState: (state: any) => void
): Promise<boolean> {
    try {
        const result = await signRecognitionApi.realtimeRecognize(imageData);
        
        // 更新翻译结果
        // 支持多种后端返回格式
        if (result.detected !== undefined || result.word !== undefined) {
            setState((state: any) => ({
                ...state,
                signInput: result.detected || result.word || ''
            }));
        } else if (result.input !== undefined) {
            setState((state: any) => ({
                ...state,
                signInput: result.input
            }));
        } else if (result.signInput !== undefined) {
            setState((state: any) => ({
                ...state,
                signInput: result.signInput
            }));
        }
        
        if (result.translated !== undefined || result.text !== undefined) {
            setState((state: any) => ({
                ...state,
                signTranslation: result.translated || result.text || ''
            }));
        } else if (result.translation !== undefined) {
            setState((state: any) => ({
                ...state,
                signTranslation: result.translation
            }));
        } else if (result.signTranslation !== undefined) {
            setState((state: any) => ({
                ...state,
                signTranslation: result.signTranslation
            }));
        }
        
        return true;
    } catch (error) {
        console.error('HTTP API 发送图像数据失败:', error);
        return false;
    }
}

