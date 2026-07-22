"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { ClipboardList, GraduationCap, FileText, AlertCircle } from "lucide-react";

type ExamSummary = {
  id: string;
  name: string;
  class: string;
  status: string;
  pendingMarks: number;
};

type BackendExam = {
  id: string;
  name: string;
  type?: string;
  status?: string;
  schedules?: Array<{ class?: { name?: string }; subject?: { name?: string }; examDate?: string }>;
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN:     "Super Admin",
  SCHOOL_ADMIN:    "School Admin",
  ACCOUNTANT:      "Accountant",
  TEACHER:         "Teacher",
  STUDENT:         "Student",
  PARENT:          "Parent",
  EXAM_CONTROLLER: "Exam Controller",
  HR:              "HR",
};

export default function ExamControllerDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "EXAM_CONTROLLER") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/exams");
        const payload = res.data?.data ?? res.data;
        const examsRaw = Array.isArray(payload) ? payload : [];
        const summaries: ExamSummary[] = examsRaw.map((exam: BackendExam) => {
          const schedule = exam.schedules?.[0];
          return {
            id: exam.id,
            name: exam.name,
            class: schedule?.class?.name ?? "—",
            status: exam.status ?? "DRAFT",
            pendingMarks: 0,
          };
        });
        setExams(summaries);
      } catch {
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {roleLabels.EXAM_CONTROLLER} Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Exam scheduling, grading rules, mark approval, and result publication.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Exams
            </p>
            <ClipboardList className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{exams.length}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Published
            </p>
            <FileText className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {exams.filter((e) => e.status === "PUBLISHED").length}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Drafts
            </p>
            <GraduationCap className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {exams.filter((e) => e.status === "DRAFT").length}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pending Marks
            </p>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {exams.reduce((sum, e) => sum + (e.pendingMarks ?? 0), 0)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Exams Overview</h3>
        <div className="mt-4">
          {loading && (
            <p className="text-xs text-muted-foreground">Loading exams...</p>
          )}
          {!loading && exams.length === 0 && (
            <p className="text-xs text-muted-foreground">No exams configured.</p>
          )}
          <div className="divide-y divide-border/60">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium">{exam.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exam.class}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {exam.status}
                  </p>
                  {exam.pendingMarks > 0 && (
                    <p className="text-xs text-rose-600">
                      {exam.pendingMarks} marks pending
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
