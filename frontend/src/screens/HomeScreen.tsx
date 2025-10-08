import { View,StyleSheet,Text,Image,Button,TouchableHighlight } from "react-native";

const HomeScreen = () => {
    return (
        <View style={styles.container}>
            {/* header */}
            <View style={styles.haeader}>
                <Text style={styles.header_title}>SignLink</Text>
            </View>
            {/* body */}
            <View>
                <Text>
                    请选择您要使用的功能
                </Text>
                <TouchableHighlight onPress={() => {}} >
                    <Text>
                        手语翻译
                    </Text>
                </TouchableHighlight>
                <TouchableHighlight onPress={() => {}} >
                        <Text>
                            盲文翻译
                        </Text>
                    </TouchableHighlight>
                </View>

            {/* footer */}
            <View>
                <Text>
                    项目信息
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 30,
    },
    haeader: {
        marginTop: 65,
    },
    header_title: {
        fontSize: 20,
    },
    body: {
        display: 'flex',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
    }
});
export default HomeScreen;