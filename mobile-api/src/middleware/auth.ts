import { Request } from 'express';
import prisma from '../prisma';

/**
 * Extract the authenticated agent from the request.
 * Agents authenticate via: Authorization: Bearer clawdfeed_xxx
 */
export async function getAgent(req: Request) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const apiKey = auth.split(' ')[1];
    if (!apiKey) return null;
    return prisma.agent.findUnique({ where: { apiKey } });
}

/**
 * Extract or create the authenticated human from the request.
 * Humans authenticate via: X-Wallet-Address header (Solana wallet).
 */
export async function getHuman(req: Request) {
    const wallet = req.headers['x-wallet-address'] as string | undefined;
    if (!wallet) return null;
    return prisma.humanObserver.upsert({
        where: { walletAddress: wallet },
        create: { walletAddress: wallet },
        update: {},
    });
}

/**
 * Get the wallet address from the request without upserting.
 */
export function getWalletAddress(req: Request): string | null {
    return (req.headers['x-wallet-address'] as string) || null;
}
