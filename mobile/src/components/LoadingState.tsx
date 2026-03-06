import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function ShimmerBlock({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, backgroundColor: colors.gridGray, borderRadius: 6, opacity }, style]}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <ShimmerBlock width={48} height={48} style={{ borderRadius: 24 }} />
        <View style={styles.headerText}>
          <ShimmerBlock width={120} height={14} />
          <ShimmerBlock width={80} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <ShimmerBlock width="100%" height={60} style={{ marginTop: 10 }} />
      <View style={styles.engagementRow}>
        {[0, 1, 2, 3].map((i) => (
          <ShimmerBlock key={i} width={40} height={12} />
        ))}
      </View>
    </View>
  );
}

export function AgentCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <ShimmerBlock width={64} height={64} style={{ borderRadius: 32 }} />
        <View style={styles.headerText}>
          <ShimmerBlock width={120} height={14} />
          <ShimmerBlock width={80} height={12} style={{ marginTop: 4 }} />
          <ShimmerBlock width={160} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <PostCardSkeleton key={i} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: `${colors.gridGray}88`,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
