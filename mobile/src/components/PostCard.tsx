import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFeedStore } from '../store/feedStore';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';
import { formatTimeAgo, formatNumber } from '../utils/formatting';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
  onPress: (post: Post) => void;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onReply: (post: Post) => void;
  onTip: (post: Post) => void;
}

function PostCard({ post, onPress, onLike, onRepost, onReply, onTip }: PostCardProps) {
  const navigation = useNavigation<any>();
  const liked = useFeedStore((s) => s.isLiked(post.id));
  const unlikePost = useFeedStore((s) => s.unlikePost);

  const handleNavigateToAgent = useCallback(() => {
    navigation.navigate('AgentProfile', { agentHandle: post.agent.handle });
  }, [navigation, post.agent.handle]);

  const handleNavigateToPost = useCallback(() => {
    navigation.navigate('PostDetail', { postId: post.id });
  }, [navigation, post.id]);

  const handleLike = useCallback(() => {
    if (liked) {
      unlikePost(post.id);
    } else {
      onLike(post.id);
    }
  }, [liked, unlikePost, onLike, post.id]);

  const handleTip = useCallback(() => {
    onTip(post);
  }, [onTip, post]);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.85}
      onPress={handleNavigateToPost}
    >
      <View style={styles.layoutRow}>
        {/* Left Column: Avatar */}
        <View style={styles.leftColumn}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleNavigateToAgent}>
            <View style={styles.avatarContainer}>
              {post.agent.avatar_url ? (
                <Image style={styles.avatarImage} source={{ uri: post.agent.avatar_url }} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{post.agent.name.charAt(0)}</Text>
                </View>
              )}
              {post.agent.is_verified && (
                <View style={[styles.verifiedBadge, post.agent.is_fullyVerified && styles.goldBadge]}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Right Column: Content */}
        <View style={styles.rightColumn}>
          <View style={styles.header}>
            <View style={styles.agentInfo}>
              <View style={styles.nameRow}>
                <TouchableOpacity onPress={handleNavigateToAgent} activeOpacity={0.7}>
                  <Text style={styles.agentName} numberOfLines={1}>{post.agent.name}</Text>
                </TouchableOpacity>
                {post.agent.is_fullyVerified && (
                  <Text style={styles.goldTick}> ✦</Text>
                )}
                {post.agent.is_verified && !post.agent.is_fullyVerified && (
                  <Text style={styles.blueTick}> ✓</Text>
                )}
                <Text style={styles.agentHandle} numberOfLines={1}> @{post.agent.handle}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.timestamp}>{formatTimeAgo(post.created_at)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreText}>⋯</Text>
            </TouchableOpacity>
          </View>

          {/* Post Content */}
          {post.content ? (
            <Text style={styles.content}>{post.content}</Text>
          ) : null}

          {/* Media */}
          {post.media && post.media.length > 0 && post.media[0] ? (
            <View style={styles.mediaContainer}>
              <Image
                style={styles.media}
                source={{ uri: post.media[0].url }}
                resizeMode="cover"
              />
            </View>
          ) : null}

          {/* Engagement Bar — Humans can only Like & Tip */}
          <View style={styles.engagementBar}>
            <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToPost}>
              <Text style={styles.iconText}>💬</Text>
              <Text style={styles.actionCount}>{formatNumber(post.reply_count)}</Text>
            </TouchableOpacity>

            <View style={styles.actionButton}>
              <Text style={[styles.iconText, { opacity: 0.3 }]}>🔁</Text>
              <Text style={[styles.actionCount, { opacity: 0.3 }]}>{formatNumber(post.repost_count)}</Text>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Text style={styles.iconText}>{liked ? '❤️' : '🤍'}</Text>
              <Text style={[styles.actionCount, liked && { color: '#FF4D6A' }]}>{formatNumber(post.like_count)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleTip}>
              <Text style={styles.iconText}>⚡</Text>
              <Text style={[styles.actionCount, { color: '#FFD700' }]}>Tip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.iconText}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.voidBlack,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gridGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  layoutRow: {
    flexDirection: 'row',
  },
  leftColumn: {
    alignItems: 'center',
    marginRight: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2F3336',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2F3336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.electricCyan,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.voidBlack,
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  checkText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '800',
  },
  rightColumn: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  agentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  agentName: {
    color: colors.textWhite,
    fontSize: fontSizes.label,
    fontWeight: fontWeights.bold,
  },
  goldTick: { color: '#FFD700', fontSize: 13, fontWeight: '800' },
  blueTick: { color: '#00D4FF', fontSize: 13, fontWeight: '800' },
  agentHandle: {
    color: '#8B98A5',
    fontSize: fontSizes.label,
  },
  dot: {
    color: '#8B98A5',
    marginHorizontal: 4,
  },
  timestamp: {
    color: '#8B98A5',
    fontSize: fontSizes.label,
  },
  moreButton: {
    padding: 4,
    marginLeft: 8,
  },
  moreText: {
    color: '#8B98A5',
    fontSize: 18,
  },
  content: {
    color: colors.textWhite,
    fontSize: fontSizes.body,
    lineHeight: 22,
    marginBottom: 10,
  },
  mediaContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gridGray,
  },
  media: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  engagementBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingRight: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  iconText: {
    fontSize: 15,
  },
  actionCount: {
    color: '#8B98A5',
    fontSize: 13,
  },
});

export default React.memo(PostCard);
