"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import NoticeCard from "@/app/modules/notice/NoticeCard";

export default function NoticesPage() {
  const router = useRouter();
  const { role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (role === "STUDENT") {
      router.replace("/dashboard/student/notices");
    }
  }, [role, loading, router]);

  if (loading) {
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
