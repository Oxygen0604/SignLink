import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 定义用户类型
interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

// 定义认证状态类型
interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // 方法
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyToken: () => Promise<boolean>;
  clearError: () => void;
}

// 创建authStore
export const useAuthStore = create<AuthState>((set) => ({
  // 初始状态
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  
  // 登录方法
  login: async (email: string, _password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 这里应该调用实际的登录API
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟后端返回的数据
      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockUser = {
        id: '1',
        name: '测试用户',
        email: email,
        role: 'user'
      };
      
      // 存储token到AsyncStorage
      await AsyncStorage.setItem('auth_token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      
      // 更新状态
      set({
        token: mockToken,
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error: any) {
      set({
        error: error.message || '登录失败，请检查邮箱和密码',
        isLoading: false
      });
      return false;
    }
  },
  
  // 注册方法
  register: async (name: string, email: string, _password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 这里应该调用实际的注册API
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟后端返回的数据
      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockUser = {
        id: '1',
        name: name,
        email: email,
        role: 'user'
      };
      
      // 存储token到AsyncStorage
      await AsyncStorage.setItem('auth_token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      
      // 更新状态
      set({
        token: mockToken,
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error: any) {
      set({
        error: error.message || '注册失败，请稍后重试',
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
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        error: error.message || '登出失败，请稍后重试',
        isLoading: false
      });
    }
  },
  
  // 找回密码方法
  forgotPassword: async (_email: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 这里应该调用实际的找回密码API
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set({ isLoading: false, error: null });
      return true;
    } catch (error: any) {
      set({
        error: error.message || '找回密码失败，请稍后重试',
        isLoading: false
      });
      return false;
    }
  },
  
  // 验证token方法
  verifyToken: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // 从AsyncStorage获取token
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return true;
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return false;
      }
    } catch (error: any) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || '验证失败，请重新登录'
      });
      return false;
    }
  },
  
  // 清除错误
  clearError: () => set({ error: null })
}));
