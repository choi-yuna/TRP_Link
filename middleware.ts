import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS = process.env.AUTH_COOKIE ?? "access_token";

// /login은 열어두고, (protected)·/dashboard·/users만 보호
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/(protected)");

  if (isProtected) {
    const token = req.cookies.get(ACCESS)?.value;
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/users/:path*", "/(protected)/(.*)"],
};
