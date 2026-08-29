"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Search, Filter, Eye, CheckCircle2, XCircle, Loader2, Inbox,
  User, Mail, Phone, Calendar, Briefcase, Building2, Award, Clock, BookOpen,
  Banknote, MapPin, FileText, FileSignature, AlertCircle, X, Users, Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { TeachingApplication, TeachingApplicationStatus } from "./teachingApplication.types";
import { useTeachingApplications, useUpdateTeachingApplicationStatus } from "./useTeachingApplication";

type StatusKey = "PENDING" | "APPROVED" | "REJECTED";

const statusConfig: Record<StatusKey, { cls: string; icon: React.ElementType; label: string }> = {
  PENDING:  { cls: "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",       icon: AlertCircle,  label: "Pending"  },
  APPROVED: { cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30", icon: CheckCircle2, label: "Approved" },
  REJECTED: { cls: "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",             icon: XCircle,      label: "Rejected" },
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const rowVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } } };

export default function TeachingApplicationList() {
  const { data, isLoading } = useTeachingApplications();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateTeachingApplicationStatus();
  const { role } = useAuth();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TeachingApplicationStatus | "">("");
  const [selected, setSelected] = useState<TeachingApplication | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const list: TeachingApplication[] = Array.isArray(data) ? data : [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((item) => {
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
      const matchStatus = filterStatus ? item.status === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [list, search, filterStatus]);

  const stats = useMemo(() => ({
    total: list.length,
    pending: list.filter((a) => a.status === "PENDING").length,
    approved: list.filter((a) => a.status === "APPROVED").length,
    rejected: list.filter((a) => a.status === "REJECTED").length,
  }), [list]);

  const canManage = role && hasPermission(role, "create_teacher");

  const handleApprove = (id: string) => {
    if (confirm("Approve this application?")) updateStatus({ id, data: { status: "APPROVED" } });
  };
  const handleReject = (id: string) => {
    const reason = prompt("Enter a rejection reason (optional)") ?? undefined;
    if (confirm("Reject this application?")) updateStatus({ id, data: { status: "REJECTED", rejectionReason: reason } });
  };
  const handleView = (item: TeachingApplication) => { setSelected(item); setShowDetail(true); };
  const handleClose = () => { setSelected(null); setShowDetail(false); };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-sky-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-none space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-black/20"
        >
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-sky-400/30 via-indigo-500/20 to-violet-500/20 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  Teaching Applications
                </h1>
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Total {list.length} applications
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {[
            { label: "Total",    value: stats.total,    color: "from-sky-500 to-indigo-600",   icon: Users },
            { label: "Pending",  value: stats.pending,  color: "from-amber-400 to-orange-500", icon: AlertCircle },
            { label: "Approved", value: stats.approved, color: "from-emerald-500 to-teal-500", icon: CheckCircle2 },
            { label: "Rejected", value: stats.rejected, color: "from-rose-500 to-pink-500",    icon: XCircle },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-xl`} />
              <div className="relative flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{stat.value}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
            {([
              { v: "" as const, l: "All" },
              { v: "PENDING" as const, l: "Pending" },
              { v: "APPROVED" as const, l: "Approved" },
              { v: "REJECTED" as const, l: "Rejected" },
            ]).map((s) => (
              <button
                key={s.l}
                onClick={() => setFilterStatus(s.v as TeachingApplicationStatus | "")}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterStatus === s.v
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {s.l}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <Inbox className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No applications found</p>
              <p className="text-xs mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden sm:table-cell">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden md:table-cell">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden lg:table-cell">Exp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                  <AnimatePresence>
                    {filtered.map((item) => {
                      const status = statusConfig[item.status as StatusKey];
                      const StatusIcon = status.icon;
                      return (
                        <motion.tr
                          key={item.id}
                          variants={rowVariants}
                          className="border-b border-slate-200/60 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-indigo-500/15 text-indigo-600 dark:text-sky-300 ring-1 ring-indigo-500/10">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {item.phone}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-slate-700 dark:text-slate-200">{item.designation}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm text-slate-600 dark:text-slate-300">{item.experience} yrs</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.cls}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => handleView(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-sky-100 dark:hover:bg-sky-500/15 hover:text-sky-700 dark:hover:text-sky-300 transition-all duration-300 hover:-translate-y-0.5"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </motion.button>
                              {canManage && item.status === "PENDING" && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => handleApprove(item.id)}
                                    disabled={isUpdating}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
                                    title="Approve"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => handleReject(item.id)}
                                    disabled={isUpdating}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-300 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300"
            >
              {/* Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 px-6 py-5">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/20">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Teaching Application</h2>
                      <p className="text-xs text-white/70">ID: {selected.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  {(() => {
                    const s = statusConfig[selected.status as StatusKey];
                    const I = s.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${s.cls}`}>
                        <I className="h-3.5 w-3.5" />
                        {s.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Name", value: selected.name, icon: User },
                    { label: "Email", value: selected.email, icon: Mail },
                    { label: "Phone", value: selected.phone, icon: Phone },
                    { label: "Gender", value: selected.gender, icon: User },
                    { label: "Date of Birth", value: selected.dob, icon: Calendar },
                    { label: "Designation", value: selected.designation, icon: Briefcase },
                    { label: "Department", value: selected.department || "—", icon: Building2 },
                    { label: "Qualification", value: selected.qualification, icon: Award },
                    { label: "Experience", value: `${selected.experience} yrs`, icon: Clock },
                    { label: "Subject", value: selected.subjectSpecialization || "—", icon: BookOpen },
                    { label: "Expected Salary", value: selected.expectedSalary ?? "—", icon: Banknote },
                    { label: "Address", value: selected.address, icon: MapPin },
                    {
                      label: "Resume URL",
                      value: selected.resumeUrl ? (
                        <a href={selected.resumeUrl} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-sky-400 hover:underline break-all">
                          {selected.resumeUrl}
                        </a>
                      ) : "—",
                      icon: FileText,
                    },
                    { label: "Cover Letter", value: selected.coverLetter || "—", icon: FileSignature },
                  ].map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.label} className="flex gap-3 rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/15 to-indigo-500/15 text-indigo-600 dark:text-sky-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{field.label}</p>
                          <div className="text-sm text-slate-800 dark:text-slate-100 break-words">{field.value as React.ReactNode}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-4">
                {canManage && selected.status === "PENDING" ? (
                  <>
                    <button
                      onClick={() => { handleReject(selected.id); handleClose(); }}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-100 dark:bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/25 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => { handleApprove(selected.id); handleClose(); }}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-shadow"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {isUpdating ? "Processing…" : "Approve"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleClose}
                    className="ml-auto rounded-xl bg-slate-100 dark:bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
