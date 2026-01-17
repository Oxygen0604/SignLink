import React from 'react';
import {
    View,
    StyleSheet,
    Text,
    TextInput
} from 'react-native';
import TabBar from '../../components/TabBar';
import CameraComponent from '../../components/CameraComponent';
import { useTranslationStore } from '../../store';

const SignTranslationScreen = () => {
    // 状态管理 - 使用 zustand store
    const {
        signInput,
        signTranslation,
        getWsManager
    } = useTranslationStore();

    // 处理捕获的视频帧
    const handleFrameCaptured = async (base64Image: string) => {
        // 直接使用TranslationStore的sendImage方法发送图片
        // CameraComponent内部已经处理了WebSocket连接和权限管理
    };

    // 渲染主界面
    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="手语翻译" />
            
            {/* 摄像头预览区域 */}
            <View style={styles.cameraContainer}>
                <CameraComponent
                    isCameraVisible={true} // 始终显示摄像头
                    onFrameCaptured={handleFrameCaptured}
                    wsManager={getWsManager()}
                    captureInterval={300} // 直接设置捕获间隔
                    showControls={true} // 显示控制按钮
                />
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

