import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    Image, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert,
} from 'react-native';
import TabBar from '../../components/TabBar';
import CameraComponent from '../../components/CameraComponent';
import { useAnswerStore, useVideoFrameStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import { answerWebSocketManager } from '../../api';

const AnswerQuiz = () => {
    const navigation = useNavigation();
    const cameraRef = useRef<any>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(Date.now());

    const {
        currentQuestion,
        setCurrentQuestion,
        questions,
        setQuestions,
        updateQuestionFeedback,
        currentScore,
        setCurrentScore,
        isCameraActive,
        toggleCamera,
        setSubmitting,
        addRecord,
    } = useAnswerStore();
    
    // 使用 videoFrameStore 管理视频帧捕获
    const { 
        setWebSocketManager, 
        startCapture, 
        stopCapture,
        setCaptureInterval,
        captureFrame
    } = useVideoFrameStore();

    // 初始化组件
    useEffect(() => {
        // 初始化问题列表
        const initialQuestions = [
            { id: '1', image: 'https://via.placeholder.com/300x300?text=Sign+1', name: '你好', correct: false, feedback: '' },
            { id: '2', image: 'https://via.placeholder.com/300x300?text=Sign+2', name: '谢谢', correct: false, feedback: '' },
            { id: '3', image: 'https://via.placeholder.com/300x300?text=Sign+3', name: '再见', correct: false, feedback: '' },
        ];
        setQuestions(initialQuestions);
        setCurrentQuestion(initialQuestions[0]);

        // 直接启动摄像头，权限检查由CameraComponent内部处理
        toggleCamera(true);

        // 延迟连接WebSocket，确保摄像头已经初始化完成
        // 这样即使WebSocket连接失败，用户仍然可以看到摄像头画面
        const connectWebSocket = async () => {
            try {
                // 延迟300ms连接WebSocket，确保摄像头已经初始化
                await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
                
                await answerWebSocketManager.connect();
                
                // 设置WebSocket消息处理
                answerWebSocketManager.onMessage((message) => {
                    handleWebSocketMessage(message);
                });
                
                // WebSocket连接成功后，初始化videoFrameStore
                setWebSocketManager(answerWebSocketManager);
                
                // 设置捕获间隔为500ms
                setCaptureInterval(500);
                
                // 开始捕获视频帧
                startCapture();
            } catch (error) {
                console.error('WebSocket连接失败:', error);
                // WebSocket连接失败不影响摄像头使用
            }
        };

        connectWebSocket();

        // 组件卸载时清理资源
        return () => {
            stopCapture(); // 停止捕获视频帧
            answerWebSocketManager.close(); // 关闭WebSocket连接
            toggleCamera(false); // 组件卸载时关闭摄像头
        };
    }, [setQuestions, setCurrentQuestion, toggleCamera]);

    // 处理WebSocket消息
    const handleWebSocketMessage = (message: any) => {
        if (message.type === 'analysis_result') {
            processAnalysisResult(message.data);
        }
    };

    // 处理分析结果
    const processAnalysisResult = (result: any) => {
        if (!currentQuestion) return;

        const { detected, confidence } = result;
        const isCorrect = detected === currentQuestion.name;
        const feedback = isCorrect 
            ? `回答正确！相似度：${(confidence * 100).toFixed(0)}%` 
            : `回答错误，相似度：${(confidence * 100).toFixed(0)}%。正确答案：${currentQuestion.name}`;

        updateQuestionFeedback(currentQuestion.id, isCorrect, feedback);

        // 更新分数
        if (isCorrect) {
            setCurrentScore(currentScore + 10);
        }

        // 延迟后进入下一题
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => {
                    const newIndex = prev + 1;
                    setCurrentQuestion(questions[newIndex]);
                    return newIndex;
                });
            } else {
                // 完成所有题目
                completeQuiz();
            }
        }, 1500);
    };

    // 处理捕获的视频帧
    const handleFrameCaptured = async (base64Image: string) => {
        // 使用videoFrameStore的captureFrame函数处理帧捕获
        await captureFrame(base64Image, async (image) => {
            // 发送视频帧到服务器进行手语识别
            if (!isAnalyzing && currentQuestion && answerWebSocketManager.isConnected()) {
                answerWebSocketManager.send(JSON.stringify({
                    type: 'detect_sign',
                    data: image,
                    questionId: currentQuestion.id
                }));
            }
        });
    };

    // 拍摄照片并发送到服务器进行分析
    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setSubmitting(true);

        try {
            // 模拟照片分析结果
            const mockResult = {
                detected: currentQuestion?.name,
                confidence: Math.random() > 0.5 ? 0.9 : 0.3
            };
            
            // 模拟延迟
            setTimeout(() => {
                processAnalysisResult(mockResult);
                setIsAnalyzing(false);
                setSubmitting(false);
            }, 1000);
        } catch (error) {
            console.error('分析失败:', error);
            Alert.alert('错误', '分析失败，请重试');
            setIsAnalyzing(false);
            setSubmitting(false);
        }
    };



    // 完成答题
    const completeQuiz = () => {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        
        // 保存答题记录
        const newRecord = {
            id: Date.now().toString(),
            score: currentScore,
            totalQuestions: questions.length,
            duration,
            date: new Date().toISOString().split('T')[0],
        };
        addRecord(newRecord);

        // 显示完成信息
        Alert.alert(
            '答题完成！',
            `你的得分：${currentScore}/${questions.length * 10}\n用时：${Math.floor(duration / 60)}分${duration % 60}秒`,
            [
                {
                    text: '查看记录',
                    onPress: () => {
                        // navigation.navigate('AnswerRecords');
                    },
                },
                {
                    text: '再玩一次',
                    onPress: () => {
                        resetQuiz();
                    },
                },
            ]
        );
    };

    // 重置答题
    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setCurrentScore(0);
        setSessionStartTime(Date.now());
        if (questions.length > 0) {
            setCurrentQuestion(questions[0]);
        }
    };

    // 更新当前问题
    useEffect(() => {
        if (questions.length > 0 && currentQuestionIndex < questions.length) {
            setCurrentQuestion(questions[currentQuestionIndex]);
        }
    }, [currentQuestionIndex]);

    // 移除重复的权限状态检查，由CameraComponent内部处理

    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="手语答题" />

            <View style={styles.contentContainer}>
                {/* 分数显示 */}
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>分数: {currentScore}</Text>
                    <Text style={styles.questionCount}>
                        第 {currentQuestionIndex + 1}/{questions.length} 题
                    </Text>
                </View>

                {/* 图片展示框 */}
                <View style={styles.imageContainer}>
                    {currentQuestion && (
                        <Image
                            source={{ uri: currentQuestion.image }}
                            style={styles.signImage}
                            resizeMode="cover"
                        />
                    )}
                    <View style={styles.imageOverlay}>
                        <Text style={styles.imageOverlayText}>手语示例</Text>
                    </View>
                </View>

                {/* 文字说明 */}
                <View style={styles.textContainer}>
                    <Text style={styles.signName}>
                        {currentQuestion?.name || '加载中...'}
                    </Text>
                    <Text style={styles.instruction}>
                        请模仿上方的手语动作，然后点击下方按钮进行分析
                    </Text>
                </View>

                {/* 摄像头展示框 */}
                <View style={styles.cameraContainer}>
                    <CameraComponent
                    isCameraVisible={isCameraActive}
                    onFrameCaptured={handleFrameCaptured}
                    wsManager={answerWebSocketManager}
                    captureInterval={0} // 使用videoFrameStore控制捕获间隔
                />
                </View>

                {/* 答题反馈区域 */}
                <View style={styles.feedbackContainer}>
                    {currentQuestion?.feedback && (
                        <View 
                            style={[
                                styles.feedbackBox,
                                currentQuestion.correct ? styles.correctFeedback : styles.incorrectFeedback
                            ]}
                        >
                            <Text 
                                style={[
                                    styles.feedbackText,
                                    currentQuestion.correct ? styles.correctText : styles.incorrectText
                                ]}
                            >
                                {currentQuestion.feedback}
                            </Text>
                        </View>
                    )}
                </View>

                {/* 分析按钮 */}
                <TouchableOpacity
                    style={[
                        styles.analyzeButton,
                        isAnalyzing && styles.analyzeButtonDisabled
                    ]}
                    onPress={handleAnalyze}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.analyzeButtonText}>开始分析</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    contentContainer: {
        flex: 1,
        padding: 16,
        paddingBottom: 32,
    },
    scoreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    scoreText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    questionCount: {
        fontSize: 16,
        color: '#666',
    },
    imageContainer: {
        width: '100%',
        height: 250,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    signImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    imageOverlayText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    signName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    instruction: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    cameraContainer: {
        width: '100%',
        height: 250,
        backgroundColor: '#000',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    camera: {
        width: '100%',
        height: '100%',
    },
    cameraOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    cameraText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    feedbackContainer: {
        minHeight: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    feedbackBox: {
        padding: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        borderWidth: 2,
    },
    correctFeedback: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    incorrectFeedback: {
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
    },
    feedbackText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    correctText: {
        color: '#4CAF50',
    },
    incorrectText: {
        color: '#F44336',
    },
    analyzeButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    analyzeButtonDisabled: {
        opacity: 0.7,
    },
    analyzeButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    cameraPlaceholder: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginTop: '50%',
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
});

export default AnswerQuiz;