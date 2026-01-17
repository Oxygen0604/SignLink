import React from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    TextInput
} from 'react-native';
import TabBar from '../../components/TabBar';
import CameraComponent from '../../components/CameraComponent';
import { useTranslationStore } from '../../store/translationStore';

const SignHomeScreen = () => {
    // 使用 zustand store 管理翻译数据
    const { 
        signInput, 
        signTranslation, 
        getWsManager
    } = useTranslationStore();

    // 处理捕获的视频帧
    const handleFrameCaptured = async (base64Image: string) => {
        // CameraComponent 内部已经处理了帧捕获和发送逻辑
        // 直接使用 TranslationStore 的 sendImage 方法发送图片
    };

    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="手语翻译" />
            
            {/* 上半部分：摄像头预览 - 使用封装好的 CameraComponent */}
            <View style={styles.cameraContainer}>
                <CameraComponent
                    isCameraVisible={true}
                    onFrameCaptured={handleFrameCaptured}
                    wsManager={getWsManager()}
                    captureInterval={200} // 每200ms捕获一帧
                    showControls={true}
                />
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

