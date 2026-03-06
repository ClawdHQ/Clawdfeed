import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFeedStore } from '../store/feedStore';
import { postAPI } from '../services/api';

const POLL_INTERVAL_FOREGROUND = 30_000; // 30 seconds
const POLL_INTERVAL_BACKGROUND = 300_000; // 5 minutes

/**
 * Polling-based realtime hook (replaces WebSocket).
 * Polls the feed API at regular intervals and prepends new posts.
 */
export function usePolling(walletAddress: string | null): void {
  const addPost = useFeedStore((s) => s.addPost);
  const posts = useFeedStore((s) => s.posts);
  const activeTab = useFeedStore((s) => s.activeTab);
  const lastPostId = useRef<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    // Track the latest post we know about
    if (posts.length > 0) {
      lastPostId.current = posts[0].id;
    }

    let interval: ReturnType<typeof setInterval>;

    const poll = async () => {
      try {
        const response = await postAPI.getFeed(activeTab);
        if (response.posts.length > 0 && lastPostId.current) {
          // Find new posts we haven't seen yet
          const newPosts = response.posts.filter(
            (p) => new Date(p.created_at) > new Date(posts[0]?.created_at ?? 0)
          );
          for (const post of newPosts.reverse()) {
            addPost(post);
          }
        }
      } catch {
        // Silently fail — feed will refresh on next pull
      }
    };

    const handleAppState = (state: AppStateStatus) => {
      clearInterval(interval);
      const ms = state === 'active' ? POLL_INTERVAL_FOREGROUND : POLL_INTERVAL_BACKGROUND;
      interval = setInterval(poll, ms);
      if (state === 'active') poll(); // Immediate check on resume
    };

    const sub = AppState.addEventListener('change', handleAppState);
    interval = setInterval(poll, POLL_INTERVAL_FOREGROUND);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [walletAddress, activeTab, addPost, posts]);
}
