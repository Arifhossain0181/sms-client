"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function FeesPage() {
  const router = useRouter();
  const { role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (role === "STUDENT") {
      router.replace("/dashboard/student/fees");
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

  // Staff view - render the existing FeeList component
  const { default: FeeList } = require("@/app/modules/fees/FeeList");
  return <FeeList />;
}
