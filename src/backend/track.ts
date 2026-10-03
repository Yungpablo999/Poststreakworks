import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import { api, backendReady } from './api';

// Tells the server something the creator did that only the app can see (e.g. picking an idea), so
// a quest can notice it. Recorded as "client.<name>". Best effort: a failure is never shown.
export function trackEvent(name: string, properties: Record<string, string | number | boolean> = {}): void {
  if (!backendReady()) return;
  void api.post(API_ROUTES.ANALYTICS.TRACK, { eventName: name, properties });
}
