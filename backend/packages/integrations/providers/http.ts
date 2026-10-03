import { ProviderApiError, type FetchLike, type ProviderConfig, type ProviderErrorKind, type ProviderId } from "./types";

// The small amount of HTTP every adapter shares: a timeout, JSON in and out, the platform's error
// shape turned into a ProviderApiError, and the switch to the local stand-in for testing.

const TIMEOUT_MS = 15_000;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
/** This computer's address on a home or office network (what a phone on the same Wi-Fi uses to reach it). */
const PRIVATE_LAN = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;
const isThisMachineOrLan = (hostname: string) => LOCAL_HOSTS.has(hostname) || PRIVATE_LAN.test(hostname);

export class ProviderConfigError extends Error {}

/**
 * A `http://localhost:PORT[/prefix]` address (no trailing slash), or a ProviderConfigError. This computer's
 * address on a private network also passes, so a phone can be tried against stand-ins running here. Anything
 * else could send tokens somewhere they shouldn't go.
 */
export function assertLocalOrigin(raw: string, name: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ProviderConfigError(`${name} is not a valid URL`);
  }
  if (url.protocol !== "http:" || !isThisMachineOrLan(url.hostname)) {
    throw new ProviderConfigError(`${name} must be an http://localhost address`);
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new ProviderConfigError(`${name} must be a plain address`);
  }
  return url.origin + url.pathname.replace(/\/+$/, "");
}

/**
 * A redirect address must be https (the platforms insist), without a query string or fragment, and
 * is taken from our own settings, never from a request. A stand-in on this machine may use http://localhost
 * (or this computer's network address, for a phone).
 */
export function assertValidRedirectUri(uri: string, name: string, opts: { allowLocalHttp?: boolean } = {}): void {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    throw new ProviderConfigError(`${name} is not a valid URL`);
  }
  const localHttp = opts.allowLocalHttp === true && url.protocol === "http:" && isThisMachineOrLan(url.hostname);
  if (url.protocol !== "https:" && !localHttp) throw new ProviderConfigError(`${name} must be https`);
  if (uri.includes("?")) throw new ProviderConfigError(`${name} must not contain query parameters`);
  if (uri.includes("#")) throw new ProviderConfigError(`${name} must not contain a fragment`);
  if (uri.length > 512) throw new ProviderConfigError(`${name} must be under 512 characters`);
}

/**
 * The address the creator's browser is sent to. Real platforms: as given. With a stand-in: the same path on the
 * stand-in, under the platform's real host name (`https://www.instagram.com/oauth/authorize` becomes
 * `<mock>/www.instagram.com/oauth/authorize`), so one stand-in can speak for every host a platform uses.
 */
export function withMock(config: ProviderConfig, url: string): string {
  if (!config.mockOrigin) return url;
  const u = new URL(url);
  return `${config.mockOrigin}/${u.host}${u.pathname}${u.search}`;
}

/** `fetch` that sends everything meant for the platform's hosts to the stand-in when one is configured. */
export function fetchFor(config: ProviderConfig, hosts: readonly string[], fetchImpl: FetchLike = fetch): FetchLike {
  const mock = config.mockOrigin;
  if (!mock) return fetchImpl;
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const target = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const host = (() => {
      try {
        return new URL(target).host;
      } catch {
        return "";
      }
    })();
    return fetchImpl(hosts.includes(host) ? withMock(config, target) : target, init);
  }) as FetchLike;
}

export type Classifier = (code: string, httpStatus: number) => ProviderErrorKind;

export type Sent = { status: number; body: unknown };

/**
 * One request. Network failures and error replies become ProviderApiErrors; `readError` pulls the platform's
 * own error code out of a body (each platform words it differently).
 */
export async function send(
  provider: ProviderId,
  fetchImpl: FetchLike,
  url: string,
  init: RequestInit,
  readError: (body: unknown) => { code: string; logId?: string } | null,
  classify: Classifier,
): Promise<Sent> {
  let response: Response;
  try {
    response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new ProviderApiError(provider, "network_error", "transient", 0);
  }
  let body: unknown = null;
  try {
    body = JSON.parse(await response.text());
  } catch {
    // A 5xx from an edge proxy is often HTML. The status code is enough.
  }
  const error = readError(body);
  if (error || response.status >= 400) {
    const code = error?.code ?? `http_${response.status}`;
    throw new ProviderApiError(provider, code, classify(code, response.status), response.status, error?.logId);
  }
  return { status: response.status, body };
}

export const str = (value: unknown, key: string): string | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : undefined;
};

export const num = (value: unknown, key: string): number | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "number" && Number.isFinite(field) ? field : undefined;
};

export const obj = (value: unknown, key: string): Record<string, unknown> | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "object" && field !== null && !Array.isArray(field) ? (field as Record<string, unknown>) : undefined;
};

export const arr = (value: unknown, key: string): unknown[] => {
  if (typeof value !== "object" || value === null) return [];
  const field = (value as Record<string, unknown>)[key];
  return Array.isArray(field) ? field : [];
};

/** The sanity limit on one sync: how many posts per platform we read. */
export const MAX_POSTS_PER_SYNC = 100;
