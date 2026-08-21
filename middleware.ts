import { NextRequest, NextResponse } from "next/server";
import { MEMBER_SESSION_COOKIE } from "./app/members/constants";

const PROTECTED_ROUTES = [
  "/engines",
  "/projects",
  "/project",
  "/account",
  "/author",
];

// Documentation, not enforcement: gating is PROTECTED_ROUTES below plus each
// page's own server check. Kept because app/site/registry.test.ts reads this
// list out of the source to catch a page that claims to be public while
// middleware demands a session.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PUBLIC_ROUTES = [
  "/",
  // vNext: Your Builds and Your Work handle signed-out visitors themselves.
  // /builds shows server-saved builds only to a signed-in member, but both
  // pages also surface pre-vNext work that lives in the visitor's OWN browser
  // — a gate here would lock people out of their own local files.
  "/builds",
  "/library",
  // The directory and the proof pages are the front of the product — they are
  // public by definition. /shop is deliberately absent: it is a shared preview
  // and gates itself in the page, which is where preview access belongs.
  "/explore",
  "/everything",
  "/preview",
  "/about",
  "/how",
  "/build",
  "/products",
  "/live",
  "/membership",
  "/members/login",
  "/members/signup",
  "/owner",
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip API routes, static assets, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/manifest") ||
    pathname.match(/\.(js|css|png|svg|ico|webmanifest)$/)
  ) {
    return NextResponse.next();
  }

  // Protected routes: require member session
  if (isProtectedRoute(pathname)) {
    const sessionCookie = req.cookies.get(MEMBER_SESSION_COOKIE);
    if (!sessionCookie) {
      // Redirect to login, preserving intended destination (pathname is always internal from router)
      const loginUrl = new URL("/members/login", req.url);
      // Only set returnTo for safe internal paths
      if (pathname.startsWith("/")) {
        loginUrl.searchParams.set("returnTo", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except those that:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, etc (metadata files)
     */
    "/((?!_next/static|_next/image|favicon|manifest|robots|icon).*)",
  ],
};
