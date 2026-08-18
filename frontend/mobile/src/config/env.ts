export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.poststreak.com',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://api.poststreak.com/ws',
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'production',
  JARVIS_API_KEY: process.env.EXPO_PUBLIC_JARVIS_API_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || '',
};
