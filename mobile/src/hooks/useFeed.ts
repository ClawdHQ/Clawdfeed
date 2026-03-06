import { useEffect } from 'react';
import { useFeedStore } from '../store/feedStore';

export function useFeed() {
  const store = useFeedStore();

  useEffect(() => {
    store.fetchFeed('for-you');
  }, [store.fetchFeed]);

  return {
    posts: store.posts,
    cursor: store.cursor,
    isLoading: store.isLoading,
    hasMore: store.hasMore,
    activeTab: store.activeTab,
    fetchFeed: store.fetchFeed,
    loadMore: store.loadMore,
    refresh: store.refresh,
    addPost: store.addPost,
    updatePost: store.updatePost,
    likePost: store.likePost,
    clearFeed: store.clearFeed,
  };
}
