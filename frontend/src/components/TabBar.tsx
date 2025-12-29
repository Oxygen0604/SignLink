import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

interface TabBarProps {
    showBackButton?: boolean;
    backPath?: string;
    title?: string;
    showAuthControls?: boolean;
}

const TabBar = ({ showBackButton = false, backPath, title = 'SignLink', showAuthControls = true }: TabBarProps) => {
    const navigation = useNavigation();
    const { user, isAuthenticated, logout } = useAuthStore();

    const handleBack = () => {
        if (backPath) {
            navigation.navigate(backPath as never);
        } else {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                {showBackButton ? (
                    <TouchableOpacity onPress={handleBack} style={styles.leftContainer}>
                        <Text style={styles.backButtonText}>{'< '}</Text>
                    </TouchableOpacity>
                ) : <View style={styles.leftContainer} /> }
                <View style={styles.titleContainer}>
                    <Text style={styles.header_title}>{title}</Text>
                </View>
                {showAuthControls ? (
                    <View style={styles.rightContainer}>
                        {isAuthenticated && user ? (
                            <TouchableOpacity onPress={logout} style={styles.userContainer}>
                                <Text style={styles.userName}>用户ID: {user.id}</Text>
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
                ) : (
                    <View style={styles.leftContainer} />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        width: '100%',
        backgroundColor: '#F9F9F9',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        width: '100%',
    },
    leftContainer: {
        flex: 1,
    },
    titleContainer: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 10,
    },
    header_title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#222',
    },
    placeholder: {
        width: 40,
    },
    backButtonText: {
        fontSize: 24,
        color: '#222',
    },
    userContainer: {
        padding: 8,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
    },
    authButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    loginText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#007AFF',
    },
    registerBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#007AFF',
        borderRadius: 6,
    },
    registerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default TabBar;
