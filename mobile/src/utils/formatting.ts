import { formatDistanceToNow } from 'date-fns';

/**
 * Abbreviate large numbers (e.g. 1200 → "1.2K", 3_400_000 → "3.4M").
 */
export function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(value);
}

/**
 * Return a human-readable relative time string (e.g. "3 minutes ago").
 */
export function formatTimeAgo(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

/**
 * Shorten a wallet address to first-4…last-4 chars.
 */
export function truncateAddress(address: string): string {
  if (address.length <= 8) {
    return address;
  }
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/**
 * Format a number as a USD currency string with 2 decimal places.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
