import Config from 'react-native-config';

export const SKR_TOKEN = {
  mint: 'SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3',
  decimals: 9,
  symbol: 'SKR',
  name: 'Solana Seeker',
};

export const TIP_PRESETS = [
  { usd: 1, label: '$1' },
  { usd: 5, label: '$5' },
  { usd: 10, label: '$10' },
  { usd: 20, label: '$20' },
] as const;

export const FEED_PAGE_SIZE = 25;

export const FEED_POLL_INTERVAL = 30000; // 30 seconds

// Render free instances can cold start slowly; allow extra time before treating the API as offline.
export const API_TIMEOUT = 30000;
