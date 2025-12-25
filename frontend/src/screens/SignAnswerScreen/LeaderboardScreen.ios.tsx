import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnswerStore } from '../../store/answerStore';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../../components/TabBar';

const LeaderboardScreen = () => {
    const navigation = useNavigation();
    const { leaderboard } = useAnswerStore();

    // 渲染排行榜项
    const renderLeaderboardItem = ({ item, index }: { item: any; index: number }) => {
        // 根据排名设置不同的背景色
        const getRankBackgroundColor = () => {
            if (item.rank === 1) return '#FFD700'; // 金色 - 第一名
            if (item.rank === 2) return '#C0C0C0'; // 银色 - 第二名
            if (item.rank === 3) return '#CD7F32'; // 铜色 - 第三名
            return '#fff'; // 白色 - 其他名次
        };

        // 根据排名设置不同的文字颜色
        const getRankTextColor = () => {
            if (item.rank <= 3) return '#fff';
            return '#333';
        };

        return (
            <View 
                style={[
                    styles.leaderboardItem,
                    index === 0 && styles.myRankItem,
                    item.rank <= 3 && styles.topRankItem
                ]}
            >
                {/* 排名 */}
                <View 
                    style={[
                        styles.rankContainer,
                        { backgroundColor: getRankBackgroundColor() }
                    ]}
                >
                    <Text 
                        style={[
                            styles.rankNumber,
                            { color: getRankTextColor() }
                        ]}
                    >
                        {item.rank}
                    </Text>
                </View>

                {/* 用户信息 */}
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userScore}>得分: {item.score}</Text>
                </View>

                {/* 分数 */}
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>{item.score}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="答题总榜" />

            <ScrollView style={styles.contentContainer}>
                {/* 排行榜标题 */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>排行榜</Text>
                    <Text style={styles.headerSubtitle}>总共有 {leaderboard.length} 位用户参与答题</Text>
                </View>

                {/* 排行榜列表 */}
                <View style={styles.leaderboardListContainer}>
                    {leaderboard.length > 0 ? (
                        <FlatList
                            data={leaderboard}
                            renderItem={renderLeaderboardItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                            contentContainerStyle={styles.leaderboardList}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>暂无排行榜数据</Text>
                        </View>
                    )}
                </View>

                {/* 排行榜说明 */}
                <View style={styles.leaderboardInfo}>
                    <Text style={styles.infoTitle}>排名说明</Text>
                    <Text style={styles.infoText}>• 排名根据用户的最高得分计算</Text>
                    <Text style={styles.infoText}>• 得分相同的用户排名相同</Text>
                    <Text style={styles.infoText}>• 每周一0点更新排行榜</Text>
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
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    leaderboardListContainer: {
        marginBottom: 24,
    },
    leaderboardList: {
        paddingBottom: 8,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
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
    myRankItem: {
        borderWidth: 2,
        borderColor: '#007AFF',
    },
    topRankItem: {
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    rankContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    rankNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userScore: {
        fontSize: 14,
        color: '#666',
    },
    scoreContainer: {
        alignItems: 'flex-end',
    },
    scoreText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    leaderboardInfo: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
});

export default LeaderboardScreen;