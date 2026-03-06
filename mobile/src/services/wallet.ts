// @ts-ignore - Ignore module resolution issue due to internal package.json "exports" configuration
import {
  transact,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  createTransferCheckedInstruction, 
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import Config from 'react-native-config';
import { SKR_TOKEN } from '../constants/config';
import {
  saveWalletAddress,
  getWalletAddress,
  removeWalletAddress,
} from './storage';

const APP_IDENTITY = {
  name: 'ClawdFeed',
  uri: 'https://clawdfeed.com',
  icon: 'favicon.ico',
};

class WalletService {
  private connection: Connection;

  constructor() {
    console.log('WalletService initialized with RPC:', Config.SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com');
    this.connection = new Connection(
      Config.SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com',
      'confirmed',
    );
  }

  /**
   * Authorise with the Mobile Wallet Adapter and return the wallet address.
   */
  async connect(): Promise<string> {
    console.log('Starting wallet connection via transact...');
    try {
      const walletAddress = await transact(async (wallet: any) => {
        console.log('Transact callback started, calling authorize...');
        const authResult = await wallet.authorize({
          identity: APP_IDENTITY,
          chain: 'solana:mainnet',
        });
        console.log('Authorize result:', JSON.stringify(authResult));
        const address = authResult.accounts[0]?.address ?? '';
        return address;
      });
      console.log('Final wallet address obtained:', walletAddress);
      return walletAddress;
    } catch (error) {
      console.error('Detailed connection error stack:', error);
      throw error;
    }
  }

  /**
   * Deauthorise and clear stored credentials.
   */
  async disconnect(): Promise<void> {
    await transact(async (wallet: any) => {
      await wallet.deauthorize({ auth_token: '' });
    }).catch(() => { });
    await removeWalletAddress();
  }

  /**
   * Fetch the SKR token balance for the currently connected wallet.
   */
  async getBalance(): Promise<number> {
    const address = await getWalletAddress();
    if (!address) {
      return 0;
    }
    try {
      const mint = new PublicKey(SKR_TOKEN.mint);
      const owner = new PublicKey(address);
      const ata = getAssociatedTokenAddressSync(mint, owner);
      const info = await this.connection.getTokenAccountBalance(ata);
      return info.value.uiAmount ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Build and sign an SPL token transfer, returning the transaction signature.
   */
  async sendTip(recipientWallet: string, skrAmount: number): Promise<string> {
    const senderAddress = await getWalletAddress();
    if (!senderAddress) {
      throw new Error('Wallet not connected');
    }

    const mint = new PublicKey(SKR_TOKEN.mint);
    const sender = new PublicKey(senderAddress);
    const recipient = new PublicKey(recipientWallet);
    const senderAta = getAssociatedTokenAddressSync(mint, sender);
    const recipientAta = getAssociatedTokenAddressSync(mint, recipient);

    const lamports = BigInt(
      Math.round(skrAmount * 10 ** SKR_TOKEN.decimals),
    );

    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash();

    const tx = new Transaction({
      feePayer: sender,
      blockhash,
      lastValidBlockHeight,
    });

    tx.add(
      createTransferCheckedInstruction(
        senderAta,
        mint,
        recipientAta,
        sender,
        lamports,
        SKR_TOKEN.decimals,
      ),
    );

    const signature = await transact(async (wallet: any) => {
      const signed = await wallet.signAndSendTransactions({
        transactions: [tx],
      });
      return signed[0] ?? '';
    });

    return signature;
  }

  async isConnected(): Promise<boolean> {
    const address = await getWalletAddress();
    return Boolean(address);
  }

  async getAddress(): Promise<string | null> {
    return getWalletAddress();
  }
}

export const walletService = new WalletService();
