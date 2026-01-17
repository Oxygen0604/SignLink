import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api';

// 定义用户类型
interface User {
  id: string;
  name: string;
  email: string;
}

// 定义认证状态类型
interface AuthState {
  // 状态
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // 方法
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  sendVerificationCode: (email: string) => Promise<boolean>;
  verifyToken: () => Promise<boolean>;
  clearError: () => void;
}

// 创建authStore
export const useAuthStore = create<AuthState>(
  (set) => ({
  // 初始状态
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  
  // 登录方法
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 调用登录API
      const data = await authApi.login(email, password);
      
      // 存储token到AsyncStorage
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      
      // 更新状态
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || '登录失败，请检查邮箱和密码',
        isLoading: false
      });
      return false;
    }
  },
  
  // 注册方法
  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 调用注册API
      const data = await authApi.register(name, email, password);
      
      // 存储token到AsyncStorage
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      
      // 更新状态
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || '注册失败，请稍后重试',
        isLoading: false
      });
      return false;
    }
  },
  
  // 登出方法
  logout: async () => {
    try {      
      // 清除AsyncStorage中的数据
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      
      // 重置状态
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || '登出失败，请稍后重试',
        isLoading: false
      });
    }
  },
  
  // 发送验证码方法
  sendVerificationCode: async (email: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 调用发送验证码API
      await authApi.sendVerificationCode(email);
      
      set({ isLoading: false, error: null });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || '发送验证码失败，请稍后重试',
        isLoading: false
      });
      return false;
    }
  },
  
  // 重置密码方法
  resetPassword: async (email: string, code: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 调用重置密码API
      await authApi.resetPassword(email, code, newPassword);
      
      set({ isLoading: false, error: null });
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message || '重置密码失败，请稍后重试', isLoading: false });
      return false;
    }
  },
  
  // 验证token方法
  verifyToken: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // 从AsyncStorage获取token
      const token = await AsyncStorage.getItem('auth_token');
      
      if (token) {
        // 调用getUserInformation API验证token有效性
        const userInfo = await authApi.getUserInformation();
        
        // 存储用户信息到AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userInfo));
        
        // 更新状态
        set({
          user: userInfo,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return true;
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return false;
      }
    } catch (error: any) {
      // 清除无效的token和用户信息
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.response?.data?.message || error.message || '验证失败，请重新登录'
      });
      return false;
    }
  },
  
  // 清除错误
  clearError: () => set({ error: null })
}));
