"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  CreditCard,
  Inbox,
  Loader2,
  FileText,
  BarChart3,
  Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatTaka, cn } from "@/lib/utils";
import { feesService } from "@/app/modules/fees/fees.service";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
};

const exportReportPdf = (report: any, month: string) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const byTypeEntries = report?.byType ? Object.entries(report.byType) : [];
  const byMethodEntries = report?.byMethod ? Object.entries(report.byMethod) : [];
  const totalCollected = Number(report?.totalCollected ?? 0);
  const totalTransactions = Number(report?.totalTransactions ?? 0);
  const totalOnline = Number(byMethodEntries.find(([k]) => k === "ONLINE" || k === "STRIPE")?.[1] ?? 0);
  const totalOffline = Number(byMethodEntries.find(([k]) => k === "OFFLINE" || k === "CASH")?.[1] ?? 0);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Report", 40, 50);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Month: ${month}`, 40, 68);
  doc.text(`Generated: ${dateStr} ${timeStr}`, 40, 82);

  let y = 110;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Summary", 40, y);
  y += 18;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Collected", formatTaka(totalCollected)],
      ["Total Transactions", String(totalTransactions)],
      ["Online Amount", formatTaka(totalOnline)],
      ["Offline Amount", formatTaka(totalOffline)],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], fontSize: 11 },
    bodyStyles: { fontSize: 11, cellPadding: 8 },
    columnStyles: { 0: { cellWidth: 260 }, 1: { cellWidth: 200, halign: "right" } },
    styles: { overflow: "linebreak", cellWidth: "auto" },
  });

  y = (doc as any).lastAutoTable.finalY + 24;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Collection by Type", 40, y);
  y += 14;

  if (byTypeEntries.length === 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("No data available.", 40, y);
    y += 20;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Type", "Amount"]],
      body: byTypeEntries.map(([type, amount]) => [type, formatTaka(Number(amount))]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], fontSize: 11 },
      bodyStyles: { fontSize: 11, cellPadding: 8 },
      columnStyles: { 0: { cellWidth: 300 }, 1: { cellWidth: 160, halign: "right" } },
      styles: { overflow: "linebreak", cellWidth: "auto" },
    });
    y = (doc as any).lastAutoTable.finalY + 24;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Collection by Method", 40, y);
  y += 14;

  if (byMethodEntries.length === 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("No data available.", 40, y);
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Method", "Amount"]],
      body: byMethodEntries.map(([method, amount]) => [method, formatTaka(Number(amount))]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], fontSize: 11 },
      bodyStyles: { fontSize: 11, cellPadding: 8 },
      columnStyles: { 0: { cellWidth: 300 }, 1: { cellWidth: 160, halign: "right" } },
      styles: { overflow: "linebreak", cellWidth: "auto" },
    });
  }

  doc.save(`financial-report-${month}.pdf`);
};

export default function ReportsPage() {
  const { role } = useAuth();
  const canView = !!role && hasPermission(role, "view_financial_reports");

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data, isLoading } = useQuery({
    queryKey: ["fees", "report", "collection", month],
    queryFn: () => feesService.getCollectionReport({ month }),
    enabled: canView,
  });

  if (!canView) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  const report = data;
  const byTypeEntries = report?.byType ? Object.entries(report.byType) : [];
  const byMethodEntries = report?.byMethod ? Object.entries(report.byMethod) : [];
  const totalCollected = report?.totalCollected ?? 0;
  const totalTransactions = report?.totalTransactions ?? 0;
  const totalOnline = byMethodEntries.find(([k]) => k === "ONLINE" || k === "STRIPE")?.[1] ?? 0;
  const totalOffline = byMethodEntries.find(([k]) => k === "OFFLINE" || k === "CASH")?.[1] ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Financial Reports</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Monthly collection reports</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative sm:w-48">
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <button
              onClick={() => report && exportReportPdf(report, month)}
              disabled={!report || isLoading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Collected", value: totalCollected, icon: DollarSign, gradient: "from-blue-500 to-indigo-600", ring: "ring-blue-500/20", glow: "shadow-blue-500/10" },
            { label: "Total Transactions", value: totalTransactions, icon: BarChart3, gradient: "from-purple-500 to-indigo-600", ring: "ring-purple-500/20", glow: "shadow-purple-500/10", isText: true },
            { label: "Online Amount", value: totalOnline, icon: CreditCard, gradient: "from-emerald-500 to-teal-600", ring: "ring-emerald-500/20", glow: "shadow-emerald-500/10" },
            { label: "Offline Amount", value: totalOffline, icon: DollarSign, gradient: "from-amber-500 to-orange-600", ring: "ring-amber-500/20", glow: "shadow-amber-500/10" },
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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl space-y-3">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="w-10 h-10 rounded-xl ml-auto" />
              </div>
            ))}
          </div>
        ) : !report ? (
          <motion.div variants={itemVariants}
            className="bg-white dark:bg-slate-900 rounded-2xl p-8 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Inbox className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No report data available for this month.</p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* By Type Breakdown */}
            <motion.div variants={itemVariants}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Collection by Type
              </h3>
              {byTypeEntries.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No data available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {byTypeEntries.map(([type, amount]) => (
                    <div key={type} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 ring-1 ring-slate-200 dark:ring-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{type}</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatTaka(amount as number)}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* By Method Breakdown */}
            <motion.div variants={itemVariants}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Collection by Method</h3>
              {byMethodEntries.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No data available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {byMethodEntries.map(([method, amount]) => (
                    <div key={method} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 ring-1 ring-slate-200 dark:ring-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{method}</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatTaka(amount as number)}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
