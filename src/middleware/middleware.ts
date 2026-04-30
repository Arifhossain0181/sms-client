import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

const roleRoutes = {
  ADMIN:   ["/dashboard", "/students", "/teachers", "/classes", "/subjects", "/attendance", "/exams", "/results", "/fees", "/notices", "/admission", "/timetable", "/notifications"],
  TEACHER: ["/dashboard", "/attendance", "/exams", "/results", "/notices", "/timetable", "/notifications"],
  STUDENT: ["/dashboard", "/results", "/fees", "/notices", "/timetable", "/notifications"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Access Token cookie 
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // Login/Register page
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (accessToken) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Access Token 
  if (!accessToken) {
    // Refresh Token 
    if (refreshToken) {
      // Backend এ refresh 
      try {
        const refreshRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {
            method: "POST",
            headers: { Cookie: `refreshToken=${refreshToken}` },
            credentials: "include",
          }
        );

        if (refreshRes.ok) {
          //  cookie 
          const response = NextResponse.next();
          const setCookie = refreshRes.headers.get("set-cookie");
          if (setCookie) response.headers.set("set-cookie", setCookie);
          return response;
        }
      } catch {
        // Refresh failed
      }
    }

    // → login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Access Token decode 
  try {
    const decoded = jwtDecode<{ role: string; exp: number }>(accessToken);

    // Expire 
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role check
    const allowed = roleRoutes[decoded.role as keyof typeof roleRoutes] || [];
    const hasAccess = allowed.some((r) => pathname.startsWith(r));

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();

  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("accessToken");
    res.cookies.delete("refreshToken");
    return res;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/students/:path*", "/teachers/:path*",
    "/classes/:path*", "/subjects/:path*", "/attendance/:path*",
    "/exams/:path*", "/results/:path*", "/fees/:path*",
    "/notices/:path*", "/admission/:path*", "/timetable/:path*",
    "/notifications/:path*", "/login", "/register",
  ],
};