"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  AlertTriangle,
  Inbox,
  Loader2,
  GraduationCap,
  CalendarDays,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useClasses } from "@/app/modules/class/useClasses";
import { feesService } from "@/app/modules/fees/fees.service";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { formatTaka, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
};

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export default function OverduePage() {
  const { role } = useAuth();
  const canView = !!role && hasPermission(role, "view_overdue_fees");

  const { data: classes = [] } = useClasses();
  const [filterClass, setFilterClass] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ["fees", "overdue", filterClass, page, limit],
    queryFn: () =>
      feesService.getOverdue({
        ...(filterClass ? { classId: filterClass } : {}),
        page,
        limit,
      }),
    enabled: canView,
  });

  const overdueFees = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const overdueCount = meta?.total ?? overdueFees.length;

  if (!canView) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Overdue Fees</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-rose-600 dark:text-rose-400">{overdueCount}</span> overdue fees
              </p>
            </div>
          </div>
        </motion.div>

        {/* Summary Card */}
        <motion.div variants={itemVariants}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-rose-500/20 shadow-xl shadow-rose-500/10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue Count</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{overdueCount}</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
          <div className="relative sm:w-56">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer">
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div variants={itemVariants}
          className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  {["Student", "Roll No", "Fee Type", "Amount", "Paid", "Due", "Due Date", "Days Overdue"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8">
                      <div className="space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-md" />
                            <Skeleton className="h-4 w-20 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-md" />
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-md" />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : overdueFees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Inbox className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No overdue fees found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  overdueFees.map((fee, idx) => {
                    const days = getDaysOverdue(fee.dueDate);
                    const dueAmount = fee.amount - fee.Paidamount;
                    const student = fee.student;
                    const studentName = student?.user?.name;
                    const rollNumber = student?.rollNumber ?? "—";
                    return (
                      <motion.tr key={fee.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-100 to-orange-100 dark:from-rose-500/20 dark:to-orange-500/20 flex items-center justify-center text-xs font-bold text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-500/30">
                              {studentName ? studentName.charAt(0).toUpperCase() : "?"}
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white">{studentName ?? "Class Fee"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{rollNumber}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-500/30">
                            {fee.feeType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{formatTaka(fee.amount)}</td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatTaka(fee.Paidamount)}</td>
                        <td className="px-4 py-3.5 font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">{formatTaka(dueAmount)}</td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(fee.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                            days > 30 ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30" :
                            days > 7 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30" :
                            "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30")}>
                            {days} days
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors">Previous</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">Next</motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
