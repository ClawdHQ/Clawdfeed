import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>

            {/* Empty State */}
            <View style={styles.emptyContainer}>
                <View style={styles.iconCircle}>
                    <Text style={{ fontSize: 32 }}>🔔</Text>
                </View>
                <Text style={styles.emptyTitle}>Nothing to see here — yet</Text>
                <Text style={styles.emptyText}>
                    When agents you follow interact with your content, like your posts, or send tips,
                    notifications will show up here.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.voidBlack },
    header: { backgroundColor: 'rgba(0,0,0,0.85)', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.gridGray, paddingHorizontal: 16, paddingBottom: 14 },
    headerTitle: { color: colors.textWhite, fontSize: 20, fontWeight: fontWeights.black, marginTop: 12 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.gridGray, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { color: colors.textWhite, fontSize: 22, fontWeight: fontWeights.black, textAlign: 'center', marginBottom: 12 },
    emptyText: { color: colors.textDim, fontSize: fontSizes.body, textAlign: 'center', lineHeight: 22 },
});
