"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Banknote,
  CheckCircle2,
  Hash,
  Clock,
} from "lucide-react";
import { useFees, useDeleteFee } from "./useFees";
import { useStudents } from "../student/useStudents";
import type { Student } from "../student/student.types";
import { feesService } from "./fees.service";
import CashPaymentModal from "@/app/modules/fees/CashPaymentModal";
import PaymentModal from "@/app/modules/fees/PaymentModal";
import { Fee } from "./fees.types";
import { formatTaka } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import Pagination from "@/components/ui/pagination";
import api from "@/lib/axios";

/**
 * ⚠️ SCALE NOTE: this fetches ALL fee records and computes totals/search
 * client-side. Fine for a small school, but at 3000-student scale
 * (student × fee-type × month = potentially 100k+ rows) this needs
 * server-side pagination + a dedicated summary endpoint, same as was
 * done for the Admissions list. Flagging rather than silently shipping —
 * worth revisiting once the fee-structure backend exists.
 */

type PaymentMethod = "" | "STRIPE" | "CASH";

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

const paymentStatusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  FAILED: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  REFUNDED: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
};

const methodStyles: Record<string, { badge: string; label: string; icon: typeof Wallet }> = {
  CASH: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    label: "Cash",
    icon: Banknote,
  },
  STRIPE: {
    badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
    label: "Stripe",
    icon: CreditCard,
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
  const { data: students = [] } = useStudents();
  const { mutate: deleteFee } = useDeleteFee();
  const { role } = useAuth();

  const [showCash, setShowCash] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMethod, setFilterMethod] = useState<PaymentMethod>("");
  const [paymentPage, setPaymentPage] = useState(1);
  const [feePage, setFeePage] = useState(1);
  const feePageSize = 20;

  const canManage = !!role && hasPermission(role, "manage_fees");
  const canViewPayments = role === "ACCOUNTANT" || role === "SCHOOL_ADMIN";

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    isError: transactionsError,
  } = useQuery({
    queryKey: ["fees", "transactions", role, paymentPage, filterMethod],
    queryFn: () =>
      feesService.getTransactions({
        page: paymentPage,
        limit: 20,
        ...(filterMethod ? { method: filterMethod } : {}),
      }),
    enabled: canViewPayments,
    retry: false,
  });

  const { data: summaryData } = useQuery({
    queryKey: ["fees", "summary"],
    queryFn: () => feesService.getSummary(),
    enabled: canViewPayments,
    retry: false,
  });

  const { data: admissionPayments } = useQuery({
    queryKey: ["admission", "accountant", "payments"],
    queryFn: async () => {
      const res = await api.get("/admission/accountant/payments");
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    },
    enabled: canViewPayments,
    retry: false,
  });

  const admissionStudentIds = useMemo(() => {
    const ids = new Set<string>();
    (admissionPayments ?? []).forEach((p: any) => {
      if (p.studentId) ids.add(p.studentId);
    });
    return ids;
  }, [admissionPayments]);

  const admissionCash = useMemo(
    () => (admissionPayments ?? []).filter((p: any) => (p.paymentMethod ?? "CASH") === "CASH").reduce((s: number, p: any) => s + (Number(p.paymentAmount ?? 0)), 0),
    [admissionPayments]
  );
  const admissionStripe = useMemo(
    () => (admissionPayments ?? []).filter((p: any) => (p.paymentMethod ?? "CASH") === "STRIPE").reduce((s: number, p: any) => s + (Number(p.paymentAmount ?? 0)), 0),
    [admissionPayments]
  );

  const safeFees = useMemo(() => (Array.isArray(fees) ? fees : []), [fees]);
  const studentsWithoutFees = useMemo(() => {
    const feeStudentIds = new Set(safeFees.map((fee) => fee.studentId).filter(Boolean));
    const hasAnyFee = (id: string) => feeStudentIds.has(id) || admissionStudentIds.has(id);

    return (Array.isArray(students) ? students : [])
      .filter((student) => !hasAnyFee(student.id))
      .sort((a: Student, b: Student) => {
        const classCompare = (a.class?.name ?? "").localeCompare(b.class?.name ?? "");
        if (classCompare !== 0) return classCompare;
        return String(a.rollNumber ?? "").localeCompare(String(b.rollNumber ?? ""), undefined, {
          numeric: true,
        });
      });
  }, [safeFees, students, admissionStudentIds]);
  const filtered = safeFees.filter((f) => {
    const matchSearch = f.student?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? f.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const totalFeePages = Math.max(1, Math.ceil(filtered.length / feePageSize));
  const paginatedFees = filtered.slice((feePage - 1) * feePageSize, feePage * feePageSize);

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

  const totalAmount = useMemo(
    () => Number(summaryData?.totalAmount ?? safeFees.reduce((sum, f) => sum + (f.amount ?? 0), 0)),
    [summaryData, safeFees]
  );

  const totalPaidFromApi = useMemo(
    () => Number(summaryData?.totalPaid ?? 0),
    [summaryData]
  );

  const totalDueFromApi = useMemo(
    () => Number(summaryData?.outstanding ?? 0),
    [summaryData]
  );

  const admissionPaidAmount = useMemo(
    () => Number(summaryData?.admissionTotalPaid ?? 0),
    [summaryData]
  );

  const feeOnlyPaid = useMemo(
    () => totalPaidFromApi - admissionPaidAmount,
    [totalPaidFromApi, admissionPaidAmount]
  );

  const totalPaidDisplay = totalPaidFromApi;
  const totalDueDisplay = totalDueFromApi;
  const collectionRate = totalAmount > 0 ? Math.round((feeOnlyPaid / totalAmount) * 100) : 0;

  const cashCollected = useMemo(
    () => (transactionsData?.data?.filter((p: any) => p.method === "CASH").reduce((s: number, p: any) => s + (Number(p.amount ?? 0)), 0) ?? 0) + admissionCash,
    [transactionsData, admissionCash]
  );
  const stripeCollected = useMemo(
    () => (transactionsData?.data?.filter((p: any) => p.method === "STRIPE").reduce((s: number, p: any) => s + (Number(p.amount ?? 0)), 0) ?? 0) + admissionStripe,
    [transactionsData, admissionStripe]
  );
  const cashCount = useMemo(
    () => (transactionsData?.data?.filter((p: any) => p.method === "CASH").length ?? 0) + (admissionPayments ?? []).filter((p: any) => (p.paymentMethod ?? "CASH") === "CASH").length,
    [transactionsData, admissionPayments]
  );
  const stripeCount = useMemo(
    () => (transactionsData?.data?.filter((p: any) => p.method === "STRIPE").length ?? 0) + (admissionPayments ?? []).filter((p: any) => (p.paymentMethod ?? "CASH") === "STRIPE").length,
    [transactionsData, admissionPayments]
  );

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
              value: totalPaidDisplay,
              icon: TrendingUp,
              gradient: "from-emerald-500 to-teal-600",
              ring: "ring-emerald-500/20",
              glow: "shadow-emerald-500/10",
            },
            {
              label: "Total Due",
              value: totalDueDisplay,
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

        {/* Payment Method Split Cards */}
        {canViewPayments && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: "Cash Collected",
                value: cashCollected,
                icon: Banknote,
                gradient: "from-emerald-500 to-green-600",
                ring: "ring-emerald-500/20",
                count: cashCount,
              },
              {
                label: "Stripe Collected",
                value: stripeCollected,
                icon: CreditCard,
                gradient: "from-blue-500 to-violet-600",
                ring: "ring-blue-500/20",
                count: stripeCount,
              },
            ].map((card) => (
              <motion.div
                key={card.label}
                variants={itemVariants}
                whileHover={{ y: -3 }}
                className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ${card.ring} shadow-xl transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                      {transactionsLoading && !summaryData ? (
                        <span className="inline-block w-20 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      ) : (
                        formatTaka(card.value)
                      )}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {transactionsLoading && !summaryData ? "..." : `${card.count} transaction${card.count !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

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
              onChange={(e) => {
                setSearch(e.target.value);
                setFeePage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="relative sm:w-56">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setFeePage(1);
              }}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
        </motion.div>

        {/* ── ALL PAYMENTS TABLE (ACCOUNTANT / SCHOOL_ADMIN) ── */}
        {canViewPayments && (
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl overflow-hidden"
          >
            {/* Table header + method filter */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">All Payments</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {transactionsData?.meta.total ?? 0} total payment records from database
                </p>
              </div>
              {/* Method filter tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                {(["", "CASH", "STRIPE"] as PaymentMethod[]).map((m) => {
                  const labels: Record<string, string> = { "": "All", CASH: "Cash", STRIPE: "Stripe" };
                  const icons: Record<string, typeof Wallet> = { "": Filter, CASH: Banknote, STRIPE: CreditCard };
                  const Icon = icons[m];
                  const active = filterMethod === m;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setFilterMethod(m);
                        setPaymentPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {labels[m]}
                    </button>
                  );
                })}
              </div>
            </div>

            {transactionsLoading ? (
              <div className="p-8 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading payments from database...
              </div>
            ) : transactionsError ? (
              <div className="p-8 text-center text-sm text-rose-600 dark:text-rose-400">
                Unable to load payment records.
              </div>
            ) : transactionsData?.data.length ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        {["Student", "Fee Type", "Amount", "Method", "Transaction ID", "Date & Time", "Status"].map((heading) => (
                          <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {transactionsData.data.map((payment, idx) => {
                          const mStyle = methodStyles[payment.method] ?? methodStyles.CASH;
                          const MIcon = mStyle.icon;
                          return (
                            <motion.tr
                              key={payment.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -16 }}
                              transition={{ delay: idx * 0.025 }}
                              className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                            >
                              {/* Student */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-500/30 shrink-0">
                                    {payment.student?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                      {payment.student?.user?.name ?? "—"}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                      {payment.student?.user?.email ?? ""}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              {/* Fee type */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <p className="font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    {payment.feeStructure?.title ?? "—"}
                                  </p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">
                                    {payment.feeStructure?.feeType ?? ""}
                                  </p>
                                </div>
                              </td>
                              {/* Amount */}
                              <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap text-base">
                                {formatTaka(payment.amount)}
                              </td>
                              {/* Method badge */}
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${mStyle.badge}`}>
                                  <MIcon className="w-3 h-3" />
                                  {mStyle.label}
                                </span>
                              </td>
                              {/* Transaction ID */}
                              <td className="px-4 py-3.5">
                                {payment.transactionId ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                    <Hash className="w-3 h-3" />
                                    {payment.transactionId.length > 16
                                      ? `${payment.transactionId.slice(0, 16)}…`
                                      : payment.transactionId}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                                )}
                              </td>
                              {/* Date */}
                              <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {payment.paidAt
                                    ? new Date(payment.paidAt).toLocaleString("en-BD", {
                                        day: "2-digit", month: "short", year: "numeric",
                                        hour: "2-digit", minute: "2-digit",
                                      })
                                    : payment.createdAt
                                    ? new Date(payment.createdAt).toLocaleString("en-BD", {
                                        day: "2-digit", month: "short", year: "numeric",
                                        hour: "2-digit", minute: "2-digit",
                                      })
                                    : "—"}
                                </div>
                              </td>
                              {/* Status */}
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusStyles[payment.status] ?? paymentStatusStyles.PENDING}`}>
                                  <CheckCircle2 className="w-3 h-3" />
                                  {payment.status}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-5 py-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing page {transactionsData.meta.page} of {transactionsData.meta.totalPages} &nbsp;·&nbsp;
                    {transactionsData.meta.total} total records
                  </p>
                  <Pagination
                    currentPage={paymentPage}
                    totalPages={transactionsData.meta.totalPages}
                    onPageChange={setPaymentPage}
                    showSummary={false}
                  />
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Inbox className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No payment records found{filterMethod ? ` for ${filterMethod.toLowerCase()} payments` : ""}.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STUDENTS WITHOUT FEE ASSIGNMENT ── */}
        {studentsWithoutFees.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-amber-200 dark:ring-amber-500/20 shadow-xl overflow-hidden"
          >
            <div className="px-5 sm:px-6 py-4 border-b border-amber-100 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-500/5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Students Without Fee Record
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {studentsWithoutFees.length} new student{studentsWithoutFees.length !== 1 ? "s" : ""} need fee assignment
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    {[
                      "Student",
                      "Roll",
                      "Class",
                      "Guardian Name",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 whitespace-nowrap"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentsWithoutFees.map((student) => {
                    const rawStudent = student as Student & {
                      parent?: { name?: string };
                      admissionRecord?: { guardianName?: string };
                    };
                    const guardianName =
                      student.guardianName ??
                      rawStudent.parent?.name ??
                      rawStudent.admissionRecord?.guardianName ??
                      "—";

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {student.name}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {student.rollNumber ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {student.class?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {guardianName}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                            Fee not assigned
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── FEE RECORDS TABLE ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Fee Records</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              All student fee assignments
            </p>
          </div>
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
                  {paginatedFees.map((fee, idx) => {
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

                {paginatedFees.length === 0 && (
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
          {totalFeePages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page {feePage} of {totalFeePages} · {filtered.length} records
              </p>
              <Pagination
                currentPage={feePage}
                totalPages={totalFeePages}
                onPageChange={setFeePage}
                summaryTemplate={() => `Page ${feePage} of ${totalFeePages}`}
              />
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Modals */}
      {showCash && <CashPaymentModal onClose={handleClose} />}
      {showPayment && selectedFee && <PaymentModal fee={selectedFee} onClose={handleClose} />}
    </div>
  );
}
