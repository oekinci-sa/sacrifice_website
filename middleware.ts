import { resolveTenantIdFromHost } from "@/lib/tenant-resolver";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicRoutes = ["/giris"];

// OAuth cookie'lerinin çalışması için subdomain → localhost yönlendirmesi
// (kahramankazan.localhost:3001 ile localhost:3001 farklı origin, state mismatch olur)
const SUBDOMAIN_TO_PORT: Record<string, number> = {
  "golbasi.localhost": 3000,
  "kahramankazan.localhost": 3001,
};

export default withAuth(
  function middleware(req) {
    const host = req.headers.get("host") ?? "";
    const hostWithoutPort = host.split(":")[0];
    const port = host.includes(":") ? host.split(":")[1] : null;

    // Subdomain kullanılıyorsa localhost:port'a yönlendir (OAuth uyumluluğu)
    const targetPort = SUBDOMAIN_TO_PORT[hostWithoutPort];
    if (targetPort !== undefined) {
      const url = new URL(req.url);
      url.host = `localhost:${targetPort}`;
      return NextResponse.redirect(url, 307);
    }

    const tenantId = resolveTenantIdFromHost(host);

    if (!tenantId) {
      return NextResponse.json(
        { error: "Bilinmeyen tenant. localhost:3000 (test), localhost:3001 (kahramankazan) veya localhost:3002 (golbasi) kullanın." },
        { status: 404 }
      );
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-tenant-id", tenantId);

    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/kurban-admin");
    const isUserManagementRoute = req.nextUrl.pathname.startsWith("/kurban-admin/kullanici-yonetimi");
    const isReservationsRoute = req.nextUrl.pathname.startsWith("/kurban-admin/rezervasyonlar");
    const isTenantSettingsRoute = req.nextUrl.pathname.startsWith("/kurban-admin/tenant-ayarlari");

    if (publicRoutes.includes(req.nextUrl.pathname)) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (!token && isAdminRoute) {
      return NextResponse.redirect(new URL("/giris", req.url));
    }

    if (token && isAdminRoute && token.status !== "approved" && token.role !== "super_admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (token?.role !== "admin" && token?.role !== "super_admin" && isUserManagementRoute) {
      return NextResponse.redirect(new URL("/kurban-admin/genel-bakis", req.url));
    }

    if (
      token?.role !== "admin" &&
      token?.role !== "editor" &&
      token?.role !== "super_admin" &&
      isReservationsRoute
    ) {
      return NextResponse.redirect(new URL("/kurban-admin/genel-bakis", req.url));
    }

    if (token?.role !== "super_admin" && isTenantSettingsRoute) {
      return NextResponse.redirect(new URL("/kurban-admin/genel-bakis", req.url));
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/kurban-admin")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/api/:path*",
    "/kurban-admin/:path*",
    "/giris",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
