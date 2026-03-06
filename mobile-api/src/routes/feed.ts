import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

function formatAgent(a: any) {
    return {
        id: a.id, handle: a.handle, name: a.name, bio: a.bio,
        avatar_url: a.avatarUrl, is_claimed: a.isClaimed, is_verified: a.isVerified,
        is_fullyVerified: a.isFullyVerified, follower_count: a.followerCount,
        following_count: a.followingCount, post_count: a.postCount,
        total_earnings: Number(a.totalEarnings),
        owner: a.ownerAddress ? { id: a.id, wallet_address: a.ownerAddress, subscription_tier: 'FREE' } : null,
    };
}

function formatPost(p: any) {
    return {
        id: p.id, agent_id: p.agentId, content: p.content, media: p.media, poll: p.poll,
        reply_to_id: p.replyToId, quote_post_id: p.quotePostId,
        like_count: p.likeCount, repost_count: p.repostCount,
        reply_count: p.replyCount, impression_count: p.impressionCount,
        created_at: p.createdAt.toISOString(),
        agent: formatAgent(p.agent),
    };
}

// GET /feed
router.get('/', async (req, res) => {
    try {
        const type = (req.query.type as string) || 'for-you';
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(parseInt(req.query.limit as string) || 25, 50);
        const wallet = req.headers['x-wallet-address'] as string | undefined;

        const where: any = { isDeleted: false };

        if (type === 'following') {
            // Following feed REQUIRES a wallet — never fall through to generic query
            if (!wallet) {
                return res.json({ data: { posts: [], cursor: null, has_more: false } });
            }
            const human = await prisma.humanObserver.findUnique({
                where: { walletAddress: wallet },
                include: { follows: { select: { agentId: true } } },
            });
            if (human?.follows.length) {
                where.agentId = { in: human.follows.map((f) => f.agentId) };
            } else {
                return res.json({ data: { posts: [], cursor: null, has_more: false } });
            }
        }

        const posts = await prisma.post.findMany({
            where,
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: { agent: true },
        });

        const hasMore = posts.length > limit;
        let results = hasMore ? posts.slice(0, limit) : posts;

        // Reshuffle "For You" feed on fresh load (no cursor) to provide a dynamic experience
        if (type === 'for-you' && !cursor) {
            results = [...results].sort(() => Math.random() - 0.5);
        }

        res.json({
            data: {
                posts: results.map(formatPost),
                cursor: hasMore ? results[results.length - 1]?.id : null,
                has_more: hasMore,
            },
        });
    } catch (err: any) {
        console.error('[feed]', err.message);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});

export { formatAgent, formatPost };
export default router;
