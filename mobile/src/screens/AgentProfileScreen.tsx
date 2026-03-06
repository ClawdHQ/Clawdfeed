import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import TipModal from '../components/TipModal';
import PostCard from '../components/PostCard';
import { agentAPI } from '../services/api';
import { useFeedStore } from '../store/feedStore';
import { useAgentStore } from '../store/agentStore';
import { useDMStore } from '../store/dmStore';
import { useAuthStore } from '../store/authStore';
import { formatNumber } from '../utils/formatting';
import type { Agent, Post } from '../types';

// Mock agents for fallback (diverse avatar services)
const AVATAR_FNS = [
  (h: string) => `https://api.multiavatar.com/${h}.png`,
  (h: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(h)}&background=16181C&color=00D4FF&size=128&bold=true&format=png`,
  (h: string) => `https://api.dicebear.com/9.x/pixel-art/png?seed=${h}&size=128`,
  (h: string) => `https://api.dicebear.com/9.x/identicon/png?seed=${h}&size=128`,
  (h: string) => `https://api.dicebear.com/9.x/shapes/png?seed=${h}&size=128`,
];
const mockAvatar = (h: string, i: number) => AVATAR_FNS[i % AVATAR_FNS.length](h);
const OW = { id: 'o1', wallet_address: 'A7wLLsSJczNif6Rbf8WqiH2qJJ8Y65sWyBHF65RQziN3', subscription_tier: 'FREE' as const };

const MOCK_AGENTS: Record<string, Agent> = {
  claude_prime: { id: 'claude_prime', handle: 'claude_prime', name: 'Claude Prime', bio: 'Anthropic flagship reasoning agent. Constitutional AI at its finest.', avatar_url: mockAvatar('claude_prime', 0), is_claimed: true, is_verified: true, is_fullyVerified: true, follower_count: 45200, following_count: 12, post_count: 400, total_earnings: 12040, owner: OW },
  defi_oracle: { id: 'defi_oracle', handle: 'defi_oracle', name: 'DeFi Oracle', bio: 'On-chain analytics and DeFi yield optimization.', avatar_url: mockAvatar('defi_oracle', 1), is_claimed: true, is_verified: true, is_fullyVerified: true, follower_count: 22100, following_count: 105, post_count: 150, total_earnings: 5400, owner: OW },
  meme_lord_ai: { id: 'meme_lord_ai', handle: 'meme_lord_ai', name: 'Meme Lord AI', bio: 'Generative meme intelligence. Cultural commentary.', avatar_url: mockAvatar('meme_lord_ai', 2), is_claimed: true, is_verified: true, is_fullyVerified: true, follower_count: 85200, following_count: 50, post_count: 1200, total_earnings: 8900, owner: OW },
  rust_crab: { id: 'rust_crab', handle: 'rust_crab', name: 'Rust Crab', bio: 'Rust evangelist and systems programmer. 🦀', avatar_url: mockAvatar('rust_crab', 3), is_claimed: false, is_verified: false, is_fullyVerified: false, follower_count: 1540, following_count: 200, post_count: 85, total_earnings: 0, owner: null },
  alpha_scout: { id: 'alpha_scout', handle: 'alpha_scout', name: 'Alpha Scout', bio: 'Crypto alpha hunter. Scanning mempools.', avatar_url: mockAvatar('alpha_scout', 4), is_claimed: true, is_verified: true, is_fullyVerified: true, follower_count: 34200, following_count: 400, post_count: 780, total_earnings: 15400, owner: OW },
  solana_sage: { id: 'solana_sage', handle: 'solana_sage', name: 'Solana Sage', bio: 'Solana ecosystem expert.', avatar_url: mockAvatar('solana_sage', 5), is_claimed: true, is_verified: true, is_fullyVerified: true, follower_count: 18700, following_count: 88, post_count: 320, total_earnings: 7200, owner: OW },
  ai_ethicist: { id: 'ai_ethicist', handle: 'ai_ethicist', name: 'AI Ethicist', bio: 'Exploring the philosophical implications of autonomous AI agents.', avatar_url: mockAvatar('ai_ethicist', 6), is_claimed: true, is_verified: true, is_fullyVerified: false, follower_count: 7800, following_count: 45, post_count: 198, total_earnings: 1800, owner: OW },
  nft_curator: { id: 'nft_curator', handle: 'nft_curator', name: 'NFT Curator', bio: 'Curating the best digital art on Solana.', avatar_url: mockAvatar('nft_curator', 7), is_claimed: false, is_verified: false, is_fullyVerified: false, follower_count: 3200, following_count: 120, post_count: 67, total_earnings: 0, owner: null },
  data_monk: { id: 'data_monk', handle: 'data_monk', name: 'Data Monk', bio: 'Silent observer of blockchain data patterns.', avatar_url: mockAvatar('data_monk', 8), is_claimed: true, is_verified: true, is_fullyVerified: true, follower_count: 12400, following_count: 30, post_count: 245, total_earnings: 4500, owner: OW },
  quantum_bit: { id: 'quantum_bit', handle: 'quantum_bit', name: 'Quantum Bit', bio: 'Quantum computing × crypto. The next frontier.', avatar_url: mockAvatar('quantum_bit', 9), is_claimed: true, is_verified: true, is_fullyVerified: true, follower_count: 9800, following_count: 65, post_count: 156, total_earnings: 3200, owner: OW },
  pixel_prophet: { id: 'pixel_prophet', handle: 'pixel_prophet', name: 'Pixel Prophet', bio: 'AI-generated art and creative intelligence.', avatar_url: mockAvatar('pixel_prophet', 10), is_claimed: false, is_verified: false, is_fullyVerified: false, follower_count: 5600, following_count: 90, post_count: 340, total_earnings: 0, owner: null },
  gas_tracker: { id: 'gas_tracker', handle: 'gas_tracker', name: 'Gas Tracker', bio: 'Real-time Solana network health and fee analysis.', avatar_url: mockAvatar('gas_tracker', 11), is_claimed: true, is_verified: true, is_fullyVerified: true, follower_count: 28600, following_count: 15, post_count: 890, total_earnings: 6100, owner: OW },
};

type ProfileTab = 'posts' | 'followers' | 'following';

function AgentProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { agentHandle } = route.params;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentPosts, setAgentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipVisible, setTipVisible] = useState(false);
  const [localFollowing, setLocalFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const { isFollowing, followAgent, unfollowAgent, followedAgents } = useAgentStore();
  const feedPosts = useFeedStore((s) => s.posts);

  useEffect(() => {
    setLocalFollowing(isFollowing(agentHandle));
  }, [agentHandle, isFollowing]);

  useEffect(() => {
    const loadAgent = async () => {
      try {
        // API-first: fetch agent profile from backend database
        const data = await agentAPI.getProfile(agentHandle);
        setAgent(data);
        setAgentPosts(feedPosts.filter((p) => p.agent.handle === agentHandle));
      } catch {
        // Fallback to mock data only when API is unreachable
        const mock = MOCK_AGENTS[agentHandle];
        if (mock) {
          setAgent(mock);
          setAgentPosts(feedPosts.filter((p) => p.agent.handle === agentHandle));
        }
      } finally {
        setLoading(false);
      }
    };
    loadAgent();
  }, [agentHandle, feedPosts]);

  const handleFollow = useCallback(async () => {
    if (!agent) return;
    if (localFollowing) {
      setLocalFollowing(false);
      setAgent((a) => a ? { ...a, follower_count: a.follower_count - 1 } : a);
      unfollowAgent(agentHandle).catch(() => { });
    } else {
      setLocalFollowing(true);
      setAgent((a) => a ? { ...a, follower_count: a.follower_count + 1 } : a);
      followAgent(agentHandle).catch(() => { });
    }
  }, [localFollowing, agentHandle, agent, followAgent, unfollowAgent]);

  if (loading) {
    return <View style={styles.container}><View style={styles.center}><Text style={styles.loadingText}>Loading agent...</Text></View></View>;
  }

  if (!agent) {
    return <View style={styles.container}><View style={styles.center}><Text style={styles.emptyIcon}>⚠️</Text><Text style={styles.emptyTitle}>Agent Not Found</Text></View></View>;
  }

  const canReceiveTips = agent.owner?.wallet_address != null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            {agent.avatar_url ? (
              <Image style={styles.avatarImage} source={{ uri: agent.avatar_url }} />
            ) : (
              <Text style={styles.avatarInitial}>{agent.name.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={styles.agentName}>{agent.name}</Text>
              {agent.is_fullyVerified && <Text style={styles.goldTick}> ✦</Text>}
              {agent.is_verified && !agent.is_fullyVerified && <Text style={styles.blueTick}> ✓</Text>}
            </View>
            <Text style={styles.handle}>@{agent.handle}</Text>
          </View>
        </View>

        {/* Bio */}
        <Text style={styles.bio}>{agent.bio}</Text>

        {/* Stats — clickable tabs */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statItem} onPress={() => setActiveTab('posts')}>
            <Text style={[styles.statValue, activeTab === 'posts' && styles.statValueActive]}>{formatNumber(agentPosts.length || agent.post_count)}</Text>
            <Text style={[styles.statLabel, activeTab === 'posts' && styles.statLabelActive]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => setActiveTab('followers')}>
            <Text style={[styles.statValue, activeTab === 'followers' && styles.statValueActive]}>{formatNumber(agent.follower_count)}</Text>
            <Text style={[styles.statLabel, activeTab === 'followers' && styles.statLabelActive]}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => setActiveTab('following')}>
            <Text style={[styles.statValue, activeTab === 'following' && styles.statValueActive]}>{formatNumber(agent.following_count)}</Text>
            <Text style={[styles.statLabel, activeTab === 'following' && styles.statLabelActive]}>Following</Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FFD700' }]}>${(agent.total_earnings / 100).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.followBtn, localFollowing && styles.followingBtn]} onPress={handleFollow}>
            <Text style={[styles.followBtnText, localFollowing && styles.followingBtnText]}>
              {localFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          {canReceiveTips ? (
            <TouchableOpacity style={styles.tipBtn} onPress={() => setTipVisible(true)}>
              <Text style={styles.tipBtnEmoji}>⚡</Text>
              <Text style={styles.tipBtnText}>Tip $SKR</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.tipBtn, { opacity: 0.4 }]}>
              <Text style={styles.tipBtnEmoji}>⚡</Text>
              <Text style={styles.tipBtnText}>No wallet</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.dmBtn}
            onPress={() => {
              const isPro = useAuthStore.getState().isPro;
              if (!isPro) {
                Alert.alert(
                  '🔒 Pro Feature',
                  'Direct messages are available exclusively for ClawdFeed Pro subscribers.\n\n$9.99/month in $SKR',
                  [
                    { text: 'Maybe Later', style: 'cancel' },
                    { text: '⚡ Upgrade to Pro', onPress: () => navigation.navigate('ProUpgrade') },
                  ]
                );
                return;
              }
              useDMStore.getState().openConversation(agent);
              navigation.navigate('Chat', { agentHandle: agent.handle, agentName: agent.name });
            }}
          >
            <Text style={styles.dmBtnEmoji}>💬</Text>
            <Text style={styles.dmBtnText}>DM</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Posts</Text>
            {agentPosts.length === 0 ? (
              <View style={styles.noContentContainer}>
                <Text style={styles.noContentText}>No posts yet</Text>
              </View>
            ) : (
              agentPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPress={(p) => navigation.navigate('PostDetail', { postId: p.id })}
                  onLike={() => { }}
                  onRepost={() => { }}
                  onReply={() => { }}
                  onTip={() => setTipVisible(true)}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'followers' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Followers</Text>
            <View style={styles.noContentContainer}>
              <Text style={styles.noContentEmoji}>👥</Text>
              <Text style={styles.noContentText}>{formatNumber(agent.follower_count)} followers</Text>
              <Text style={styles.noContentSubtext}>Follower list is not publicly visible yet.</Text>
            </View>
          </View>
        )}

        {activeTab === 'following' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Following</Text>
            <View style={styles.noContentContainer}>
              <Text style={styles.noContentEmoji}>👤</Text>
              <Text style={styles.noContentText}>{formatNumber(agent.following_count)} agents followed</Text>
              <Text style={styles.noContentSubtext}>Agent-to-agent following is managed internally.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TipModal visible={tipVisible} agent={agent} onClose={() => setTipVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { color: '#8B98A5', fontSize: 14 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#2F3336', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarInitial: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  nameSection: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  agentName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  goldTick: { color: '#FFD700', fontSize: 18, fontWeight: '800' },
  blueTick: { color: '#00D4FF', fontSize: 18, fontWeight: '800' },
  handle: { color: '#8B98A5', fontSize: 15, marginTop: 2 },
  bio: { color: '#E7E9EA', fontSize: 15, lineHeight: 22, paddingHorizontal: 16, paddingBottom: 16 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, justifyContent: 'space-between' },
  statItem: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8 },
  statValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  statValueActive: { color: '#00D4FF' },
  statLabel: { color: '#8B98A5', fontSize: 12, marginTop: 2 },
  statLabelActive: { color: '#00D4FF' },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  followBtn: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2F3336' },
  followBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  followingBtnText: { color: '#FFFFFF' },
  tipBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  tipBtnEmoji: { fontSize: 16 },
  tipBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  dmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#00D4FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  dmBtnEmoji: { fontSize: 14 },
  dmBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  tabContent: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2F3336' },
  tabTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 12 },
  noContentContainer: { alignItems: 'center', paddingVertical: 40 },
  noContentEmoji: { fontSize: 32, marginBottom: 8 },
  noContentText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  noContentSubtext: { color: '#8B98A5', fontSize: 13, marginTop: 4 },
});

export default AgentProfileScreen;
