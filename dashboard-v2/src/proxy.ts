import { NextRequest, NextResponse } from "next/server";
import { verifySession, sessionCookieName } from "@/lib/auth/session";

const PUBLIC_ROUTES = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // Kalau sudah login dan akses /login, redirect ke dashboard
    const token = request.cookies.get(sessionCookieName)?.value;
    if (token && pathname === "/login") {
      const valid = await verifySession(token);
      if (valid) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // Allow API auth routes
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Allow health check (untuk Docker HEALTHCHECK tanpa session)
  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  // Allow static files dan Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }

  // Check session
  const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const valid = await verifySession(token);
  if (!valid) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(sessionCookieName);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
