import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnswerStore } from '../../store/answerStore';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../../components/TabBar';

const AnswerRecordsScreen = () => {
    const navigation = useNavigation();
    const { records, leaderboard } = useAnswerStore();

    // 计算统计信息
    const totalRecords = records.length;
    const totalQuestions = records.reduce((sum, record) => sum + record.totalQuestions, 0);
    const totalScore = records.reduce((sum, record) => sum + record.score, 0);
    const averageScore = totalRecords > 0 ? Math.round(totalScore / totalRecords) : 0;
    const totalCorrect = records.reduce((sum, record) => sum + Math.round((record.score / 10)), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const averageDuration = totalRecords > 0 ? Math.round(records.reduce((sum, record) => sum + record.duration, 0) / totalRecords) : 0;

    // 格式化时间
    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}分${remainingSeconds}秒`;
    };

    // 个人排名
    const userRank = leaderboard.length > 0 ? leaderboard[0].rank : 0;
    const userScore = leaderboard.length > 0 ? leaderboard[0].score : 0;

    // 渲染答题记录项
    const renderRecordItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.recordItem}>
            <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>{item.date}</Text>
                <Text style={[styles.recordScore, item.score >= item.totalQuestions * 7 ? styles.highScore : styles.lowScore]}>
                    {item.score}/{item.totalQuestions * 10}
                </Text>
            </View>
            <View style={styles.recordDetails}>
                <Text style={styles.recordDetailText}>题目数: {item.totalQuestions}</Text>
                <Text style={styles.recordDetailText}>用时: {formatDuration(item.duration)}</Text>
                <Text style={styles.recordDetailText}>
                    正确率: {Math.round((item.score / (item.totalQuestions * 10)) * 100)}%
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="答题记录" />

            <ScrollView style={styles.contentContainer}>
                {/* 统计信息卡片 */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>我的统计</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{totalRecords}</Text>
                            <Text style={styles.statLabel}>总答题次数</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{averageScore}</Text>
                            <Text style={styles.statLabel}>平均得分</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{accuracy}%</Text>
                            <Text style={styles.statLabel}>正确率</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{averageDuration}s</Text>
                            <Text style={styles.statLabel}>平均用时</Text>
                        </View>
                    </View>
                </View>

                {/* 个人排名卡片 */}
                <View style={styles.rankContainer}>
                    <Text style={styles.sectionTitle}>我的排名</Text>
                    <View style={styles.rankCard}>
                        <View style={styles.rankIcon}>
                            <Text style={styles.rankNumber}>{userRank}</Text>
                        </View>
                        <View style={styles.rankInfo}>
                            <Text style={styles.rankTitle}>当前排名</Text>
                            <Text style={styles.rankScore}>最高得分: {userScore}</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.viewLeaderboardButton}
                            onPress={() => navigation.navigate('Leaderboard' as never)}
                        >
                            <Text style={styles.viewLeaderboardText}>查看总榜</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 答题记录列表 */}
                <View style={styles.recordsListContainer}>
                    <Text style={styles.sectionTitle}>答题记录</Text>
                    {totalRecords > 0 ? (
                        <FlatList
                            data={records}
                            renderItem={renderRecordItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>暂无答题记录</Text>
                            <TouchableOpacity 
                                style={styles.startButton}
                                onPress={() => navigation.navigate('AnswerGame' as never)}
                            >
                                <Text style={styles.startButtonText}>开始答题</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
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
    statsContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    rankContainer: {
        marginBottom: 24,
    },
    rankCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rankNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    rankInfo: {
        flex: 1,
    },
    rankTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    rankScore: {
        fontSize: 14,
        color: '#666',
    },
    viewLeaderboardButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    viewLeaderboardText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    recordsListContainer: {
        marginBottom: 24,
    },
    recordItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        fontWeight: 'bold',
        color: '#333',
    },
    recordScore: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    highScore: {
        color: '#4CAF50',
        backgroundColor: '#E8F5E9',
    },
    lowScore: {
        color: '#F44336',
        backgroundColor: '#FFEBEE',
    },
    recordDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    recordDetailText: {
        fontSize: 14,
        color: '#666',
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    startButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AnswerRecordsScreen;