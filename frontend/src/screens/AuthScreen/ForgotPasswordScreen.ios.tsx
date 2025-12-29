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
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: 输入手机号，2: 输入验证码和新密码
  const [countdown, setCountdown] = useState(0);
  
  // 使用authStore
  const {
    sendVerificationCode,
    resetPassword,
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
  
  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // 发送验证码
  const handleSendCode = async () => {
    if (!phone) {
      Alert.alert('错误', '请输入您的手机号');
      return;
    }
    
    const success = await sendVerificationCode(phone);
    if (success) {
      // 发送成功，开始倒计时并进入下一步
      setCountdown(60);
      setStep(2);
    }
  };
  
  // 重置密码
  const handleResetPassword = async () => {
    // 验证字段
    if (!phone || !code || !newPassword || !confirmPassword) {
      Alert.alert('错误', '请填写所有必填字段');
      return;
    }
    
    // 验证验证码格式
    if (code.length !== 5 || !/^\d+$/.test(code)) {
      Alert.alert('错误', '请输入正确的验证码（5位数字）');
      return;
    }
    
    // 验证密码一致性
    if (newPassword !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }
    
    const success = await resetPassword(phone, code, newPassword);
    if (success) {
      // 重置成功，导航到登录页面
      Alert.alert('成功', '密码重置成功，请使用新密码登录');
      navigation.navigate('Login' as never);
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
        <TabBar showBackButton={true} title="找回密码" showAuthControls={false} />
        
        {/* 找回密码表单 */}
        <View style={styles.formContainer}>
          {/* 错误提示 */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {step === 1 ? (
            // 步骤1：输入手机号
            <>
              <Text style={styles.titleText}>忘记密码</Text>
              <Text style={styles.subtitleText}>请输入您注册时使用的手机号，我们将向您发送验证码</Text>
              
              {/* 手机号输入 */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>手机号</Text>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="请输入您的手机号"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              {/* 发送验证码按钮 */}
              <TouchableOpacity
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                onPress={handleSendCode}
                disabled={isLoading || countdown > 0}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendButtonText}>发送验证码</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // 步骤2：输入验证码和新密码
            <>
              <Text style={styles.titleText}>验证身份</Text>
              <Text style={styles.subtitleText}>请输入收到的验证码和新密码</Text>
              
              {/* 验证码输入 */}
              <View style={styles.inputContainer}>
                <View style={styles.codeContainer}>
                  <TextInput
                    style={[styles.textInput, styles.codeInput]}
                    value={code}
                    onChangeText={setCode}
                    placeholder="请输入验证码"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={5}
                  />
                  <TouchableOpacity
                    style={[styles.codeButton, countdown > 0 && styles.codeButtonDisabled]}
                    onPress={handleSendCode}
                    disabled={countdown > 0 || isLoading}
                  >
                    <Text style={[
                      styles.codeButtonText,
                      countdown > 0 && styles.codeButtonTextDisabled
                    ]}>
                      {countdown > 0 ? `${countdown}s后重发` : '重新发送'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* 新密码输入 */}
              <View style={styles.inputContainer}>
                <View style={styles.passwordLabelContainer}>
                  <Text style={styles.inputLabel}>新密码</Text>
                </View>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="请输入新密码"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* 确认密码输入 */}
              <View style={styles.inputContainer}>
                <View style={styles.passwordLabelContainer}>
                  <Text style={styles.inputLabel}>确认密码</Text>
                </View>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="请再次输入新密码"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* 重置密码按钮 */}
              <TouchableOpacity
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendButtonText}>重置密码</Text>
                )}
              </TouchableOpacity>
            </>
          )}
          
          {/* 登录链接 */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>想起密码了？</Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>返回登录</Text>
            </TouchableOpacity>
          </View>
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
  passwordLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  eyeIconText: {
    fontSize: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeInput: {
    flex: 1,
    marginRight: 12,
  },
  codeButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  codeButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  codeButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  codeButtonTextDisabled: {
    color: '#BDBDBD',
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