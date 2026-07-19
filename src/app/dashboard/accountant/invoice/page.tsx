"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  Printer,
  Inbox,
  Loader2,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { feesService } from "@/app/modules/fees/fees.service";
import { formatTaka, cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
};

const statusStyles: Record<string, { badge: string; dot: string; label: string }> = {
  PAID: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    dot: "bg-emerald-500",
    label: "Paid",
  },
  UNPAID: {
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    dot: "bg-rose-500",
    label: "Unpaid",
  },
  PARTIAL: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    dot: "bg-amber-500",
    label: "Partial",
  },
};

interface StudentOption {
  id: string;
  name: string;
  rollNumber?: string;
  class?: { name: string };
}

function useStudentSearch(query: string) {
  const [results, setResults] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/students", { params: { search: query, limit: 10 } });
        const payload = res.data?.data ?? res.data;
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        if (!cancelled) setResults(list.slice(0, 10));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, loading };
}

export default function InvoicePage() {
  const { role } = useAuth();
  const canView = !!role && hasPermission(role, "manage_fees");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const { results, loading: searchLoading } = useStudentSearch(search);

  const { data: feesData, isLoading: feesLoading } = useQuery({
    queryKey: ["fees", "student", selectedStudentId],
    queryFn: () => feesService.getByStudent(selectedStudentId),
    enabled: !!selectedStudentId,
  });

  const fees = feesData ?? [];
  const totalAmount = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalDue = fees.reduce((s, f) => s + f.dueAmount, 0);

  const handleSelectStudent = (student: StudentOption) => {
    setSelectedStudent(student);
    setSelectedStudentId(student.id);
    setSearch(student.name);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!canView) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Generate Invoice</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Search and select a student to generate invoice</p>
            </div>
          </div>
          {selectedStudentId && (
            <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all">
              <Printer className="w-4 h-4" />
              Print Invoice
            </motion.button>
          )}
        </motion.div>

        {/* Student Search */}
        <motion.div variants={itemVariants}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider">Search Student</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type student name to search..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          {results.length > 0 && (
            <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {results.map((s) => (
                <button key={s.id} onClick={() => handleSelectStudent(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                    {s.rollNumber && <p className="text-xs text-slate-500 dark:text-slate-400">{s.rollNumber} {s.class?.name ? `· ${s.class.name}` : ""}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchLoading && search.length >= 2 && (
            <div className="mt-2 flex items-center gap-2 px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Searching...</span>
            </div>
          )}
        </motion.div>

        {/* Invoice */}
        {selectedStudentId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl overflow-hidden">
            {/* Invoice Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">INVOICE</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              {fees.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Invoice #</p>
                  <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{fees[0].id.slice(0, 8).toUpperCase()}</p>
                </div>
              )}
            </div>

            {/* Student Info */}
            {selectedStudent && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-2xl font-bold text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-500/30">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {selectedStudent.class?.name ?? selectedStudent.rollNumber ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fee Details */}
            <div className="p-6">
              {feesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : fees.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Inbox className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No fee records for this student.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          {["Month", "Amount", "Paid", "Due", "Status"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fees.map((fee, idx) => {
                          const status = statusStyles[fee.status] ?? statusStyles.UNPAID;
                          return (
                            <motion.tr key={fee.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                              className="border-b border-slate-100 dark:border-slate-800">
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                  {fee.month}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{formatTaka(fee.amount)}</td>
                              <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{formatTaka(fee.paidAmount)}</td>
                              <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">{formatTaka(fee.dueAmount)}</td>
                              <td className="px-4 py-3">
                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", status.badge)}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                                  {status.label}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                      <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Amount</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{formatTaka(totalAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Paid</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatTaka(totalPaid)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Balance Due</p>
                          <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatTaka(totalDue)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
