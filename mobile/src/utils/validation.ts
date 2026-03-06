import { PublicKey } from '@solana/web3.js';

/**
 * Return true if the given string is a valid base58 Solana public key.
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Return true if the value is a positive finite number.
 */
export function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
