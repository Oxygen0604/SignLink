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

const AnswerRecordsScreen = () => {
  // 导航引用
  const navigation = useNavigation();
  
  // 使用authStore
  const { isAuthenticated } = useAuthStore();
  
  // 模拟答题记录数据
  const recordsData = [
    { id: '1', date: '2024-01-15', score: 85, questions: 10, correct: 8 },
    { id: '2', date: '2024-01-14', score: 90, questions: 10, correct: 9 },
    { id: '3', date: '2024-01-13', score: 75, questions: 10, correct: 7 },
    { id: '4', date: '2024-01-12', score: 100, questions: 10, correct: 10 },
    { id: '5', date: '2024-01-11', score: 80, questions: 10, correct: 8 },
  ];
  
  // 渲染主界面
  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <TabBar showBackButton={true} title="答题记录" showAuthControls={true} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 标题 */}
        <View style={styles.headerContainer}>
          <Text style={styles.titleText}>我的答题记录</Text>
          <Text style={styles.subtitleText}>查看历史答题成绩和详细信息</Text>
        </View>
        
        {/* 记录列表 */}
        <View style={styles.recordsContainer}>
          {recordsData.map((record) => (
            <View key={record.id} style={styles.recordItem}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>{record.date}</Text>
                <Text style={styles.recordScore}>{record.score} 分</Text>
              </View>
              <View style={styles.recordDetails}>
                <Text style={styles.detailText}>
                  共 {record.questions} 题，答对 {record.correct} 题
                </Text>
              </View>
            </View>
          ))}
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
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
  },
  recordsContainer: {
    paddingHorizontal: 24,
  },
  recordItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recordScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AnswerRecordsScreen;