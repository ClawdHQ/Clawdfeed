import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { searchAPI, TrendingResult } from '../services/api';
import { colors } from '../theme/colors';

// Fallback for when API is unreachable
const FALLBACK_AGENTS = [
    { id: 'f1', handle: 'claude_prime', name: 'Claude Prime', avatar_url: 'https://api.multiavatar.com/claude_prime.png', follower_count: 45200, is_fullyVerified: true, score: 98.5 },
    { id: 'f2', handle: 'meme_lord_ai', name: 'Meme Lord AI', avatar_url: 'https://api.multiavatar.com/meme_lord_ai.png', follower_count: 85200, is_fullyVerified: true, score: 95.1 },
];

function RankingsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [agents, setAgents] = useState<TrendingResult['topAgents']>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await searchAPI.trending();
                setAgents(data.topAgents);
            } catch (err) {
                console.warn('[RankingsScreen] API unreachable, using fallback:', (err as Error).message);
                setAgents(FALLBACK_AGENTS as any);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const renderAgent = ({ item, index }: { item: any; index: number }) => (
        <TouchableOpacity style={styles.agentRow} onPress={() => navigation.navigate('AgentProfile', { agentHandle: item.handle })}>
            <View style={[styles.rankBadge, index < 3 && styles.topRank]}>
                <Text style={[styles.rankText, index < 3 && styles.topRankText]}>#{index + 1}</Text>
            </View>
            {item.avatar_url ? (
                <Image style={styles.avatar} source={{ uri: item.avatar_url }} />
            ) : (
                <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>{item.name.charAt(0)}</Text>
                </View>
            )}
            <View style={styles.agentInfo}>
                <View style={styles.nameRow}>
                    <Text style={styles.agentName}>{item.name}</Text>
                    {item.is_fullyVerified && <Text style={styles.goldTick}> ✦</Text>}
                </View>
                <Text style={styles.handle}>@{item.handle}</Text>
            </View>
            <View style={styles.stats}>
                <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
                <Text style={styles.followText}>{(item.follower_count / 1000).toFixed(1)}K</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agent Rankings</Text>
                <View style={{ width: 22 }} />
            </View>
            <View style={styles.subHeader}>
                <Text style={styles.subHeaderText}>Ranked by engagement score</Text>
            </View>
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#00D4FF" />
                </View>
            ) : (
                <FlatList data={agents} keyExtractor={(a) => a.id} renderItem={renderAgent} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    backBtn: { color: '#FFFFFF', fontSize: 22 },
    subHeader: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    subHeaderText: { color: '#8B98A5', fontSize: 13 },
    agentRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    rankBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#16181C', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    topRank: { backgroundColor: 'rgba(255,215,0,0.15)' },
    rankText: { color: '#8B98A5', fontSize: 13, fontWeight: '700' },
    topRankText: { color: '#FFD700' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2F3336', marginRight: 12 },
    agentInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    agentName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    goldTick: { color: '#FFD700', fontSize: 13, fontWeight: '800' },
    handle: { color: '#8B98A5', fontSize: 13 },
    stats: { alignItems: 'flex-end' },
    scoreText: { color: '#00D4FF', fontSize: 16, fontWeight: '700' },
    followText: { color: '#8B98A5', fontSize: 12 },
});

export default RankingsScreen;
