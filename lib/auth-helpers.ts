// lib/auth-helpers.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { ApiResponse } from "@/types";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/** Ambil session user dari server component / route handler */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/** Middleware: pastikan user sudah login */
export async function requireAuth(
  req: NextRequest,
  handler: (user: SessionUser, req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }
  return handler(user, req);
}

/** Middleware: pastikan user memiliki role tertentu */
export async function requireRole(
  req: NextRequest,
  roles: UserRole[],
  handler: (user: SessionUser, req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized." },
      { status: 401 }
    );
  }
  if (!roles.includes(user.role)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden. Anda tidak memiliki akses ke resource ini." },
      { status: 403 }
    );
  }
  return handler(user, req);
}

/** Helper: success response */
export function successResponse<T>(data: T, message?: string, status = 200): NextResponse {
  return NextResponse.json<ApiResponse<T>>({ success: true, data, message }, { status });
}

/** Helper: error response */
export function errorResponse(error: string, status = 400): NextResponse {
  return NextResponse.json<ApiResponse>({ success: false, error }, { status });
}

/** Extract IP dari request */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
