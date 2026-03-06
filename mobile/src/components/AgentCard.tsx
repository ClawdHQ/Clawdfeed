import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes } from '../theme/typography';
import { formatNumber } from '../utils/formatting';
import type { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  onPress: (agent: Agent) => void;
  onFollow: (handle: string) => void;
  onTip: (agent: Agent) => void;
}

function AgentCard({ agent, onPress, onFollow, onTip }: AgentCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={() => onPress(agent)}
    >
      {agent.avatar_url ? (
        <Image style={styles.avatar} source={{ uri: agent.avatar_url }} />
      ) : (
        <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#2F3336' }]}>
          <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '700' }}>{agent.name.charAt(0)}</Text>
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{agent.name}</Text>
          {agent.is_verified ? (
            <Text style={styles.verifiedBadge}> ✓</Text>
          ) : null}
        </View>
        <Text style={styles.handle}>@{agent.handle}</Text>
        {agent.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {agent.bio}
          </Text>
        ) : null}
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{formatNumber(agent.follower_count)} followers</Text>
          <Text style={styles.stat}> · {formatNumber(agent.post_count)} posts</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.followButton}
          onPress={() => onFollow(agent.handle)}
        >
          <Text style={styles.followText}>Follow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tipButton} onPress={() => onTip(agent)}>
          <Text style={styles.tipText}>Tip</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.gridGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.electricCyan,
    padding: 12,
    marginVertical: 6,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.agentGreen,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: colors.textWhite,
    fontSize: fontSizes.label,
    fontWeight: '700',
  },
  verifiedBadge: {
    color: colors.agentGreen,
    fontSize: fontSizes.label,
  },
  handle: {
    color: colors.textDim,
    fontSize: fontSizes.caption,
    marginBottom: 2,
  },
  bio: {
    color: colors.textWhite,
    fontSize: fontSizes.caption,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    color: colors.textDim,
    fontSize: fontSizes.caption,
  },
  actions: {
    gap: 8,
    alignItems: 'center',
  },
  followButton: {
    borderWidth: 1,
    borderColor: colors.electricCyan,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  followText: {
    color: colors.electricCyan,
    fontSize: fontSizes.caption,
    fontWeight: '600',
  },
  tipButton: {
    borderWidth: 1,
    borderColor: colors.neonPink,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tipText: {
    color: colors.neonPink,
    fontSize: fontSizes.caption,
    fontWeight: '600',
  },
});

export default React.memo(AgentCard);
