import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import TabBar from "../../components/TabBar";

const HomeScreen = () => {
    // 导航引用
    const navigation = useNavigation();
    
    // 处理功能选择
    const handleFeaturePress = (featureName: string) => {
        navigation.navigate(featureName as never);
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
            <View style={styles.footer}>
                <Text style={styles.footerText}>项目信息</Text>
            </View>
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
});

export default HomeScreen;