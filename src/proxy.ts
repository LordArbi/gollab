import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const authToken = request.cookies.get("authToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!authToken) {
    if (!isAuthPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // If logged in and trying to access login/signup, redirect to dashboard based on role
  if (isAuthPage && authToken) {
    if (userRole === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    if (userRole === "coach") return NextResponse.redirect(new URL("/coach", request.url));
    return NextResponse.redirect(new URL("/player", request.url));
  }

  // Role-based protection
  if (pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname.startsWith("/coach") && userRole !== "coach" && userRole !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname.startsWith("/player") && !userRole) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/coach/:path*",
    "/player/:path*",
    "/login",
    "/signup"
  ],
};
