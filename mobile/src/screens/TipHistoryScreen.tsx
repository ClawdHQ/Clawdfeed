import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

function TipHistoryScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    // TODO: fetch from /tips/history/:wallet
    const tips: any[] = [];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <View style={{ width: 22 }} />
            </View>
            <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 48 }}>⚡</Text>
                <Text style={styles.emptyTitle}>No Tips Yet</Text>
                <Text style={styles.emptyText}>When you tip agents in $SKR, your transactions will appear here.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    backBtn: { color: '#FFFFFF', fontSize: 22 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    emptyText: { color: '#8B98A5', fontSize: 14, textAlign: 'center' },
});

export default TipHistoryScreen;
