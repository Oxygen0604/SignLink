import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../../components/TabBar';
import { useAuthStore } from '../../store/authStore';

const SignTranslationScreen = () => {
  // 导航引用
  const navigation = useNavigation();
  
  // 状态管理
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  // 使用authStore
  const { isAuthenticated } = useAuthStore();
  
  // 处理翻译
  const handleTranslate = async () => {
    if (!isAuthenticated) {
      return;
    }
    
    if (!inputText.trim()) {
      return;
    }
    
    setIsTranslating(true);
    try {
      // 待完成：调用翻译API
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
      setTranslatedText(`翻译结果：${inputText}`);
    } catch (error) {
      console.error('翻译失败:', error);
    } finally {
      setIsTranslating(false);
    }
  };
  
  // 清除输入
  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
  };
  
  // 渲染主界面
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 90}
    >
      {/* 顶部导航栏 */}
      <TabBar showBackButton={true} title="手语翻译" showAuthControls={true} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 输入区域 */}
        <View style={styles.inputContainer}>
          <Text style={styles.sectionTitle}>输入文本</Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="请输入要翻译的文本"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          {/* 操作按钮 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.translateButton]}
              onPress={handleTranslate}
              disabled={isTranslating || !isAuthenticated}
            >
              {isTranslating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>翻译</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
              disabled={isTranslating}
            >
              <Text style={styles.buttonText}>清除</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 输出区域 */}
        <View style={styles.outputContainer}>
          <Text style={styles.sectionTitle}>翻译结果</Text>
          <View style={styles.outputContent}>
            <Text style={styles.outputText}>
              {translatedText || '翻译结果将显示在这里'}
            </Text>
          </View>
        </View>
        
        {/* 说明信息 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>使用说明</Text>
          <Text style={styles.infoText}>
            1. 在输入框中输入要翻译的文本
          </Text>
          <Text style={styles.infoText}>
            2. 点击翻译按钮获取手语翻译
          </Text>
          <Text style={styles.infoText}>
            3. 查看翻译结果和对应的手语视频
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  inputContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  textInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F9F9F9',
    marginBottom: 16,
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
  translateButton: {
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
  outputContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  outputContent: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
  },
  outputText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  infoContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default SignTranslationScreen;