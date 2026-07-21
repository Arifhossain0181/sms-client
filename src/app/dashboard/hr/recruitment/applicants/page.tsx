"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Plus, Search, UserCheck, XCircle, Mail, Phone, MessageSquare } from "lucide-react";

type Applicant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  resumeUrl?: string;
  coverLetter?: string;
  jobPosting?: { title: string; designation: string };
  interviews: any[];
  offers: any[];
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

export default function ApplicantsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/recruitment/applicants${filter ? `?status=${filter}` : ""}`);
        const payload = res.data?.data ?? res.data;
        setApplicants(payload.applicants ?? []);
      } catch {
        setApplicants([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      APPLIED: { cls: "bg-gray-100 text-gray-700", label: "Applied" },
      SHORTLISTED: { cls: "bg-sky-100 text-sky-700", label: "Shortlisted" },
      REJECTED: { cls: "bg-red-100 text-red-700", label: "Rejected" },
      OFFERED: { cls: "bg-violet-100 text-violet-700", label: "Offered" },
      ACCEPTED: { cls: "bg-emerald-100 text-emerald-700", label: "Accepted" },
      DECLINED: { cls: "bg-red-100 text-red-700", label: "Declined" },
    };
    const s = map[status] ?? { cls: "bg-gray-100 text-gray-700", label: status };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/recruitment/applicants/${id}/status`, { status });
      const res = await api.get(`/recruitment/applicants${filter ? `?status=${filter}` : ""}`);
      const payload = res.data?.data ?? res.data;
      setApplicants(payload.applicants ?? []);
    } catch {
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Applicants</h1>
          <p className="text-muted-foreground mt-1">Track and manage job applicants</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/hr/recruitment/applicants/new")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Applicant
        </button>
      </div>

      <div className="flex gap-2">
        {["", "APPLIED", "SHORTLISTED", "OFFERED", "ACCEPTED", "REJECTED", "DECLINED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-primary text-white" : "bg-card border border-border/60 hover:bg-white/5"
            }`}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : applicants.length === 0 ? (
          <p className="text-xs text-muted-foreground">No applicants found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Phone</th>
                  <th className="pb-2 font-medium">Job</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {applicants.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 font-medium">{a.name}</td>
                    <td className="py-3 text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{a.email}</td>
                    <td className="py-3 text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{a.phone ?? "—"}</td>
                    <td className="py-3 text-xs">{a.jobPosting?.title ?? "—"}</td>
                    <td className="py-3">{getStatusBadge(a.status)}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === "APPLIED" && (
                          <button onClick={() => updateStatus(a.id, "SHORTLISTED")} className="rounded-lg p-1.5 hover:bg-sky-100" title="Shortlist"><UserCheck className="h-4 w-4 text-sky-500" /></button>
                        )}
                        {a.status === "SHORTLISTED" && (
                          <button onClick={() => router.push(`/dashboard/hr/recruitment/interviews/new?applicantId=${a.id}`)} className="rounded-lg p-1.5 hover:bg-emerald-100" title="Schedule Interview"><MessageSquare className="h-4 w-4 text-emerald-500" /></button>
                        )}
                        {(a.status === "SHORTLISTED" || a.status === "INTERVIEWED") && (
                          <button onClick={() => updateStatus(a.id, "REJECTED")} className="rounded-lg p-1.5 hover:bg-red-100" title="Reject"><XCircle className="h-4 w-4 text-red-500" /></button>
                        )}
                        {a.interviews?.length > 0 && (
                          <button onClick={() => router.push(`/dashboard/hr/recruitment/applicants/${a.id}`)} className="text-xs text-primary hover:underline">Details</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
