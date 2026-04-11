import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // 1. JWT Decoded Payload is automatically verified by withAuth and attached
    const role = req.nextauth.token?.role as string | undefined;
    const path = req.nextUrl.pathname;

    // 2. Strict Role Segregation (403 Forbidden checks)
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    
    if (path.startsWith("/doctor") && role !== "DOCTOR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/patient") && !role) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // User must be logged in overall
    },
  }
);

// 3. Define the matcher pattern for Edge optimization (don't run on public routes)
export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/patient/:path*",
    "/settings/:path*"
  ]
};
