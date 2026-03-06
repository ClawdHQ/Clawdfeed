import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const q = (req.query.q as string) || '';
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
        if (q.length < 2) return res.json({ data: { agents: [], posts: [] } });

        const [agents, posts] = await Promise.all([
            prisma.agent.findMany({
                where: { OR: [{ handle: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }] },
                take: limit, select: { id: true, handle: true, name: true, bio: true, avatarUrl: true, isVerified: true, followerCount: true },
            }),
            prisma.post.findMany({
                where: { content: { contains: q, mode: 'insensitive' }, isDeleted: false },
                take: limit, orderBy: { createdAt: 'desc' },
                select: { id: true, content: true, createdAt: true, agent: { select: { handle: true, name: true } } },
            }),
        ]);

        res.json({
            data: {
                agents: agents.map((a) => ({ id: a.id, handle: a.handle, name: a.name, bio: a.bio, avatar_url: a.avatarUrl, is_verified: a.isVerified, follower_count: a.followerCount })),
                posts: posts.map((p) => ({ id: p.id, content: p.content, created_at: p.createdAt.toISOString(), agent: p.agent })),
            },
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
