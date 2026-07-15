"use client";

import { useState, useEffect } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/tyPes/auth.tyPes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [bannerMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const msg = window.localStorage.getItem("redirectMessage");
    if (msg) {
      window.localStorage.removeItem("redirectMessage");
    }
    return msg;
  });

  useEffect(() => {
    if (!role) return;

    const isSuperAdmin = role === "SUPER_ADMIN";

    // Super admin can access everything
    if (isSuperAdmin) return;

    const routeRoleMap: { prefix: string; allowedRole: Role; label: string }[] = [
      { prefix: "/dashboard/school-admin", allowedRole: "SCHOOL_ADMIN", label: "School Admin" },
      { prefix: "/dashboard/accountant", allowedRole: "ACCOUNTANT", label: "Accountant" },
      { prefix: "/dashboard/teacher", allowedRole: "TEACHER", label: "Teacher" },
      { prefix: "/dashboard/parent", allowedRole: "PARENT", label: "Parent" },
      { prefix: "/dashboard/exam-controller", allowedRole: "EXAM_CONTROLLER", label: "Exam Controller" },
      { prefix: "/dashboard/hr", allowedRole: "HR", label: "HR" },
      { prefix: "/dashboard/super-admin", allowedRole: "SUPER_ADMIN", label: "Super Admin" },
    ];

    for (const { prefix, allowedRole, label } of routeRoleMap) {
      if (pathname?.startsWith(prefix) && role !== allowedRole) {
        window.localStorage.setItem(
          "redirectMessage",
          `You do not have permission to view the ${label} pages.`
        );
        router.replace("/dashboard");
        return;
      }
    }

    // Student approval check
    if (pathname?.startsWith("/dashboard/student")) {
      if (role !== "STUDENT" && role !== "PARENT") {
        window.localStorage.setItem("redirectMessage", "You do not have permission to view student pages.");
        router.replace("/dashboard");
        return;
      }

      if (role === "STUDENT") {
        const checkStudentApproval = async () => {
          try {
            const response = await api.get("/students/me");
            const profile = response.data?.data ?? response.data;

            if (
              profile?.pending ||
              (profile?.admissionStatus !== undefined &&
                profile.admissionStatus !== "APPROVED")
            ) {
              router.replace("/pending-approval");
              return;
            }
          } catch (error: unknown) {
            const status = (error as { response?: { status?: number } }).response?.status;
            if (status === 404) {
              window.localStorage.setItem(
                "redirectMessage",
                "Complete your admission application first to access the dashboard."
              );
              router.replace("/apply-for-admission");
              return;
            }

            window.localStorage.setItem(
              "redirectMessage",
              "We could not verify your student access right now. Please try again."
            );
            router.replace("/");
          }
        };

        void checkStudentApproval();
      }
    }
  }, [role, pathname, router]);

  if (!role) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
          <main className="flex-1 px-6 lg:px-10 py-8">
            {bannerMessage && (
              <div className="mb-4 rounded-md border border-border/60 bg-yellow-50 p-3 text-yellow-900">
                <strong className="block">Notice:</strong>
                <span>{bannerMessage}</span>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
