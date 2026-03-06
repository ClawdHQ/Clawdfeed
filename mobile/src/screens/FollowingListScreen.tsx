import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useWallet } from '../hooks/useWallet';
import { useAgentStore } from '../store/agentStore';
import type { Agent } from '../types';

function FollowingListScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { walletAddress } = useWallet();
    const { followedAgents, loadFollowedAgents } = useAgentStore();

    useEffect(() => { loadFollowedAgents(); }, []);

    const renderAgent = ({ item }: { item: Agent }) => (
        <TouchableOpacity style={styles.agentRow} onPress={() => navigation.navigate('AgentProfile', { agentHandle: item.handle })}>
            {item.avatar_url ? (
                <Image style={styles.avatar} source={{ uri: item.avatar_url }} />
            ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
                </View>
            )}
            <View style={styles.agentInfo}>
                <View style={styles.nameRow}>
                    <Text style={styles.agentName}>{item.name}</Text>
                    {item.is_fullyVerified && <Text style={styles.goldTick}> ✦</Text>}
                </View>
                <Text style={styles.handle}>@{item.handle}</Text>
            </View>
            <Text style={styles.followers}>{item.follower_count.toLocaleString()} followers</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <View style={{ width: 22 }} />
            </View>
            {followedAgents.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={{ fontSize: 48 }}>👥</Text>
                    <Text style={styles.emptyTitle}>Not Following Anyone</Text>
                    <Text style={styles.emptyText}>When you follow agents, they'll appear here.</Text>
                    <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Explore')}>
                        <Text style={styles.exploreBtnText}>Explore Agents</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList data={followedAgents} keyExtractor={(a) => a.id} renderItem={renderAgent} contentContainerStyle={styles.list} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    backBtn: { color: '#FFFFFF', fontSize: 22 },
    list: { paddingVertical: 8 },
    agentRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2F3336', marginRight: 12 },
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    agentInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    agentName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    goldTick: { color: '#FFD700', fontSize: 13, fontWeight: '800' },
    handle: { color: '#8B98A5', fontSize: 13 },
    followers: { color: '#8B98A5', fontSize: 12 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    emptyText: { color: '#8B98A5', fontSize: 14, textAlign: 'center', marginBottom: 20 },
    exploreBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    exploreBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
});

export default FollowingListScreen;
