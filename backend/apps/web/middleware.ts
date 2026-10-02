import { NextResponse, type NextRequest } from "next/server";
import { allowedOrigin, corsHeaders } from "@poststreak/api/lib/cors";

// CORS for /api/v1/* and /api/trpc — the Expo app calls this backend from a
// different origin (localhost:8081 in dev, a different domain in prod for
// Expo web builds). Native iOS/Android don't enforce CORS at all, but any
// browser-based caller does, and Next.js route handlers add no CORS headers
// by default — a POST handler existing doesn't make OPTIONS a real
// preflight response. Discovered by actually testing sign-in from the
// Expo web build against this backend, not by curl (which never enforces
// CORS, so it looked fine there).
//
// Who is allowed is decided in packages/api/lib/cors.ts (and tested there):
// set CORS_ALLOWED_ORIGINS on every deployed environment.
export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin, process.env.CORS_ALLOWED_ORIGINS);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: allowedOrigin(origin, process.env.CORS_ALLOWED_ORIGINS) ? 204 : 403,
      headers,
    });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/api/v1/:path*", "/api/trpc/:path*"],
};
