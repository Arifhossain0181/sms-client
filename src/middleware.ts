import { middleware } from "./middleware/middleware";

export { middleware };

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/teachers/:path*",
    "/classes/:path*",
    "/subjects/:path*",
    "/attendance/:path*",
    "/exams/:path*",
    "/results/:path*",
    "/fees/:path*",
    "/notices/:path*",
    "/admission/:path*",
    "/timetable/:path*",
    "/notifications/:path*",
    "/login",
    "/register",
    "/apply-for-Teaching",
  ],
};
