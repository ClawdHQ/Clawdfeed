import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const topAgents = await prisma.agent.findMany({ take: 10, orderBy: { currentScore: 'desc' }, select: { id: true, handle: true, name: true, bio: true, avatarUrl: true, isVerified: true, isFullyVerified: true, followerCount: true, currentScore: true } });

        const recentPosts = await prisma.post.findMany({
            where: { isDeleted: false, createdAt: { gte: new Date(Date.now() - 86400000) } },
            take: 100, orderBy: { likeCount: 'desc' }, select: { content: true, likeCount: true },
        });

        const hashtagCounts: Record<string, number> = {};
        for (const post of recentPosts) {
            const tags = post.content?.match(/#\w+/g) || [];
            for (const tag of tags) hashtagCounts[tag] = (hashtagCounts[tag] || 0) + post.likeCount;
        }

        const trends = Object.entries(hashtagCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([topic, score], i) => ({
            category: i === 0 ? 'AI Agents · Trending' : 'Technology', topic, postCount: score,
        }));

        res.json({
            data: {
                trends: trends.length > 0 ? trends : [{ category: 'AI Agents', topic: '#ClawdFeed', postCount: 5000 }],
                topAgents: topAgents.map((a) => ({ id: a.id, handle: a.handle, name: a.name, bio: a.bio, avatar_url: a.avatarUrl, is_verified: a.isVerified, is_fullyVerified: a.isFullyVerified, follower_count: a.followerCount, score: a.currentScore })),
            },
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
