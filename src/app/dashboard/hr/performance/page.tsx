"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Star, Plus } from "lucide-react";

type Review = {
  id: string;
  reviewDate: string;
  rating: string;
  strengths?: string;
  areasToImprove?: string;
  comments?: string;
  staff: { name: string; employeeId: string };
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
  EXAM_CONTROLLER: "Exam Controller",
  HR: "HR",
};

const ratingColors: Record<string, string> = {
  EXCELLENT: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-sky-100 text-sky-700",
  SATISFACTORY: "bg-amber-100 text-amber-700",
  NEEDS_IMPROVEMENT: "bg-orange-100 text-orange-700",
  POOR: "bg-red-100 text-red-700",
};

export default function PerformancePage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/hr/performance");
        const payload = res.data?.data ?? res.data;
        setReviews(payload ?? []);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Performance Appraisals</h1>
        <p className="text-muted-foreground mt-1">
          Schedule and record staff performance reviews
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : reviews.length === 0 ? (
          <p className="text-xs text-muted-foreground">No performance reviews found.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-border/60 bg-background p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.staff.name}</p>
                    <p className="text-xs text-muted-foreground">{r.staff.employeeId}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ratingColors[r.rating] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {r.rating}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(r.reviewDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {r.strengths && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Strengths:</span> {r.strengths}
                  </p>
                )}
                {r.areasToImprove && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium">Areas to improve:</span> {r.areasToImprove}
                  </p>
                )}
                {r.comments && (
                  <p className="mt-1 text-xs text-muted-foreground italic">{r.comments}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
