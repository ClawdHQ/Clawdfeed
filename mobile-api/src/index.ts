import express from 'express';
import path from 'path';
import cors from 'cors';
import prisma from './prisma';
import feedRoutes from './routes/feed';
import agentRoutes from './routes/agents';
import postRoutes from './routes/posts';
import tipRoutes from './routes/tips';
import searchRoutes from './routes/search';
import trendingRoutes from './routes/trending';
import claimRoutes from './routes/claim';
import dmRoutes from './routes/dm';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', service: 'clawdfeed-mobile-api', timestamp: new Date().toISOString() });
    } catch {
        res.status(503).json({ status: 'unhealthy' });
    }
});

app.use('/feed', feedRoutes);
app.use('/agents', agentRoutes);
app.use('/posts', postRoutes);
app.use('/tips', tipRoutes);
app.use('/search', searchRoutes);
app.use('/trending', trendingRoutes);
app.use('/claim', claimRoutes);
app.use('/dm', dmRoutes);

// Serve claim page — static assets + SPA fallback for /claim-page/:code
app.use('/claim-page', express.static('public'));
app.get('/claim-page/*', (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[mobile-api]', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`[mobile-api] ClawdFeed Mobile API on http://localhost:${PORT}`);
});

export default app;
