import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Modal, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from "../../store/authStore";
import TabBar from "../../components/TabBar";

const HomeScreen = () => {
    // 导航引用
    const navigation = useNavigation();
    const { isAuthenticated } = useAuthStore();
    
    // 状态变量
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [hasCheckedLogin, setHasCheckedLogin] = useState(false);
    
    // 处理功能选择
    const handleFeaturePress = (featureName: string) => {
        navigation.navigate(featureName as never);
    };
    
    // 检查是否需要显示登录提示
    useEffect(() => {
        const checkLoginPrompt = async () => {
            try {
                // 检查是否已登录
                if (!isAuthenticated) {
                    // 检查是否已关闭过提示
                    const hasClosedPrompt = await AsyncStorage.getItem('hasClosedLoginPrompt');
                    if (!hasClosedPrompt) {
                        // 显示登录提示
                        setShowLoginPrompt(true);
                    }
                }
            } catch (error) {
                console.error('检查登录提示状态失败:', error);
            } finally {
                setHasCheckedLogin(true);
            }
        };
        
        checkLoginPrompt();
    }, [isAuthenticated]);
    
    // 处理关闭提示
    const handleClosePrompt = async () => {
        try {
            // 存储已关闭提示的状态
            await AsyncStorage.setItem('hasClosedLoginPrompt', 'true');
            setShowLoginPrompt(false);
        } catch (error) {
            console.error('存储关闭提示状态失败:', error);
            setShowLoginPrompt(false);
        }
    };
    
    // 处理登录
    const handleLogin = () => {
        setShowLoginPrompt(false);
        navigation.navigate('Login' as never);
    };
    
    // 处理注册
    const handleRegister = () => {
        setShowLoginPrompt(false);
        navigation.navigate('Register' as never);
    };
    
    // 渲染主界面
    return (
        <View style={styles.container}>
            {/* 顶部导航栏 */}
            <TabBar />
            
            {/* 主内容区域 */}
            <View style={styles.contentContainer}>
                <Text style={styles.titleText}>
                    请选择您要使用的功能
                </Text>
                
                {/* 功能按钮列表 */}
                <View style={styles.featuresList}>
                    {/* 手语翻译按钮 */}
                    <TouchableOpacity 
                        style={styles.featureButton} 
                        onPress={() => handleFeaturePress('SignHome')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.featureButtonText}>手语翻译</Text>
                    </TouchableOpacity>
                    
                    {/* 答题闯关按钮 */}
                    <TouchableOpacity 
                        style={styles.featureButton} 
                        onPress={() => handleFeaturePress('AnswerGame')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.featureButtonText}>答题闯关</Text>
                    </TouchableOpacity>
                    
                    {/* AI助手按钮 */}
                    <TouchableOpacity 
                        style={styles.featureButton} 
                        onPress={() => handleFeaturePress('AIAssistant')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.featureButtonText}>AI助手</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* 页脚信息 */}
            <TouchableOpacity 
                style={styles.footer} 
                onPress={() => Alert.alert(
                    "SignLink 项目信息",
                    "SignLink 是一个集成实时手语识别、AI问答及互动学习的跨平台移动应用，支持实时摄像头识别翻译、手语AI问答以及互动学习答题功能，致力于打造健听人士与听障人士之间无障碍沟通的智能桥梁。\n\n技术栈：\n- 前端：React Native 0.81, TypeScript\n- 后端：Node.js, FastAPI\n- 图像识别：MediaPipe, OpenCV\n- 机器学习：TensorFlow/Keras, LSTM\n- 状态管理：Zustand\n\n版本：1.0.0",
                    [{ text: "确定", style: "default" }]
                )}
            >
                <Text style={styles.footerText}>项目信息</Text>
            </TouchableOpacity>
            
            {/* 登录注册提示模态框 */}
            <Modal
                visible={showLoginPrompt}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>欢迎使用 SignLink</Text>
                        <Text style={styles.modalMessage}>
                            登录或注册以获得更好的使用体验
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={styles.modalLoginButton} 
                                onPress={handleLogin}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalLoginButtonText}>登录</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.modalRegisterButton} 
                                onPress={handleRegister}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalRegisterButtonText}>注册</Text>
                            </TouchableOpacity>
                        </View>
                        <Pressable 
                            style={styles.closeButton} 
                            onPress={handleClosePrompt}
                        >
                            <Text style={styles.closeButtonText}>关闭</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    // 头部样式
    header: {
        marginTop: 65,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '600',
        color: '#222',
        letterSpacing: 1,
    },
    // 主内容区域样式
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    // 标题样式
    titleText: {
        fontSize: 18,
        color: '#555',
        marginBottom: 32,
        fontWeight: '500',
    },
    // 功能列表样式
    featuresList: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // 功能按钮样式
    featureButton: {
        width: 260,
        height: 56,
        backgroundColor: '#007AFF',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    // 功能按钮文本样式
    featureButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '500',
        letterSpacing: 1,
    },
    // 页脚样式
    footer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 30,
    },
    footerText: {
        color: '#888',
        fontSize: 14,
    },
    // 模态框样式
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        maxWidth: 300,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#222',
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        color: '#555',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16,
    },
    modalLoginButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginRight: 8,
    },
    modalLoginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalRegisterButton: {
        flex: 1,
        backgroundColor: '#34C759',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginLeft: 8,
    },
    modalRegisterButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default HomeScreen;