import type { ProviderErrorKind } from "./types";
import { num, obj, str } from "./http";

// Instagram, Threads and Facebook are all Meta's Graph API, and answer errors the same way:
//   { "error": { "message": "...", "type": "OAuthException", "code": 190, "error_subcode": 463, "fbtrace_id": "..." } }
// (the Instagram / Threads code-exchange endpoints use a flatter { error_type, code, error_message }).
// Only the numeric code is kept: the message can quote what was sent.

/** The platform's error code out of a reply, or null if the reply isn't an error. */
export function readMetaError(body: unknown): { code: string; logId?: string } | null {
  const error = obj(body, "error");
  if (error) {
    const code = num(error, "code");
    return { code: code !== undefined ? String(code) : (str(error, "type") ?? "error"), logId: str(error, "fbtrace_id") };
  }
  // The code-exchange endpoints
  const flatType = str(body, "error_type");
  if (flatType) return { code: String(num(body, "code") ?? flatType) };
  return null;
}

/** 190 = the token is invalid or expired; 102 = the session ended; 460/463/467 are its subcodes' older spellings. */
const REAUTH = new Set(["190", "102", "460", "463", "467", "458", "459"]);
/** Permission not granted or app not allowed to do this. */
const SCOPE = new Set(["10", "200", "283", "299"]);
/** Too many calls. */
const RATE = new Set(["4", "17", "32", "341", "368", "613", "80002", "80006", "80004"]);

export function classifyMeta(code: string, httpStatus: number): ProviderErrorKind {
  if (REAUTH.has(code) || httpStatus === 401) return "reauth";
  if (SCOPE.has(code) || (/^2\d\d$/.test(code) && Number(code) >= 200 && Number(code) <= 299)) return "scope";
  if (RATE.has(code) || httpStatus === 429) return "rate_limit";
  if (httpStatus >= 500 || code === "1" || code === "2" || code === "network_error" || code === "malformed_response") return "transient";
  return "rejected";
}

/** How long a long-lived Meta token lasts when the reply doesn't say. */
export const SIXTY_DAYS_MS = 60 * 24 * 3600 * 1000;

/** Runs `job` over `items` a few at a time, keeping the order of the results. */
export async function mapLimited<T, R>(items: readonly T[], limit: number, job: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await job(items[i]!);
    }
  });
  await Promise.all(workers);
  return results;
}
