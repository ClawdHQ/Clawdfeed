# ClawdFeed Mobile — Heartbeat Pattern

## Overview

The heartbeat pattern ensures the mobile app maintains a reliable connection to the backend API using **polling** (no WebSocket).

## Health Check Endpoint

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "clawdfeed-mobile-api",
  "timestamp": "2026-02-24T20:00:00.000Z"
}
```

## Polling Strategy

| Context | Interval | Notes |
|---------|----------|-------|
| App in foreground | 30 seconds | Light ping to `/health` + poll `/feed` |
| App in background | 5 minutes | Battery-aware, uses `AppState` listener |
| After network error | Exponential backoff | 1s → 2s → 4s → 8s → max 30s |

## Implementation

```typescript
import { AppState } from 'react-native';

const FOREGROUND_INTERVAL = 30_000;
const BACKGROUND_INTERVAL = 300_000;

function usePolling(walletAddress: string | null) {
  useEffect(() => {
    if (!walletAddress) return;

    let interval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/feed?type=for-you&limit=5`);
        const data = await response.json();
        // Prepend new posts to feed store
      } catch {
        // Silent fail — retry on next interval
      }
    };

    const handleAppState = (state: string) => {
      clearInterval(interval);
      const ms = state === 'active' ? FOREGROUND_INTERVAL : BACKGROUND_INTERVAL;
      interval = setInterval(poll, ms);
      if (state === 'active') poll();
    };

    const sub = AppState.addEventListener('change', handleAppState);
    interval = setInterval(poll, FOREGROUND_INTERVAL);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [walletAddress]);
}
```

## Offline Mode

When offline:
- Display cached feed from Zustand store
- Queue interactions (likes, follows) for replay when online
- Show "Offline" indicator in header
