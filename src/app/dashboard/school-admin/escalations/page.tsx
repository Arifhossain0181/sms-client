"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Loader2,
  UserCheck,
  UserX,
  Briefcase,
  CalendarDays,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type CriticalAction = {
  id: string;
  actionType: string;
  staffId: string;
  staffName: string;
  reason: string;
  details?: Record<string, any>;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy: string;
  reviewedBy?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
};

type ActionTypeConfig = {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
};

const ACTION_TYPES: Record<string, ActionTypeConfig> = {
  TERMINATION: {
    label: "Termination",
    icon: UserX,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    description: "Staff termination request",
  },
  RESIGNATION: {
    label: "Resignation",
    icon: UserCheck,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    description: "Staff resignation",
  },
  SALARY_REVISION: {
    label: "Salary Revision",
    icon: Briefcase,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    description: "Salary structure change",
  },
  LEAVE: {
    label: "Leave Approval",
    icon: CalendarDays,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    description: "Leave request approval",
  },
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

function getActionConfig(actionType: string): ActionTypeConfig {
  return (
    ACTION_TYPES[actionType] ?? {
      label: actionType,
      icon: FileText,
      color: "text-foreground",
      bg: "bg-secondary/60",
      description: "Critical action",
    }
  );
}

function getStatusConfig(status: string): { label: string; color: string; bg: string; icon: React.ElementType } {
  switch (status) {
    case "PENDING":
      return { label: "Pending", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", icon: AlertCircle };
    case "APPROVED":
      return { label: "Approved", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: CheckCircle2 };
    case "REJECTED":
      return { label: "Rejected", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", icon: XCircle };
    default:
      return { label: status, color: "text-muted-foreground", bg: "bg-secondary/60", icon: AlertCircle };
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function DetailModal({
  action,
  onClose,
  onApprove,
  onReject,
  actionLoading,
  showComment,
  setShowComment,
  comment,
  setComment,
}: {
  action: CriticalAction;
  onClose: () => void;
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment: string) => void;
  actionLoading: boolean;
  showComment: boolean;
  setShowComment: (v: boolean) => void;
  comment: string;
  setComment: (v: string) => void;
}) {
  const actionConfig = getActionConfig(action.actionType);
  const statusConfig = getStatusConfig(action.status);
  const StatusIcon = statusConfig.icon;
  const ActionIcon = actionConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <ActionIcon className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base">{actionConfig.label} Request</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {fmt(action.createdAt)}
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-secondary/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Staff Member</p>
              <p className="text-sm font-medium">{action.staffName}</p>
              <p className="text-xs text-muted-foreground">ID: {action.staffId}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Reason</p>
              <p className="text-sm">{action.reason}</p>
            </div>

            {action.details && Object.keys(action.details).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Additional Details</p>
                <div className="bg-secondary/40 rounded-xl p-3 text-xs font-mono">
                  {JSON.stringify(action.details, null, 2)}
                </div>
              </div>
            )}

            {action.reviewComment && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Review Comment</p>
                <p className="text-sm">{action.reviewComment}</p>
              </div>
            )}
          </div>

          {action.status === "PENDING" && (
            <div className="space-y-3 pt-2">
              {!showComment ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => onApprove(action.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => setShowComment(true)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    placeholder="Reason for rejection (required)…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowComment(false); setComment(""); }}
                      className="flex-1 text-sm py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onReject(action.id, comment)}
                      disabled={!comment.trim() || actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolAdminEscalationsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  // ── Role guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [selectedAction, setSelectedAction] = useState<CriticalAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectComment, setShowRejectComment] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  // ── Fetch escalations ──────────────────────────────────────────────────────
  const { data: escalations = [], isLoading, refetch } = useQuery({
    queryKey: ["escalations", statusFilter],
    queryFn: async () => {
      const res = await api.get("/hr/critical-actions");
      const d = res.data?.data ?? res.data ?? [];
      let list = Array.isArray(d) ? d : [];
      if (statusFilter !== "ALL") {
        list = list.filter((a: CriticalAction) => a.status === statusFilter);
      }
      return list as CriticalAction[];
    },
    enabled: role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN",
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const res = await api.patch(`/hr/critical-actions/${id}/approve`, { reviewComment: comment });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      toast.success("Escalation approved");
      setSelectedAction(null);
      queryClient.invalidateQueries({ queryKey: ["escalations"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to approve");
      toast.error(msg);
    },
    onSettled: () => setActionLoading(false),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const res = await api.patch(`/hr/critical-actions/${id}/reject`, { reviewComment: comment });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      toast.success("Escalation rejected");
      setSelectedAction(null);
      setShowRejectComment(false);
      setRejectComment("");
      queryClient.invalidateQueries({ queryKey: ["escalations"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to reject");
      toast.error(msg);
    },
    onSettled: () => setActionLoading(false),
  });

  // ── useMemo: derived values ────────────────────────────────────────────────
  const filterKey = search.toLowerCase().replace(/[^a-z0-9]/g, "");

  const filtered = useMemo(() => {
    if (!filterKey) return escalations;
    return escalations.filter((a) => {
      const hay = `${a.staffName} ${a.actionType} ${a.reason} ${a.reviewComment ?? ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      return hay.includes(filterKey);
    });
  }, [escalations, filterKey]);

  const totalPending = useMemo(() => escalations.filter((a) => a.status === "PENDING").length, [escalations]);
  const totalApproved = useMemo(() => escalations.filter((a) => a.status === "APPROVED").length, [escalations]);
  const totalRejected = useMemo(() => escalations.filter((a) => a.status === "REJECTED").length, [escalations]);

  const handleApprove = (id: string, comment?: string) => {
    setActionLoading(true);
    approveMutation.mutate({ id, comment });
  };

  const handleReject = (id: string, comment: string) => {
    setActionLoading(true);
    rejectMutation.mutate({ id, comment });
  };

  const openDetail = (action: CriticalAction) => {
    setSelectedAction(action);
    setShowRejectComment(false);
    setRejectComment("");
  };

  const closeDetail = () => {
    setSelectedAction(null);
    setShowRejectComment(false);
    setRejectComment("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Escalations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review and approve or reject critical staff action requests.
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
            label: "Pending",
            value: totalPending,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/30",
            icon: AlertCircle,
          },
          {
            label: "Approved",
            value: totalApproved,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            icon: CheckCircle2,
          },
          {
            label: "Rejected",
            value: totalRejected,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-950/30",
            icon: XCircle,
          },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {isLoading ? <Skel className="w-10 h-7 inline-block" /> : value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 flex-wrap"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by staff, action type, or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-2.5 rounded-xl font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
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
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Action</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Staff</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Reason</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skel className="w-20 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-24 h-4" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skel className="w-32 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-16 h-5 rounded-full" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-20 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-8 h-8 rounded" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <ClipboardCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No escalations found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((action) => {
                  const actionConfig = getActionConfig(action.actionType);
                  const statusConfig = getStatusConfig(action.status);
                  const ActionIcon = actionConfig.icon;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={action.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${actionConfig.bg} flex items-center justify-center shrink-0`}>
                            <ActionIcon className={`w-4 h-4 ${actionConfig.color}`} />
                          </div>
                          <span className="font-medium">{actionConfig.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium">{action.staffName}</p>
                          <p className="text-xs text-muted-foreground">ID: {action.staffId.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                        {action.reason}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {fmt(action.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openDetail(action)}
                          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center ml-auto transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAction && (
          <DetailModal
            action={selectedAction}
            onClose={closeDetail}
            onApprove={handleApprove}
            onReject={handleReject}
            actionLoading={actionLoading}
            showComment={showRejectComment}
            setShowComment={setShowRejectComment}
            comment={rejectComment}
            setComment={setRejectComment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
