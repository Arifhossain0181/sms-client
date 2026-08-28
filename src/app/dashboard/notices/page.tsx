"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHydration } from "@/hooks/useHydration";
import NoticeCard from "@/app/modules/notice/NoticeCard";

export default function NoticesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const isHydrated = useHydration();

  useEffect(() => {
    if (!isHydrated) return;
    if (role === "STUDENT") {
      router.replace("/dashboard/student/notices");
    }
  }, [role, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role === "STUDENT") {
    return null;
  }

  return <NoticeCard />;
}
