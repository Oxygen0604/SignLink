import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../../components/TabBar';
import { useAuthStore } from '../../store/authStore';

const AnswerQuizScreen = () => {
  // 导航引用
  const navigation = useNavigation();
  
  // 状态管理
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // 使用authStore
  const { isAuthenticated } = useAuthStore();
  
  // 模拟题目数据
  const questions = [
    {
      id: '1',
      question: '以下哪个是"你好"的手语表达？',
      options: ['选项A', '选项B', '选项C', '选项D'],
      correctAnswer: '选项B'
    },
    {
      id: '2',
      question: '以下哪个是"谢谢"的手语表达？',
      options: ['选项A', '选项B', '选项C', '选项D'],
      correctAnswer: '选项C'
    },
    {
      id: '3',
      question: '以下哪个是"再见"的手语表达？',
      options: ['选项A', '选项B', '选项C', '选项D'],
      correctAnswer: '选项A'
    },
  ];
  
  // 处理答案选择
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };
  
  // 处理提交答案
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      Alert.alert('提示', '请选择一个答案');
      return;
    }
    
    if (!isAuthenticated) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 模拟API提交
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
      
      // 检查答案是否正确
      if (selectedAnswer === questions[currentQuestion].correctAnswer) {
        setScore(prevScore => prevScore + 1);
      }
      
      // 检查是否完成所有题目
      if (currentQuestion < questions.length - 1) {
        // 进入下一题
        setCurrentQuestion(prevQuestion => prevQuestion + 1);
        setSelectedAnswer(null);
      } else {
        // 完成所有题目
        setQuizCompleted(true);
      }
    } catch (error) {
      console.error('提交答案失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 重新开始答题
  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizCompleted(false);
  };
  
  // 返回首页
  const handleBackToHome = () => {
    navigation.navigate('SignAnswerHome' as never);
  };
  
  // 渲染题目内容
  const renderQuestionContent = () => {
    if (quizCompleted) {
      return (
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>答题完成！</Text>
          <Text style={styles.scoreText}>你的得分：{score}/{questions.length}</Text>
          <Text style={styles.completedText}>
            {score === questions.length 
              ? '恭喜你，全部答对！' 
              : `继续加油，你还有进步空间！`}
          </Text>
          
          <View style={styles.completedButtons}>
            <TouchableOpacity
              style={[styles.button, styles.restartButton]}
              onPress={handleRestartQuiz}
            >
              <Text style={styles.buttonText}>重新答题</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.homeButton]}
              onPress={handleBackToHome}
            >
              <Text style={styles.buttonText}>返回首页</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    const question = questions[currentQuestion];
    
    return (
      <View style={styles.questionContainer}>
        {/* 题目进度 */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            第 {currentQuestion + 1}/{questions.length} 题
          </Text>
        </View>
        
        {/* 题目内容 */}
        <Text style={styles.questionText}>{question.question}</Text>
        
        {/* 选项列表 */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === option && styles.selectedOption,
                isSubmitting && styles.disabledOption
              ]}
              onPress={() => handleAnswerSelect(option)}
              disabled={isSubmitting}
            >
              <Text style={[
                styles.optionText,
                selectedAnswer === option && styles.selectedOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* 提交按钮 */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isSubmitting || !selectedAnswer) && styles.disabledSubmitButton
          ]}
          onPress={handleSubmitAnswer}
          disabled={isSubmitting || !selectedAnswer}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>提交答案</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  // 渲染主界面
  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <TabBar showBackButton={true} title="答题" showAuthControls={true} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 题目内容 */}
        {renderQuestionContent()}
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
  questionContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  progressContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    color: '#666',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 32,
    lineHeight: 28,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionButton: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F0FE',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  submitButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSubmitButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  completedContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 16,
  },
  completedText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  completedButtons: {
    width: '100%',
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
  restartButton: {
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  homeButton: {
    backgroundColor: '#E0E0E0',
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AnswerQuizScreen;