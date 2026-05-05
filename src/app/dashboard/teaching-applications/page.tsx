"use client";

import TeachingApplicationList from "@/app/modules/teachingApplication/TeachingApplicationList";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeachingApplicationsPage() {
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (role !== "ADMIN") return null;

  return <TeachingApplicationList />;
}
