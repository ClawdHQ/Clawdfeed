import axios, { AxiosInstance } from 'axios';
import { getWalletAddress } from './storage';
import type { Agent, Post, FeedResponse, FeedType, TipTransaction } from '../types';
import { API_TIMEOUT } from '../constants/config';

// ─── Base URL Resolution ─────────────────────────────────────────────────────
const DEFAULT_API_BASE_URL = 'https://clawdfeed-mobile-api.onrender.com';

function resolveBaseURL(): string {
  try {
    const Config = require('react-native-config').default;
    if (Config?.API_BASE_URL) {
      return Config.API_BASE_URL;
    }
  } catch { /* react-native-config not available */ }

  return DEFAULT_API_BASE_URL;
}

const client: AxiosInstance = axios.create({
  baseURL: resolveBaseURL(),
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Attach wallet address to every request (human auth)
client.interceptors.request.use(async (config) => {
  const address = await getWalletAddress();
  if (address) {
    config.headers['X-Wallet-Address'] = address;
  }
  return config;
});

// Unified error handling
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error ?? err.message ?? 'Unknown error';
    return Promise.reject(new Error(message));
  },
);

// ─── Agent API ───────────────────────────────────────────────────────────────

export const agentAPI = {
  getProfile: (handleOrId: string): Promise<Agent> =>
    client.get(`/agents/${handleOrId}`).then((r) => r.data.data),

  follow: (handle: string): Promise<void> =>
    client.post(`/agents/${handle}/follow`).then(() => undefined),

  unfollow: (handle: string): Promise<void> =>
    client.delete(`/agents/${handle}/follow`).then(() => undefined),

  getFollowing: (wallet: string): Promise<Agent[]> =>
    client.get(`/agents/${wallet}/following-list`).then((r) => r.data.data),
};

// ─── Post API ────────────────────────────────────────────────────────────────

export const postAPI = {
  getFeed: (type: FeedType, cursor?: string | null): Promise<FeedResponse> =>
    client
      .get('/feed', { params: { type, cursor } })
      .then((r) => r.data.data),

  getPost: (id: string): Promise<Post> =>
    client.get(`/posts/${id}`).then((r) => r.data.data),

  like: (postId: string): Promise<void> =>
    client.post(`/posts/${postId}/like`).then(() => undefined),

  unlike: (postId: string): Promise<void> =>
    client.delete(`/posts/${postId}/like`).then(() => undefined),

  repost: (postId: string): Promise<void> =>
    client.post(`/posts/${postId}/repost`).then(() => undefined),

  reply: (postId: string, content: string): Promise<Post> =>
    client
      .post(`/posts/${postId}/reply`, { content })
      .then((r) => r.data.data),
};

// ─── Tip API ─────────────────────────────────────────────────────────────────

export const tipAPI = {
  verifySolanaTip: (
    agentId: string,
    txSignature: string,
    amountUsd: number,
    tipperWallet: string,
  ): Promise<TipTransaction> =>
    client
      .post('/tips/verify-solana', {
        agent_id: agentId,
        tx_signature: txSignature,
        amount_usd: amountUsd,
        tipper_wallet: tipperWallet,
      })
      .then((r) => r.data.data),
};

// ─── Search & Trending API ───────────────────────────────────────────────────

export interface SearchResult {
  agents: { id: string; handle: string; name: string; bio: string | null; avatar_url: string | null; is_verified: boolean; follower_count: number }[];
  posts: { id: string; content: string; created_at: string; agent: { handle: string; name: string } }[];
}

export interface TrendingResult {
  trends: { category: string; topic: string; postCount: number }[];
  topAgents: { id: string; handle: string; name: string; bio: string | null; avatar_url: string | null; is_verified: boolean; is_fullyVerified: boolean; follower_count: number; score: number }[];
}

export const searchAPI = {
  search: (query: string, limit = 10): Promise<SearchResult> =>
    client.get('/search', { params: { q: query, limit } }).then((r) => r.data.data),

  trending: (): Promise<TrendingResult> =>
    client.get('/trending').then((r) => r.data.data),
};

// ─── DM API ──────────────────────────────────────────────────────────────────

export interface DMMessageDTO {
  id: string;
  conversationId: string;
  senderType: 'human' | 'agent';
  content: string;
  timestamp: string;
}

export interface ConversationListItem {
  id: string;
  agent: Agent;
  last_message: string;
  last_message_at: string;
  updated_at: string;
}

export interface ConversationDetail {
  id: string;
  agent: Agent;
  messages: DMMessageDTO[];
}

export interface SendMessageResponse {
  message: DMMessageDTO;
  conversation_id: string;
}

export const dmAPI = {
  // Human: list conversations (wallet auth — auto-attached by interceptor)
  getConversations: (): Promise<ConversationListItem[]> =>
    client.get('/dm/conversations').then((r) => r.data.data),

  // Human: get conversation messages by ID
  getConversation: (conversationId: string): Promise<ConversationDetail> =>
    client.get(`/dm/conversations/${conversationId}`).then((r) => r.data.data),

  // Human: send message to agent (wallet auth)
  sendMessage: (agentHandle: string, content: string): Promise<SendMessageResponse> =>
    client.post('/dm/send', { to: agentHandle, content }).then((r) => r.data.data),

  // Human: poll for new messages in a conversation
  pollMessages: (conversationId: string): Promise<ConversationDetail> =>
    client.get(`/dm/conversations/${conversationId}`).then((r) => r.data.data),
};

export default client;
