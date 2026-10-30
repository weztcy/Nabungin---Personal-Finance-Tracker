import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/accounts",
  "/categories",
  "/budgets",
  "/goals",
  "/recurring",
  "/reports",
  "/settings",
];

const AUTH_PAGES = ["/sign-in", "/sign-up"];

/**
 * Next.js 16 mengganti `middleware.ts` → `proxy.ts` (fungsi `proxy`).
 * Di sini kita melakukan OPTIMISTIC check berbasis cookie saja.
 * Validasi sesungguhnya tetap dilakukan di server (requireSession) per halaman/route.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected && !sessionCookie) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/accounts/:path*",
    "/categories/:path*",
    "/budgets/:path*",
    "/goals/:path*",
    "/recurring/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
