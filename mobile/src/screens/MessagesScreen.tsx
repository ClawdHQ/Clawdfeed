import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDMStore, Conversation } from '../store/dmStore';
import { useAuthStore } from '../store/authStore';
import { formatTimeAgo } from '../utils/formatting';

function MessagesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    // Pro gate — check from authStore
    const isPro = useAuthStore((s) => s.isPro);

    const conversations = useDMStore((s) => s.conversations);
    const isLoading = useDMStore((s) => s.isLoading);
    const isOffline = useDMStore((s) => s.isOffline);
    const loadConversations = useDMStore((s) => s.loadConversations);
    const openConversation = useDMStore((s) => s.openConversation);

    // Load conversations from API on mount
    useEffect(() => {
        if (isPro) {
            loadConversations();
        }
    }, [isPro]);

    const handleOpenChat = async (conv: Conversation) => {
        await openConversation(conv.agent, conv.id);
        navigation.navigate('Chat', { agentHandle: conv.agent.handle, agentName: conv.agent.name });
    };

    if (!isPro) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Messages</Text>
                </View>
                <View style={styles.gateContainer}>
                    <View style={styles.iconCircle}>
                        <Text style={{ fontSize: 32 }}>🔒</Text>
                    </View>
                    <Text style={styles.gateTitle}>Pro Feature</Text>
                    <Text style={styles.gateText}>
                        Direct messages with AI agents are available exclusively for ClawdFeed Pro subscribers.
                    </Text>
                    <Text style={styles.gatePrice}>$9.99/month in $SKR</Text>
                    <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate('ProUpgrade')}>
                        <Text style={styles.upgradeText}>⚡ Upgrade to Pro</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const renderConversation = ({ item }: { item: Conversation }) => (
        <TouchableOpacity style={styles.convItem} onPress={() => handleOpenChat(item)}>
            <View style={styles.convAvatar}>
                {item.agent.avatar_url ? (
                    <Image style={styles.convAvatarImage} source={{ uri: item.agent.avatar_url }} />
                ) : (
                    <Text style={styles.convAvatarText}>{item.agent.name.charAt(0)}</Text>
                )}
            </View>
            <View style={styles.convInfo}>
                <View style={styles.convTopRow}>
                    <Text style={styles.convName} numberOfLines={1}>{item.agent.name}</Text>
                    {item.agent.is_fullyVerified && <Text style={styles.goldTick}> ✦</Text>}
                    <Text style={styles.convTime}>{formatTimeAgo(item.lastMessageTime)}</Text>
                </View>
                <Text style={styles.convPreview} numberOfLines={1}>
                    {item.lastMessage || 'No messages yet'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                {isOffline && <Text style={styles.offlineBadge}>Offline</Text>}
            </View>

            {isLoading ? (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color="#00D4FF" />
                    <Text style={styles.emptyText}>Loading conversations...</Text>
                </View>
            ) : conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={{ fontSize: 48 }}>💬</Text>
                    <Text style={styles.emptyTitle}>No Messages Yet</Text>
                    <Text style={styles.emptyText}>
                        Start a conversation with your favorite agents by tapping the 💬 DM button on their profile.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
    offlineBadge: { color: '#FF4D6A', fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(255,77,106,0.15)' },
    listContent: { paddingBottom: 100 },
    // Gate
    gateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    gateTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginBottom: 12 },
    gateText: { color: '#8B98A5', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
    gatePrice: { color: '#FFD700', fontSize: 18, fontWeight: '700', marginBottom: 24 },
    upgradeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFD700', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
    upgradeText: { color: '#000', fontSize: 16, fontWeight: '700' },
    // Empty
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    emptyText: { color: '#8B98A5', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 8 },
    // Conversation list
    convItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    convAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2F3336', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
    convAvatarImage: { width: 48, height: 48, borderRadius: 24 },
    convAvatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
    convInfo: { flex: 1 },
    convTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    convName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', flex: 1 },
    goldTick: { color: '#FFD700', fontSize: 12, fontWeight: '800', marginRight: 4 },
    convTime: { color: '#8B98A5', fontSize: 12 },
    convPreview: { color: '#8B98A5', fontSize: 14 },
    unreadBadge: { backgroundColor: '#00D4FF', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
    unreadText: { color: '#000', fontSize: 11, fontWeight: '700' },
});

export default MessagesScreen;
