import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import TabBar from "../../components/TabBar";

const HomeScreen = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.container}>
            <TabBar />
            {/* body */}
            <View style={styles.body}>
                <Text style={styles.body_title}>
                    请选择您要使用的功能
                </Text>
                <TouchableOpacity style={styles.mainButton} onPress={() => {navigation.navigate('SignHome' as never)}}>
                    <Text style={styles.buttonText}>手语翻译</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mainButton} onPress={() => {}}>
                    <Text style={styles.buttonText}>盲文翻译</Text>
                </TouchableOpacity>
            </View>
            {/* footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>项目信息</Text>
            </View>
        </View>
    );
}

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
    body_title: {
        fontSize: 18,
        color: '#555',
        marginBottom: 32,
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
});
export default HomeScreen;