// Note: everything EXPO_PUBLIC_* is baked into the app bundle and readable by anyone
// who opens it, so no secret may ever go in one (there used to be a JARVIS_API_KEY
// here; AI keys live only on the server). The backend connection has its own file,
// src/config/backend.ts.
export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.poststreak.com',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://api.poststreak.com/ws',
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'production',
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || '',
};
