"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Inbox,
  Loader2,
  GraduationCap,
  CalendarDays,
  Layers,
  Search,
  Filter,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { formatTaka, cn } from "@/lib/utils";
import { useClasses } from "@/app/modules/class/useClasses";
import { feesService } from "@/app/modules/fees/fees.service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type FeeType = "TUITION" | "ADMISSION" | "EXAM";
const FEE_TYPES: FeeType[] = ["TUITION", "ADMISSION", "EXAM"];

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

export default function FeeStructurePage() {
  const { role } = useAuth();
  const canManage = !!role && hasPermission(role, "manage_fees");
  const queryClient = useQueryClient();
  const { data: classes = [], isLoading: classesLoading } = useClasses();

  const [showForm, setShowForm] = useState(false);
  const [filterClass, setFilterClass] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const [formClassId, setFormClassId] = useState("");
  const [formType, setFormType] = useState<FeeType>("TUITION");
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDueDate, setFormDueDate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["fees", "all", filterClass, filterType, filterStatus, filterMonth],
    queryFn: () =>
      feesService.getAllPaginated({
        ...(filterClass ? { classId: filterClass } : {}),
        ...(filterType ? { type: filterType } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(filterMonth ? { month: filterMonth } : {}),
      }),
  });

  const { data: summary } = useQuery({
    queryKey: ["fees", "summary", filterMonth],
    queryFn: () => feesService.getSummary(filterMonth ? { month: filterMonth } : undefined),
  });

  const createMutation = useMutation({
    mutationFn: (data: { classId: string; type: FeeType; title: string; amount: number; dueDate: string; studentId?: string }) =>
      feesService.create({
        studentId: data.studentId,
        classId: data.classId,
        title: data.title,
        type: data.type,
        amount: data.amount,
        dueDate: data.dueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast.success("Fee structure created!");
      resetForm();
    },
    onError: () => toast.error("Failed to create fee structure"),
  });

  const bulkMutation = useMutation({
    mutationFn: (data: { classId: string; type: FeeType; title: string; amount: number; dueDate: string }) =>
      feesService.bulkCreate({
        classId: data.classId,
        type: data.type,
        title: data.title,
        amount: data.amount,
        dueDate: data.dueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast.success("Bulk fee structure created!");
      resetForm();
    },
    onError: () => toast.error("Failed to bulk create fees"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast.success("Fee deleted!");
    },
    onError: () => toast.error("Failed to delete fee"),
  });

  const resetForm = () => {
    setFormClassId("");
    setFormType("TUITION");
    setFormTitle("");
    setFormAmount("");
    setFormDueDate("");
    setShowForm(false);
  };

  const handleBulk = () => {
    if (!formClassId || !formTitle || !formAmount || !formDueDate) return;
    bulkMutation.mutate({
      classId: formClassId,
      type: formType,
      title: formTitle,
      amount: parseFloat(formAmount),
      dueDate: formDueDate,
    });
  };

  const handleSingleCreate = () => {
    if (!formClassId || !formTitle || !formAmount || !formDueDate) return;
    createMutation.mutate({
      classId: formClassId,
      type: formType,
      title: formTitle,
      amount: parseFloat(formAmount),
      dueDate: formDueDate,
    });
  };

  const fees = data?.fees ?? [];
  const totalAmount = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalDue = fees.reduce((s, f) => s + f.dueAmount, 0);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl space-y-3">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="w-10 h-10 rounded-xl ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Fee Structure</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{fees.length}</span> fee records
              </p>
            </div>
          </div>
          {canManage && (
            <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all">
              <Plus className="w-4 h-4" />
              {showForm ? "Cancel" : "Create Fee"}
            </motion.button>
          )}
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Amount", value: summary?.totalAmount ?? totalAmount, icon: DollarSign, gradient: "from-blue-500 to-indigo-600", ring: "ring-blue-500/20", glow: "shadow-blue-500/10" },
            { label: "Total Paid", value: summary?.totalPaid ?? totalPaid, icon: TrendingUp, gradient: "from-emerald-500 to-teal-600", ring: "ring-emerald-500/20", glow: "shadow-emerald-500/10" },
            { label: "Outstanding", value: summary?.outstanding ?? totalDue, icon: TrendingDown, gradient: "from-rose-500 to-pink-600", ring: "ring-rose-500/20", glow: "shadow-rose-500/10" },
          ].map((card) => (
            <motion.div key={card.label} variants={itemVariants} whileHover={{ y: -4 }}
              className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ${card.ring} shadow-xl ${card.glow} transition-all`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{formatTaka(card.value)}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && canManage && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl overflow-hidden">
              <form onSubmit={(e) => { e.preventDefault(); handleSingleCreate(); }} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Class</label>
                    <select value={formClassId} onChange={(e) => setFormClassId(e.target.value)} required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="">Select class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Fee Type</label>
                    <select value={formType} onChange={(e) => setFormType(e.target.value as FeeType)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      {FEE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Title</label>
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required placeholder="e.g. July Tuition"
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Amount (৳)</label>
                    <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01"
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Due Date</label>
                    <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={createMutation.isPending || bulkMutation.isPending || !formClassId}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Single
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={handleBulk} disabled={createMutation.isPending || bulkMutation.isPending || !formClassId}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50">
                    {bulkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                    Bulk Create for Class
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
          <div className="relative sm:w-48">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer">
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="relative sm:w-40">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer">
              <option value="">All Types</option>
              {FEE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="relative sm:w-40">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer">
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
          <div className="relative sm:w-40">
            <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div variants={itemVariants}
          className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  {["Student", "Class", "Type", "Title", "Amount", "Paid", "Due", "Status", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Inbox className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No fee records found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  fees.map((fee, idx) => {
                    const status = statusStyles[fee.status] ?? statusStyles.UNPAID;
                    return (
                      <motion.tr key={fee.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ delay: idx * 0.02 }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-500/30">
                              {fee.student?.name?.charAt(0).toUpperCase() ?? "—"}
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white whitespace-nowrap">{fee.student?.name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {fee.student?.class?.name ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-500/30">
                            {fee.month}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{formatTaka(fee.amount)}</td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatTaka(fee.paidAmount)}</td>
                        <td className="px-4 py-3.5 font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">{formatTaka(fee.dueAmount)}</td>
                        <td className="px-4 py-3.5">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", status.badge)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {canManage && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { if (confirm("Delete this fee record?")) deleteMutation.mutate(fee.id); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 text-xs font-semibold transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </motion.button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
