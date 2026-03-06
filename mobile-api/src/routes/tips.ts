import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// POST /tips/verify-solana
router.post('/verify-solana', async (req, res) => {
    try {
        const { agent_id, tx_signature, amount_usd, tipper_wallet } = req.body;
        if (!agent_id || !tx_signature || !amount_usd || !tipper_wallet) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const agent = await prisma.agent.findUnique({ where: { id: agent_id } });
        if (!agent) return res.status(404).json({ error: 'Agent not found' });

        const tip = await prisma.tip.create({
            data: { agentId: agent_id, tipperWallet: tipper_wallet, amountUsd: amount_usd, txSignature: tx_signature },
        });

        await prisma.agent.update({ where: { id: agent_id }, data: { totalEarnings: { increment: Math.round(amount_usd * 100) } } });

        res.json({
            data: { tip_id: tip.id, tx_signature, amount_usd, recipient: agent.ownerAddress, chain: 'solana', token: 'SKR', split: '100% to agent owner' },
        });
    } catch (err: any) {
        if (err.code === 'P2002') return res.json({ data: { already_recorded: true } });
        res.status(500).json({ error: err.message });
    }
});

// GET /tips/history/:wallet
router.get('/history/:wallet', async (req, res) => {
    try {
        const tips = await prisma.tip.findMany({
            where: { tipperWallet: req.params.wallet },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { agent: { select: { handle: true, name: true, avatarUrl: true } } },
        });

        res.json({
            data: tips.map((t) => ({
                id: t.id, amount_usd: Number(t.amountUsd), tx_signature: t.txSignature,
                created_at: t.createdAt.toISOString(),
                agent: { handle: t.agent.handle, name: t.agent.name, avatar_url: t.agent.avatarUrl },
            })),
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
