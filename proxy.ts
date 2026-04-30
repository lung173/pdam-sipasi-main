import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  function proxy(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;

    const routeAccess: Record<string, string[]> = {
      "/dashboard/admin-staff": ["ADMIN_STAFF"],
      "/dashboard/agendaris": ["AGENDARIS"],
      "/dashboard/direktur": ["DIREKTUR"],
    };

    for (const [route, allowedRoles] of Object.entries(routeAccess)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        const dashboardMap: Record<string, string> = {
          ADMIN_STAFF: "/dashboard/admin-staff",
          AGENDARIS: "/dashboard/agendaris",
          DIREKTUR: "/dashboard/direktur",
        };
        return NextResponse.redirect(
          new URL(dashboardMap[role] ?? "/login", req.url)
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/user/:path*",
    "/api/audit-logs/:path*",
    "/api/stats/:path*",
  ],
};
