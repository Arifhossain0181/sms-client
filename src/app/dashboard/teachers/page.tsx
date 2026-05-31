"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import TeacherList from "@/app/modules/teachers/teacherlist";

export default function TeachersPage() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (role !== "ADMIN") return null;

  return <TeacherList />;
}
