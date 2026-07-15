"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import StudentList from "@/app/modules/student/StudentList";

export default function StudentsPage() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (role !== "SCHOOL_ADMIN") return null;

  return <StudentList />;
}
