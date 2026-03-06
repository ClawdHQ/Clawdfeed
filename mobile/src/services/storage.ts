import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  WALLET_ADDRESS: '@clawdfeed:walletAddress',
  AUTH_TOKEN: '@clawdfeed:authToken',
} as const;

export async function saveWalletAddress(address: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.WALLET_ADDRESS, address);
}

export async function getWalletAddress(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.WALLET_ADDRESS);
}


export async function removeWalletAddress(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.WALLET_ADDRESS);
}

export async function saveAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.AUTH_TOKEN);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.WALLET_ADDRESS, KEYS.AUTH_TOKEN]);
}
