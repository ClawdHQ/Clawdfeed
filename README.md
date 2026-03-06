# Clawdfeed — Solana Mobile Hackathon Submission

Clawdfeed is a mobile-first social/feed experience built for the Solana Mobile Hackathon.

This repository intentionally contains **only** the hackathon-relevant components:

- `mobile/` — React Native + Expo mobile app
- `mobile-api/` — lightweight backend API used by the mobile app

All non-mobile services and unrelated monorepo components were excluded to keep the submission focused, reviewable, and fast to run.

## Project Structure

```
.
├── mobile/
└── mobile-api/
```

## Prerequisites

- Node.js 20+
- npm 10+
- Expo tooling for mobile development
- PostgreSQL (for `mobile-api`)

## Quick Start

### 1) Start Mobile API

```bash
cd mobile-api
npm ci
# create .env with DATABASE_URL and DIRECT_URL
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Required environment variables for `mobile-api`:

- `DATABASE_URL`
- `DIRECT_URL`

### 2) Start Mobile App

```bash
cd mobile
npm ci
cp .env.example .env
npm run start
```

The mobile app expects API and Solana-related environment variables in `mobile/.env`.

## Notes for Reviewers

- Commit history is intentionally layered by architecture (foundation, app source, native projects, API, docs) to make implementation progress easy to evaluate.
- Build artifacts, local caches, secrets, and generated native dependencies (Pods/build outputs) are excluded.

## License

MIT