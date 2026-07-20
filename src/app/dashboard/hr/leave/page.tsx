"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { FileCheck, Clock, XCircle, CheckCircle, Search } from "lucide-react";

type LeaveRecord = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  rejectionReason?: string;
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

export default function LeavePage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/hr/leave${filter ? `?status=${filter}` : ""}`);
        const payload = res.data?.data ?? res.data;
        setLeaves(payload.leaves ?? []);
      } catch {
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await api.patch(`/hr/leave/${id}/approve`, { approved, rejectionReason: "" });
      const res = await api.get(`/hr/leave${filter ? `?status=${filter}` : ""}`);
      const payload = res.data?.data ?? res.data;
      setLeaves(payload.leaves ?? []);
    } catch {
      alert("Failed to update leave request");
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      PENDING: { cls: "bg-amber-100 text-amber-700", label: "Pending" },
      APPROVED: { cls: "bg-emerald-100 text-emerald-700", label: "Approved" },
      REJECTED: { cls: "bg-red-100 text-red-700", label: "Rejected" },
    };
    const s = map[status] ?? { cls: "bg-gray-100 text-gray-700", label: status };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground mt-1">
          View and approve or reject staff leave requests
        </p>
      </div>

      <div className="flex gap-2">
        {["", "PENDING", "APPROVED", "REJECTED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-card border border-border/60 hover:bg-white/5"
            }`}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : leaves.length === 0 ? (
          <p className="text-xs text-muted-foreground">No leave requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 font-medium">Staff</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Start Date</th>
                  <th className="pb-2 font-medium">End Date</th>
                  <th className="pb-2 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3">
                      <p className="font-medium">{l.staff.name}</p>
                      <p className="text-xs text-muted-foreground">{l.staff.employeeId}</p>
                    </td>
                    <td className="py-3">{l.leaveType}</td>
                    <td className="py-3 text-xs">{new Date(l.startDate).toLocaleDateString()}</td>
                    <td className="py-3 text-xs">{new Date(l.endDate).toLocaleDateString()}</td>
                    <td className="py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {l.reason ?? "—"}
                    </td>
                    <td className="py-3">{getStatusBadge(l.status)}</td>
                    <td className="py-3">
                      {l.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(l.id, true)}
                            className="rounded-lg p-1.5 hover:bg-emerald-100"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Rejection reason:");
                              if (reason !== null) handleApprove(l.id, false);
                            }}
                            className="rounded-lg p-1.5 hover:bg-red-100"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      )}
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
