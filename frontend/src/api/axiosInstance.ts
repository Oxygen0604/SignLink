import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { HTTP_API_URL } from '@env';

// 创建axios实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: HTTP_API_URL,
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
    });
    
    // 可以在这里添加认证信息，如token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    return config;
  },
  (error) => {
    // 处理请求错误
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 对响应数据做点什么
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    
    // 直接返回响应数据
    return response.data;
  },
  (error) => {
    // 处理响应错误
    console.error('API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    // 可以根据错误状态码进行不同的处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，处理登录过期等情况
          console.error('未授权，请重新登录');
          break;
        case 403:
          // 禁止访问
          console.error('禁止访问该资源');
          break;
        case 404:
          // 资源不存在
          console.error('请求的资源不存在');
          break;
        case 500:
          // 服务器错误
          console.error('服务器内部错误');
          break;
        default:
          console.error(`请求失败，错误码: ${error.response.status}`);
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('网络错误，未收到响应');
    } else {
      // 请求配置错误
      console.error('请求配置错误:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;