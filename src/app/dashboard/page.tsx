"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/tyPes/auth.tyPes";

export default function DashboardIndex() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (!role) return;

    const roleRedirects: Record<Role, string> = {
      SUPER_ADMIN: "/dashboard/super-admin",
      SCHOOL_ADMIN: "/dashboard/school-admin",
      ACCOUNTANT: "/dashboard/accountant",
      TEACHER: "/dashboard/teacher",
      STUDENT: "/dashboard/student",
      PARENT: "/dashboard/parent",
      EXAM_CONTROLLER: "/dashboard/exam-controller",
      HR: "/dashboard/hr",
    };

    const target = roleRedirects[role];
    if (target) {
      router.replace(target);
    } else {
      router.replace("/dashboard");
    }
  }, [role, router]);

  return null;
}
