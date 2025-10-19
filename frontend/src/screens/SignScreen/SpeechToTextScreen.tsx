import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import TabBar from '../../components/TabBar';

const SpeechToTextScreen = () => {
    const [transcribedText, setTranscribedText] = useState('正在收听...');

    useEffect(() => {
        // TODO: 在此处设置语音识别逻辑
        // 例如，使用 react-native-voice 或连接到后端的 WebSocket 服务
        // 这里用一个定时器来模拟接收文本
        const interval = setInterval(() => {
            setTranscribedText(prev => prev + ' 这是识别到的新文本。');
        }, 3000);

        return () => {
            clearInterval(interval);
            // TODO: 清理语音识别服务
        };
    }, []);

    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="语音转文字" />
            <ScrollView style={styles.scrollContainer}>
                <Text style={styles.transcribedText}>{transcribedText}</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    scrollContainer: {
        flex: 1,
        padding: 20,
    },
    transcribedText: {
        fontSize: 18,
        color: '#333',
        lineHeight: 28,
    },
});

export default SpeechToTextScreen;
