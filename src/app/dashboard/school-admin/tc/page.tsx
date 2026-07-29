"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import api from "@/lib/axios";
import { classService } from "@/app/modules/class/class.service";
import { motion } from "framer-motion";
import {
  FileBadge,
  Search,
  Loader2,
  GraduationCap,
  RefreshCw,
  Download,
  UserCheck,
  CalendarDays,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Student = {
  id: string;
  name: string;
  email?: string;
  rollNumber?: string;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
  isActive?: boolean;
};

type TCRecord = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  className: string;
  sectionName: string;
  rollNumber: string | null;
  issueDate: string | null;
  reason: string | null;
  createdAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Skel({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block rounded bg-muted/60 animate-pulse ${className}`} />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolAdminTCPage() {
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  // ── Role guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const canGenerateTC = role ? hasPermission(role, "generate_tc") : false;

  // ── State ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch classes ─────────────────────────────────────────────────────────
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  // ── Fetch active students for selection ────────────────────────────────────
  const { data: allStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students", "tc-search", search],
    queryFn: async () => {
      const res = await api.get("/students", {
        params: { search },
      });
      const d = res.data?.data ?? res.data ?? {};
      return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
    },
    enabled: canGenerateTC,
  });

  const activeStudents = useMemo(
    () => allStudents.filter((s: Student) => s.isActive !== false),
    [allStudents]
  );

  // ── Fetch TC records ──────────────────────────────────────────────────────
  const { data: tcRecords = [], isLoading: tcsLoading, refetch } = useQuery({
    queryKey: ["tc-records"],
    queryFn: async () => {
      const res = await api.get("/tc/all");
      const d = res.data?.data ?? res.data ?? [];
      return Array.isArray(d) ? d : [];
    },
    enabled: canGenerateTC,
  });

  // ── useMemo: derived values ───────────────────────────────────────────────
  const totalTCIssued = useMemo(() => tcRecords.length, [tcRecords]);

  const recentTCs = useMemo(() => tcRecords.slice(0, 10), [tcRecords]);

  // ── Generate TC mutation ──────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: async (payload: { studentId: string; reason: string }) => {
      // We need to handle the PDF response as a blob
      const res = await api.post("/tc/generate", payload, { responseType: "blob" });
      return res.data as Blob;
    },
    onSuccess: (blob, variables) => {
      // Download the PDF
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TC_${variables.studentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("TC generated and downloaded successfully");
      setSelectedStudentId("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["tc-records"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? "Failed to generate TC";
      toast.error(msg);
    },
    onSettled: () => setActionLoading(false),
  });

  const handleGenerate = () => {
    if (!selectedStudentId || !reason.trim()) return;
    setActionLoading(true);
    generateMutation.mutate({
      studentId: selectedStudentId,
      reason: reason.trim(),
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!canGenerateTC) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Transfer Certificate
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Issue transfer certificates for students leaving the school.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          {
            label: "TC Issued",
            value: totalTCIssued,
            color: "text-foreground",
            bg: "bg-secondary/60",
            icon: FileBadge,
          },
          {
            label: "Active Students",
            value: activeStudents.length,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            icon: UserCheck,
          },
          {
            label: "Classes",
            value: classes.length,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-50 dark:bg-violet-950/30",
            icon: GraduationCap,
          },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {tcsLoading || studentsLoading ? (
                <Skel className="w-10 h-7 inline-block" />
              ) : (
                value
              )}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Generate TC card */}
      {canGenerateTC && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base">Issue New TC</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Student search/select */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search active student by name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedStudentId("");
                }}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Student dropdown */}
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select Student</option>
              {activeStudents.map((s: Student) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.class?.name ? `(${s.class.name}` : ""}
                  {s.section?.name ? ` - ${s.section.name}` : ""}
                  {")"}
                </option>
              ))}
            </select>

            {/* Reason */}
            <input
              type="text"
              placeholder="Reason for leaving"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1 min-w-[180px]"
            />

            <button
              onClick={handleGenerate}
              disabled={!selectedStudentId || !reason.trim() || actionLoading || generateMutation.isPending}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {actionLoading || generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Generate TC
            </button>
          </div>
        </motion.div>
      )}

      {/* TC Records table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/40">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Student
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                  Class
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">
                  Section
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">
                  Issue Date
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Reason
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {tcsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skel className="w-28 h-4" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skel className="w-20 h-4" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-16 h-4" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-24 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-32 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-8 h-8 rounded" /></td>
                  </tr>
                ))
              ) : recentTCs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <FileBadge className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No TC records found.</p>
                  </td>
                </tr>
              ) : (
                recentTCs.map((tc) => (
                  <tr key={tc.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">{tc.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {tc.studentEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium hidden md:table-cell">
                      {tc.className}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground hidden lg:table-cell">
                      {tc.sectionName}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        {tc.issueDate ? fmt(tc.issueDate) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground max-w-[200px] truncate">
                      {tc.reason ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          api
                            .get(`/tc/${tc.studentId}/download`, {
                              responseType: "blob",
                            })
                            .then((res) => {
                              const blob = res.data as Blob;
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `TC_${tc.studentId}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                            })
                            .catch(() => toast.error("Failed to download TC"));
                        }}
                        className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center ml-auto transition-colors"
                        title="Download TC"
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!tcsLoading && recentTCs.length > 0 && (
          <div className="px-5 py-4 border-t border-border/60 flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">
              Showing {recentTCs.length} of {totalTCIssued} records
            </span>
            <span className="text-xs text-muted-foreground">
              {totalTCIssued} total issued
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
