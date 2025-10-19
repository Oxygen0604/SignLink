import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import BackSvg from "../../assets/back.svg"; // 修正路径

const Navbar = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.navbar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                {/* SVG 返回箭头 */}
                {/* <BackSvg width={24} height={24} /> */}
            </TouchableOpacity>
            <View style={styles.logoBox}>
                {/* <Image
                    source={require("../../assets/signlink_logo.png")}
                    style={{ width: 32, height: 32, marginRight: 8 }}
                    resizeMode="contain"
                /> */}
                <Text style={styles.logoText}>SignLink</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    navbar: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 48,
        paddingBottom: 12,
        paddingHorizontal: 18,
        backgroundColor: "#F9F9F9",
    },
    backBtn: {
        padding: 6,
        marginRight: 12,
    },
    logoBox: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoText: {
        fontSize: 24,
        fontWeight: "700",
        color: "#222",
        letterSpacing: 1,
    },
});

export default Navbar;
