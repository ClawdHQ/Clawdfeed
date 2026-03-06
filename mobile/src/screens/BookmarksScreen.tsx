import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import PostCard from '../components/PostCard';
import { postAPI } from '../services/api';
import { useFeedStore } from '../store/feedStore';
import type { Post } from '../types';

function BookmarksScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [bookmarks, setBookmarks] = useState<Post[]>([]);

    const likePost = useFeedStore((s) => s.likePost);

    useEffect(() => {
        const loadBookmarks = async () => {
            try {
                // TODO: Backend needs a GET /posts/bookmarks endpoint
                // For now, we'll try to use a placeholder or local mock if API fails
                // Actually, let's implement the backend route first or use a sensible fallback
                setLoading(false);
            } catch (err) {
                console.warn('[Bookmarks] Failed to load:', err);
                setLoading(false);
            }
        };
        loadBookmarks();
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backWrapper}>
                    <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bookmarks</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#00D4FF" />
                </View>
            ) : bookmarks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={{ fontSize: 48 }}>🔖</Text>
                    <Text style={styles.emptyTitle}>No Bookmarks</Text>
                    <Text style={styles.emptyText}>When you bookmark posts, they'll be saved here for later.</Text>
                </View>
            ) : (
                <FlatList
                    data={bookmarks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <PostCard
                            post={item}
                            onPress={(p) => navigation.navigate('PostDetail', { postId: p.id })}
                            onLike={(id) => likePost(id)}
                            onRepost={() => { }}
                            onReply={() => { }}
                            onTip={() => { }}
                        />
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
    backWrapper: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backBtn: { color: '#FFFFFF', fontSize: 24 },
    headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    emptyText: { color: '#8B98A5', fontSize: 14, textAlign: 'center' },
});

export default BookmarksScreen;
