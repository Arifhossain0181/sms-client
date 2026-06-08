import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

const dashboardRoutes = {
  ADMIN: ["/dashboard", "/dashboard/admin", "/dashboard/students", "/dashboard/teachers", "/dashboard/class", "/dashboard/subject", "/dashboard/attendances", "/dashboard/exam", "/dashboard/result", "/dashboard/fees", "/dashboard/notices", "/dashboard/admission", "/dashboard/timetable", "/dashboard/nitfication"],
  TEACHER: ["/dashboard", "/dashboard/teacher", "/dashboard/attendances", "/dashboard/exam", "/dashboard/result", "/dashboard/notices", "/dashboard/timetable", "/dashboard/nitfication"],
  STUDENT: ["/dashboard", "/dashboard/student", "/dashboard/result", "/dashboard/fees", "/dashboard/notices", "/dashboard/timetable", "/dashboard/nitfication"],
};

const roleRoutes = {
  ADMIN: ["/students", "/teachers", "/classes", "/subjects", "/attendance", "/exams", "/results", "/fees", "/notices", "/admission", "/timetable", "/notifications"],
  TEACHER: ["/attendance", "/exams", "/results", "/notices", "/timetable", "/notifications"],
  STUDENT: ["/results", "/fees", "/notices", "/timetable", "/notifications"],
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
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: `refreshToken=${refreshToken}`,
            },
            credentials: "include",
            body: JSON.stringify({ refreshToken }),
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
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Access Token decode 
  try {
    const decoded = jwtDecode<{ role: string; exp: number }>(accessToken);

    // Expire 
    if (decoded.exp * 1000 < Date.now()) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role check
    if (pathname.startsWith("/dashboard/")) {
      const allowed = dashboardRoutes[decoded.role as keyof typeof dashboardRoutes] || [];
      const hasAccess = allowed.some((r) => pathname === r || pathname.startsWith(`${r}/`));

      if (!hasAccess) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      return NextResponse.next();
    }

    const allowed = roleRoutes[decoded.role as keyof typeof roleRoutes] || [];
    const hasAccess = allowed.some((r) => pathname.startsWith(r));

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();

  } catch {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const res = NextResponse.redirect(loginUrl);
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