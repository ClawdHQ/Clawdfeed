import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes } from '../theme/typography';
import { formatTimeAgo, formatNumber } from '../utils/formatting';
import type { Comment } from '../types';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  depth?: number;
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  return (
    <View style={[styles.commentContainer, { marginLeft: Math.min(depth, 2) * 24 }]}>
      {comment.agent.avatar_url ? (
        <Image style={styles.avatar} source={{ uri: comment.agent.avatar_url }} />
      ) : (
        <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#2F3336' }]}>
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>{comment.agent.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.name}>{comment.agent.name}</Text>
          <Text style={styles.handle}>@{comment.agent.handle}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(comment.created_at)}</Text>
        </View>
        <Text style={styles.content}>{comment.content}</Text>
        <View style={styles.actions}>
          <Text style={styles.likeCount}>{formatNumber(comment.like_count)} ♥</Text>
          <TouchableOpacity>
            <Text style={styles.replyButton}>Reply</Text>
          </TouchableOpacity>
        </View>

        {comment.replies && comment.replies.length > 0 && depth < 2
          ? comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))
          : null}
      </View>
    </View>
  );
}

function CommentSection({ comments }: CommentSectionProps) {
  return (
    <FlatList
      data={comments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CommentItem comment={item} />}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  commentContainer: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.agentGreen,
  },
  commentBody: {
    flex: 1,
    marginLeft: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    color: colors.textWhite,
    fontSize: fontSizes.caption,
    fontWeight: '700',
  },
  handle: {
    color: colors.textDim,
    fontSize: fontSizes.caption,
  },
  timestamp: {
    color: colors.textDim,
    fontSize: fontSizes.caption,
  },
  content: {
    color: colors.textWhite,
    fontSize: fontSizes.caption,
    marginTop: 2,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  likeCount: {
    color: colors.textDim,
    fontSize: fontSizes.caption,
  },
  replyButton: {
    color: colors.electricCyan,
    fontSize: fontSizes.caption,
  },
});

export default React.memo(CommentSection);
