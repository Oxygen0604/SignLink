import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Modal,
    ScrollView,
} from 'react-native';
import TabBar from '../../components/TabBar';
import CameraComponent from '../../components/CameraComponent';
import { useChatStore, Message, useVideoFrameStore } from '../../store';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// 常用emoji列表
const EMOJI_LIST = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐'];

const SignAIScreen = () => {
    // 组件引用
    const flatListRef = useRef<FlatList>(null);
    const isMountedRef = useRef(true);
    
    // 状态管理
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    
    // 聊天状态管理 - 使用 zustand store
    const {
        messages,
        inputText,
        isSending,
        isEmojiPickerVisible,
        isCameraVisible,
        sendMessage,
        setInputText,
        toggleEmojiPicker,
        toggleCamera,
        getWebSocketManager,
        connectWebSocket,
        disconnectWebSocket,
    } = useChatStore();
    
    // 视频帧管理 - 使用 videoFrameStore
    const {
        setWebSocketManager,
        startCapture,
        stopCapture,
        setCaptureInterval,
        captureFrame
    } = useVideoFrameStore();

    // 检查摄像头权限
    const checkCameraPermission = async () => {
        try {
            const permissionStatus = await check(PERMISSIONS.IOS.CAMERA);
            
            if (permissionStatus === RESULTS.GRANTED) {
                setHasCameraPermission(true);
                return true;
            } else {
                const result = await request(PERMISSIONS.IOS.CAMERA);
                if (result === RESULTS.GRANTED) {
                    setHasCameraPermission(true);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error checking camera permission:', error);
            return false;
        }
    };

    // 初始化组件
    useEffect(() => {
        isMountedRef.current = true;
        
        const initializeComponent = async () => {
            try {
                setIsInitializing(true);
                // 检查摄像头权限
                await checkCameraPermission();
                // 确保通信方式为HTTP，避免自动连接WebSocket
            } catch (error) {
                console.error('Error initializing component:', error);
            } finally {
                if (isMountedRef.current) {
                    setIsInitializing(false);
                }
            }
        };
        
        initializeComponent();
        
        // 组件卸载时清理资源
        return () => {
            isMountedRef.current = false;
            stopCapture(); // 停止捕获视频帧
            disconnectWebSocket(); // 清理WebSocket连接
        };
    }, [disconnectWebSocket, stopCapture]);

    // 处理捕获的视频帧
    const handleFrameCaptured = async (base64Image: string) => {
        if (!base64Image || !isMountedRef.current) return;
        
        // 使用videoFrameStore的captureFrame函数处理帧捕获
        await captureFrame(base64Image, async (image) => {
            // 这里可以根据需要处理捕获的帧
            // 例如：发送到聊天系统进行手语识别
        });
    };

    // 滚动到底部
    useEffect(() => {
        if (messages.length > 0 && isMountedRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    // 发送消息
    const handleSendMessage = async () => {
        if (inputText.trim()) {
            await sendMessage(inputText);
        }
    };

    // 插入表情
    const handleInsertEmoji = (emoji: string) => {
        setInputText(inputText + emoji);
    };

    // 渲染消息项
    const renderMessageItem = ({ item }: { item: Message }) => {
        return (
            <View
                style={[
                    styles.messageContainer,
                    item.isUser ? styles.userMessageContainer : styles.botMessageContainer,
                ]}
            >
                <Text style={[
                    styles.messageText,
                    item.isUser ? styles.userMessageText : styles.botMessageText
                ]}>
                    {item.text}
                </Text>
            </View>
        );
    };

    // 渲染主界面
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
        >
            <TabBar showBackButton={true} title="AI助手" />

            {/* 摄像头显示区域 */}
            {isCameraVisible && hasCameraPermission && (
                <View style={styles.cameraContainer}>
                    <CameraComponent
                        isCameraVisible={isCameraVisible}
                        onFrameCaptured={handleFrameCaptured}
                        wsManager={getWebSocketManager()}
                        captureInterval={0} // 使用videoFrameStore控制捕获间隔
                    />
                </View>
            )}

            {/* 聊天消息列表 */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>开始与AI助手对话吧！</Text>
                    </View>
                }
            />

            {/* 输入区域 */}
            <View style={styles.inputContainer}>
                <TouchableOpacity
                    style={styles.emojiButton}
                    onPress={toggleEmojiPicker}
                >
                    <Text style={styles.emojiButtonText}>😊</Text>
                </TouchableOpacity>

                <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="输入消息..."
                    placeholderTextColor="#999"
                    multiline={true}
                    maxLength={500}
                />

                <TouchableOpacity
                    style={styles.signButton}
                    onPress={async () => {
                        // 检查摄像头权限
                        if (!hasCameraPermission) {
                            const granted = await checkCameraPermission();
                            if (!granted) {
                                Alert.alert(
                                    '需要摄像头权限',
                                    '请在设置中启用摄像头权限以使用手语功能',
                                    [{ text: '确定', style: 'default' }]
                                );
                                return;
                            }
                        }
                        
                        // 切换摄像头可见性 - 优先处理，让用户立即看到摄像头画面
                        toggleCamera();
                        
                        // 检查当前摄像头状态
                        const isTurningOn = !isCameraVisible;
                        
                        if (isTurningOn) {
                            // 打开摄像头的情况
                            try {
                                // 异步连接WebSocket，不阻塞主线程
                                // 摄像头已经显示，用户体验不受影响
                                const wsManager = getWebSocketManager();
                                if (wsManager) {
                                    // 设置WebSocket管理器
                                    setWebSocketManager(wsManager);
                                    
                                    // 设置捕获间隔为1000ms
                                    setCaptureInterval(1000);
                                }
                                
                                // 异步连接WebSocket，不阻塞摄像头显示
                                connectWebSocket().then(() => {
                                    // WebSocket连接成功后，开始捕获视频帧
                                    startCapture();
                                }).catch(error => {
                                    console.error('WebSocket连接失败:', error);
                                });
                            } catch (error) {
                                console.error('处理摄像头开启时出错:', error);
                            }
                        } else {
                            // 关闭摄像头的情况
                            stopCapture();
                        }
                    }}
                >
                    <Text style={styles.signButtonText}>✋</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={!inputText.trim() || isSending}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.sendButtonText}>发送</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Emoji选择器 */}
            <Modal
                visible={isEmojiPickerVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={toggleEmojiPicker}
            >
                <View style={styles.emojiModalContainer}>
                    <View style={styles.emojiModalContent}>
                        <View style={styles.emojiModalHeader}>
                            <Text style={styles.emojiModalTitle}>选择表情</Text>
                            <TouchableOpacity onPress={toggleEmojiPicker}>
                                <Text style={styles.emojiModalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.emojiList}>
                            <View style={styles.emojiGrid}>
                                {EMOJI_LIST.map((emoji, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.emojiItem}
                                        onPress={() => {
                                            handleInsertEmoji(emoji);
                                            toggleEmojiPicker();
                                        }}
                                    >
                                        <Text style={styles.emojiText}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    // 摄像头相关样式
    cameraContainer: {
        height: 200,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraPreview: {
        width: '100%',
        height: '100%',
    },
    cameraLoadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraLoadingText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 8,
    },
    cameraPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraPlaceholderText: {
        color: '#fff',
        fontSize: 16,
    },
    // 聊天消息相关样式
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
    },
    messageContainer: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    userMessageContainer: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
    },
    botMessageContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#E5E5EA',
    },
    messageText: {
        fontSize: 16,
    },
    userMessageText: {
        color: '#fff',
    },
    botMessageText: {
        color: '#000',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    // 输入区域样式
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    emojiButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    emojiButtonText: {
        fontSize: 24,
    },
    textInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        marginRight: 8,
    },
    signButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
    },
    signButtonText: {
        fontSize: 20,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 60,
    },
    sendButtonDisabled: {
        backgroundColor: '#C7C7CC',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Emoji选择器样式
    emojiModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    emojiModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '50%',
    },
    emojiModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    emojiModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    emojiModalClose: {
        fontSize: 24,
        color: '#666',
    },
    emojiList: {
        maxHeight: 300,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
    },
    emojiItem: {
        width: '12.5%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiText: {
        fontSize: 28,
    },
});

export default SignAIScreen;

