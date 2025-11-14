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
}

export const useChatStore = create<ChatState>((set, get) => {
    // WebSocket消息处理函数
    const handleWebSocketMessage = (data: any) => {
        try {
            // 根据后端返回格式处理响应
            // 支持多种格式: { response: "..." }, { message: "..." }, { text: "..." }, { answer: "..." }
            const botText = data.response || data.message || data.text || data.answer || '抱歉，我无法理解您的问题。';

            const botMessage: Message = {
                id: Date.now().toString(),
                text: botText,
                isUser: false,
                timestamp: Date.now(),
            };

            set((state) => ({
                messages: [...state.messages, botMessage],
                isLoading: false,
            }));
        } catch (error) {
            console.error('处理WebSocket消息失败:', error);
        }
    };

    // 注册WebSocket事件监听
    chatWebSocketManager.onMessage(handleWebSocketMessage);
    chatWebSocketManager.onOpen(() => set({ isWsConnected: true }));
    chatWebSocketManager.onClose(() => set({ isWsConnected: false }));
    chatWebSocketManager.onError((error) => {
        console.error('WebSocket错误:', error);
        set({ error: 'WebSocket连接错误' });
    });

    return {
        // 初始状态
        messages: [],
        inputText: '',
        isLoading: false,
        error: null,
        isEmojiPickerVisible: false,
        isCameraVisible: false,
        localStream: null,
        isWsConnected: false,
        communicationMethod: 'http', // 默认使用HTTP

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
                error: null,
            }));

            try {
                const { communicationMethod } = get();

                if (communicationMethod === 'ws' && chatWebSocketManager.isConnected()) {
                    // 使用WebSocket发送消息
                    chatWebSocketManager.send({ message: text.trim() });
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
            } catch (error: any) {
                console.error('WebSocket连接失败:', error);
                set({ error: error.message || 'WebSocket连接失败', isWsConnected: false });
            }
        },

        // 断开WebSocket
        disconnectWebSocket: () => {
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
                chatWebSocketManager.close();
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
        }
    };
});

