// proxy.ts — Next.js 16 proxy (replaces middleware.ts)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  // Jika belum login → redirect ke /login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;

  // Mapping: route prefix → role yang diizinkan
  const routeAccess: Record<string, string[]> = {
    "/dashboard/staff":    ["ADMIN_STAFF"],
    "/dashboard/admin":    ["AGENDARIS"],
    "/dashboard/direktur": ["DIREKTUR"],
  };

  // Dashboard redirect berdasarkan role
  const dashboardMap: Record<string, string> = {
    ADMIN_STAFF: "/dashboard/staff",
    AGENDARIS:   "/dashboard/admin",
    DIREKTUR:    "/dashboard/direktur",
  };

  // Cek apakah user mencoba akses route yang bukan miliknya
  for (const [route, allowedRoles] of Object.entries(routeAccess)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
      return NextResponse.redirect(
        new URL(dashboardMap[role] ?? "/login", req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/user/:path*",
    "/api/audit-logs/:path*",
    "/api/stats/:path*",
  ],
};
