"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  Inbox,
  Loader2,
  CreditCard,
  DollarSign,
  Receipt,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatTaka, cn } from "@/lib/utils";
import { feesService } from "@/app/modules/fees/fees.service";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
};

const methodStyles: Record<string, string> = {
  STRIPE: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
  CASH: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
};

const statusStyles: Record<string, { badge: string; label: string }> = {
  PAID: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    label: "Paid",
  },
  FAILED: {
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    label: "Failed",
  },
  PENDING: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    label: "Pending",
  },
  REFUNDED: {
    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
    label: "Refunded",
  },
};

const buildPrintDocument = (rows: { id: string; amount: number; method: string; status: string; transactionId?: string; paidAt?: string; createdAt: string; student: { user: { name?: string; email?: string } }; feeStructure: { title?: string; feeType?: string } }[]) => {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const total = rows.reduce((sum, tx) => sum + tx.amount, 0);

  const tableRows = rows
    .map(
      (tx, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${tx.student?.user?.name ?? "—"}<br/><span style="color:#64748b;font-size:12px">${tx.student?.user?.email ?? ""}</span></td>
          <td>${tx.feeStructure?.title ?? "—"}<br/><span style="color:#64748b;font-size:12px">${tx.feeStructure?.feeType ?? ""}</span></td>
          <td style="text-align:right">${formatTaka(tx.amount)}</td>
          <td style="text-align:center">${tx.method}</td>
          <td style="text-align:center">${tx.transactionId ?? "—"}</td>
          <td style="text-align:center">${tx.status}</td>
          <td style="text-align:right">${tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : new Date(tx.createdAt).toLocaleDateString()}</td>
        </tr>
      `
    )
    .join("");

  return `
    <html>
      <head>
        <title>Transactions Report</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            padding: 24px;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 16px;
          }
          .title {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.2px;
          }
          .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .meta {
            text-align: right;
            font-size: 12px;
            color: #334155;
            line-height: 1.6;
          }
          .summary {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
          }
          .summary-card {
            flex: 1;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 14px;
          }
          .summary-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #64748b;
            font-weight: 600;
          }
          .summary-value {
            font-size: 18px;
            font-weight: 700;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          thead tr {
            background: #0f172a;
            color: #ffffff;
          }
          thead th {
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          tbody td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          .footer {
            margin-top: 20px;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
          .total-row {
            background: #0f172a !important;
            color: #ffffff;
            font-weight: 700;
          }
          .total-row td {
            border-bottom: none;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Transactions Report</div>
            <div class="subtitle">Generated from SMS System</div>
          </div>
          <div class="meta">
            <div>Date: ${dateStr}</div>
            <div>Time: ${timeStr}</div>
            <div>Total Records: ${rows.length}</div>
          </div>
        </div>

        <div class="summary">
          <div class="summary-card">
            <div class="summary-label">Total Transactions</div>
            <div class="summary-value">${rows.length}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total Amount</div>
            <div class="summary-value">${formatTaka(total)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Paid</div>
            <div class="summary-value">${formatTaka(rows.filter((tx) => tx.status === "PAID").reduce((s, tx) => s + tx.amount, 0))}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Pending</div>
            <div class="summary-value">${formatTaka(rows.filter((tx) => tx.status === "PENDING").reduce((s, tx) => s + tx.amount, 0))}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Fee</th>
              <th style="text-align:right">Amount</th>
              <th style="text-align:center">Method</th>
              <th style="text-align:center">Transaction ID</th>
              <th style="text-align:center">Status</th>
              <th style="text-align:right">Date</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="3" style="text-align:right">Grand Total</td>
              <td style="text-align:right">${formatTaka(total)}</td>
              <td colspan="4"></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div>Prepared by: ${"Accountant"}</div>
          <div>Page 1 of 1</div>
        </div>
      </body>
    </html>
  `;
};

const exportPdf = (rows: { id: string; amount: number; method: string; status: string; transactionId?: string; paidAt?: string; createdAt: string; student: { user: { name?: string; email?: string } }; feeStructure: { title?: string; feeType?: string } }[]) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const total = rows.reduce((sum, tx) => sum + tx.amount, 0);

  doc.setFontSize(18);
  doc.text("Transactions Report", 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${dateStr} ${timeStr}`, 14, 22);
  doc.text(`Total Records: ${rows.length}`, 14, 27);

  autoTable(doc, {
    startY: 33,
    head: [["#", "Student", "Fee", "Amount", "Method", "Transaction ID", "Status", "Date"]],
    body: rows.map((tx, idx) => {
      const studentName = tx.student?.user?.name ?? "—";
      const studentEmail = tx.student?.user?.email ?? "";
      const feeTitle = tx.feeStructure?.title ?? "—";
      const feeType = tx.feeStructure?.feeType ?? "";
      const date = tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : new Date(tx.createdAt).toLocaleDateString();
      return [
        idx + 1,
        `${studentName}\n${studentEmail}`,
        `${feeTitle}\n${feeType}`,
        formatTaka(tx.amount),
        tx.method,
        tx.transactionId ?? "—",
        tx.status,
        date,
      ];
    }),
    foot: [["", "", "Grand Total", formatTaka(total), "", "", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], fontSize: 10 },
    bodyStyles: { fontSize: 9, cellPadding: 4 },
    footStyles: { fillColor: [15, 23, 42], fontSize: 10, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 38, halign: "center" },
      6: { cellWidth: 22, halign: "center" },
      7: { cellWidth: 28, halign: "right" },
    },
    styles: { overflow: "linebreak" },
  });

  doc.save(`transactions-${today.toISOString().slice(0, 10)}.pdf`);
};

export default function TransactionsPage() {
  const { role } = useAuth();
  const canView = !!role && hasPermission(role, "manage_fees");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [month, setMonth] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["fees", "transactions", page, limit, method, status, month],
    queryFn: () =>
      feesService.getTransactions({
        page,
        limit,
        ...(method ? { method } : {}),
        ...(status ? { status } : {}),
        ...(month ? { month } : {}),
      }),
    enabled: canView,
  });

  const transactions = data?.data ?? [];
  const meta = data?.meta;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTransactions = normalizedQuery
    ? transactions.filter((tx) => {
        const studentName = tx.student?.user?.name?.toLowerCase() ?? "";
        const feeTitle = tx.feeStructure?.title?.toLowerCase() ?? "";
        const transactionId = tx.transactionId?.toLowerCase() ?? "";
        return (
          studentName.includes(normalizedQuery) ||
          feeTitle.includes(normalizedQuery) ||
          transactionId.includes(normalizedQuery)
        );
      })
    : transactions;

  const totalAmount = filteredTransactions.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0);
  const totalPages = meta?.totalPages ?? 1;

  const handleExportPdf = () => {
    exportPdf(filteredTransactions);
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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Transactions</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {normalizedQuery ? filteredTransactions.length : (meta?.total ?? transactions.length)}
                </span>
                {" "}transactions
                {normalizedQuery ? ` for "${searchQuery}"` : ""}
              </p>
            </div>
          </div>
          <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExportPdf}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all">
            <Download className="w-4 h-4" />
            Export PDF
          </motion.button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Transactions", value: normalizedQuery ? filteredTransactions.length : (meta?.total ?? transactions.length), icon: Receipt, gradient: "from-indigo-500 to-purple-600", ring: "ring-indigo-500/20", glow: "shadow-indigo-500/10", isText: true },
            { label: "Total Amount", value: totalAmount, icon: DollarSign, gradient: "from-blue-500 to-indigo-600", ring: "ring-blue-500/20", glow: "shadow-blue-500/10" },
            { label: "Online Payments", value: filteredTransactions.filter((t) => t.method === "STRIPE").reduce((s, t) => s + t.amount, 0), icon: CreditCard, gradient: "from-emerald-500 to-teal-600", ring: "ring-emerald-500/20", glow: "shadow-emerald-500/10" },
          ].map((card) => (
            <motion.div key={card.label} variants={itemVariants} whileHover={{ y: -4 }}
              className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ${card.ring} shadow-xl ${card.glow} transition-all`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {card.isText ? (card.value as number).toLocaleString() : formatTaka(card.value as number)}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, fee or transaction ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="relative sm:w-48">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer">
              <option value="">All Methods</option>
              <option value="STRIPE">Online (Stripe)</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
          <div className="relative sm:w-40">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer">
                <option value="">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
                <option value="REFUNDED">Refunded</option>
              </select>
          </div>
          <div className="relative sm:w-44">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }}
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
                  {["Student", "Fee", "Amount", "Method", "Transaction ID", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8">
                      <div className="space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0 animate-pulse" />
                            <div className="flex-1 space-y-1">
                              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Inbox className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No transactions found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, idx) => {
                    const statusStyle = statusStyles[tx.status] ?? statusStyles.PENDING;
                    const methodStyle = methodStyles[tx.method] ?? methodStyles.STRIPE;
                    return (
                      <motion.tr key={tx.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-500/30">
                              {tx.student.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{tx.student.user.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{tx.student.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-900 dark:text-white">{tx.feeStructure.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{tx.feeStructure.feeType}</p>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{formatTaka(tx.amount)}</td>
                        <td className="px-4 py-3.5">
                          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", methodStyle)}>{tx.method}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">{tx.transactionId ?? "—"}</td>
                        <td className="px-4 py-3.5">
                          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", statusStyle.badge)}>{statusStyle.label}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : new Date(tx.createdAt).toLocaleDateString()}
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30 dark:hover:bg-indigo-500/20 disabled:opacity-50 transition-colors">
                  Previous
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium shadow-sm shadow-indigo-500/20 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-colors">
                  Next
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
