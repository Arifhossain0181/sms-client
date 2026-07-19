"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Search,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
  CreditCard,
  Inbox,
  Loader2,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import { useFees, useDeleteFee } from "./useFees";
import CashPaymentModal from "@/app/modules/fees/CashPaymentModal";
import PaymentModal from "@/app/modules/fees/PaymentModal";
import { Fee } from "./fees.types";
import { formatTaka } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

/**
 * ⚠️ SCALE NOTE: this fetches ALL fee records and computes totals/search
 * client-side. Fine for a small school, but at 3000-student scale
 * (student × fee-type × month = potentially 100k+ rows) this needs
 * server-side pagination + a dedicated summary endpoint, same as was
 * done for the Admissions list. Flagging rather than silently shipping —
 * worth revisiting once the fee-structure backend exists.
 */

const statusStyles: Record<string, { badge: string; dot: string; label: string }> = {
  PAID: {
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    dot: "bg-emerald-500",
    label: "Paid",
  },
  UNPAID: {
    badge:
      "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    dot: "bg-rose-500",
    label: "Unpaid",
  },
  PARTIAL: {
    badge:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    dot: "bg-amber-500",
    label: "Partial",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 24 },
  },
};

export default function FeeList() {
  const { data: fees, isLoading } = useFees();
  const { mutate: deleteFee } = useDeleteFee();
  const { role } = useAuth();

  const [showCash, setShowCash] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const canManage = !!role && hasPermission(role, "manage_fees");

  const safeFees = Array.isArray(fees) ? fees : [];
  const filtered = safeFees.filter((f) => {
    const matchSearch = f.student?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? f.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const handlePay = (fee: Fee) => {
    setSelectedFee(fee);
    setShowPayment(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this fee record?")) deleteFee(id);
  };

  const handleClose = () => {
    setShowCash(false);
    setShowPayment(false);
    setSelectedFee(null);
  };

  const totalAmount = safeFees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = safeFees.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalDue = safeFees.reduce((sum, f) => sum + f.dueAmount, 0);
  const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading fees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Fees
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {safeFees.length}
                </span>{" "}
                fee records
              </p>
            </div>
          </div>

          {canManage && (
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCash(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Cash Payment
            </motion.button>
          )}
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Amount",
              value: totalAmount,
              icon: DollarSign,
              gradient: "from-blue-500 to-indigo-600",
              ring: "ring-blue-500/20",
              glow: "shadow-blue-500/10",
            },
            {
              label: "Total Paid",
              value: totalPaid,
              icon: TrendingUp,
              gradient: "from-emerald-500 to-teal-600",
              ring: "ring-emerald-500/20",
              glow: "shadow-emerald-500/10",
            },
            {
              label: "Total Due",
              value: totalDue,
              icon: TrendingDown,
              gradient: "from-rose-500 to-pink-600",
              ring: "ring-rose-500/20",
              glow: "shadow-rose-500/10",
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ${card.ring} shadow-xl ${card.glow} transition-all`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {formatTaka(card.value)}
                  </p>
                </div>
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}
                >
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Collection Progress */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Collection Rate
            </p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {collectionRate}%
            </p>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${collectionRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full"
            />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="relative sm:w-56">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  {["Student", "Class", "Month", "Amount", "Paid", "Due", "Status", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((fee, idx) => {
                    const status = statusStyles[fee.status] ?? statusStyles.UNPAID;
                    return (
                      <motion.tr
                        key={fee.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-500/30">
                              {fee.student?.name?.charAt(0).toUpperCase() ?? "—"}
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white whitespace-nowrap">
                              {fee.student?.name ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {fee.student?.class?.name ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            {fee.month}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatTaka(fee.amount)}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatTaka(fee.paidAmount)}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {formatTaka(fee.dueAmount)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            {canManage && fee.status !== "PAID" && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePay(fee)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 text-xs font-semibold transition-colors"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Pay
                              </motion.button>
                            )}
                            {canManage && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(fee.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 text-xs font-semibold transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Inbox className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          No fee records found.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>

      {/* Modals */}
      {showCash && <CashPaymentModal onClose={handleClose} />}
      {showPayment && selectedFee && <PaymentModal fee={selectedFee} onClose={handleClose} />}
    </div>
  );
}