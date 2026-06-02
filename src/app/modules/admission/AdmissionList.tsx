"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Trash2,
  Mail,
  Phone,
  School,
  Calendar,
  Inbox,
  Loader2,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAdmissions, useUpdateAdmissionStatus, useDeleteAdmission } from "./useAdmission";
import AdminAdmissionForm from "./AdminAdmissionForm";
import AdmissionDetail from "./AdmissionDetail";
import { hasPermission } from "@/config/roles";
import { useAuth } from "@/hooks/useAuth";
import type { Admission } from "./admission.types";
import { formatDate } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  PENDING:
    "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30",
  APPROVED:
    "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30",
  REJECTED:
    "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400/30",
};

const statusIcon: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3 w-3" />,
  APPROVED: <CheckCircle2 className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
};

export default function AdmissionList() {
  const { data: admissions, isLoading } = useAdmissions();
  const { mutate: updateStatus } = useUpdateAdmissionStatus();
  const { mutate: deleteAdmission } = useDeleteAdmission();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Admission | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const admissionList = Array.isArray(admissions) ? admissions : [];
  const filtered = admissionList.filter((a) => {
    const matchSearch = a.applicantName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = filterStatus ? a.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const handleApprove = (id: string) => {
    if (confirm("Approve করবেন?")) updateStatus({ id, status: "APPROVED" });
  };
  const handleReject = (id: string) => {
    if (confirm("Reject করবেন?")) updateStatus({ id, status: "REJECTED" });
  };
  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteAdmission(id);
  };
  const handleDetail = (admission: Admission) => {
    setSelected(admission);
    setShowDetail(true);
  };
  const handleClose = () => {
    setShowForm(false);
    setShowDetail(false);
    setSelected(null);
  };

  const pending = admissionList.filter((a) => a.status === "PENDING").length;
  const approved = admissionList.filter((a) => a.status === "APPROVED").length;
  const rejected = admissionList.filter((a) => a.status === "REJECTED").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const statusFilters = [
    { value: "", label: "সব" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="relative min-h-screen p-4 sm:p-6 space-y-6 overflow-hidden">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-400/20 dark:bg-sky-500/15 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-violet-400/20 dark:bg-violet-500/15 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-400/20 dark:bg-indigo-500/15 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-sky-100/80 via-indigo-100/80 to-violet-100/80 dark:from-sky-500/15 dark:via-indigo-500/15 dark:to-violet-500/15 backdrop-blur-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30"
          >
            <GraduationCap className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 dark:from-sky-300 dark:via-indigo-300 dark:to-violet-300 bg-clip-text text-transparent">
                Admission
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] text-slate-600 dark:text-slate-300">
                <Sparkles className="h-3 w-3 text-sky-500 dark:text-sky-400" />
                Applications
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              মোট {admissionList.length} টি application
            </p>
          </div>
        </div>

        {role && hasPermission(role, "manage_admission") && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/30"
          >
            <Plus className="h-4 w-4" />
            New Admission
          </motion.button>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Pending",
            value: pending,
            color:
              "from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20",
            border: "border-amber-300 dark:border-amber-400/30",
            text: "text-amber-700 dark:text-amber-300",
            num: "text-amber-900 dark:text-white",
            icon: <Clock className="h-4 w-4" />,
          },
          {
            label: "Approved",
            value: approved,
            color:
              "from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20",
            border: "border-emerald-300 dark:border-emerald-400/30",
            text: "text-emerald-700 dark:text-emerald-300",
            num: "text-emerald-900 dark:text-white",
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
          {
            label: "Rejected",
            value: rejected,
            color:
              "from-rose-100 to-pink-100 dark:from-rose-500/20 dark:to-pink-500/20",
            border: "border-rose-300 dark:border-rose-400/30",
            text: "text-rose-700 dark:text-rose-300",
            num: "text-rose-900 dark:text-white",
            icon: <XCircle className="h-4 w-4" />,
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative rounded-2xl border ${s.border} bg-gradient-to-br ${s.color} backdrop-blur-xl p-4 overflow-hidden`}
          >
            <div className={`flex items-center gap-2 text-xs ${s.text}`}>
              {s.icon}
              <span className="font-medium">{s.label}</span>
            </div>
            <p className={`mt-2 text-2xl sm:text-3xl font-bold ${s.num}`}>
              {s.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="নাম দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-400/50 focus:bg-white dark:focus:bg-white/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {statusFilters.map((f) => (
            <motion.button
              key={f.value || "all"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterStatus(f.value)}
              className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === f.value
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {filterStatus === f.value && (
                <motion.span
                  layoutId="admissionFilterPill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{f.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((admission, idx) => (
            <motion.div
              key={admission.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-400/30 hover:shadow-lg hover:shadow-indigo-500/10 transition-all overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-sky-500/30 to-violet-500/30 dark:from-sky-500/30 dark:to-violet-500/30 border border-slate-200 dark:border-white/10 flex items-center justify-center text-sm font-semibold text-indigo-700 dark:text-white">
                    {admission.applicantName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {admission.applicantName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{admission.guardianEmail}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border ${statusStyle[admission.status]}`}
                >
                  {statusIcon[admission.status]}
                  {admission.status}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-sky-500 dark:text-sky-400" />
                  {admission.guardianPhone}
                </div>
                <div className="flex items-center gap-2">
                  <School className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                  {admission.targetClass?.name} (Class {admission.targetClass?.numericLevel})
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                  {formatDate(admission.createdAt as unknown as string)}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center gap-2 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDetail(admission)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-100 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-400/20 text-sky-700 dark:text-sky-300 text-xs hover:bg-sky-200 dark:hover:bg-sky-500/20 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  View
                </motion.button>

                {role && hasPermission(role, "manage_admission") && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApprove(admission.id)}
                      disabled={admission.status === "APPROVED"}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-300 text-xs hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReject(admission.id)}
                      disabled={admission.status === "APPROVED"}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-400/20 text-rose-700 dark:text-rose-300 text-xs hover:bg-rose-200 dark:hover:bg-rose-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(admission.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-colors ml-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl py-16 flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 border border-slate-200 dark:border-white/10 flex items-center justify-center"
          >
            <Inbox className="h-7 w-7 text-indigo-500 dark:text-indigo-300" />
          </motion.div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No admissions found.
          </p>
        </motion.div>
      )}

      {/* Modals */}
      {showForm && <AdminAdmissionForm onClose={handleClose} />}
      {showDetail && selected && (
        <AdmissionDetail admission={selected} onClose={handleClose} />
      )}
    </div>
  );
}
