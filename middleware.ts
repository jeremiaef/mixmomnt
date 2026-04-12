import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for wildcard subdomain routing.
 *
 * - `mixmomnt.com` and `app.mixmomnt.com` pass through unchanged.
 * - Any other subdomain (e.g. `alice.mixmomnt.com`) is rewritten to `/[username]`.
 * - `username.localhost:3000` is rewritten to `/[username]` for local development.
 * - `/app` routes are never rewritten.
 */
export function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") ?? "";
  const pathname = req.nextUrl.pathname;

  // Never rewrite /app routes
  if (pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  const isLocalhost = hostname.includes("localhost:3000");

  if (isLocalhost) {
    // username.localhost:3000 → /[username]
    const match = hostname.match(/^([^.]+)\.localhost:3000$/);
    if (match) {
      const username = match[1];
      const url = req.nextUrl.clone();
      url.pathname = `/${username}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Production subdomain routing
  const PROTECTED_DOMAINS = new Set(["mixmomnt.com", "app.mixmomnt.com"]);

  // Strip port if present for production hostnames
  const cleanHost = hostname.split(":")[0];
  // e.g. "alice.mixmomnt.com" → ["alice", "mixmomnt.com"]
  const parts = cleanHost.split(".");

  if (parts.length >= 2) {
    const baseDomain = parts.slice(-2).join(".");
    if (PROTECTED_DOMAINS.has(baseDomain)) {
      // Top-level domain — pass through
      return NextResponse.next();
    }
    // Unknown subdomain — treat first segment as username
    const username = parts[0];
    const url = req.nextUrl.clone();
    url.pathname = `/${username}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
