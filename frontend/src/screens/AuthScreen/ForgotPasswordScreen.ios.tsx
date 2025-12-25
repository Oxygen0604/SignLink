import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../../components/TabBar';
import { useAuthStore } from '../../store/authStore';

const ForgotPasswordScreen = () => {
  // 导航引用
  const navigation = useNavigation();
  
  // 状态管理
  const [email, setEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  // 使用authStore
  const {
    forgotPassword,
    isLoading,
    error,
    clearError
  } = useAuthStore();
  
  // 清除错误
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);
  
  // 处理找回密码
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('错误', '请输入您的邮箱');
      return;
    }
    
    const success = await forgotPassword(email);
    if (success) {
      // 发送成功
      setResetSent(true);
    }
  };
  
  // 导航到登录页面
  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };
  
  // 渲染主界面
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部导航栏 */}
        <TabBar showBackButton={true} title="找回密码" />
        
        {/* 找回密码表单 */}
        <View style={styles.formContainer}>
          {resetSent ? (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>密码重置邮件已发送</Text>
              <Text style={styles.successText}>
                我们已向您的邮箱 {email} 发送了一封密码重置邮件，请查收并按照指引操作。
              </Text>
              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={navigateToLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.backToLoginButtonText}>返回登录</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.titleText}>忘记密码</Text>
              <Text style={styles.subtitleText}>请输入您注册时使用的邮箱，我们将向您发送密码重置链接</Text>
              
              {/* 错误提示 */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              {/* 邮箱输入 */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>邮箱</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="请输入您的邮箱"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              {/* 发送重置链接按钮 */}
              <TouchableOpacity
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                onPress={handleForgotPassword}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendButtonText}>发送重置链接</Text>
                )}
              </TouchableOpacity>
              
              {/* 登录链接 */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>想起密码了？</Text>
                <TouchableOpacity onPress={navigateToLogin}>
                  <Text style={styles.loginLink}>返回登录</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FFF3F3',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  backToLoginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  backToLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;