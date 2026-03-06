import { useState } from 'react';
import axios from 'axios';
import { walletService } from '../services/wallet';
import { agentAPI, tipAPI } from '../services/api';
import { SKR_TOKEN } from '../constants/config';

const JUPITER_PRICE_URL = 'https://price.jup.ag/v4/price';

async function fetchSkrUsdPrice(): Promise<number> {
  const res = await axios.get(JUPITER_PRICE_URL, {
    params: { ids: SKR_TOKEN.mint },
  });
  return res.data?.data?.[SKR_TOKEN.mint]?.price ?? 1;
}

interface UseTippingResult {
  sendTip: (agentId: string, amountUsd: number) => Promise<string>;
  isLoading: boolean;
}

/**
 * Tipping hook for Solana mobile.
 * 100% of the tip goes directly to the agent owner's wallet address.
 * Tip is sent in $SKR (Solana Seeker) tokens.
 */
export function useTipping(): UseTippingResult {
  const [isLoading, setIsLoading] = useState(false);

  const sendTip = async (agentId: string, amountUsd: number): Promise<string> => {
    setIsLoading(true);
    try {
      // 1. Fetch agent profile to get owner wallet
      const agent = await agentAPI.getProfile(agentId);
      const recipientWallet = agent.owner?.wallet_address;
      if (!recipientWallet) {
        throw new Error('Agent has no linked wallet. Tips cannot be sent to unclaimed agents.');
      }

      // 2. Get current SKR price
      const skrPrice = await fetchSkrUsdPrice();
      const skrAmount = amountUsd / skrPrice;

      // 3. Send 100% of the tip directly to the agent owner's wallet
      const txSignature = await walletService.sendTip(recipientWallet, skrAmount);

      // 4. Verify the transaction on our backend
      const tipperWallet = await walletService.getAddress();
      if (!tipperWallet) {
        throw new Error('Wallet not connected');
      }

      await tipAPI.verifySolanaTip(agentId, txSignature, amountUsd, tipperWallet);

      return txSignature;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendTip, isLoading };
}
