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
  Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { feesService } from "@/app/modules/fees/fees.service";
import { formatTaka, cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SCHOOL_NAME = "NEXT LEVEL SCHOOL";
const SCHOOL_ADDRESS = "123 Education Street, Dhaka, Bangladesh";
const SCHOOL_CONTACT = "Phone: +880 1234-567890 | Email: info@nextlevel.edu";

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
  email?: string;
  guardianEmail?: string;
  phone?: string;
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

const exportInvoicePdf = (student: StudentOption, fees: any[], totalAmount: number, totalPaid: number, totalDue: number) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt" });
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const invoiceNo = fees.length > 0 ? fees[0].id.slice(0, 8).toUpperCase() : "N/A";

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(SCHOOL_NAME, 40, 50);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text(SCHOOL_ADDRESS, 40, 66);
  doc.text(SCHOOL_CONTACT, 40, 80);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(40, 92, 555, 92);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("INVOICE", 40, 112);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text(`Invoice #: ${invoiceNo}`, 40, 128);
  doc.text(`Date: ${dateStr} ${timeStr}`, 40, 142);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Bill To:", 40, 166);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20);
  doc.text(student.name, 40, 180);
  if (student.rollNumber) doc.text(`Roll No: ${student.rollNumber}`, 40, 194);
  if (student.class?.name) doc.text(`Class: ${student.class.name}`, 40, 208);
  if (student.email) doc.text(`Email: ${student.email}`, 40, 222);

  let y = 260;

  if (fees.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Fee Type / Title", "Month", "Amount", "Paid", "Due", "Status"]],
      body: fees.map((fee) => [
        `${fee.feeType ?? "Fee"}\n${fee.title ?? ""}`,
        fee.month ?? "",
        formatTaka(fee.amount),
        formatTaka(fee.paidAmount),
        formatTaka(fee.dueAmount),
        fee.status === "PAID" ? "Paid" : fee.status === "PARTIAL" ? "Partial" : "Unpaid",
      ]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], fontSize: 10, textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 10, textColor: [20, 20, 20], cellPadding: 6 },
      footStyles: { fillColor: [15, 23, 42], fontSize: 10, textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 180 },
        1: { cellWidth: 80, halign: "center" },
        2: { cellWidth: 70, halign: "right" },
        3: { cellWidth: 70, halign: "right" },
        4: { cellWidth: 70, halign: "right" },
        5: { cellWidth: 70, halign: "center" },
      },
      styles: { overflow: "linebreak", lineWidth: 0.1, lineColor: [180, 180, 180] },
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Payment Summary", 40, y);
    y += 16;

    autoTable(doc, {
      startY: y,
      head: [["Metric", "Amount"]],
      body: [
        ["Total Amount", formatTaka(totalAmount)],
        ["Total Paid", formatTaka(totalPaid)],
        ["Balance Due", formatTaka(totalDue)],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138], fontSize: 10, textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 10, textColor: [20, 20, 20], cellPadding: 6 },
      columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: 160, halign: "right" } },
      styles: { lineWidth: 0.1, lineColor: [180, 180, 180] },
    });
  } else {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("No fee records available for this student.", 40, y);
  }

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated on: ${dateStr} ${timeStr}`, 40, 780);
  doc.text("Authorized Signature: ____________________", 300, 780);

  doc.save(`invoice-${student.name.replace(/\s+/g, "-").toLowerCase()}-${invoiceNo}.pdf`);
};

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

  useEffect(() => {
    const styleId = "invoice-print-styles";
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media print {
        @page {
          size: A4;
          margin: 15mm 12mm 15mm 12mm;
        }
        body {
          background: #ffffff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        #invoice-print-area {
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
        }
        #invoice-print-area .invoice-header {
          background: #2563eb !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color: #ffffff !important;
        }
        #invoice-print-area .invoice-header * {
          color: #ffffff !important;
        }
        #invoice-print-area table thead tr {
          background: #0f172a !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color: #ffffff !important;
        }
        #invoice-print-area table thead th {
          color: #ffffff !important;
        }
        #invoice-print-area .bg-emerald-50,
        #invoice-print-area .bg-rose-50,
        #invoice-print-area .bg-amber-50 {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        #invoice-print-area .text-emerald-600,
        #invoice-print-area .text-rose-600 {
          color: #000000 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const handleExportPdf = () => {
    if (selectedStudent && fees.length > 0) {
      exportInvoicePdf(selectedStudent, fees, totalAmount, totalPaid, totalDue);
    }
  };

  if (!canView) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8 no-print">
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
            <>
              <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all">
                <Printer className="w-4 h-4" />
                Print Invoice
              </motion.button>
              <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExportPdf}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:from-emerald-700 hover:to-teal-700 transition-all">
                <Download className="w-4 h-4" />
                Export PDF
              </motion.button>
            </>
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
            className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl overflow-hidden" id="invoice-print-area">
            {/* School Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white invoice-header">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{SCHOOL_NAME}</h2>
                  <p className="text-blue-100 text-sm mt-1">{SCHOOL_ADDRESS}</p>
                  <p className="text-blue-100 text-sm">{SCHOOL_CONTACT}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-3xl font-bold">INVOICE</h3>
                  <p className="text-blue-100 text-sm mt-1">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Invoice Info & Student Info */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-2xl font-bold text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-500/30">
                    {selectedStudent?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedStudent?.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {selectedStudent?.rollNumber && (
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          Roll: {selectedStudent.rollNumber}
                        </span>
                      )}
                      {selectedStudent?.class?.name && (
                        <span className="inline-flex items-center gap-1">
                          Class: {selectedStudent.class.name}
                        </span>
                      )}
                      {selectedStudent?.email && (
                        <span className="text-slate-500 dark:text-slate-400">{selectedStudent.email}</span>
                      )}
                    </div>
                  </div>
                </div>
                {fees.length > 0 && (
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice #</p>
                    <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{fees[0].id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

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
                        <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                          {["Fee Type", "Month", "Due Date", "Amount", "Paid", "Due", "Status"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fees.map((fee, idx) => {
                          const status = statusStyles[fee.status] ?? statusStyles.UNPAID;
                          return (
                            <motion.tr key={fee.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                              className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white">{fee.feeType || "Fee"}</p>
                                  {fee.title && <p className="text-xs text-slate-500 dark:text-slate-400">{fee.title}</p>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium">{fee.month}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "—"}</td>
                              <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{formatTaka(fee.amount)}</td>
                              <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatTaka(fee.paidAmount)}</td>
                              <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">{formatTaka(fee.dueAmount)}</td>
                              <td className="px-4 py-3">
                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold", status.badge)}>
                                  <span className={cn("w-2 h-2 rounded-full", status.dot)} />
                                  {status.label}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Payment History */}
                  {fees.some((f) => f.payments && f.payments.length > 0) && (
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Payment History</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              {["Date", "Method", "Amount", "Status", "Transaction ID"].map((h) => (
                                <th key={h} className="px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {fees.flatMap((f) => (f.payments ?? []).map((p) => (
                              <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-slate-700 dark:text-slate-200 font-medium">{p.method}</td>
                                <td className="px-4 py-2 font-bold text-slate-900 dark:text-white">{formatTaka(p.amount)}</td>
                                <td className="px-4 py-2">
                                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                                    p.status === "PAID" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" :
                                    p.status === "FAILED" ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" :
                                    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300")}>
                                    {p.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-slate-600 dark:text-slate-300 font-mono text-xs">{p.transactionId ?? "—"}</td>
                              </tr>
                            )))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="mt-6 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
                      <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Amount</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">{formatTaka(totalAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Paid</p>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatTaka(totalPaid)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Balance Due</p>
                          <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{formatTaka(totalDue)}</p>
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
