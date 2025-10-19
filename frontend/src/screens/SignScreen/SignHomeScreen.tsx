import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, TextInput, Alert, PermissionsAndroid, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../../components/TabBar';
import { mediaDevices } from 'react-native-webrtc';

const SignHomeScreen = () => {
    const navigation = useNavigation();
    const [micModalVisible, setMicModalVisible] = useState(false);
    const [camModalVisible, setCamModalVisible] = useState(false);
    const [displayModalVisible, setDisplayModalVisible] = useState(false);
    const [micIP, setMicIP] = useState('');
    const [camIP, setCamIP] = useState('');
    const [connectedMic, setConnectedMic] = useState('未连接');
    const [connectedCam, setConnectedCam] = useState('未连接');
    const [localStream, setLocalStream] = useState<any>(null);

    const requestMicrophonePermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: "麦克风权限",
                        message: "应用需要访问您的麦克风",
                        buttonNeutral: "稍后询问",
                        buttonNegative: "取消",
                        buttonPositive: "确定"
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "摄像头权限",
                        message: "应用需要访问您的摄像头",
                        buttonNeutral: "稍后询问",
                        buttonNegative: "取消",
                        buttonPositive: "确定"
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const connectMicrophone = async () => {
        if (micIP) {
            // TODO: 连接麦克风的逻辑，这里仅更新显示
            setConnectedMic(micIP);
        } else {
            const hasPermission = await requestMicrophonePermission();
            if (!hasPermission) {
                Alert.alert("权限错误", "无法获取麦克风权限");
                setMicModalVisible(false);
                return;
            }
            try {
                const stream = await mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                });
                setLocalStream((prevStream: any) => {
                    if (prevStream) {
                        stream.getAudioTracks().forEach(track => prevStream.addTrack(track));
                        return prevStream;
                    }
                    return stream;
                });
                setConnectedMic('默认麦克风');
            } catch (err) {
                Alert.alert("错误", "无法访问麦克风");
                console.error(err);
            }
        }
        setMicModalVisible(false);
    };

    const connectCamera = async () => {
        if (camIP) {
            // TODO: 连接摄像头的逻辑，这里仅更新显示
            setConnectedCam(camIP);
        } else {
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) {
                Alert.alert("权限错误", "无法获取摄像头权限");
                setCamModalVisible(false);
                return;
            }
            try {
                const stream = await mediaDevices.getUserMedia({
                    audio: false,
                    video: true
                });
                setLocalStream((prevStream: any) => {
                    if (prevStream) {
                        stream.getVideoTracks().forEach(track => prevStream.addTrack(track));
                        return prevStream;
                    }
                    return stream;
                });
                setConnectedCam('默认摄像头');
            } catch (err) {
                Alert.alert("错误", "无法访问摄像头");
                console.error(err);
            }
        }
        setCamModalVisible(false);
    };

    const startTranslation = () => {
        if (connectedCam === '未连接') {
            Alert.alert("提示", "请先连接摄像头");
            return;
        }
        // @ts-ignore
        navigation.navigate('SignTrans', { stream: localStream });
    }

    const setupDisplay = (primary: string, secondary: string | null) => {
        // 主屏幕导航
        if (primary === 'SignTrans') {
            startTranslation();
        } else {
            navigation.navigate(primary as never);
        }

        // TODO: 处理外部显示器
        // 你需要一个原生模块来管理外部显示器, e.g., 'react-native-external-display'
        // ExternalDisplay.setScreen(secondary);
        if (secondary) {
            Alert.alert("外部显示器", `已设置为显示 ${secondary === 'SignTrans' ? '手语翻译' : '语音转文字'} 页面。\n(需要原生模块实现)`);
        }
        
        setDisplayModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <TabBar showBackButton={true} title="手语翻译" />

            {/* body */}
            <View style={styles.body}>
                <TouchableOpacity style={styles.mainButton} onPress={() => setMicModalVisible(true)}>
                    <Text style={styles.buttonText}>连接麦克风</Text>
                </TouchableOpacity>
                <Text>已连接: {connectedMic}</Text>

                <TouchableOpacity style={styles.mainButton} onPress={() => setCamModalVisible(true)}>
                    <Text style={styles.buttonText}>连接摄像头</Text>
                </TouchableOpacity>
                <Text>已连接: {connectedCam}</Text>

                <TouchableOpacity style={styles.mainButton} onPress={() => setDisplayModalVisible(true)}>
                    <Text style={styles.buttonText}>设置显示器</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.mainButton} onPress={startTranslation}>
                    <Text style={styles.buttonText}>开始翻译</Text>
                </TouchableOpacity>
            </View>

            {/* footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>项目信息</Text>
            </View>

            {/* Microphone IP Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={micModalVisible}
                onRequestClose={() => {
                    setMicModalVisible(!micModalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>请输入麦克风 IP 地址:</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={setMicIP}
                            value={micIP}
                            placeholder="192.168.1.1"
                            keyboardType="numeric"
                        />
                        <TouchableOpacity style={styles.modalButton} onPress={connectMicrophone}>
                            <Text style={styles.buttonText}>连接</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, {backgroundColor: '#007AFF'}]}
                            onPress={connectMicrophone}
                        >
                            <Text style={styles.buttonText}>使用默认设备</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.buttonClose]}
                            onPress={() => setMicModalVisible(!micModalVisible)}
                        >
                            <Text style={styles.textStyle}>取消</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Camera IP Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={camModalVisible}
                onRequestClose={() => {
                    setCamModalVisible(!camModalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>请输入摄像头 IP 地址:</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={setCamIP}
                            value={camIP}
                            placeholder="192.168.1.2"
                            keyboardType="numeric"
                        />
                        <TouchableOpacity style={styles.modalButton} onPress={connectCamera}>
                            <Text style={styles.buttonText}>连接</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, {backgroundColor: '#007AFF'}]}
                            onPress={connectCamera}
                        >
                            <Text style={styles.buttonText}>使用默认设备</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.buttonClose]}
                            onPress={() => setCamModalVisible(!camModalVisible)}
                        >
                            <Text style={styles.textStyle}>取消</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Display Setup Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={displayModalVisible}
                onRequestClose={() => setDisplayModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>设置主屏幕（手机）</Text>
                        <TouchableOpacity style={styles.modalButton} onPress={() => setupDisplay('SignTrans', 'SpeechToText')}>
                            <Text style={styles.buttonText}>显示手语翻译</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={() => setupDisplay('SpeechToText', 'SignTrans')}>
                            <Text style={styles.buttonText}>显示语音转文字</Text>
                        </TouchableOpacity>

                        <Text style={[styles.modalText, {marginTop: 20}]}>仅使用主屏幕</Text>
                        <TouchableOpacity style={styles.modalButton} onPress={() => setupDisplay('SignTrans', null)}>
                            <Text style={styles.buttonText}>仅手语翻译</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={() => setupDisplay('SpeechToText', null)}>
                            <Text style={styles.buttonText}>仅语音转文字</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.buttonClose, {marginTop: 20}]}
                            onPress={() => setDisplayModalVisible(false)}
                        >
                            <Text style={styles.textStyle}>取消</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    header: {
        marginTop: 65,
        alignItems: 'center',
    },
    header_title: {
        fontSize: 32,
        fontWeight: '600',
        color: '#222',
        letterSpacing: 1,
    },
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    mainButton: {
        width: 260,
        height: 56,
        backgroundColor: '#007AFF',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '500',
        letterSpacing: 1,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 30,
    },
    footerText: {
        color: '#888',
        fontSize: 14,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalButton: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        backgroundColor: '#007AFF',
        marginVertical: 5,
        width: 150,
        alignItems: 'center',
    },
    buttonClose: {
        backgroundColor: '#888',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 16,
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        width: 200,
    },
});

export default SignHomeScreen;
