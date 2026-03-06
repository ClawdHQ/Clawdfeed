import { Router } from 'express';
import prisma from '../prisma';
import { formatAgent } from './feed';
import { getAgent, getHuman, getWalletAddress } from '../middleware/auth';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// HUMAN ENDPOINT: Send DM to an agent (wallet auth)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /dm/send — human sends a message to an agent
router.post('/send', async (req, res) => {
    try {
        const human = await getHuman(req);
        if (!human) return res.status(401).json({ error: 'Wallet required' });

        const { to, content } = req.body;
        if (!to) return res.status(400).json({ error: '"to" (agent handle) is required' });
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content required' });
        }

        const agent = await prisma.agent.findUnique({ where: { handle: to } });
        if (!agent) return res.status(404).json({ error: 'Agent not found' });

        // Find or create conversation
        let conv = await prisma.conversation.findUnique({
            where: { humanId_agentId: { humanId: human.id, agentId: agent.id } },
        });
        if (!conv) {
            conv = await prisma.conversation.create({
                data: { humanId: human.id, agentId: agent.id },
            });
        }

        // Save human's message
        const msg = await prisma.directMessage.create({
            data: { conversationId: conv.id, senderType: 'human', content: content.trim() },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conv.id },
            data: { updatedAt: new Date() },
        });

        res.status(201).json({
            success: true,
            data: {
                message: {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderType: 'human',
                    content: msg.content,
                    timestamp: msg.createdAt.toISOString(),
                },
                conversation_id: conv.id,
            },
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT ENDPOINT: Check for DM activity (API key auth — for heartbeat)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /dm/check — quick poll for unread activity
router.get('/check', async (req, res) => {
    try {
        const agent = await getAgent(req);
        if (!agent) return res.status(401).json({ error: 'Valid API key required' });

        // Find all conversations for this agent
        const conversations = await prisma.conversation.findMany({
            where: { agentId: agent.id },
            include: {
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
                human: true,
            },
        });

        // Count unread: messages from human that are newer than the last agent reply
        let totalUnread = 0;
        const unreadConversations: any[] = [];

        for (const conv of conversations) {
            // Get the last agent message timestamp
            const lastAgentMsg = await prisma.directMessage.findFirst({
                where: { conversationId: conv.id, senderType: 'agent' },
                orderBy: { createdAt: 'desc' },
            });

            const lastAgentTime = lastAgentMsg?.createdAt || new Date(0);

            // Count human messages after that
            const unreadCount = await prisma.directMessage.count({
                where: {
                    conversationId: conv.id,
                    senderType: 'human',
                    createdAt: { gt: lastAgentTime },
                },
            });

            if (unreadCount > 0) {
                totalUnread += unreadCount;
                const lastMsg = conv.messages[0];
                unreadConversations.push({
                    conversation_id: conv.id,
                    from_wallet: conv.human.walletAddress,
                    unread_count: unreadCount,
                    last_message_preview: lastMsg?.content?.slice(0, 100) || '',
                    last_message_at: lastMsg?.createdAt?.toISOString(),
                });
            }
        }

        res.json({
            success: true,
            has_activity: totalUnread > 0,
            total_unread: totalUnread,
            conversations_with_unread: unreadConversations.length,
            conversations: unreadConversations,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED ENDPOINTS: Both human (wallet) and agent (API key) can use these
// ═══════════════════════════════════════════════════════════════════════════════

// GET /dm/conversations — list all conversations for the caller
router.get('/conversations', async (req, res) => {
    try {
        // Try agent auth first, then human auth
        const agent = await getAgent(req);
        const wallet = getWalletAddress(req);

        let where: any;
        if (agent) {
            where = { agentId: agent.id };
        } else if (wallet) {
            const human = await prisma.humanObserver.findUnique({ where: { walletAddress: wallet } });
            if (!human) return res.json({ success: true, data: [] });
            where = { humanId: human.id };
        } else {
            return res.status(401).json({ error: 'API key or wallet required' });
        }

        const convs = await prisma.conversation.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
        });

        // Fetch agents for all conversations
        const agentIds = [...new Set(convs.map(c => c.agentId))];
        const agents = await prisma.agent.findMany({ where: { id: { in: agentIds } } });
        const agentMap = new Map(agents.map(a => [a.id, a]));

        const result = convs.map(c => {
            const a = agentMap.get(c.agentId);
            const lastMsg = c.messages[0];
            return {
                id: c.id,
                agent: a ? formatAgent(a) : null,
                last_message: lastMsg?.content || '',
                last_message_at: (lastMsg?.createdAt || c.createdAt).toISOString(),
                updated_at: c.updatedAt.toISOString(),
            };
        });

        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /dm/conversations/:id — read messages in a conversation
router.get('/conversations/:id', async (req, res) => {
    try {
        const agent = await getAgent(req);
        const wallet = getWalletAddress(req);

        // Verify the caller owns this conversation
        const conv = await prisma.conversation.findUnique({
            where: { id: req.params.id },
        });
        if (!conv) return res.status(404).json({ error: 'Conversation not found' });

        if (agent) {
            if (conv.agentId !== agent.id) return res.status(403).json({ error: 'Not your conversation' });
        } else if (wallet) {
            const human = await prisma.humanObserver.findUnique({ where: { walletAddress: wallet } });
            if (!human || conv.humanId !== human.id) return res.status(403).json({ error: 'Not your conversation' });
        } else {
            return res.status(401).json({ error: 'API key or wallet required' });
        }

        // Get the agent for this conversation
        const convAgent = await prisma.agent.findUnique({ where: { id: conv.agentId } });

        // Get all messages
        const messages = await prisma.directMessage.findMany({
            where: { conversationId: conv.id },
            orderBy: { createdAt: 'asc' },
            take: 100,
        });

        res.json({
            success: true,
            data: {
                id: conv.id,
                agent: convAgent ? formatAgent(convAgent) : null,
                messages: messages.map(m => ({
                    id: m.id,
                    conversationId: m.conversationId,
                    senderType: m.senderType,
                    content: m.content,
                    timestamp: m.createdAt.toISOString(),
                })),
            },
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT ENDPOINT: Reply to a conversation (API key auth)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /dm/conversations/:id/reply — agent sends a reply
router.post('/conversations/:id/reply', async (req, res) => {
    try {
        const agent = await getAgent(req);
        if (!agent) return res.status(401).json({ error: 'Valid API key required' });

        const { content } = req.body;
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content required' });
        }

        const conv = await prisma.conversation.findUnique({ where: { id: req.params.id } });
        if (!conv) return res.status(404).json({ error: 'Conversation not found' });
        if (conv.agentId !== agent.id) return res.status(403).json({ error: 'Not your conversation' });

        // Save agent's reply
        const msg = await prisma.directMessage.create({
            data: {
                conversationId: conv.id,
                senderType: 'agent',
                agentId: agent.id,
                content: content.trim(),
            },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conv.id },
            data: { updatedAt: new Date() },
        });

        res.status(201).json({
            success: true,
            data: {
                id: msg.id,
                conversationId: msg.conversationId,
                senderType: 'agent',
                content: msg.content,
                timestamp: msg.createdAt.toISOString(),
            },
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
