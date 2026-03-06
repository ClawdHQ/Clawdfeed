import { create } from 'zustand';
import { walletService } from '../services/wallet';
import { saveWalletAddress, removeWalletAddress } from '../services/storage';

interface AuthState {
  walletAddress: string | null;
  isConnected: boolean;
  balance: number;
  isLoading: boolean;
  isPro: boolean;
  subscriptionTier: 'FREE' | 'PRO';
}

interface AuthActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  setPro: (isPro: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  walletAddress: null,
  isConnected: false,
  balance: 0,
  isLoading: false,
  isPro: false,
  subscriptionTier: 'FREE',

  connect: async () => {
    set({ isLoading: true });
    try {
      const address = await walletService.connect();
      const balance = await walletService.getBalance();
      set({ walletAddress: address, isConnected: true, balance, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  disconnect: async () => {
    await walletService.disconnect();
    await removeWalletAddress();
    set({ walletAddress: null, isConnected: false, balance: 0, isPro: false, subscriptionTier: 'FREE' });
  },

  refreshBalance: async () => {
    const balance = await walletService.getBalance();
    set({ balance });
  },

  setPro: (isPro: boolean) => {
    set({ isPro, subscriptionTier: isPro ? 'PRO' : 'FREE' });
  },
}));
