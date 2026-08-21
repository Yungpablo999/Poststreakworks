import { NextResponse, type NextRequest } from "next/server";

// CORS for /api/v1/* and /api/trpc — the Expo app calls this backend from a
// different origin (localhost:8081 in dev, a different domain in prod for
// Expo web builds). Native iOS/Android don't enforce CORS at all, but any
// browser-based caller does, and Next.js route handlers add no CORS headers
// by default — a POST handler existing doesn't make OPTIONS a real
// preflight response. Discovered by actually testing sign-in from the
// Expo web build against this backend, not by curl (which never enforces
// CORS, so it looked fine there).
//
// Reflects the request's Origin rather than hardcoding one — this is a
// first-party API for our own apps, not a public one, and the caller set is
// "wherever we deploy the frontend," which varies across dev/staging/prod.
export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-trpc-source",
    "Access-Control-Allow-Credentials": "true",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/api/v1/:path*", "/api/trpc/:path*"],
};
