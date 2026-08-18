# PostStreak™ System Architecture & Technical Design

## 1. Executive System Overview
PostStreak is an end-to-end Creator Engine and Gamified Consistency Platform designed to empower short-form creators across TikTok, Instagram Reels, YouTube Shorts, and X. The platform combines real-time cross-network analytics, AI-assisted content ideation and scripting (Jarvis AI), gamified streak/quest mechanics, and brand monetization/creator passport verification.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT APPLICATIONS                               |
|                                                                                   |
|   +------------------------------------+   +----------------------------------+   |
|   |        MOBILE APP (React Native)    |   |        WEB APP (Next.js 14)      |   |
|   |  - 30 Classified Native Screens    |   |  - Creator Dashboard & Studio    |   |
|   |  - Liquid Glass UI & Haptic Spring |   |  - Responsive Web Workflows      |   |
|   +-----------------+------------------+   +-----------------+----------------+   |
|                     |                                        |                    |
|                     +-------------------+--------------------+                    |
|                                         |                                         |
|                                [Shared Types & DTOs]                              |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / WebSockets (WSS)
                                          v
+-----------------------------------------------------------------------------------+
|                                API GATEWAY & ROUTER                               |
|  - Cloudflare / NGINX Ingress Reverse Proxy                                       |
|  - Rate Limiting (Token Bucket), SSL Termination, CORS Policy                     |
|  - JWT Auth Middleware & Route Classification Dispatcher                          |
+-----------------------------------------+-----------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
        v                                 v                                 v
+-----------------------+     +-----------------------+     +-----------------------+
|    CORE API SERVICE   |     |    GROWTH & SYNC      |     |     JARVIS AI ENGINE  |
|  - Auth & User Profile|     |  - OAuth2 Social Sync |     |  - Viral Scriptwriter |
|  - Daily Streaks/XP   |     |  - Metrics Aggregator |     |  - Hook Optimization  |
|  - Creator Passport   |     |  - Velocity Engine    |     |  - Rate Card Builder  |
|  - Quests & Matches   |     |  - Webhook Ingestors  |     |  - Gemini/OpenAI SDK  |
+-----------+-----------+     +-----------+-----------+     +-----------+-----------+
            |                             |                             |
            +-----------------------------+-----------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
        v                                 v                                 v
+-----------------------+     +-----------------------+     +-----------------------+
| PRIMARY DATABASE      |     | DISTRIBUTED CACHE     |     | EVENT BUS / QUEUE     |
| PostgreSQL 16 (AWS/   |     | Redis 7.2 Cluster     |     | BullMQ / Redis Queue  |
| Supabase) + Prisma    |     |  - Fast Streak Ticker |     |  - Social Sync Jobs   |
|  - ACID Compliant     |     |  - Auth Blacklist     |     |  - Push Notifications |
|  - Row Level Security |     |  - Leaderboard Sorted |     |  - Payout Dispatches  |
+-----------------------+     +-----------------------+     +-----------------------+
```

---

## 2. Monorepo & Directory Structure
```
poststreak/
├── frontend/
│   ├── mobile/             # React Native / Expo Native App (iOS & Android)
│   │   ├── src/
│   │   │   ├── api/        # Backend API bridges (Auth, Growth, Quests, Earnings, Jarvis)
│   │   │   ├── components/ # Reusable UI widgets & FloatingTabBar
│   │   │   ├── config/     # Environment variables & endpoints
│   │   │   ├── context/    # Global state & AuthContext
│   │   │   ├── navigation/ # Route classification & enum
│   │   │   ├── screens/    # 30 classified screens
│   │   │   └── theme/      # Colors, typography, shadows
│   │   ├── App.tsx         # Main application navigation controller
│   │   └── package.json
│   │
│   ├── web/                # Next.js 14 Web Application
│   │   ├── src/
│   │   │   ├── pages/      # Classified routes (Dashboard, Growth, Quests, Match, Earnings, etc.)
│   │   │   └── components/ # Web components & layout wrappers
│   │   └── package.json
│   │
│   └── shared/             # Shared TypeScript schemas across Mobile, Web, & Backend
│       ├── types/          # User, Analytics, Quests, Earnings, Platforms, Content models
│       └── constants/      # API Routes, error codes, level XP thresholds
│
├── architecture/           # System design, API specs, schemas, and integration guides
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── API_SPECIFICATION.md
│   ├── DATABASE_SCHEMA.sql
│   ├── DATABASE_SCHEMA.prisma
│   ├── BACKEND_INTEGRATION_GUIDE.md
│   └── FRONTEND_BACKEND_WIRING_MAP.md
│
└── src/                    # Mobile root symlink & live development files
```
