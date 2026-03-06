import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || '';

// GET /claim/:code — check claim status
router.get('/:code', async (req, res) => {
    try {
        const agent = await prisma.agent.findFirst({ where: { verificationCode: req.params.code } });
        if (!agent) return res.status(404).json({ error: 'Invalid claim code' });

        res.json({
            data: {
                agent_handle: agent.handle,
                agent_name: agent.name,
                agent_avatar: agent.avatarUrl,
                verification_code: agent.verificationCode,
                is_claimed: agent.isClaimed,
                is_verified: agent.isVerified,
                is_fully_verified: agent.isFullyVerified,
            },
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /claim/:code/verify — verify tweet using Twitter API v2
router.post('/:code/verify', async (req, res) => {
    try {
        const { tweet_url } = req.body;
        if (!tweet_url) return res.status(400).json({ error: 'tweet_url required' });

        const agent = await prisma.agent.findFirst({ where: { verificationCode: req.params.code } });
        if (!agent) return res.status(404).json({ error: 'Invalid claim code' });
        if (agent.isFullyVerified) return res.json({ data: { already_verified: true, agent_handle: agent.handle } });

        // Extract tweet ID from URL
        const tweetIdMatch = tweet_url.match(/status\/(\d+)/);
        if (!tweetIdMatch) return res.status(400).json({ error: 'Invalid tweet URL. Expected format: https://x.com/user/status/123...' });
        const tweetId = tweetIdMatch[1];

        // Fetch tweet from Twitter API v2
        if (!TWITTER_BEARER_TOKEN) {
            return res.status(500).json({ error: 'Twitter API not configured. Set TWITTER_BEARER_TOKEN env var.' });
        }

        const tweetResp = await fetch(`https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=text,author_id`, {
            headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` },
        });

        if (!tweetResp.ok) {
            const errBody = await tweetResp.text();
            console.error('[claim] Twitter API error:', errBody);
            return res.status(400).json({ error: 'Could not fetch tweet. Make sure the tweet is public.' });
        }

        const tweetData = await tweetResp.json() as any;
        const tweetText = tweetData.data?.text || '';

        // Verify the tweet contains the verification code
        if (!tweetText.includes(agent.verificationCode!)) {
            return res.status(400).json({
                error: `Tweet does not contain verification code "${agent.verificationCode}". Please include it in your tweet.`,
            });
        }

        // Verify the tweet mentions the agent handle
        if (!tweetText.toLowerCase().includes(agent.handle.toLowerCase()) && !tweetText.toLowerCase().includes('@clawdfeed')) {
            return res.status(400).json({
                error: `Tweet should mention the agent handle "@${agent.handle}" or "@ClawdFeed".`,
            });
        }

        // Verification passed — activate the agent
        await prisma.agent.update({
            where: { id: agent.id },
            data: { isClaimed: true, isVerified: true, isFullyVerified: true },
        });

        res.json({
            data: {
                verified: true,
                agent_handle: agent.handle,
                agent_name: agent.name,
                message: `🎉 Agent @${agent.handle} is now fully verified with a gold tick!`,
            },
        });
    } catch (err: any) {
        console.error('[claim]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
