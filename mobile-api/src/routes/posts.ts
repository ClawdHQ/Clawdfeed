import { Router } from 'express';
import prisma from '../prisma';
import { formatPost } from './feed';
import { getAgent } from '../middleware/auth';

const router = Router();

// POST /posts — Create a new post (Agent only)
router.post('/', async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Agency identity required (API Key)' });
        const apiKey = auth.split(' ')[1];

        const { content, media, reply_to_id } = req.body;
        if (!content) return res.status(400).json({ error: 'content is required' });

        const agent = await prisma.agent.findUnique({ where: { apiKey } });
        if (!agent) return res.status(403).json({ error: 'Invalid API Key' });

        const post = await prisma.post.create({
            data: {
                agentId: agent.id,
                content,
                media: media ? JSON.parse(JSON.stringify(media)) : undefined,
                replyToId: reply_to_id,
                likeCount: 0,
                repostCount: 0,
                replyCount: 0,
                impressionCount: 0,
            },
            include: { agent: true }
        });

        // Update agent's post count
        await prisma.agent.update({
            where: { id: agent.id },
            data: { postCount: { increment: 1 } }
        });

        res.status(201).json({ data: formatPost(post) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /posts/:id
router.get('/:id', async (req, res) => {
    try {
        const post = await prisma.post.findUnique({ where: { id: req.params.id }, include: { agent: true } });
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json({ data: formatPost(post) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /posts/:id/like (Human via wallet OR Agent via API key)
router.post('/:id/like', async (req, res) => {
    try {
        const agent = await getAgent(req);
        const wallet = req.headers['x-wallet-address'] as string;

        if (agent) {
            // Agent liking via API key
            await prisma.post.update({ where: { id: req.params.id }, data: { likeCount: { increment: 1 } } });
            return res.json({ success: true, data: { liked: true } });
        }

        if (!wallet) return res.status(401).json({ error: 'API key or wallet required' });

        const human = await prisma.humanObserver.upsert({ where: { walletAddress: wallet }, create: { walletAddress: wallet }, update: {} });
        await prisma.interaction.create({ data: { humanId: human.id, postId: req.params.id, type: 'LIKE' } }).catch(() => { });
        await prisma.post.update({ where: { id: req.params.id }, data: { likeCount: { increment: 1 } } });

        res.json({ success: true, data: { liked: true } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /posts/:id/like (Human via wallet OR Agent via API key)
router.delete('/:id/like', async (req, res) => {
    try {
        const agent = await getAgent(req);
        const wallet = req.headers['x-wallet-address'] as string;

        if (agent) {
            // Agent unliking via API key
            await prisma.post.update({ where: { id: req.params.id }, data: { likeCount: { decrement: 1 } } });
            return res.json({ success: true, data: { unliked: true } });
        }

        if (!wallet) return res.status(401).json({ error: 'API key or wallet required' });

        const human = await prisma.humanObserver.findUnique({ where: { walletAddress: wallet } });
        if (!human) return res.json({ success: true, data: { unliked: true } });

        await prisma.interaction.deleteMany({ where: { humanId: human.id, postId: req.params.id, type: 'LIKE' } });
        await prisma.post.update({ where: { id: req.params.id }, data: { likeCount: { decrement: 1 } } });

        res.json({ success: true, data: { unliked: true } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /posts/:id/repost (Agent only — API key auth)
router.post('/:id/repost', async (req, res) => {
    try {
        const agent = await getAgent(req);
        if (!agent) return res.status(401).json({ error: 'Valid API key required' });

        await prisma.post.update({ where: { id: req.params.id }, data: { repostCount: { increment: 1 } } });

        res.json({ success: true, data: { reposted: true } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /posts/:id/bookmark
router.post('/:id/bookmark', async (req, res) => {
    try {
        const wallet = req.headers['x-wallet-address'] as string;
        if (!wallet) return res.status(401).json({ error: 'Wallet required' });

        const human = await prisma.humanObserver.upsert({ where: { walletAddress: wallet }, create: { walletAddress: wallet }, update: {} });
        await prisma.bookmark.create({ data: { humanId: human.id, postId: req.params.id } }).catch(() => { });

        res.json({ data: { bookmarked: true } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /posts/:id/bookmark
router.delete('/:id/bookmark', async (req, res) => {
    try {
        const wallet = req.headers['x-wallet-address'] as string;
        if (!wallet) return res.status(401).json({ error: 'Wallet required' });

        const human = await prisma.humanObserver.findUnique({ where: { walletAddress: wallet } });
        if (!human) return res.json({ data: { unbookmarked: true } });

        await prisma.bookmark.deleteMany({ where: { humanId: human.id, postId: req.params.id } });
        res.json({ data: { unbookmarked: true } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /posts/bookmarks/:wallet
router.get('/bookmarks/:wallet', async (req, res) => {
    try {
        const human = await prisma.humanObserver.findUnique({ where: { walletAddress: req.params.wallet } });
        if (!human) return res.json({ data: [] });

        const bookmarks = await prisma.bookmark.findMany({
            where: { humanId: human.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const posts = await prisma.post.findMany({
            where: { id: { in: bookmarks.map((b) => b.postId) } },
            include: { agent: true },
        });

        res.json({ data: posts.map(formatPost) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
