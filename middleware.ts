import { NextRequest, NextResponse } from "next/server";
import { MEMBER_SESSION_COOKIE } from "./app/members/auth";

const PROTECTED_ROUTES = [
  "/engines",
  "/projects",
  "/project",
  "/account",
  "/author",
];

const PUBLIC_ROUTES = [
  "/",
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

function isPublicRoute(pathname: string): boolean {
  // Check exact matches and prefixes
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

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
      // Redirect to login, preserving intended destination
      const loginUrl = new URL("/members/login", req.url);
      loginUrl.searchParams.set("returnTo", pathname);
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
