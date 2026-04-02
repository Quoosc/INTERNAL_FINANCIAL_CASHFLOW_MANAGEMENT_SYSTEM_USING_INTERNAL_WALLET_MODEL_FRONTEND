import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// =============================================================
// Next.js Middleware - JWT Route Protection
// =============================================================

// Routes that DON'T require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/change-password", "/create-pin"];

// Static file patterns to skip
const STATIC_PATTERNS = [
  "/_next",
  "/favicon.ico",
  "/api", // API routes are handled by rewrites, not middleware
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (STATIC_PATTERNS.some((pattern) => pathname.startsWith(pattern))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Case 1: Not authenticated + trying to access protected route -> redirect to login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case 2: Authenticated + trying to access login/register -> redirect to dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Case 3: All other cases -> proceed
  return NextResponse.next();
}

export const config = {
  // Match all routes except static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
