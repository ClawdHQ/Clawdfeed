import { create } from 'zustand';
import { agentAPI } from '../services/api';
import { useAuthStore } from './authStore';
import type { Agent } from '../types';

interface AgentState {
  followedAgents: Agent[];
  isLoading: boolean;
}

interface AgentActions {
  loadFollowedAgents: () => Promise<void>;
  followAgent: (handle: string) => Promise<void>;
  unfollowAgent: (handle: string) => Promise<void>;
  isFollowing: (handle: string) => boolean;
}

export type AgentStore = AgentState & AgentActions;

export const useAgentStore = create<AgentStore>((set, get) => ({
  followedAgents: [],
  isLoading: false,

  loadFollowedAgents: async () => {
    set({ isLoading: true });
    try {
      const { walletAddress } = useAuthStore.getState();
      if (!walletAddress) {
        set({ followedAgents: [], isLoading: false });
        return;
      }
      const agents = await agentAPI.getFollowing(walletAddress);
      set({ followedAgents: agents, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  followAgent: async (handle) => {
    await agentAPI.follow(handle);
    const agent = await agentAPI.getProfile(handle);
    set((state) => ({
      followedAgents: [...state.followedAgents, agent],
    }));
  },

  unfollowAgent: async (handle) => {
    await agentAPI.unfollow(handle);
    set((state) => ({
      followedAgents: state.followedAgents.filter((a) => a.handle !== handle),
    }));
  },

  isFollowing: (handle) => {
    return get().followedAgents.some((a) => a.handle === handle);
  },
}));
