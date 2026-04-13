import { NextRequest, NextResponse } from "next/server";
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

/**
 * Middleware for wildcard subdomain routing + Convex Auth.
 *
 * Convex Auth handles:
 * - /api/auth POST (signIn/signOut proxy)
 * - /api/auth GET (OAuth callback)
 *
 * Subdomain routing handles:
 * - `alice.mixmomnt.com` → `/[username]`
 */
export const combinedMiddleware = convexAuthNextjsMiddleware(subdomainRouter);

function subdomainRouter(req: NextRequest) {
  const hostname = req.headers.get("host") ?? "";
  const pathname = req.nextUrl.pathname;

  // Never rewrite /app routes
  if (pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  // Vercel preview/review deployment URLs: anything.vercel.app or anything.vercel.sh
  // These should NOT be rewritten as usernames — treat as the main app.
  // Production alias (mixmomnt.vercel.app) also ends in .vercel.app, skip it too.
  if (hostname.endsWith(".vercel.app") || hostname.endsWith(".vercel.sh")) {
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
  const cleanHost = hostname.split(":")[0];
  const parts = cleanHost.split(".");
  const baseDomain = parts.slice(-2).join(".");

  if (cleanHost === baseDomain) {
    return NextResponse.next();
  }
  const username = parts[0];
  const url = req.nextUrl.clone();
  url.pathname = `/${username}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export function middleware(
  req: NextRequest,
  ctx: { nextUrl: { basePath: string }; page: string }
) {
  // Next.js 15 passes (request, context) but the Convex auth middleware
  // wraps it so we need to return the middleware result directly
  return combinedMiddleware(req, ctx as never);
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
