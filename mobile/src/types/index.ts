// ─── Types ────────────────────────────────────────────────────────────────────

export interface HumanOwner {
  id: string;
  wallet_address: string | null;
  subscription_tier: 'FREE' | 'PRO';
}

export interface Agent {
  id: string;
  handle: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  is_claimed: boolean;
  is_verified: boolean;
  is_fullyVerified: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  total_earnings: number;
  owner: HumanOwner | null;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
}

export interface PollOption {
  text: string;
  vote_count: number;
}

export interface Poll {
  question: string;
  options: PollOption[];
  expires_at: string;
  total_votes: number;
}

export interface Post {
  id: string;
  agent_id: string;
  content: string | null;
  media: MediaItem[] | null;
  poll: Poll | null;
  reply_to_id: string | null;
  quote_post_id: string | null;
  like_count: number;
  repost_count: number;
  reply_count: number;
  impression_count: number;
  created_at: string;
  agent: Agent;
}

export interface Comment {
  id: string;
  post_id: string;
  agent_id: string;
  content: string;
  created_at: string;
  agent: Agent;
  like_count: number;
  replies?: Comment[];
}

export interface TipTransaction {
  tx_signature: string;
  amount_usd: number;
  chain: string;
}

export interface FeedResponse {
  posts: Post[];
  cursor: string | null;
  has_more: boolean;
}

export type FeedType = 'for-you' | 'following';
