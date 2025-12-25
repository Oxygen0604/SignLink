import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../store/authStore";

const Navbar = () => {
    const navigation = useNavigation();
    const { user, isAuthenticated, logout } = useAuthStore();

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
            <View style={styles.rightContainer}>
                {isAuthenticated && user ? (
                    <TouchableOpacity onPress={logout} style={styles.userContainer}>
                        <Text style={styles.userName}>{user.name}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.authButtons}>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Login' as never)} 
                            style={styles.loginBtn}
                        >
                            <Text style={styles.loginText}>登录</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Register' as never)} 
                            style={styles.registerBtn}
                        >
                            <Text style={styles.registerText}>注册</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    navbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 48,
        paddingBottom: 12,
        paddingHorizontal: 18,
        backgroundColor: "#F9F9F9",
    },
    backBtn: {
        padding: 6,
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
    rightContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    userContainer: {
        padding: 8,
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#222",
    },
    authButtons: {
        flexDirection: "row",
        alignItems: "center",
    },
    loginBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 12,
    },
    loginText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#007AFF",
    },
    registerBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: "#007AFF",
        borderRadius: 8,
    },
    registerText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});

export default Navbar;
