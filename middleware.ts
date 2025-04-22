import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Unprotected routes that don't need authentication
const publicRoutes = ["/giris"];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/kurban-admin");
    const isUserManagementRoute = req.nextUrl.pathname.startsWith("/kurban-admin/kullanici-yonetimi");

    // If the route is public, allow access
    if (publicRoutes.includes(req.nextUrl.pathname)) {
      return NextResponse.next();
    }

    // Kullanıcı giriş yapmamışsa ve admin sayfasına erişmeye çalışıyorsa
    if (!token && isAdminRoute) {
      return NextResponse.redirect(new URL("/giris", req.url));
    }

    // Kullanıcı admin değilse ve kullanıcı yönetimi sayfasına erişmeye çalışıyorsa
    if (token?.role !== "admin" && isUserManagementRoute) {
      return NextResponse.redirect(new URL("/kurban-admin/genel-bakis", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Admin sayfaları için token gerekli
        if (req.nextUrl.pathname.startsWith("/kurban-admin")) {
          return !!token;
        }
        // Diğer sayfalar için her zaman izin ver
        return true;
      }
    },
  }
);

export const config = {
  matcher: ["/kurban-admin/:path*"]
}; 