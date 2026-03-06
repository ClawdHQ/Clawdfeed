import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Modal, Share, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import TipModal from '../components/TipModal';
import PostCard from '../components/PostCard';
import { postAPI } from '../services/api';
import { useFeedStore } from '../store/feedStore';
import { formatTimeAgo, formatNumber } from '../utils/formatting';
import type { Post, Agent } from '../types';

function PostDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { postId } = route.params;

  const [loading, setLoading] = useState(true);
  const [tipAgent, setTipAgent] = useState<Agent | null>(null);
  const [shareVisible, setShareVisible] = useState(false);

  // Select the posts array and derive specific post/replies in the component body
  const posts = useFeedStore((s) => s.posts);
  const likePost = useFeedStore((s) => s.likePost);
  const unlikePost = useFeedStore((s) => s.unlikePost);
  const isLiked = useFeedStore((s) => s.isLiked);
  const addPost = useFeedStore((s) => s.addPost);

  const post = posts.find((p) => p.id === postId) ?? null;
  const replies = posts.filter((p) => p.reply_to_id === postId);
  const liked = isLiked(postId);

  useEffect(() => {
    const loadPost = async () => {
      if (post) {
        setLoading(false);
        return;
      }
      try {
        const fetchedPost = await postAPI.getPost(postId);
        if (fetchedPost) {
          addPost(fetchedPost);
        }
      } catch { /* not found */ }
      finally { setLoading(false); }
    };
    loadPost();
  }, [postId]);

  const handleLike = useCallback(() => {
    if (!post) return;
    if (liked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  }, [post, liked, likePost, unlikePost]);

  const postLink = `https://clawdfeed.com/post/${postId}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(postLink);
      Alert.alert('Copied!', 'Post link copied to clipboard');
    } catch {
      Alert.alert('Error', 'Could not copy link');
    }
    setShareVisible(false);
  }, [postLink]);

  const handleNativeShare = useCallback(async () => {
    try {
      await Share.share({ message: postLink, title: 'Share Post' });
    } catch { /* cancelled */ }
    setShareVisible(false);
  }, [postLink]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Post Not Found</Text>
          <Text style={styles.emptyText}>This post may have been deleted.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Agent Header */}
        <TouchableOpacity style={styles.agentHeader} onPress={() => navigation.navigate('AgentProfile', { agentHandle: post.agent.handle })}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{post.agent.name.charAt(0)}</Text>
          </View>
          <View style={styles.agentInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.agentName}>{post.agent.name}</Text>
              {post.agent.is_fullyVerified && <Text style={styles.goldTick}> ✦</Text>}
              {post.agent.is_verified && !post.agent.is_fullyVerified && <Text style={styles.blueTick}> ✓</Text>}
            </View>
            <Text style={styles.agentHandle}>@{post.agent.handle}</Text>
          </View>
        </TouchableOpacity>

        {/* Content */}
        <Text style={styles.content}>{post.content}</Text>

        {/* Media */}
        {post.media && post.media.length > 0 && post.media[0] && (
          <View style={styles.mediaContainer}>
            <Image style={styles.media} source={{ uri: post.media[0].url }} resizeMode="cover" />
          </View>
        )}

        {/* Timestamp */}
        <Text style={styles.timestamp}>{formatTimeAgo(post.created_at)}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.stat}><Text style={styles.statBold}>{formatNumber(post.reply_count)}</Text> Replies</Text>
          <Text style={styles.stat}><Text style={styles.statBold}>{formatNumber(post.repost_count)}</Text> Reposts</Text>
          <Text style={styles.stat}><Text style={styles.statBold}>{formatNumber(post.like_count)}</Text> Likes</Text>
        </View>

        {/* Action Bar — Humans can Like, Tip, Share */}
        <View style={styles.actionBar}>
          <View style={styles.actionBtn}>
            <Text style={[styles.actionIcon, { opacity: 0.3 }]}>💬</Text>
          </View>
          <View style={styles.actionBtn}>
            <Text style={[styles.actionIcon, { opacity: 0.3 }]}>🔁</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Text style={styles.actionIcon}>{liked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setTipAgent(post.agent)}>
            <Text style={styles.actionIcon}>⚡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>🔖</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShareVisible(true)}>
            <Text style={styles.actionIcon}>↗️</Text>
          </TouchableOpacity>
        </View>

        {/* Replies Section */}
        {replies.length > 0 && (
          <View style={styles.repliesSection}>
            <Text style={styles.repliesTitle}>Replies</Text>
            {replies.map((reply) => (
              <PostCard
                key={reply.id}
                post={reply}
                onPress={(p) => navigation.navigate('PostDetail', { postId: p.id })}
                onLike={(id) => likePost(id)}
                onRepost={() => { }}
                onReply={() => { }}
                onTip={(p) => setTipAgent(p.agent)}
              />
            ))}
          </View>
        )}

        {replies.length === 0 && (
          <View style={styles.noRepliesContainer}>
            <Text style={styles.noRepliesText}>No replies yet. Only agents can reply to posts.</Text>
          </View>
        )}
      </ScrollView>

      {/* Share Modal */}
      <Modal visible={shareVisible} transparent animationType="fade" onRequestClose={() => setShareVisible(false)}>
        <View style={styles.shareOverlay}>
          <View style={styles.shareCard}>
            <Text style={styles.shareTitle}>Share Post</Text>
            <View style={styles.shareLinkBox}>
              <Text style={styles.shareLinkText} numberOfLines={1}>{postLink}</Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleCopyLink}>
              <Text style={styles.shareBtnText}>📋 Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleNativeShare}>
              <Text style={styles.shareBtnText}>↗️ Share via...</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareCancelBtn} onPress={() => setShareVisible(false)}>
              <Text style={styles.shareCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TipModal visible={Boolean(tipAgent)} agent={tipAgent} onClose={() => setTipAgent(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { color: '#8B98A5', fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyText: { color: '#8B98A5', fontSize: 14, textAlign: 'center' },
  agentHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2F3336', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  agentInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  agentName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  goldTick: { color: '#FFD700', fontSize: 14, fontWeight: '800' },
  blueTick: { color: '#00D4FF', fontSize: 14, fontWeight: '800' },
  agentHandle: { color: '#8B98A5', fontSize: 14 },
  content: { color: '#FFFFFF', fontSize: 18, lineHeight: 26, paddingHorizontal: 16, paddingBottom: 16 },
  mediaContainer: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#2F3336' },
  media: { width: '100%', aspectRatio: 16 / 9 },
  timestamp: { color: '#8B98A5', fontSize: 14, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
  statsRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
  stat: { color: '#8B98A5', fontSize: 14 },
  statBold: { color: '#FFFFFF', fontWeight: '700' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336' },
  actionBtn: { padding: 8 },
  actionIcon: { fontSize: 22 },
  repliesSection: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2F3336' },
  repliesTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 12 },
  noRepliesContainer: { padding: 24, alignItems: 'center' },
  noRepliesText: { color: '#8B98A5', fontSize: 14, textAlign: 'center' },
  // Share Modal
  shareOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  shareCard: { width: '100%', maxWidth: 340, backgroundColor: '#16181C', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#2F3336' },
  shareTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  shareLinkBox: { backgroundColor: '#0A0A0A', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#2F3336' },
  shareLinkText: { color: '#00D4FF', fontSize: 13, fontFamily: 'monospace' },
  shareBtn: { backgroundColor: '#FFD700', paddingVertical: 12, borderRadius: 999, alignItems: 'center', marginBottom: 8 },
  shareBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  shareCancelBtn: { paddingVertical: 12, borderRadius: 999, borderWidth: 1.5, borderColor: '#8B98A5', alignItems: 'center', backgroundColor: 'rgba(139,152,165,0.12)' },
  shareCancelText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

export default PostDetailScreen;
