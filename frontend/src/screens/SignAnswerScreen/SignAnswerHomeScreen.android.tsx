import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../../components/TabBar';
import { useAuthStore } from '../../store/authStore';

const SignAnswerHomeScreen = () => {
  // 导航引用
  const navigation = useNavigation();
  
  // 使用authStore
  const { user } = useAuthStore();
  
  // 导航到答题页面
  const navigateToAnswerQuiz = () => {
    navigation.navigate('AnswerQuiz' as never);
  };
  
  // 导航到排行榜页面
  const navigateToLeaderboard = () => {
    navigation.navigate('Leaderboard' as never);
  };
  
  // 导航到答题记录页面
  const navigateToAnswerRecords = () => {
    navigation.navigate('AnswerRecords' as never);
  };
  
  // 渲染主界面
  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <TabBar showBackButton={true} title="手语答题" showAuthControls={true} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 欢迎信息 */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>欢迎，{user?.name || '用户'}！</Text>
          <Text style={styles.subtitleText}>挑战手语答题，提升你的手语水平</Text>
        </View>
        
        {/* 功能卡片 */}
        <View style={styles.cardContainer}>
          <TouchableOpacity 
            style={styles.card} 
            onPress={navigateToAnswerQuiz}
          >
            <Text style={styles.cardTitle}>开始答题</Text>
            <Text style={styles.cardDescription}>挑战不同难度的手语题目</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={navigateToLeaderboard}
          >
            <Text style={styles.cardTitle}>排行榜</Text>
            <Text style={styles.cardDescription}>查看全国用户排名</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={navigateToAnswerRecords}
          >
            <Text style={styles.cardTitle}>答题记录</Text>
            <Text style={styles.cardDescription}>查看历史答题成绩</Text>
          </TouchableOpacity>
        </View>
        
        {/* 说明信息 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>如何答题</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1</Text>
            <Text style={styles.infoText}>选择开始答题，进入答题界面</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2</Text>
            <Text style={styles.infoText}>观看手语视频，选择正确答案</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3</Text>
            <Text style={styles.infoText}>答题完成后，查看得分和解析</Text>
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
  welcomeContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    paddingHorizontal: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 12,
    minWidth: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default SignAnswerHomeScreen;