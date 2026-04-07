import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

const protectedRoutes = ["/admin", "/ho-so", "/lich-su"];

export default auth(async (req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // 1. Handle Protected Routes
  if (isProtectedRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/dang-nhap", nextUrl));
    }
    
    // Check Role for /admin
    if (nextUrl.pathname.startsWith("/admin") && req.auth.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl)); // or a 403 page
    }
  }

  // 2. Handle Anonymous Session
  const response = NextResponse.next();
  const anonymousId = req.cookies.get("anonymous_id")?.value;

  if (!isLoggedIn && !anonymousId) {
    const newAnonymousId = uuidv4();
    response.cookies.set("anonymous_id", newAnonymousId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
