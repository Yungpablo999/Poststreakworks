import { api } from './authFetch';

// The creator's connected social accounts, from the backend.
//
//   GET  /api/platforms          -> { platforms: [{ platform, expires_at }] }  (never any token)
//   POST /api/auth/disconnect    -> { success: true }
//
// Ids match poststreak-web's PLATFORM_META (X is not enabled there).

export const PLATFORM_IDS = ['linkedin', 'threads', 'facebook', 'instagram', 'youtube', 'tiktok'] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

export interface ConnectedPlatform {
  platform: string;
  /** When the platform token expires (ISO), or null if it doesn't */
  expires_at: string | null;
}

export interface PlatformsApi {
  list: () => Promise<ConnectedPlatform[]>;
  disconnect: (platform: string) => Promise<void>;
}

export const platformsApi: PlatformsApi = {
  list: async () => (await api.get<{ platforms: ConnectedPlatform[] }>('/api/platforms')).platforms,
  disconnect: async (platform) => {
    await api.post('/api/auth/disconnect', { platform });
  },
};
