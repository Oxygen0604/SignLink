import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../../components/TabBar';
import { useAuthStore } from '../../store/authStore';

const SignAIScreen = () => {
  // 导航引用
  const navigation = useNavigation();
  
  // 状态管理
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  
  // 使用authStore
  const { isAuthenticated } = useAuthStore();
  
  // 处理AI交互
  const handleAIInteraction = async () => {
    if (!isAuthenticated) {
      return;
    }
    
    setIsProcessing(true);
    try {
      // 这里应该调用AI交互API
      // 模拟API调用
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));
      setResult('AI交互结果示例');
    } catch (error) {
      console.error('AI交互失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 清除结果
  const handleClear = () => {
    setResult('');
  };
  
  // 渲染主界面
  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <TabBar showBackButton={true} title="手语AI" showAuthControls={true} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 功能介绍 */}
        <View style={styles.introContainer}>
          <Text style={styles.sectionTitle}>AI手语助手</Text>
          <Text style={styles.introText}>
            与AI手语助手进行交互，学习手语知识，获取实时帮助
          </Text>
        </View>
        
        {/* 交互区域 */}
        <View style={styles.interactionContainer}>
          <Text style={styles.sectionTitle}>AI交互</Text>
          
          {/* 结果展示 */}
          <View style={styles.resultContainer}>
            {result ? (
              <Text style={styles.resultText}>{result}</Text>
            ) : (
              <Text style={styles.placeholderText}>AI交互结果将显示在这里</Text>
            )}
          </View>
          
          {/* 操作按钮 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.aiButton]}
              onPress={handleAIInteraction}
              disabled={isProcessing || !isAuthenticated}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>开始AI交互</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>清除</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 功能说明 */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>功能特点</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureNumber}>1</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>实时手语识别</Text>
              <Text style={styles.featureDescription}>
                AI实时识别手语动作，提供准确的翻译结果
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureNumber}>2</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>智能对话</Text>
              <Text style={styles.featureDescription}>
                与AI进行手语相关的智能对话，获取学习建议
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureNumber}>3</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>个性化学习</Text>
              <Text style={styles.featureDescription}>
                根据学习进度提供个性化的手语学习计划
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  introContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  interactionContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  resultContainer: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiButton: {
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  clearButton: {
    backgroundColor: '#E0E0E0',
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  featuresContainer: {
    paddingHorizontal: 24,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  featureNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 16,
    marginTop: 4,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default SignAIScreen;