import { create } from 'zustand';
import { chatApi, chatWebSocketManager, ChatMessage as ApiChatMessage } from '../api';

export interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: number;
}

interface ChatState {
    // 状态
    messages: Message[];
    inputText: string;
    isLoading: boolean;
    isSending: boolean;
    error: string | null;
    isEmojiPickerVisible: boolean;
    isCameraVisible: boolean;
    localStream: any | null;
    isWsConnected: boolean;
    communicationMethod: 'ws' | 'http'; // ws: WebSocket, http: HTTP
    
    // Actions
    sendMessage: (text: string) => Promise<void>;
    addMessage: (message: Message) => void;
    setInputText: (text: string) => void;
    toggleEmojiPicker: () => void;
    toggleCamera: () => void;
    setLocalStream: (stream: any | null) => void;
    clearMessages: () => void;
    connectWebSocket: () => Promise<void>;
    disconnectWebSocket: () => void;
    setCommunicationMethod: (method: 'ws' | 'http') => void;
    loadChatHistory: () => Promise<void>;
    getWebSocketManager: () => typeof chatWebSocketManager;
    registerWebSocketListeners: () => void;
    unregisterWebSocketListeners: () => void;
}

// WebSocket消息处理函数 (移到外部，避免闭包问题)
const handleWebSocketMessage = (set: any) => (data: any) => {
    try {
        // 根据后端返回格式处理响应
        // 支持多种格式: { response: "..." }, { message: "..." }, { text: "..." }, { answer: "..." }
        const botText = data.response || data.message || data.text || data.answer || '抱歉，我无法理解您的问题。';
        const messageId = Date.now().toString(); // 使用时间戳作为唯一ID

        const botMessage: Message = {
            id: messageId,
            text: botText,
            isUser: false,
            timestamp: Date.now(),
        };

        // 更新状态，添加新消息
        set((state: ChatState) => {
            // 检查消息是否已存在，避免重复
            const messageExists = state.messages.some(msg => msg.id === messageId);
            if (messageExists) {
                return state; // 消息已存在，不重复添加
            }
            return {
                messages: [...state.messages, botMessage],
                isLoading: false,
                isSending: false,
            };
        });
    } catch (error) {
        console.error('处理WebSocket消息失败:', error);
        set((state: ChatState) => ({
            isSending: false,
        }));
    }
};

export const useChatStore = create<ChatState>((set, get) => {
    // 存储监听器引用，以便正确移除
    let messageListener: any = null;
    let openListener: any = null;
    let closeListener: any = null;
    let errorListener: any = null;

    // 初始化时设置默认通信方式为HTTP，避免自动连接WebSocket
    set({ communicationMethod: 'http' });

    return {
        // 初始状态
        messages: [],
        inputText: '',
        isLoading: false,
        isSending: false,
        error: null,
        isEmojiPickerVisible: false,
        isCameraVisible: false,
        localStream: null,
        isWsConnected: false,
        communicationMethod: 'http', // 默认使用HTTP

        // 获取WebSocket管理器
        getWebSocketManager: () => chatWebSocketManager,

        // 发送消息
        sendMessage: async (text: string) => {
            if (!text.trim()) return;

            const messageId = Date.now().toString();
            const userMessage: Message = {
                id: messageId,
                text: text.trim(),
                isUser: true,
                timestamp: Date.now(),
            };

            // 添加用户消息
            set((state) => ({
                messages: [...state.messages, userMessage],
                inputText: '',
                isLoading: true,
                isSending: true,
                error: null,
            }));

            try {
                const { communicationMethod } = get();

                if (communicationMethod === 'ws' && chatWebSocketManager.isConnected()) {
                    // 使用WebSocket发送消息
                    chatWebSocketManager.send({ 
                        message: text.trim(),
                        timestamp: Date.now()
                    });
                    // WebSocket响应由handleWebSocketMessage处理
                } else {
                    // 使用HTTP发送消息
                    const response = await chatApi.sendMessage(text.trim());
                    
                    const botMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        text: response.text,
                        isUser: false,
                        timestamp: Date.now(),
                    };

                    set((state) => ({
                        messages: [...state.messages, botMessage],
                        isLoading: false,
                        isSending: false,
                    }));
                }
            } catch (error: any) {
                console.error('发送消息失败:', error);
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: '发送消息失败，请检查网络连接。',
                    isUser: false,
                    timestamp: Date.now(),
                };

                set((state) => ({
                    messages: [...state.messages, errorMessage],
                    isLoading: false,
                    isSending: false,
                    error: error.message || '发送消息失败',
                }));
            }
        },

        // 添加消息
        addMessage: (message: Message) => {
            set((state) => ({
                messages: [...state.messages, message],
            }));
        },

        // 设置输入文本
        setInputText: (text: string) => {
            set({ inputText: text });
        },

        // 切换emoji选择器显示
        toggleEmojiPicker: () => {
            set((state) => ({
                isEmojiPickerVisible: !state.isEmojiPickerVisible,
            }));
        },

        // 切换摄像头显示
        toggleCamera: () => {
            set((state) => ({
                isCameraVisible: !state.isCameraVisible,
            }));
        },

        // 设置本地视频流
        setLocalStream: (stream: any | null) => {
            set({ localStream: stream });
        },

        // 清空消息
        clearMessages: () => {
            set({ messages: [] });
        },

        // 连接WebSocket
        connectWebSocket: async () => {
            try {
                set({ error: null });
                await chatWebSocketManager.connect();
                set({ isWsConnected: true, communicationMethod: 'ws' });
                // 连接成功后注册监听器
                get().registerWebSocketListeners();
            } catch (error: any) {
                console.error('WebSocket连接失败:', error);
                set({ error: error.message || 'WebSocket连接失败', isWsConnected: false });
            }
        },

        // 断开WebSocket
        disconnectWebSocket: () => {
            // 断开连接前移除监听器
            get().unregisterWebSocketListeners();
            chatWebSocketManager.close();
            set({ isWsConnected: false, communicationMethod: 'http' });
        },

        // 设置通信方式
        setCommunicationMethod: (method: 'ws' | 'http') => {
            if (method === 'ws' && !chatWebSocketManager.isConnected()) {
                // 如果选择WebSocket但未连接，自动尝试连接
                get().connectWebSocket();
            } else if (method === 'http' && chatWebSocketManager.isConnected()) {
                // 如果选择HTTP但WebSocket已连接，断开连接
                get().disconnectWebSocket();
            }
            set({ communicationMethod: method });
        },

        // 加载聊天历史
        loadChatHistory: async () => {
            try {
                set({ isLoading: true, error: null });
                const history = await chatApi.getChatHistory();
                const messages: Message[] = history.map((msg: ApiChatMessage) => ({
                    id: msg.id,
                    text: msg.text,
                    isUser: msg.isUser,
                    timestamp: msg.timestamp,
                }));
                set({ messages, isLoading: false });
            } catch (error: any) {
                console.error('加载聊天历史失败:', error);
                set({ error: error.message || '加载聊天历史失败', isLoading: false });
            }
        },
        
        // 注册WebSocket监听器
        registerWebSocketListeners: () => {
            // 创建绑定了set的处理函数
            messageListener = handleWebSocketMessage(set);
            openListener = () => set({ isWsConnected: true });
            closeListener = () => set({ isWsConnected: false });
            errorListener = (error: any) => {
                console.error('WebSocket错误:', error);
                set({ error: 'WebSocket连接错误' });
            };
            
            // 注册监听器
            chatWebSocketManager.onMessage(messageListener);
            chatWebSocketManager.onOpen(openListener);
            chatWebSocketManager.onClose(closeListener);
            chatWebSocketManager.onError(errorListener);
        },
        
        // 移除WebSocket监听器
        unregisterWebSocketListeners: () => {
            // 移除所有监听器
            if (messageListener) {
                chatWebSocketManager.offMessage(messageListener);
                messageListener = null;
            }
            if (openListener) {
                chatWebSocketManager.offOpen(openListener);
                openListener = null;
            }
            if (closeListener) {
                chatWebSocketManager.offClose(closeListener);
                closeListener = null;
            }
            if (errorListener) {
                chatWebSocketManager.offError(errorListener);
                errorListener = null;
            }
        }
    };
});

