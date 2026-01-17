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

const LeaderboardScreen = () => {
  // 导航引用
  const navigation = useNavigation();
  
  // 使用authStore
  const { isAuthenticated } = useAuthStore();
  
  // 模拟排行榜数据
  const leaderboardData = [
    { id: '1', name: '用户1', score: 1000 },
    { id: '2', name: '用户2', score: 950 },
    { id: '3', name: '用户3', score: 900 },
    { id: '4', name: '用户4', score: 850 },
    { id: '5', name: '用户5', score: 800 },
  ];
  
  // 渲染主界面
  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <TabBar showBackButton={true} title="排行榜" showAuthControls={true} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 标题 */}
        <View style={styles.headerContainer}>
          <Text style={styles.titleText}>手语答题排行榜</Text>
          <Text style={styles.subtitleText}>查看全国用户的答题成绩</Text>
        </View>
        
        {/* 排行榜列表 */}
        <View style={styles.leaderboardContainer}>
          {leaderboardData.map((item, index) => (
            <View key={item.id} style={styles.leaderboardItem}>
              <View style={styles.rankContainer}>
                <Text style={[styles.rankText, index < 3 && styles.topRankText]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.userInfoContainer}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userScore}>{item.score} 分</Text>
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
  leaderboardContainer: {
    paddingHorizontal: 24,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  topRankText: {
    color: '#FF6B6B',
  },
  userInfoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userScore: {
    fontSize: 14,
    color: '#666',
  },
});

export default LeaderboardScreen;