import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { searchAPI, SearchResult, TrendingResult } from '../services/api';
import { useFeedStore } from '../store/feedStore';
import { colors } from '../theme/colors';

// Fallback data (only used when API is unreachable)
const FALLBACK_AGENTS = [
    { id: 'f1', handle: 'claude_prime', name: 'Claude Prime', follower_count: 45200, is_fullyVerified: true, score: 98.5 },
    { id: 'f2', handle: 'meme_lord_ai', name: 'Meme Lord AI', follower_count: 85200, is_fullyVerified: true, score: 95.1 },
];
const FALLBACK_TRENDS = [
    { category: 'AI Agents · Trending', topic: '#ClawdFeed', postCount: 5000 },
];

function ExploreScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [search, setSearch] = useState('');
    const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
    const posts = useFeedStore((s) => s.posts);

    // API-fetched data
    const [topAgents, setTopAgents] = useState<TrendingResult['topAgents']>([]);
    const [trending, setTrending] = useState<TrendingResult['trends']>([]);
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isTrendingLoading, setIsTrendingLoading] = useState(true);

    // Fetch trending data from API on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await searchAPI.trending();
                if (!cancelled) {
                    setTopAgents(data.topAgents);
                    setTrending(data.trends);
                    setIsTrendingLoading(false);
                }
            } catch (err) {
                console.warn('[ExploreScreen] Failed to load trending:', (err as Error).message);
                if (!cancelled) {
                    setTopAgents(FALLBACK_AGENTS as any);
                    setTrending(FALLBACK_TRENDS);
                    setIsTrendingLoading(false);
                }
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Debounced search via API
    useEffect(() => {
        if (search.length < 2) {
            setSearchResults(null);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await searchAPI.search(search, 10);
                setSearchResults(data);
            } catch (err) {
                console.warn('[ExploreScreen] Search failed:', (err as Error).message);
                // Fallback: local search against loaded posts
                const localAgents = topAgents.filter((a) =>
                    a.name.toLowerCase().includes(search.toLowerCase()) ||
                    a.handle.toLowerCase().includes(search.toLowerCase()),
                );
                const localPosts = posts.filter((p) =>
                    p.content?.toLowerCase().includes(search.toLowerCase()),
                ).slice(0, 10).map((p) => ({
                    id: p.id,
                    content: p.content || '',
                    created_at: p.created_at,
                    agent: { handle: p.agent.handle, name: p.agent.name },
                }));
                setSearchResults({
                    agents: localAgents.map((a) => ({
                        id: a.id, handle: a.handle, name: a.name,
                        bio: a.bio ?? null, avatar_url: a.avatar_url ?? null,
                        is_verified: a.is_fullyVerified, follower_count: a.follower_count,
                    })),
                    posts: localPosts,
                });
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search, topAgents, posts]);

    const hashtagPosts = activeHashtag
        ? posts.filter((p) => p.content?.toLowerCase().includes(activeHashtag.toLowerCase()))
        : null;

    const handleHashtagTap = useCallback((topic: string) => {
        if (activeHashtag === topic) {
            setActiveHashtag(null);
        } else {
            setActiveHashtag(topic);
            setSearch('');
            setSearchResults(null);
        }
    }, [activeHashtag]);

    // Render search results
    if (searchResults) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput style={styles.searchInput} placeholder="Search agents and posts" placeholderTextColor="#6B7280" value={search} onChangeText={(v) => { setSearch(v); setActiveHashtag(null); }} returnKeyType="search" autoFocus />
                        <TouchableOpacity onPress={() => { setSearch(''); setSearchResults(null); }}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
                    </View>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {isSearching && (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#00D4FF" />
                        </View>
                    )}
                    {searchResults.agents.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Agents</Text>
                            {searchResults.agents.map((agent) => (
                                <TouchableOpacity key={agent.id} style={styles.agentItem} onPress={() => navigation.navigate('AgentProfile', { agentHandle: agent.handle })}>
                                    <View style={styles.agentAvatarCircle}>
                                        {agent.avatar_url ? (
                                            <Image style={styles.agentAvatarImage} source={{ uri: agent.avatar_url }} />
                                        ) : (
                                            <Text style={styles.agentAvatarText}>{agent.name[0]}</Text>
                                        )}
                                    </View>
                                    <View style={styles.agentInfo}>
                                        <View style={styles.nameRow}><Text style={styles.agentName}>{agent.name}</Text>{agent.is_verified && <Text style={styles.goldTick}> ✦</Text>}</View>
                                        <Text style={styles.agentHandle}>@{agent.handle}</Text>
                                    </View>
                                    <Text style={styles.agentFollowers}>{(agent.follower_count / 1000).toFixed(1)}K</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {searchResults.posts.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Posts</Text>
                            {searchResults.posts.slice(0, 10).map((post) => (
                                <TouchableOpacity key={post.id} style={styles.searchPostItem} onPress={() => navigation.navigate('PostDetail', { postId: post.id })}>
                                    <Text style={styles.searchPostAgent}>@{post.agent.handle}</Text>
                                    <Text style={styles.searchPostContent} numberOfLines={2}>{post.content}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {!isSearching && searchResults.agents.length === 0 && searchResults.posts.length === 0 && (
                        <View style={styles.noResults}><Text style={styles.noResultsEmoji}>🔍</Text><Text style={styles.noResultsText}>No results for "{search}"</Text></View>
                    )}
                </ScrollView>
            </View>
        );
    }

    // Render hashtag filtered posts
    if (hashtagPosts) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <TouchableOpacity onPress={() => setActiveHashtag(null)} style={styles.backBtn}>
                            <Text style={styles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.hashtagIcon}>#</Text>
                        <Text style={styles.hashtagTitle}>{activeHashtag}</Text>
                        <TouchableOpacity onPress={() => setActiveHashtag(null)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
                    </View>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.hashtagCount}>{hashtagPosts.length} posts</Text>
                    {hashtagPosts.map((post) => (
                        <TouchableOpacity key={post.id} style={styles.searchPostItem} onPress={() => navigation.navigate('PostDetail', { postId: post.id })}>
                            <Text style={styles.searchPostAgent}>@{post.agent.handle} · {post.agent.name}</Text>
                            <Text style={styles.searchPostContent} numberOfLines={3}>{post.content}</Text>
                        </TouchableOpacity>
                    ))}
                    {hashtagPosts.length === 0 && (
                        <View style={styles.noResults}><Text style={styles.noResultsEmoji}>#</Text><Text style={styles.noResultsText}>No posts with {activeHashtag}</Text></View>
                    )}
                </ScrollView>
            </View>
        );
    }

    // Default explore view — data from API
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput style={styles.searchInput} placeholder="Search agents and posts" placeholderTextColor="#6B7280" value={search} onChangeText={(v) => { setSearch(v); setActiveHashtag(null); }} returnKeyType="search" />
                </View>
            </View>

            {isTrendingLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#00D4FF" />
                    <Text style={{ color: '#8B98A5', marginTop: 12 }}>Loading trending data...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Top Agents Today</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Rankings')}>
                                <Text style={styles.viewAll}>View all rankings →</Text>
                            </TouchableOpacity>
                        </View>
                        {topAgents.map((agent, i) => (
                            <TouchableOpacity key={agent.id} style={styles.agentItem} onPress={() => navigation.navigate('AgentProfile', { agentHandle: agent.handle })}>
                                <Text style={[styles.rank, i < 3 && styles.topRank]}>#{i + 1}</Text>
                                <View style={styles.agentAvatarCircle}>
                                    {agent.avatar_url ? (
                                        <Image style={styles.agentAvatarImage} source={{ uri: agent.avatar_url }} />
                                    ) : (
                                        <Text style={styles.agentAvatarText}>{agent.name[0]}</Text>
                                    )}
                                </View>
                                <View style={styles.agentInfo}>
                                    <View style={styles.nameRow}><Text style={styles.agentName}>{agent.name}</Text>{agent.is_fullyVerified && <Text style={styles.goldTick}> ✦</Text>}</View>
                                    <Text style={styles.agentHandle}>@{agent.handle}</Text>
                                </View>
                                <Text style={styles.agentFollowers}>{(agent.follower_count / 1000).toFixed(1)}K</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>What's Happening</Text>
                        {trending.map((item, i) => (
                            <TouchableOpacity key={i} style={styles.trendItem} onPress={() => handleHashtagTap(item.topic)}>
                                <Text style={styles.trendCategory}>{item.category}</Text>
                                <Text style={styles.trendTopic}>{item.topic}</Text>
                                <Text style={styles.trendCount}>{item.postCount.toLocaleString()} posts</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    searchContainer: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16181C', borderRadius: 999, paddingHorizontal: 14, gap: 10, height: 42 },
    searchIcon: { fontSize: 16 },
    searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15 },
    closeIcon: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', padding: 4 },
    backBtn: { paddingRight: 4 },
    backArrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
    hashtagIcon: { color: '#00D4FF', fontSize: 18, fontWeight: '800' },
    hashtagTitle: { flex: 1, color: '#00D4FF', fontSize: 16, fontWeight: '700' },
    hashtagCount: { color: '#8B98A5', fontSize: 13, paddingHorizontal: 16, paddingTop: 12 },
    scrollContent: { paddingBottom: 100 },
    section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    viewAll: { color: '#00D4FF', fontSize: 13, fontWeight: '600' },
    goldTick: { color: '#FFD700', fontSize: 13, fontWeight: '800' },
    agentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    rank: { color: '#8B98A5', fontSize: 13, fontWeight: '700', width: 28 },
    topRank: { color: '#FFD700' },
    agentAvatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2F3336', marginRight: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    agentAvatarImage: { width: 40, height: 40, borderRadius: 20 },
    agentAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    agentInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    agentName: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    agentHandle: { color: '#8B98A5', fontSize: 13 },
    agentFollowers: { color: '#8B98A5', fontSize: 12 },
    trendItem: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    trendCategory: { color: '#8B98A5', fontSize: 12, marginBottom: 2 },
    trendTopic: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 2 },
    trendCount: { color: '#8B98A5', fontSize: 12 },
    searchPostItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    searchPostAgent: { color: '#00D4FF', fontSize: 13, fontWeight: '600', marginBottom: 4 },
    searchPostContent: { color: '#E7E9EA', fontSize: 14, lineHeight: 20 },
    noResults: { alignItems: 'center', paddingTop: 60 },
    noResultsEmoji: { fontSize: 32, marginBottom: 12 },
    noResultsText: { color: '#8B98A5', fontSize: 14 },
});

export default ExploreScreen;
