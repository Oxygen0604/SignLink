import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TextInput,
    ActivityIndicator
} from 'react-native';
import TabBar from '../../components/TabBar';
import CameraComponent from '../../components/CameraComponent';
import { useTranslationStore, useVideoFrameStore } from '../../store';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const SignTranslationScreen = () => {
    // 状态管理
    const [isCameraVisible, setIsCameraVisible] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    
    // 组件引用
    const isMountedRef = useRef(true);
    
    // 状态管理 - 使用 zustand store
    const {
        signInput,
        signTranslation,
        connect,
        disconnect,
        sendImage,
        getWsManager
    } = useTranslationStore();
    
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

    // 处理捕获的视频帧
    const handleFrameCaptured = async (base64Image: string) => {
        if (!base64Image || !isMountedRef.current) return;
        
        // 使用videoFrameStore的captureFrame函数处理帧捕获
        await captureFrame(base64Image, async (image) => {
            await sendImage(image);
        });
    };

    // 初始化应用
    useEffect(() => {
        isMountedRef.current = true;
        
        const initializeApp = async () => {
            try {
                setIsInitializing(true);
                
                // 检查摄像头权限
                const granted = await checkCameraPermission();
                
                if (granted && isMountedRef.current) {
                    // 先显示摄像头，再尝试连接WebSocket
                    // 这样即使WebSocket连接失败，用户仍然可以看到摄像头画面
                    setIsCameraVisible(true);
                    
                    // 延迟连接WebSocket，确保摄像头已经初始化完成
                    setTimeout(async () => {
                        if (isMountedRef.current) {
                            try {
                                await connect();
                                
                                // WebSocket连接成功后，初始化videoFrameStore并开始捕获
                                const wsManager = getWsManager();
                                if (wsManager) {
                                    // 设置WebSocket管理器
                                    setWebSocketManager(wsManager);
                                    
                                    // 设置捕获间隔为300ms
                                    setCaptureInterval(300);
                                    
                                    // 开始捕获视频帧
                                    startCapture();
                                }
                            } catch (error) {
                                console.error('WebSocket连接失败:', error);
                                // WebSocket连接失败不影响摄像头使用
                            }
                        }
                    }, 500);
                }
            } catch (error) {
                console.error('Error initializing app:', error);
            } finally {
                if (isMountedRef.current) {
                    setIsInitializing(false);
                }
            }
        };

        initializeApp();

        // 组件卸载时清理资源
        return () => {
            isMountedRef.current = false;
            setIsCameraVisible(false);
            stopCapture(); // 停止捕获视频帧
            disconnect(); // 断开WebSocket连接
        };
    }, [connect, disconnect, startCapture, stopCapture, setWebSocketManager, setCaptureInterval]);

    // 渲染初始化状态
    if (isInitializing) {
        return (
            <View style={[styles.container, styles.initializingContainer]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.initializingText}>正在初始化...</Text>
            </View>
        );
    }

    // 渲染权限不足状态
    if (!hasCameraPermission) {
        return (
            <View style={[styles.container, styles.permissionContainer]}>
                <Text style={styles.permissionText}>需要摄像头权限才能使用此功能</Text>
                <Text style={styles.permissionSubText}>请在设备设置中启用摄像头权限</Text>
            </View>
        );
    }

    // 渲染主界面
    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="手语翻译" />
            
            {/* 摄像头预览区域 */}
            <View style={styles.cameraContainer}>
                {isCameraVisible && (
                    <CameraComponent
                        isCameraVisible={isCameraVisible}
                        onFrameCaptured={handleFrameCaptured}
                        wsManager={getWsManager()}
                        captureInterval={0} // 使用videoFrameStore控制捕获间隔
                    />
                )}
            </View>

            {/* 翻译结果区域 */}
            <View style={styles.translationSection}>
                {/* 手语输入显示 */}
                <View style={styles.inputContainer}>
                    <Text style={styles.sectionLabel}>手语输入</Text>
                    <TextInput
                        style={styles.inputTextArea}
                        value={signInput}
                        editable={false}
                        multiline={true}
                        textAlignVertical="top"
                        placeholder="等待手语输入..."
                        placeholderTextColor="#999"
                    />
                </View>

                {/* 翻译结果显示 */}
                <View style={styles.translationContainer}>
                    <Text style={styles.sectionLabel}>手语翻译</Text>
                    <TextInput
                        style={styles.translationTextArea}
                        value={signTranslation}
                        editable={false}
                        multiline={true}
                        textAlignVertical="top"
                        placeholder="等待翻译结果..."
                        placeholderTextColor="#999"
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    initializingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initializingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#333',
    },
    permissionContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    permissionText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    permissionSubText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    translationSection: {
        height: 320,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    inputContainer: {
        height: 100,
        marginBottom: 12,
    },
    translationContainer: {
        flex: 1,
        minHeight: 150,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputTextArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        minHeight: 70,
    },
    translationTextArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        minHeight: 150,
    },
});

export default SignTranslationScreen;

