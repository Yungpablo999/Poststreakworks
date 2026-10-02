export const API_ROUTES = {
  // Auth
  AUTH: {
    SIGN_IN: '/api/v1/auth/sign-in',
    SIGN_UP: '/api/v1/auth/sign-up',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    REFRESH_TOKEN: '/api/v1/auth/refresh',
    ME: '/api/v1/auth/me',
  },
  // User Profile & Passport
  USER: {
    PROFILE: '/api/v1/user/profile',
    UPDATE_PROFILE: '/api/v1/user/profile',
    PASSPORT: '/api/v1/user/passport',
    READINESS: '/api/v1/user/opportunity-readiness',
    // Phase 1: onboarding state the app used to keep in memory
    ONBOARDING: '/api/v1/user/onboarding', // PUT { displayName?, handle?, niches?, timezone? }
    TOUR_DONE: '/api/v1/user/tour', // POST — Ghost's welcome tour finished or skipped
    TIP_SEEN: '/api/v1/user/tips', // POST { key } — a first-visit tip was shown
  },
  // Everything the app needs at launch, in one call (profile, plan, connected
  // platforms, check-in streak, drafts, saved hooks, repurpose allowance, tour/tips)
  ME: {
    BOOTSTRAP: '/api/v1/me/bootstrap',
  },
  // Drafts: the app's own string id is the key — URL-encode it
  DRAFTS: {
    LIST: '/api/v1/drafts',
    ITEM: (id: string) => `/api/v1/drafts/${encodeURIComponent(id)}`, // PUT upserts, DELETE removes
  },
  // Hook Studio hearts
  HOOKS: {
    LIST: '/api/v1/hooks',
    TOGGLE: '/api/v1/hooks', // POST { line, style, idea } -> { saved }
  },
  // Daily check-in and the streak
  CHECK_INS: {
    SUMMARY: '/api/v1/check-ins', // GET
    CHECK_IN: '/api/v1/check-ins', // POST — idempotent per local day
    MONTH: (year: number, month: number) => `/api/v1/check-ins/month?year=${year}&month=${month}`, // month is 0-based
  },
  // Weekly Repurpose allowance
  REPURPOSE: {
    ALLOWANCE: '/api/v1/repurpose',
    SPEND: '/api/v1/repurpose/spend',
  },
  // Event tracking (recorded as "client.<eventName>")
  ANALYTICS: {
    TRACK: '/api/v1/analytics/track',
  },
  // Social Platforms Sync
  PLATFORMS: {
    LIST: '/api/v1/platforms',
    CONNECT: (id: string) => `/api/v1/platforms/${id}/connect`,
    DISCONNECT: (id: string) => `/api/v1/platforms/${id}/disconnect`,
    SYNC_ALL: '/api/v1/platforms/sync-all',
  },
  // Growth Analytics
  GROWTH: {
    AGGREGATE: '/api/v1/growth/aggregate',
    POST_PERFORMANCE: (postId: string) => `/api/v1/growth/posts/${postId}`,
    AUDIENCE_BREAKDOWN: '/api/v1/growth/audience',
    PLATFORM_COMPARISON: '/api/v1/growth/comparison',
  },
  // Quests & Gamification
  QUESTS: {
    DAILY_MISSIONS: '/api/v1/quests/daily',
    COMPLETE: (questId: string) => `/api/v1/quests/${questId}/complete`,
    CHALLENGES: '/api/v1/quests/challenges',
    JOIN_CHALLENGE: (id: string) => `/api/v1/quests/challenges/${id}/join`,
    STREAK_STATUS: '/api/v1/quests/streak',
  },
  // Earnings & Brand Deals
  EARNINGS: {
    SUMMARY: '/api/v1/earnings/summary',
    SET_GOAL: '/api/v1/earnings/goal',
    CAMPAIGNS: '/api/v1/earnings/campaigns',
    REQUEST_PAYOUT: '/api/v1/earnings/payout',
  },
  // Creator Matches & Collabs
  MATCH: {
    CREATORS: '/api/v1/matches/creators',
    SEND_PITCH: '/api/v1/matches/pitch',
    CONVERSATIONS: '/api/v1/messages/conversations',
    SEND_MESSAGE: '/api/v1/messages/send',
  },
  // Jarvis AI Content Engine
  JARVIS: {
    GENERATE_IDEAS: '/api/v1/jarvis/ideas',
    GENERATE_SCRIPT: '/api/v1/jarvis/script',
    GENERATE_CAPTION: '/api/v1/jarvis/caption',
    OPTIMIZE_HOOK: '/api/v1/jarvis/optimize-hook',
    RATE_CARD: '/api/v1/jarvis/rate-card',
    CHAT: '/api/v1/jarvis/chat', // "Ask Jarvis" — see frontend/shared/types/phase1.ts
  },
  // Scheduling & Calendar
  SCHEDULE: {
    POSTS: '/api/v1/schedule/posts', // GET ?from=&to=&status=&limit=&offset=
    CREATE_POST: '/api/v1/schedule/posts',
    UPDATE_POST: (id: string) => `/api/v1/schedule/posts/${id}`,
    DELETE_POST: (id: string) => `/api/v1/schedule/posts/${id}`,
  },
} as const;
