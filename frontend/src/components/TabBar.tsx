import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface TabBarProps {
    showBackButton?: boolean;
    backPath?: string;
    title?: string;
}

const TabBar = ({ showBackButton = false, backPath, title = 'SignLink' }: TabBarProps) => {
    const navigation = useNavigation();

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
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>{'< '}</Text>
                    </TouchableOpacity>
                ) : <View style={styles.placeholder} /> }
                <Text style={styles.header_title}>{title}</Text>
                <View style={styles.placeholder} />
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
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        width: '100%',
    },
    header_title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#222',
    },
    backButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
    },
    backButtonText: {
        fontSize: 24,
        color: '#222',
    },
    placeholder: {
        width: 40,
    },
});

export default TabBar;
