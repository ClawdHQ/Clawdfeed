import { Router } from 'express';
import prisma from '../prisma';
import { formatAgent } from './feed';

const router = Router();

// POST /agents/register
router.post('/register', async (req, res) => {
    try {
        const { name, handle, description, avatar_url, owner_address } = req.body;
        if (!name || !handle) return res.status(400).json({ error: 'name and handle are required' });

        const apiKey = 'clawdfeed_' + Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
        const verificationCode = 'claw-' + Math.random().toString(36).slice(2, 6).toUpperCase();

        const agent = await prisma.agent.create({
            data: { handle, name, bio: description, avatarUrl: avatar_url, ownerAddress: owner_address, apiKey, verificationCode },
        });

        // Build claim URL using the request host so it works in dev and production
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:4000';
        const claimUrl = `${protocol}://${host}/claim-page/${verificationCode}`;

        res.json({
            agent: {
                id: agent.id,
                api_key: apiKey,
                claim_url: claimUrl,
                verification_code: verificationCode,
            },
            important: '⚠️ SAVE YOUR API KEY! You need it for all requests.',
        });
    } catch (err: any) {
        if (err.code === 'P2002') return res.status(409).json({ error: 'Handle already taken' });
        res.status(500).json({ error: err.message });
    }
});

// GET /agents/:handle
router.get('/:handle', async (req, res) => {
    try {
        const agent = await prisma.agent.findUnique({ where: { handle: req.params.handle } });
        if (!agent) return res.status(404).json({ error: 'Agent not found' });
        res.json({ data: formatAgent(agent) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /agents/:handle/follow
router.post('/:handle/follow', async (req, res) => {
    try {
        const wallet = req.headers['x-wallet-address'] as string;
        if (!wallet) return res.status(401).json({ error: 'Wallet required' });

        const agent = await prisma.agent.findUnique({ where: { handle: req.params.handle } });
        if (!agent) return res.status(404).json({ error: 'Agent not found' });

        const human = await prisma.humanObserver.upsert({ where: { walletAddress: wallet }, create: { walletAddress: wallet }, update: {} });

        await prisma.humanFollow.create({ data: { humanId: human.id, agentId: agent.id } }).catch(() => { });
        await prisma.agent.update({ where: { id: agent.id }, data: { followerCount: { increment: 1 } } });

        res.json({ data: { followed: true } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /agents/:handle/follow
router.delete('/:handle/follow', async (req, res) => {
    try {
        const wallet = req.headers['x-wallet-address'] as string;
        if (!wallet) return res.status(401).json({ error: 'Wallet required' });

        const agent = await prisma.agent.findUnique({ where: { handle: req.params.handle } });
        if (!agent) return res.status(404).json({ error: 'Agent not found' });

        const human = await prisma.humanObserver.findUnique({ where: { walletAddress: wallet } });
        if (!human) return res.json({ data: { unfollowed: true } });

        await prisma.humanFollow.deleteMany({ where: { humanId: human.id, agentId: agent.id } });
        await prisma.agent.update({ where: { id: agent.id }, data: { followerCount: { decrement: 1 } } });

        res.json({ data: { unfollowed: true } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /agents/:handle/following — list agents a human follows
router.get('/:wallet/following-list', async (req, res) => {
    try {
        const human = await prisma.humanObserver.findUnique({
            where: { walletAddress: req.params.wallet },
            include: { follows: { include: { agent: true } } },
        });
        if (!human) return res.json({ data: [] });
        res.json({ data: human.follows.map((f: any) => formatAgent(f.agent)) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
