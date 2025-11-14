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
    PermissionsAndroid,
} from 'react-native';
import TabBar from '../../components/TabBar';
import { mediaDevices, RTCView } from 'react-native-webrtc';
import { useChatStore, Message } from '../../store/chatStore';

// 常用emoji列表
const EMOJI_LIST = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐'];

const SignAIScreen = () => {
    const [isLoadingCamera, setIsLoadingCamera] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const {
        messages,
        inputText,
        isLoading,
        isEmojiPickerVisible,
        isCameraVisible,
        localStream,
        sendMessage,
        setInputText,
        toggleEmojiPicker,
        toggleCamera,
        setLocalStream,
    } = useChatStore();

    const requestCameraPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: "摄像头权限",
                    message: "应用需要访问您的摄像头以进行手语识别",
                    buttonNeutral: "稍后询问",
                    buttonNegative: "取消",
                    buttonPositive: "确定"
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Permission request error:', err);
            return false;
        }
    };

    const startCamera = async () => {
        setIsLoadingCamera(true);
        const hasPermission = await requestCameraPermission();
        
        if (!hasPermission) {
            Alert.alert("权限错误", "无法获取摄像头权限");
            setIsLoadingCamera(false);
            return;
        }

        try {
            const stream = await mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            setLocalStream(stream);
        } catch (err) {
            Alert.alert("错误", "无法访问摄像头");
            console.error('Camera error:', err);
        } finally {
            setIsLoadingCamera(false);
        }
    };

    const stopCamera = () => {
        if (localStream) {
            localStream.getTracks().forEach((track: any) => {
                track.stop();
            });
            setLocalStream(null);
        }
    };

    useEffect(() => {
        if (isCameraVisible) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCameraVisible]);

    // 滚动到底部
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSend = async () => {
        if (inputText.trim()) {
            await sendMessage(inputText);
        }
    };

    const insertEmoji = (emoji: string) => {
        setInputText(inputText + emoji);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        return (
            <View
                style={[
                    styles.messageContainer,
                    item.isUser ? styles.userMessage : styles.botMessage,
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

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'android' ? 'height' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 90}
        >
            <TabBar showBackButton={true} title="AI助手" />

            {/* 摄像头显示区域 */}
            {isCameraVisible && (
                <View style={styles.cameraContainer}>
                    {isLoadingCamera ? (
                        <View style={styles.cameraLoadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.cameraLoadingText}>正在启动摄像头...</Text>
                        </View>
                    ) : localStream ? (
                        <RTCView
                            // @ts-ignore
                            streamURL={localStream.toURL()}
                            style={styles.cameraPreview}
                            objectFit="cover"
                            mirror={true}
                        />
                    ) : (
                        <View style={styles.cameraPlaceholder}>
                            <Text style={styles.cameraPlaceholderText}>摄像头未启动</Text>
                        </View>
                    )}
                </View>
            )}

            {/* 聊天消息列表 */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
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
                    onPress={toggleCamera}
                >
                    <Text style={styles.signButtonText}>✋</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || isLoading}
                >
                    {isLoading ? (
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
                                            insertEmoji(emoji);
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
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
    },
    botMessage: {
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

