import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc'; // 假设 react-native-webrtc 已安装
import TabBar from '../../components/TabBar';
import { useRoute } from '@react-navigation/native';

const SignTransScreen = () => {
    const route = useRoute();
    // @ts-ignore
    const { stream } = route.params || {};

    const [translatedText, setTranslatedText] = useState('等待翻译结果...');
    const [videoStream, setVideoStream] = useState(stream || null);

    useEffect(() => {
        if (stream) {
            setVideoStream(stream);
        }
        // TODO: 在此处设置 WebRTC 连接，将本地流发送到后端
        // 1. 创建 RTCPeerConnection
        // 2. 将 `videoStream` 的轨道添加到 PeerConnection
        // 3. 与后端进行信令交换 (offer/answer)
        
        // TODO: 在此处设置 WebSocket 或其他机制来接收翻译文本
        // const socket = new WebSocket('ws://your-backend-ws-url');
        // socket.onmessage = (event) => {
        //     setTranslatedText(event.data);
        // };

        return () => {
            // 清理连接
            // socket.close();
            // peerConnection.close();
        };
    }, [stream]);

    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="翻译中" />
            <View style={styles.videoContainer}>
                {videoStream ? (
                    <RTCView
                        // @ts-ignore
                        streamURL={videoStream.toURL()}
                        style={styles.video}
                        objectFit={'cover'}
                    />
                ) : (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>正在连接视频流...</Text>
                    </View>
                )}
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.translatedText}>{translatedText}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    videoContainer: {
        flex: 3,
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 18,
    },
    textContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    translatedText: {
        fontSize: 22,
        color: '#333',
        fontWeight: '500',
    },
});

export default SignTransScreen;
