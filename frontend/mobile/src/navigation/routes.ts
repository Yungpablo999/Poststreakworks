export enum AppRoute {
  // Auth
  SPLASH = 'splash',
  WELCOME = 'welcome',
  SIGN_IN = 'sign-in',
  SIGN_UP = 'sign-up',
  RESET_PASSWORD = 'reset-password',
  NICHE_SELECTION = 'niche-selection',
  ONBOARDING_COMPLETE = 'onboarding-complete',

  // Core Main
  DASHBOARD = 'dashboard',
  SCHEDULE = 'schedule',
  MESSAGES = 'messages',

  // Growth & Analytics
  GROWTH = 'growth',
  AUDIENCE_BREAKDOWN = 'audience-breakdown',
  PLATFORM_GROWTH = 'platform-growth',
  POST_PERFORMANCE = 'post-performance',
  PLATFORMS = 'platforms',

  // Earnings & Monetization
  EARNINGS = 'earnings',
  OPPORTUNITY_READINESS = 'opportunity-readiness',
  CREATOR_PASSPORT = 'creator-passport',

  // Quests & Challenges
  QUESTS = 'quests',
  MISSION_DETAIL = 'mission-detail',
  CHALLENGE_DETAIL = 'challenge-detail',

  // Match & Collab
  MATCH = 'match',
  COLLAB_IDEA = 'collab-idea',

  // AI Creation Studio
  CREATE = 'create',
  IDEA_DETAIL = 'idea-detail',
  POST_COMPOSER = 'composer',
  SCRIPT = 'script',
  CAPTION = 'caption',
  CONTENT_ANGLE = 'content-angle',

  // Jarvis Pro Suite
  JARVIS_PRO = 'jarvis-pro',
}

export const ROUTE_CATEGORIES = {
  AUTH: [
    AppRoute.SPLASH,
    AppRoute.WELCOME,
    AppRoute.SIGN_IN,
    AppRoute.SIGN_UP,
    AppRoute.RESET_PASSWORD,
    AppRoute.NICHE_SELECTION,
    AppRoute.ONBOARDING_COMPLETE,
  ],
  GROWTH: [
    AppRoute.GROWTH,
    AppRoute.AUDIENCE_BREAKDOWN,
    AppRoute.PLATFORM_GROWTH,
    AppRoute.POST_PERFORMANCE,
    AppRoute.PLATFORMS,
  ],
  EARNINGS: [
    AppRoute.EARNINGS,
    AppRoute.OPPORTUNITY_READINESS,
    AppRoute.CREATOR_PASSPORT,
  ],
  QUESTS: [
    AppRoute.QUESTS,
    AppRoute.MISSION_DETAIL,
    AppRoute.CHALLENGE_DETAIL,
  ],
  CREATION: [
    AppRoute.CREATE,
    AppRoute.IDEA_DETAIL,
    AppRoute.POST_COMPOSER,
    AppRoute.SCRIPT,
    AppRoute.CAPTION,
    AppRoute.CONTENT_ANGLE,
  ],
  COMMUNICATION: [
    AppRoute.MESSAGES,
    AppRoute.MATCH,
    AppRoute.COLLAB_IDEA,
    AppRoute.SCHEDULE,
  ],
  PREMIUM: [AppRoute.JARVIS_PRO],
};
