import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    TextInput, 
    Alert, 
    ActivityIndicator
} from 'react-native';
import TabBar from '../../components/TabBar';
import { mediaDevices, RTCView } from 'react-native-webrtc';
import { useTranslationStore } from '../../store/translationStore';
import { captureFrameFromStream } from '../../utils/videoCapture';

const SignHomeScreen = () => {
    const [localStream, setLocalStream] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // 使用 zustand store 管理翻译数据
    const { 
        signInput, 
        signTranslation, 
        connect, 
        disconnect,
        sendImage
    } = useTranslationStore();
    
    // 捕获帧的定时器引用
    const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isCapturingRef = useRef(false);
    // RTCView 的引用，用于截图
    const cameraViewRef = useRef<any>(null);

    const startCamera = async () => {
        setIsLoading(true);
        
        try {
            // iOS 会自动处理权限请求（需要在 Info.plist 中配置 NSCameraUsageDescription）
            const stream = await mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: 'user', // 前置摄像头
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            setLocalStream(stream);
        } catch (err: any) {
            // iOS 权限被拒绝时会抛出错误
            if (err?.name === 'NotAllowedError' || err?.message?.includes('permission')) {
                Alert.alert(
                    "权限错误", 
                    "无法获取摄像头权限。请在设置中允许应用访问摄像头。",
                    [
                        { text: "取消", style: "cancel" },
                        { text: "去设置", onPress: () => {
                            // iOS 会自动打开设置页面
                            // 如果需要，可以使用 Linking.openSettings()
                        }}
                    ]
                );
            } else {
                Alert.alert("错误", "无法访问摄像头");
            }
            console.error('Camera error:', err);
        } finally {
            setIsLoading(false);
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

    // 开始捕获视频帧
    const startCapture = useCallback(() => {
        if (captureIntervalRef.current || isCapturingRef.current) {
            return;
        }

        isCapturingRef.current = true;
        
        // 每200ms捕获一帧（可根据需要调整）
        captureIntervalRef.current = setInterval(async () => {
            if (!localStream) {
                return;
            }

            try {
                // 捕获视频帧（传入视图引用）
                const base64Image = await captureFrameFromStream(localStream, cameraViewRef);
                
                if (base64Image) {
                    // 发送到WebSocket（如果连接）或HTTP API（如果未连接）
                    await sendImage(base64Image);
                }
            } catch (error) {
                console.error('捕获视频帧失败:', error);
            }
        }, 200); // 每200ms捕获一帧
    }, [localStream, sendImage, cameraViewRef]);

    // 停止捕获视频帧
    const stopCapture = () => {
        if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
            captureIntervalRef.current = null;
        }
        isCapturingRef.current = false;
    };

    useEffect(() => {
        // 组件挂载时自动启动摄像头
        startCamera();
        // 连接 WebSocket（通过 store 管理）
        connect();

        // 组件卸载时清理摄像头和 WebSocket
        return () => {
            stopCapture();
            stopCamera();
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 当摄像头准备好时，开始捕获帧
    // 注意：不依赖 WebSocket 连接状态，即使未连接也使用 HTTP API 发送
    useEffect(() => {
        if (localStream) {
            // 延迟一小段时间确保摄像头稳定
            setTimeout(() => {
                startCapture();
            }, 500);
        } else {
            stopCapture();
        }

        return () => {
            stopCapture();
        };
    }, [localStream, startCapture]);

    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="手语翻译" />
            
            {/* 上半部分：摄像头预览 */}
            <View style={styles.cameraContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>正在启动摄像头...</Text>
                    </View>
                ) : localStream ? (
                    <View ref={cameraViewRef} style={styles.cameraPreview}>
                        <RTCView
                            // @ts-ignore
                            streamURL={localStream.toURL()}
                            style={StyleSheet.absoluteFillObject}
                            objectFit="cover"
                            mirror={true}
                        />
                    </View>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>摄像头未启动</Text>
                        <Text style={styles.placeholderSubText}>正在请求权限...</Text>
                    </View>
                )}
            </View>

            {/* 下半部分：两个文本框 */}
            <View style={styles.textSection}>
                {/* 手语输入 - 较小的文本框 */}
                <View style={styles.textBoxContainerSmall}>
                    <Text style={styles.label}>手语输入</Text>
                    <TextInput
                        style={styles.textInputSmall}
                        value={signInput}
                        editable={false}
                        multiline={true}
                        textAlignVertical="top"
                        placeholder="等待手语输入..."
                        placeholderTextColor="#999"
                    />
                </View>

                {/* 手语翻译 - 较大的文本框 */}
                <View style={styles.textBoxContainerLarge}>
                    <Text style={styles.label}>手语翻译</Text>
                    <TextInput
                        style={styles.textInputLarge}
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
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraPreview: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 12,
    },
    placeholderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 8,
    },
    placeholderSubText: {
        color: '#999',
        fontSize: 14,
    },
    textSection: {
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
    textBoxContainerSmall: {
        height: 100,
        marginBottom: 12,
    },
    textBoxContainerLarge: {
        flex: 1,
        minHeight: 150,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInputSmall: {
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
    textInputLarge: {
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

export default SignHomeScreen;

