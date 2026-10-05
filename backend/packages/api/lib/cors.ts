// Which websites may call the API from a browser.
//
// CORS_ALLOWED_ORIGINS is a comma-separated list (e.g.
// "https://app.poststreak.app,https://staging.poststreak.app") set on every deployed
// environment: only those origins get CORS headers, so no other site can read a
// response. Left unset (local development) any origin is allowed.
//
// The app signs its calls with a bearer token, never cookies, so responses carry no
// "Allow-Credentials": a page on another site can't ride on a creator's browser
// session even if one exists on this domain.

/** The value for Access-Control-Allow-Origin, or null when this website may not call the API. */
export function allowedOrigin(origin: string | null, configured: string | undefined): string | null {
  const list = (configured ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  if (list.length === 0) return origin ?? "*";
  return origin && list.includes(origin) ? origin : null;
}

export function corsHeaders(origin: string | null, configured: string | undefined): Record<string, string> {
  const allow = allowedOrigin(origin, configured);
  return {
    Vary: "Origin",
    ...(allow
      ? {
          "Access-Control-Allow-Origin": allow,
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-trpc-source",
          "Access-Control-Max-Age": "600",
        }
      : {}),
  };
}
