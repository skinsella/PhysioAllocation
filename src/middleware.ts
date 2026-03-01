import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight middleware that checks for session cookie presence.
// Actual session validation and role checks happen in server component layouts.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes - always allow
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin-login") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (set by next-auth)
  const sessionToken =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");

  if (!sessionToken) {
    // Not logged in - redirect to appropriate login page
    if (pathname.startsWith("/admin") || pathname.startsWith("/coordinator")) {
      return NextResponse.redirect(new URL("/admin-login", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
