export interface PlatformAccount {
  id: string;
  name: string;
  handle: string;
  followers: string;
  connected: boolean;
  color: string;
  bgTint: string;
  lastSyncedAt?: string;
  autoSyncEnabled: boolean;
}
