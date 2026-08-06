"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useCreateLeaveRequest, useLeaveBalance, useMyLeaveRequests } from "@/app/modules/leave/useLeave";
import { LeaveRequest, LeaveStatus, LeaveType } from "@/app/modules/leave/leave.types";
import { formatDate } from "@/lib/utils";

type TabType = "new" | "history";

const LEAVE_TYPES: { value: LeaveType | ""; label: string }[] = [
  { value: "", label: "Select type" },
  { value: "CASUAL", label: "Casual Leave" },
  { value: "SICK", label: "Sick Leave" },
  { value: "EARNED", label: "Earned Leave" },
  { value: "MATERNITY", label: "Maternity Leave" },
  { value: "PATERNITY", label: "Paternity Leave" },
];

const STATUS_FILTERS = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const LEAVE_TYPE_FILTERS = [
  { value: "", label: "All Types" },
  { value: "CASUAL", label: "Casual" },
  { value: "SICK", label: "Sick" },
  { value: "EARNED", label: "Earned" },
  { value: "MATERNITY", label: "Maternity" },
  { value: "PATERNITY", label: "Paternity" },
];

function getStatusMeta(status: LeaveStatus) {
  if (status === "APPROVED")
    return {
      label: "Approved",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/20",
      dot: "bg-emerald-500",
    };
  if (status === "REJECTED")
    return {
      label: "Rejected",
      badge: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-200/70 dark:border-rose-500/20",
      dot: "bg-rose-500",
    };
  return {
    label: "Pending",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/20",
    dot: "bg-amber-500",
  };
}

function getLeaveTypeLabel(type: LeaveType) {
  const map: Record<LeaveType, string> = {
    CASUAL: "Casual",
    SICK: "Sick",
    EARNED: "Earned",
    MATERNITY: "Maternity",
    PATERNITY: "Paternity",
  };
  return map[type] ?? type;
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("new");
  const [statusFilter, setStatusFilter] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const [formLeaveType, setFormLeaveType] = useState<LeaveType | "">("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formReason, setFormReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leavesQuery = useMyLeaveRequests({ status: statusFilter || undefined, leaveType: leaveTypeFilter || undefined, limit: 20 });
  const balanceQuery = useLeaveBalance(new Date().getFullYear());
  const createMutation = useCreateLeaveRequest();

  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const leaveRows = useMemo(() => {
    const list = Array.isArray(leavesQuery.data?.leaves) ? leavesQuery.data!.leaves : [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (l) =>
        l.leaveType.toLowerCase().includes(q) ||
        (l.reason ?? "").toLowerCase().includes(q) ||
        getStatusMeta(l.status).label.toLowerCase().includes(q)
    );
  }, [leavesQuery.data, search]);

  const balance = Array.isArray(balanceQuery.data) ? balanceQuery.data : [];

  const stats = useMemo(() => {
    const list = Array.isArray(leavesQuery.data?.leaves) ? leavesQuery.data!.leaves : [];
    return {
      total: list.length,
      pending: list.filter((l) => l.status === "PENDING").length,
      approved: list.filter((l) => l.status === "APPROVED").length,
      rejected: list.filter((l) => l.status === "REJECTED").length,
    };
  }, [leavesQuery.data]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
    queryClient.invalidateQueries({ queryKey: ["my-leave-balance"] });
    toast.success("Data refreshed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLeaveType || !formStartDate || !formEndDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (new Date(formEndDate) < new Date(formStartDate)) {
      toast.error("End date cannot be before start date");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        leaveType: formLeaveType,
        startDate: formStartDate,
        endDate: formEndDate,
        reason: formReason || undefined,
      });
      toast.success("Leave request submitted");
      setFormLeaveType("");
      setFormStartDate("");
      setFormEndDate("");
      setFormReason("");
      setActiveTab("history");
    } catch {
      // error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = leavesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
        />
        <div className="relative w-full">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="space-y-3 mt-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200/50 dark:bg-slate-700/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] flex items-start sm:items-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
      {/* Animated background orbs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-300/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative w-full my-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Gradient Header */}
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center cursor-pointer"
                >
                  <CalendarDays className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    My Leave & Attendance
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Apply for leave and track your requests.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: "Total Requests", value: stats.total, color: "from-sky-400 to-indigo-400" },
                { label: "Pending", value: stats.pending, color: "from-amber-400 to-orange-400" },
                { label: "Approved", value: stats.approved, color: "from-emerald-400 to-green-500" },
                { label: "Rejected", value: stats.rejected, color: "from-rose-400 to-red-500" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1 bg-gradient-to-r bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 p-1"
            >
              {([
                { key: "new" as TabType, label: "Apply Leave", icon: Plus },
                { key: "history" as TabType, label: "My Requests", icon: CalendarDays },
              ]).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? "text-white"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="leaveTab"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>

            {/* Leave Balance */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Leave Balance ({new Date().getFullYear()})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {balance.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 col-span-full">No balance data available.</p>
                ) : (
                  balance.map((b) => {
                    const remaining = b.totalDays - b.usedDays;
                    const percent = b.totalDays > 0 ? Math.round((remaining / b.totalDays) * 100) : 0;
                    return (
                      <div key={b.id} className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 p-3">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {getLeaveTypeLabel(b.leaveType)}
                        </p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{remaining} days</p>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {b.usedDays} used / {b.totalDays} total
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* New Leave Form */}
            {activeTab === "new" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">New Leave Request</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Leave Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formLeaveType}
                        onChange={(e) => setFormLeaveType(e.target.value as LeaveType | "")}
                        className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                      >
                        {LEAVE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      End Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      min={formStartDate}
                      className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      placeholder="Optional reason"
                      className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting || createMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting || createMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Submit Request
                    </button>
                    {formStartDate && formEndDate && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {calculateDays(formStartDate, formEndDate)} day(s)
                      </span>
                    )}
                  </div>
                </form>
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <>
                {/* Filters */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                        >
                          {STATUS_FILTERS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        Leave Type
                      </label>
                      <div className="relative">
                        <select
                          value={leaveTypeFilter}
                          onChange={(e) => setLeaveTypeFilter(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                        >
                          {LEAVE_TYPE_FILTERS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search by type, reason..."
                          className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Leave Table */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden"
                >
                  {leaveRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                      >
                        <CalendarDays className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                      </motion.div>
                      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                        No leave requests found
                      </h3>
                      <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                        {leavesQuery.isLoading ? "Loading..." : "Apply for a new leave to get started."}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5">
                            <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Type
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Date Range
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Days
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Reason
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/40 dark:divide-white/10">
                          <AnimatePresence mode="popLayout">
                            {leaveRows.map((leave, index) => {
                              const statusMeta = getStatusMeta(leave.status);
                              const days = calculateDays(leave.startDate, leave.endDate);
                              return (
                                <motion.tr
                                  key={leave.id}
                                  layout
                                  initial={{ opacity: 0, y: 14 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: -30, scale: 0.98 }}
                                  transition={{ delay: index * 0.02, type: "spring", stiffness: 120, damping: 18 }}
                                  className={`group transition-colors duration-200 ${
                                    leave.status === "APPROVED"
                                      ? "bg-emerald-50/30 dark:bg-emerald-500/5"
                                      : leave.status === "REJECTED"
                                        ? "bg-rose-50/30 dark:bg-rose-500/5"
                                        : "hover:bg-white/60 dark:hover:bg-white/5"
                                  }`}
                                >
                                  <td className="px-4 sm:px-6 py-4">
                                    <span className="inline-flex items-center rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                                      {getLeaveTypeLabel(leave.leaveType)}
                                    </span>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4">
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                      {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                                    </span>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                      {days}
                                    </span>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4">
                                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px] block">
                                      {leave.reason || "—"}
                                    </span>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${statusMeta.badge}`}>
                                      <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                                      {statusMeta.label}
                                    </span>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Footer */}
                  {leaveRows.length > 0 && (
                    <div className="p-4 sm:p-5 border-t border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Showing{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {leaveRows.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {leavesQuery.data?.meta?.total ?? 0}
                        </span>{" "}
                        requests
                      </p>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          My Leave & Attendance
        </motion.p>
      </motion.div>
    </div>
  );
}
