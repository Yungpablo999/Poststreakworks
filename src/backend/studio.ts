import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type {
  AiUsage,
  CaptionEditBody,
  CaptionEditResult,
  CaptionsBody,
  CaptionsResult,
  HooksBody,
  HooksResult,
  RepurposeBody,
  RepurposeResult,
  ScriptBody,
  ScriptPartBody,
  ScriptPartResult,
  ScriptResult,
  StudioUsage,
} from '../../frontend/shared/types/phase1';
import { hydrateRepurpose } from '../data';
import { api, type ApiFailure, type ApiResult } from './api';
import { createStore } from './store';

// The writing tools (script, hooks, captions and small caption edits, Repurpose). Jarvis writes on the
// server; the app asks and shows what comes back. The server counts what a creator may have each day
// (or week, for Repurpose) and says how much is used with every reply, so the little "2 left today"
// on each tool is the server's number, never one this device kept.

/** Today's writes and edits, as of the last reply. null = not read yet. */
export const usageStore = createStore<StudioUsage | null>(null);
export const useStudioUsage = usageStore.use;

export async function loadStudioUsage(): Promise<StudioUsage | null> {
  const res = await api.get<StudioUsage>(API_ROUTES.STUDIO.USAGE);
  if (!res.ok) return null;
  usageStore.set(res.data);
  return res.data;
}

export function clearStudioUsage(): void {
  usageStore.set(null);
}

const NOTHING: AiUsage = { used: 0, limit: null };

/** Remembers the allowance a reply reports (so every tool shows the same number). */
function noted<T extends { usage: AiUsage }>(kind: 'generate' | 'edit', res: ApiResult<T>): ApiResult<T> {
  if (res.ok) {
    const now = usageStore.get() ?? { generate: NOTHING, edit: NOTHING };
    usageStore.set({ ...now, [kind]: res.data.usage });
  }
  return res;
}

export const requestScript = async (body: ScriptBody) => noted('generate', await api.post<ScriptResult>(API_ROUTES.STUDIO.SCRIPT, body));
export const requestScriptPart = async (body: ScriptPartBody) => noted('edit', await api.post<ScriptPartResult>(API_ROUTES.STUDIO.SCRIPT_PART, body));
export const requestHooks = async (body: HooksBody) => noted('generate', await api.post<HooksResult>(API_ROUTES.STUDIO.HOOKS, body));
export const requestCaptions = async (body: CaptionsBody) => noted('generate', await api.post<CaptionsResult>(API_ROUTES.STUDIO.CAPTIONS, body));
export const requestCaptionEdit = async (body: CaptionEditBody) => noted('edit', await api.post<CaptionEditResult>(API_ROUTES.STUDIO.CAPTION_EDIT, body));

/** Writes a version for each platform. Uses one of the week's repurposes (the server counts it). */
export async function requestRepurpose(body: RepurposeBody): Promise<ApiResult<RepurposeResult>> {
  const res = await api.post<RepurposeResult>(API_ROUTES.REPURPOSE.GENERATE, body);
  if (res.ok) hydrateRepurpose({ usedThisWeek: res.data.usedThisWeek, weeklyLimit: res.data.weeklyLimit });
  return res;
}

/** What went wrong, in words for the creator, and whether the way forward is Pro. */
export function studioProblem(res: ApiFailure): { message: string; upgrade: boolean } {
  if (res.offline) return { message: 'Can’t reach PostStreak right now. Check your connection and try again.', upgrade: false };
  // Over the day's (or week's) allowance, or a Pro tool on a free plan: the server's own words, and the way forward
  if (res.code === 'UPGRADE_REQUIRED') return { message: res.message, upgrade: true };
  // Too many requests too fast, Jarvis unreachable or unusable, a request that wasn't right: the server wrote those for a person
  if ([400, 429, 502, 503].includes(res.status)) return { message: res.message, upgrade: false };
  return { message: 'Something went wrong. Please try again.', upgrade: false };
}
