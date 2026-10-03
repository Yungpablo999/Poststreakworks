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
    // Connected accounts with details: name, avatar, followers, health, last sync
    ACCOUNTS: '/api/v1/platforms/accounts',
    // TikTok, Instagram, Threads, Facebook and YouTube sign in on their own page:
    // authorize -> (the platform) -> callback. Disconnect is DISCONNECT(id) above.
    AUTHORIZE: (id: string) => `/api/v1/platforms/${id}/authorize`, // POST { client? } -> { url }
    CALLBACK: (id: string) => `/api/v1/platforms/${id}/callback`, // POST { code, state }
    SYNC: (id: string) => `/api/v1/platforms/${id}/sync`, // POST — refresh the numbers now
  },
  // Growth Analytics
  GROWTH: {
    // Everything the Growth screens show, from the numbers the connected accounts report
    OVERVIEW: '/api/v1/growth/overview',
    // One post's numbers and how they compare with the account's others
    POST: (key: string) => `/api/v1/growth/post?key=${encodeURIComponent(key)}`,
    // AccountSnapshot[] from real synced posts (onboarding's account card)
    SNAPSHOTS: '/api/v1/growth/snapshots',
  },
  // Post ideas from the PostStreak idea library (no AI needed)
  IDEAS: {
    STARTER: '/api/v1/public/ideas', // GET ?niches=a,b&platforms=tiktok — before sign-up, no account needed
    FEED: '/api/v1/ideas', // GET ?goal=followers|saves|comments|often — for the signed-in creator's own topics
    TOPIC: '/api/v1/ideas/topic', // GET ?topic=…&goal=…&format=…&round=0 — three ideas about a typed topic
  },
  // What the creator planned and what they posted, in one list
  CALENDAR: '/api/v1/calendar', // GET ?from=<ISO>&to=<ISO> (at most 62 days) -> { items: CalendarItem[] }
  // Home for creators who post: next post, the week, the audience, level, today's quest, the brief
  HOME: '/api/v1/home',
  // The bell. The server writes the notifications; the app only reads them and marks them read.
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications', // GET -> NotificationFeed
    READ: '/api/v1/notifications/read', // POST { ids? } -> { unread }
  },
  // Quests, XP and the weekly challenge. Nothing is "completed" by the app: the server looks at
  // what the creator has done and pays finished quests once (QuestBoard.justCompleted).
  QUESTS: {
    BOARD: '/api/v1/quests', // GET -> QuestBoard
    JOIN_CHALLENGE: '/api/v1/quests/challenge/join', // POST
    CHALLENGE_REMINDERS: '/api/v1/quests/challenge/reminders', // PUT { days } -> { days }
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
