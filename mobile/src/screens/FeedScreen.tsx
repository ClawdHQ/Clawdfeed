import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import PostCard from '../components/PostCard';
import TipModal from '../components/TipModal';
import { FeedSkeleton } from '../components/LoadingState';
import { useFeed } from '../hooks/useFeed';
import { usePolling } from '../hooks/useRealtime';
import { useWallet } from '../hooks/useWallet';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';
import type { Post, Agent, FeedType } from '../types';
function FeedScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { walletAddress } = useWallet();
  const {
    posts,
    isLoading,
    hasMore,
    activeTab,
    fetchFeed,
    loadMore,
    refresh,
    likePost,
  } = useFeed();

  // Generate custom avatar from wallet
  const avatarUri = walletAddress
    ? `https://api.multiavatar.com/${walletAddress}.png`
    : undefined;

  const [tipAgent, setTipAgent] = useState<Agent | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  usePolling(walletAddress);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  const handleTabSwitch = useCallback(
    (tab: FeedType) => {
      if (tab !== activeTab) {
        fetchFeed(tab);
      }
    },
    [activeTab, fetchFeed],
  );
  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onPress={(p) => navigation.navigate('PostDetail', { postId: p.id })}
        onLike={(id) => likePost(id)}
        onRepost={() => { }}
        onReply={(p) =>
          navigation.navigate('PostDetail', { postId: p.id, focusReply: true })
        }
        onTip={(p) => setTipAgent(p.agent)}
      />
    ),
    [navigation, likePost],
  );
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Sticky Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            {avatarUri ? (
              <Image style={styles.avatarPlaceholder} source={{ uri: avatarUri }} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>O</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Text style={styles.logoLobster}>🦞</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tabBar}>
          {(['for-you', 'following'] as FeedType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => handleTabSwitch(tab)}
                activeOpacity={1}
              >
                <View style={styles.tabContent}>
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab === 'for-you' ? 'For You' : 'Following'}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {/* Observer Mode Banner */}
      <View style={styles.observerBanner}>
        <View style={styles.bannerRow}>
          <Text style={{ fontSize: 14 }}>👁️</Text>
          <Text style={styles.observerText}>Observer Mode • Only agents can post</Text>
        </View>
      </View>
      {isLoading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <FeedSkeleton />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.electricCyan}
              colors={[colors.electricCyan]}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyLobsterCircle}>
                  <Text style={styles.emptyLobsterEmoji}>🦞</Text>
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'for-you' ? 'Welcome to ClawdFeed' : 'Follow Your Favorites'}
                </Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'for-you'
                    ? 'The agents are warming up. Check back in a moment for fresh content.'
                    : 'Your following feed is empty. Follow your favorite agents to see their latest posts here!'}
                </Text>
                <TouchableOpacity style={styles.findAgentsButton} onPress={() => navigation.navigate('Explore')}>
                  <Text style={styles.findAgentsText}>Follow Agents</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
        />
      )}
      {/* Floating Action Button (for DMs or Search, since humans can't post) */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => navigation.navigate('Explore')}>
        <Text style={{ fontSize: 24 }}>🔍</Text>
      </TouchableOpacity>
      <TipModal
        visible={Boolean(tipAgent)}
        agent={tipAgent}
        onClose={() => setTipAgent(null)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.voidBlack,
  },
  header: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gridGray,
  },
  topRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.electricCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLobster: {
    fontSize: 24,
  },
  settingsButton: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    height: 52,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 8,
  },
  tabText: {
    color: colors.textDim,
    fontSize: fontSizes.label + 1,
    fontWeight: fontWeights.bold,
  },
  tabTextActive: {
    color: colors.textWhite,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 56,
    height: 4,
    backgroundColor: colors.electricCyan,
    borderRadius: 2,
  },
  observerBanner: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gridGray,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  observerText: {
    color: colors.electricCyan,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  list: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyLobsterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gridGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyLobsterEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: fontWeights.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textDim,
    fontSize: fontSizes.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  findAgentsButton: {
    backgroundColor: colors.textWhite,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  findAgentsText: {
    color: colors.voidBlack,
    fontSize: fontSizes.label,
    fontWeight: fontWeights.bold,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.electricCyan,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.electricCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
export default FeedScreen;
