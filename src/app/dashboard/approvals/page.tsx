"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { ArrowLeft, ShieldCheck, AlertTriangle, UserCheck, XCircle } from "lucide-react";
import Link from "next/link";

type CriticalAction = {
  id: string;
  actionType: string;
  staffId: string;
  staffName: string;
  reason: string;
  status: string;
  details?: any;
  reviewComment?: string;
  createdAt: string;
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

export default function ApprovalsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [actions, setActions] = useState<CriticalAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/hr/critical-actions");
      const payload = res.data?.data ?? res.data;
      setActions(Array.isArray(payload) ? payload : []);
    } catch {
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    const comment = prompt("Approval comment (optional):");
    try {
      await api.patch(`/hr/critical-actions/${id}/approve`, { reviewComment: comment });
      load();
    } catch {
      alert("Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    const comment = prompt("Rejection reason:");
    if (comment === null) return;
    try {
      await api.patch(`/hr/critical-actions/${id}/reject`, { reviewComment: comment });
      load();
    } catch {
      alert("Failed to reject");
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
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Pending Approvals</h1>
        <p className="text-muted-foreground mt-1">
          Critical HR actions requiring your approval
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : actions.length === 0 ? (
          <div className="text-center py-8">
            <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((action) => (
              <div key={action.id} className="rounded-xl border border-border/60 bg-background p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium capitalize">{action.actionType.replace(/_/g, " ")}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Staff: <span className="font-medium text-foreground">{action.staffName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{action.reason}</p>
                      {action.details && (
                        <pre className="mt-2 text-xs bg-white/50 p-2 rounded-lg overflow-auto max-w-md">
                          {JSON.stringify(action.details, null, 2)}
                        </pre>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Requested: {new Date(action.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(action.status)}
                    {action.status === "PENDING" && (
                      <>
                        <button onClick={() => handleApprove(action.id)} className="flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200">
                          <UserCheck className="h-3 w-3" /> Approve
                        </button>
                        <button onClick={() => handleReject(action.id)} className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200">
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
