import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

type Role =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "ACCOUNTANT"
  | "LIBRARIAN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "RECEPTIONIST"
  | "EXAM_CONTROLLER"
  | "HR";

const dashboardRoutes: Record<Role, string[]> = {
  SUPER_ADMIN: ["/dashboard", "/dashboard/super-admin"],
  SCHOOL_ADMIN: ["/dashboard", "/dashboard/admin", "/dashboard/students", "/dashboard/teachers", "/dashboard/class", "/dashboard/subject", "/dashboard/attendances", "/dashboard/exam", "/dashboard/result", "/dashboard/fees", "/dashboard/notices", "/dashboard/admission", "/dashboard/notification", "/dashboard/approvals", "/dashboard/hr"],
  ACCOUNTANT: ["/dashboard", "/dashboard/accountant", "/dashboard/fees", "/dashboard/notices", "/dashboard/notification"],
  LIBRARIAN: ["/dashboard", "/dashboard/librarian", "/dashboard/notices", "/dashboard/notification"],
  TEACHER: ["/dashboard", "/dashboard/teacher", "/dashboard/attendances", "/dashboard/exam", "/dashboard/result", "/dashboard/notices", "/dashboard/timetable", "/dashboard/notification"],
  STUDENT: ["/dashboard", "/dashboard/student", "/dashboard/fees", "/dashboard/notices", "/dashboard/timetable", "/dashboard/notification"],
  PARENT: ["/dashboard", "/dashboard/parent", "/dashboard/parent/children", "/dashboard/parent/attendance", "/dashboard/parent/results", "/dashboard/student", "/dashboard/result", "/dashboard/fees", "/dashboard/notices", "/dashboard/timetable", "/dashboard/notification"],
  RECEPTIONIST: ["/dashboard", "/dashboard/receptionist", "/dashboard/notices", "/dashboard/notification"],
  EXAM_CONTROLLER: ["/dashboard", "/dashboard/exam-controller", "/dashboard/exam", "/dashboard/result", "/dashboard/notices", "/dashboard/notification"],
  HR: ["/dashboard", "/dashboard/hr", "/dashboard/teachers", "/dashboard/attendances", "/dashboard/notices", "/dashboard/notification", "/dashboard/hr/recruitment", "/dashboard/hr/profiles", "/dashboard/hr/leave", "/dashboard/hr/leave-calendar", "/dashboard/hr/payroll", "/dashboard/hr/reports", "/dashboard/hr/performance", "/dashboard/hr/departments", "/dashboard/hr/documents", "/dashboard/hr/attendance"],
};

const roleRoutes: Record<Role, string[]> = {
  SUPER_ADMIN: ["/dashboard"],
  SCHOOL_ADMIN: ["/students", "/teachers", "/classes", "/subjects", "/attendance", "/exams", "/results", "/fees", "/notices", "/admission", "/notifications", "/hr"],
  ACCOUNTANT: ["/fees", "/notifications", "/hr"],
  LIBRARIAN: ["/notifications"],
  TEACHER: ["/attendance", "/exams", "/results", "/notices", "/timetable", "/notifications"],
  STUDENT: ["/results", "/fees", "/notices", "/timetable", "/notifications"],
  PARENT: ["/results", "/fees", "/notices", "/timetable", "/notifications"],
  RECEPTIONIST: ["/notices", "/notifications"],
  EXAM_CONTROLLER: ["/exams", "/results", "/notices", "/notifications"],
  HR: ["/teachers", "/attendance", "/notices", "/notifications", "/hr", "/recruitment"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (accessToken) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!accessToken) {
    if (refreshToken) {
      try {
        const refreshRes = await fetch(
          "${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: "refreshToken=${refreshToken}",
            },
            credentials: "include",
            body: JSON.stringify({ refreshToken }),
          }
        );

        if (refreshRes.ok) {
          const response = NextResponse.next();
          const setCookie = refreshRes.headers.get("set-cookie");
          if (setCookie) response.headers.set("set-cookie", setCookie);
          return response;
        }
      } catch {
        // Refresh failed
      }
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decoded = jwtDecode<{ role: string; exp: number }>(accessToken);

    if (decoded.exp * 1000 < Date.now()) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = decoded.role as Role;

    if (pathname.startsWith("/dashboard/")) {
      const allowed = dashboardRoutes[role] || [];
      const hasAccess = allowed.some((r) => pathname === r || pathname.startsWith(`${r}/`));

      if (!hasAccess) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      return NextResponse.next();
    }

    const allowed = roleRoutes[role] || [];
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
