import React from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../../components/TabBar';
import { useAnswerStore } from '../../store/answerStore';

const SignAnswerHomeScreen = () => {
    const navigation = useNavigation();
    const { records, leaderboard } = useAnswerStore();

    const handleNavigate = (screen: string) => {
        // @ts-ignore
        navigation.navigate(screen as never);
    };

    // 获取最近一次答题记录
    const latestRecord = records.length > 0 ? records[0] : null;

    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="答题闯关" />
            
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 答题模块 */}
                <TouchableOpacity
                    style={styles.quizModule}
                    onPress={() => handleNavigate('AnswerQuiz')}
                    activeOpacity={0.8}
                >
                    <View style={styles.quizIconContainer}>
                        <Text style={styles.quizIcon}>📝</Text>
                    </View>
                    <View style={styles.quizContent}>
                        <Text style={styles.quizTitle}>开始答题</Text>
                        <Text style={styles.quizSubtitle}>挑战你的手语知识</Text>
                    </View>
                    <View style={styles.quizArrow}>
                        <Text style={styles.arrowText}>›</Text>
                    </View>
                </TouchableOpacity>

                {/* 答题记录模块 - 最大 */}
                <TouchableOpacity
                    style={styles.recordModule}
                    onPress={() => handleNavigate('AnswerRecords')}
                    activeOpacity={0.8}
                >
                    <View style={styles.recordHeader}>
                        <View style={styles.recordIconContainer}>
                            <Text style={styles.recordIcon}>📊</Text>
                        </View>
                        <View style={styles.recordHeaderText}>
                            <Text style={styles.recordTitle}>答题记录</Text>
                            <Text style={styles.recordSubtitle}>
                                {records.length > 0 ? `共 ${records.length} 条记录` : '暂无记录'}
                            </Text>
                        </View>
                    </View>
                    
                    {latestRecord ? (
                        <View style={styles.latestRecordCard}>
                            <View style={styles.latestRecordRow}>
                                <Text style={styles.latestRecordLabel}>最近一次</Text>
                                <Text style={styles.latestRecordDate}>{latestRecord.date}</Text>
                            </View>
                            <View style={styles.latestRecordStats}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{latestRecord.score}</Text>
                                    <Text style={styles.statLabel}>分数</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{latestRecord.totalQuestions}</Text>
                                    <Text style={styles.statLabel}>题目</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>
                                        {Math.floor(latestRecord.duration / 60)}分{latestRecord.duration % 60}秒
                                    </Text>
                                    <Text style={styles.statLabel}>用时</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyRecordCard}>
                            <Text style={styles.emptyRecordText}>还没有答题记录</Text>
                            <Text style={styles.emptyRecordHint}>开始答题来创建记录吧！</Text>
                        </View>
                    )}
                    
                    <View style={styles.recordFooter}>
                        <Text style={styles.viewAllText}>查看全部 ›</Text>
                    </View>
                </TouchableOpacity>

                {/* 答题排行榜模块 */}
                <TouchableOpacity
                    style={styles.leaderboardModule}
                    onPress={() => handleNavigate('AnswerLeaderboard')}
                    activeOpacity={0.8}
                >
                    <View style={styles.leaderboardHeader}>
                        <View style={styles.leaderboardIconContainer}>
                            <Text style={styles.leaderboardIcon}>🏆</Text>
                        </View>
                        <View style={styles.leaderboardHeaderText}>
                            <Text style={styles.leaderboardTitle}>排行榜</Text>
                            <Text style={styles.leaderboardSubtitle}>看看谁是最强王者</Text>
                        </View>
                    </View>
                    
                    <View style={styles.leaderboardList}>
                        {leaderboard.slice(0, 3).map((item, index) => (
                            <View key={item.id} style={styles.leaderboardItem}>
                                <View style={[
                                    styles.rankBadge,
                                    index === 0 && styles.rankBadgeGold,
                                    index === 1 && styles.rankBadgeSilver,
                                    index === 2 && styles.rankBadgeBronze,
                                ]}>
                                    <Text style={styles.rankText}>{item.rank}</Text>
                                </View>
                                <Text style={styles.leaderboardName}>{item.name}</Text>
                                <View style={styles.leaderboardScore}>
                                    <Text style={styles.leaderboardScoreText}>{item.score}分</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                    
                    <View style={styles.leaderboardFooter}>
                        <Text style={styles.viewAllText}>查看完整排行榜 ›</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    // 答题模块样式
    quizModule: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    quizIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    quizIcon: {
        fontSize: 32,
    },
    quizContent: {
        flex: 1,
    },
    quizTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    quizSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    quizArrow: {
        marginLeft: 8,
    },
    arrowText: {
        fontSize: 24,
        color: '#999',
    },
    // 答题记录模块样式
    recordModule: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        minHeight: 280,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    recordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    recordIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#34C759',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    recordIcon: {
        fontSize: 28,
    },
    recordHeaderText: {
        flex: 1,
    },
    recordTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    recordSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    latestRecordCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    latestRecordRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    latestRecordLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    latestRecordDate: {
        fontSize: 12,
        color: '#999',
    },
    latestRecordStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 12,
    },
    emptyRecordCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyRecordText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    emptyRecordHint: {
        fontSize: 14,
        color: '#999',
    },
    recordFooter: {
        alignItems: 'flex-end',
    },
    // 排行榜模块样式
    leaderboardModule: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    leaderboardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    leaderboardIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FF9500',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    leaderboardIcon: {
        fontSize: 28,
    },
    leaderboardHeaderText: {
        flex: 1,
    },
    leaderboardTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    leaderboardSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    leaderboardList: {
        marginBottom: 16,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 8,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankBadgeGold: {
        backgroundColor: '#FFD700',
    },
    rankBadgeSilver: {
        backgroundColor: '#C0C0C0',
    },
    rankBadgeBronze: {
        backgroundColor: '#CD7F32',
    },
    rankText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    leaderboardName: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    leaderboardScore: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    leaderboardScoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    leaderboardFooter: {
        alignItems: 'flex-end',
    },
    viewAllText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
});

export default SignAnswerHomeScreen;

