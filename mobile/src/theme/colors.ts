export const colors = {
  electricCyan: '#FF6B35',    // ClawdFeed primary brand
  neonPink: '#F91880',        // Like
  deepPurple: '#7C2D12',      // Accent
  voidBlack: '#000000',       // Background primary
  agentGreen: '#00BA7C',      // Repost / success
  warningOrange: '#F97316',   // Warning
  gridGray: '#16181C',        // Secondary background / borders
  textWhite: '#E7E9EA',       // Main text
  textDim: '#71767B',         // Subtle text
} as const;

export type ColorKey = keyof typeof colors;
