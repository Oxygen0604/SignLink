import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert, TouchableOpacity, Linking, Platform } from 'react-native';
import { mediaDevices, RTCView } from 'react-native-webrtc';
import { captureFrameFromStream } from '../utils/videoCapture';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface CameraComponentProps {
  isCameraVisible: boolean;
  onFrameCaptured: (base64Image: string) => Promise<void>;
  captureInterval?: number; // 捕获间隔（毫秒），默认300ms
  wsManager?: any; // WebSocket管理器实例
  showControls?: boolean; // 是否显示控制按钮
}

const CameraComponent: React.FC<CameraComponentProps> = memo(({
  isCameraVisible,
  onFrameCaptured,
  captureInterval = 300,
  wsManager,
  showControls = false,
}) => {
  const [localStream, setLocalStream] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // 'user' 前置, 'environment' 后置
  
  // 跟踪启动状态，避免不必要的重渲染
  const isStartingRef = useRef(false);
  
  // 捕获帧的定时器引用
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCapturingRef = useRef(false);
  // RTCView 的引用，用于截图
  const cameraViewRef = useRef<any>(null);
  // 用于跟踪本地流的引用，确保即使在组件卸载时也能访问
  const localStreamRef = useRef<any>(null);
  // 跟踪摄像头是否已经在运行
  const isCameraRunningRef = useRef(false);
  // 跟踪最后捕获时间，避免过于频繁捕获
  const lastCaptureTimeRef = useRef<number>(0);
  // 组件挂载状态
  const isMountedRef = useRef(true);

  // 检查并请求摄像头权限
  const checkAndRequestCameraPermission = useCallback(async () => {
    const permissionType = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
    
    // 首先检查权限
    let permissionResult = await check(permissionType);
    
    // 如果没有权限，请求权限
    if (permissionResult !== RESULTS.GRANTED) {
      permissionResult = await request(permissionType);
    }
    
    return permissionResult;
  }, []);

  // 开始摄像头
  const startCamera = useCallback(async () => {
    // 如果摄像头已经在启动中，避免重复调用
    if (isStartingRef.current) {
      return;
    }
    
    setIsLoading(true);
    isStartingRef.current = true;
    
    try {
      // 确保之前的流已经停止
      if (localStreamRef.current) {
        await stopCamera();
      }
      
      // 检查并请求摄像头权限
      const permissionResult = await checkAndRequestCameraPermission();
      
      if (permissionResult !== RESULTS.GRANTED) {
        Alert.alert(
          "权限错误", 
          "无法获取摄像头权限。请在设置中允许应用访问摄像头。",
          [
            { text: "取消", style: "cancel" },
            { text: "去设置", onPress: () => Linking.openSettings() }
          ]
        );
        setHasPermission(false);
        return;
      }
      
      // 权限已获取，初始化摄像头
      console.log('Starting camera with facingMode:', facingMode);
      const stream = await mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode }, // 使用对象形式，更可靠
          width: { ideal: 480 },
          height: { ideal: 360 },
          frameRate: { ideal: 10 }
        }
      });
      
      // 更新流状态 - 先设置ref，确保useEffect触发时能正确检测到运行状态
      localStreamRef.current = stream;
      isCameraRunningRef.current = true;
      setLocalStream(stream);
      setHasPermission(true);
      
      console.log('Camera started successfully with facingMode:', facingMode);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.message?.includes('permission')) {
        Alert.alert(
          "权限错误", 
          "无法获取摄像头权限。请在设置中允许应用访问摄像头。",
          [
            { text: "取消", style: "cancel" },
            { text: "去设置", onPress: () => Linking.openSettings() }
          ]
        );
      } else {
        Alert.alert("错误", "无法访问摄像头");
      }
      console.error('Camera error:', err);
      setHasPermission(false);
      isCameraRunningRef.current = false;
    } finally {
      setIsLoading(false);
      isStartingRef.current = false;
    }
  }, [checkAndRequestCameraPermission, facingMode]);

  // 开始捕获视频帧
  const startCapture = useCallback(() => {
    if (captureIntervalRef.current || isCapturingRef.current || !localStreamRef.current) {
      return;
    }

    isCapturingRef.current = true;
    setIsCapturing(true);
    
    // 每captureInterval毫秒捕获一帧，加入速率限制
    captureIntervalRef.current = setInterval(async () => {
      if (!localStreamRef.current || !isMountedRef.current) {
        return;
      }

      try {
        const now = Date.now();
        // 确保不会过于频繁捕获
        if (now - lastCaptureTimeRef.current >= captureInterval) {
          lastCaptureTimeRef.current = now;
          // 捕获视频帧（传入视图引用）
          const base64Image = await captureFrameFromStream(localStreamRef.current, cameraViewRef);
          
          if (base64Image && isMountedRef.current) {
            // 调用回调函数处理捕获的帧
            await onFrameCaptured(base64Image);
          }
        }
      } catch (error) {
        console.error('捕获视频帧失败:', error);
      }
    }, Math.max(200, captureInterval / 2)); // 检查频率更高但实际捕获受限制
  }, [onFrameCaptured, cameraViewRef, captureInterval]);

  // 停止捕获视频帧
  const stopCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    isCapturingRef.current = false;
    setIsCapturing(false);
  }, []);

  // 停止摄像头
  const stopCamera = useCallback(async () => {
    // 先检查ref中的流，确保能访问到最新的流
    const streamToStop = localStreamRef.current;
    
    if (streamToStop) {
      try {
        // 停止所有轨道
        const tracks = streamToStop.getTracks();
        for (const track of tracks) {
          if (track.readyState !== 'ended') {
            track.stop();
          }
        }
        
        console.log('Camera stopped successfully, tracks stopped:', tracks.length);
      } catch (error) {
        console.error('Error stopping camera tracks:', error);
      }
    }
    
    // 清空ref和状态
    localStreamRef.current = null;
    setLocalStream(null);
    isCameraRunningRef.current = false;
    
    // 确保捕获也停止
    stopCapture();
  }, [stopCapture]);

  // 初始化WebSocket事件监听
  const initWebSocketListeners = useCallback(() => {
    if (!wsManager) return;

    wsManager.onOpen(() => {
      console.log('WebSocket连接已建立');
      setIsWsConnected(true);
    });

    wsManager.onClose((event: any) => {
      console.log('WebSocket连接已关闭', event.code, event.reason);
      setIsWsConnected(false);
    });

    wsManager.onError((error: any) => {
      console.error('WebSocket错误:', error);
      setIsWsConnected(false);
    });
  }, [wsManager]);

  // 切换前后摄像头
  const toggleCamera = useCallback(async () => {
    // 切换摄像头方向
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // 重新启动摄像头
    if (isCameraRunningRef.current) {
      await stopCamera();
      await startCamera();
    }
  }, [facingMode, stopCamera, startCamera]);
  
  // 手动捕获一帧
  const handleManualCapture = useCallback(async () => {
    if (!localStream || !isWsConnected) return;

    try {
      const base64Image = await captureFrameFromStream(localStream, cameraViewRef);
      if (base64Image) {
        await onFrameCaptured(base64Image);
      }
    } catch (error) {
      console.error('手动捕获帧失败:', error);
      Alert.alert("错误", "捕获图像失败，请重试");
    }
  }, [localStream, isWsConnected, onFrameCaptured, cameraViewRef]);

  // 切换捕获状态
  const toggleCapture = useCallback(() => {
    if (isCapturing) {
      stopCapture();
    } else {
      startCapture();
    }
  }, [isCapturing, startCapture, stopCapture]);

  // 设置组件挂载状态
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // 组件卸载时的清理
      stopCapture();
      
      // 使用ref中的流来停止摄像头，确保即使状态已更新也能清理
      const streamToCleanup = localStreamRef.current;
      if (streamToCleanup) {
        try {
          const tracks = streamToCleanup.getTracks();
          for (const track of tracks) {
            if (track.readyState !== 'ended') {
              track.stop();
            }
          }
          console.log('Cleanup: Camera tracks stopped on unmount');
        } catch (error) {
          console.error('Error during camera cleanup:', error);
        }
      }
      
      // 清空所有引用
      localStreamRef.current = null;
      isCameraRunningRef.current = false;
      
      // 清除捕获定时器
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [stopCapture]);

  // 摄像头可见性变化时的处理
  useEffect(() => {
    const handleCameraVisibility = async () => {
      if (isCameraVisible && isMountedRef.current) {
        await startCamera();
      } else if (isMountedRef.current) {
        stopCapture();
        await stopCamera();
      }
    };
    
    handleCameraVisibility();
  }, [isCameraVisible, startCamera, stopCamera, stopCapture]);

  // 当摄像头准备好且WebSocket连接成功时，开始捕获帧
  useEffect(() => {
    if (localStream && isCameraVisible && isCameraRunningRef.current && isWsConnected && isMountedRef.current) {
      // 延迟一小段时间确保摄像头稳定
      const timer = setTimeout(() => {
        if (isMountedRef.current && localStreamRef.current && isCameraRunningRef.current && isWsConnected) {
          startCapture();
        }
      }, 300);

      return () => {
        clearTimeout(timer);
      };
    }

    return () => {
      stopCapture();
    };
  }, [localStream, isCameraVisible, isWsConnected, startCapture, stopCapture]);

  // 处理WebSocket连接状态变化
  useEffect(() => {
    if (isWsConnected && localStream && isCameraVisible && isCameraRunningRef.current && isMountedRef.current) {
      // WebSocket连接成功，开始捕获
      startCapture();
    } else if (!isWsConnected) {
      // WebSocket连接断开，停止捕获
      stopCapture();
    }
  }, [isWsConnected, localStream, isCameraVisible, startCapture, stopCapture]);

  // 初始化WebSocket
  useEffect(() => {
    initWebSocketListeners();
  }, [initWebSocketListeners]);

  // 权限处理
  if (hasPermission === null && isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在初始化摄像头...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>没有摄像头权限</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={startCamera}
        >
          <Text style={styles.permissionButtonText}>重新请求权限</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>正在启动摄像头...</Text>
            </View>
          ) : localStream ? (
            <View ref={cameraViewRef} style={styles.cameraPreview}>
              <RTCView
                // @ts-ignore
                streamURL={localStream.toURL()}
                style={StyleSheet.absoluteFillObject}
                objectFit="cover"
                mirror={facingMode === 'user'} // 只有前置摄像头镜像
              />
              <View style={styles.cameraOverlay}>
                <Text style={styles.overlayText}>摄像头预览</Text>
                <View style={styles.overlayRight}>
                  {wsManager && (
                    <Text style={[
                      styles.connectionStatus,
                      isWsConnected ? styles.connected : styles.disconnected
                    ]}>
                      {isWsConnected ? '已连接' : '未连接'}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.cameraToggleButton}
                    onPress={toggleCamera}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cameraToggleIcon}>🔄</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>摄像头未启动</Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={startCamera}
          >
            <Text style={styles.startButtonText}>启动摄像头</Text>
          </TouchableOpacity>
        </View>
      )}

      {showControls && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, isCapturing && styles.capturingButton]}
            onPress={toggleCapture}
          >
            <Text style={styles.controlButtonText}>
              {isCapturing ? '停止捕获' : '开始捕获'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleManualCapture}
          >
            <Text style={styles.controlButtonText}>立即捕获</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectionStatus: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 16,
  },
  cameraToggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraToggleIcon: {
    fontSize: 20,
    color: '#fff',
  },
  connected: {
    color: '#4CAF50',
  },
  disconnected: {
    color: '#F44336',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  capturingButton: {
    backgroundColor: '#F44336',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

CameraComponent.displayName = 'CameraComponent';
export default CameraComponent;