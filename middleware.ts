import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Unprotected routes that don't need authentication
const publicRoutes = ["/giris"];

export default withAuth(
  function middleware(req) {
    // If the route is public, allow access
    if (publicRoutes.includes(req.nextUrl.pathname)) {
      return NextResponse.next();
    }

    const token = req.nextauth.token;

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/giris", req.url));
    }

    // Check user status
    if (token.status === "pending" || token.status === "blacklisted") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Check admin access for user management
    if (
      req.nextUrl.pathname.startsWith("/kurban-admin/kullanici-yonetimi") && 
      token.role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/kurban-admin/genel-bakis", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // We'll handle authorization in the middleware function
    },
  }
);

export const config = {
  matcher: ["/giris", "/kurban-admin/:path*"],
}; 