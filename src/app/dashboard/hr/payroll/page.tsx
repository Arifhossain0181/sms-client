"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Wallet, Search, CheckCircle2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type PayrollRecord = {
  id: string;
  month: number;
  year: number;
  basicPay: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  attendanceDays: number;
  leaveDays: number;
  status: string;
  paidAt?: string;
  staff: { name: string; employeeId: string; designation?: string };
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
  EXAM_CONTROLLER: "Exam Controller",
  HR: "HR",
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PayrollPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>("");

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "ACCOUNTANT") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const url = `/hr/payroll${yearFilter ? `?year=${yearFilter}` : ""}`;
        const res = await api.get(url);
        const payload = res.data?.data ?? res.data;
        setPayrolls(payload.payrolls ?? []);
      } catch {
        setPayrolls([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [yearFilter]);

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Mark this payroll as paid?")) return;
    try {
      await api.patch(`/hr/payroll/${id}/mark-paid`);
      const res = await api.get(`/hr/payroll${yearFilter ? `?year=${yearFilter}` : ""}`);
      const payload = res.data?.data ?? res.data;
      setPayrolls(payload.payrolls ?? []);
    } catch {
      alert("Failed to update payroll");
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      PENDING: { cls: "bg-amber-100 text-amber-700", label: "Pending" },
      PAID: { cls: "bg-emerald-100 text-emerald-700", label: "Paid" },
      FAILED: { cls: "bg-red-100 text-red-700", label: "Failed" },
    };
    const s = map[status] ?? { cls: "bg-gray-100 text-gray-700", label: status };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-6xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Payroll Management
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <Wallet className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Monthly salary generation and payment tracking
                </p>
              </div>
              <input
                type="number"
                placeholder="Filter by year (e.g. 2026)"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-48 rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              />
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-16 rounded-md" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : payrolls.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <Wallet className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No payroll records found
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Payroll records will appear here once generated.
                </p>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                      <th className="pb-2 font-medium">Staff</th>
                      <th className="pb-2 font-medium">Period</th>
                      <th className="pb-2 font-medium text-right">Basic Pay</th>
                      <th className="pb-2 font-medium text-right">Allowances</th>
                      <th className="pb-2 font-medium text-right">Deductions</th>
                      <th className="pb-2 font-medium text-right">Net Salary</th>
                      <th className="pb-2 font-medium text-center">Days</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {payrolls.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3">
                          <p className="font-medium text-slate-900 dark:text-white">{p.staff.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{p.staff.employeeId}</p>
                        </td>
                        <td className="py-3 text-slate-700 dark:text-slate-200">
                          {monthNames[p.month - 1]} {p.year}
                        </td>
                        <td className="py-3 text-right text-slate-900 dark:text-white">৳{p.basicPay.toLocaleString()}</td>
                        <td className="py-3 text-right text-emerald-600 dark:text-emerald-400">+৳{p.allowances.toLocaleString()}</td>
                        <td className="py-3 text-right text-red-600 dark:text-red-400">-৳{p.deductions.toLocaleString()}</td>
                        <td className="py-3 text-right font-semibold text-slate-900 dark:text-white">৳{p.netSalary.toLocaleString()}</td>
                        <td className="py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                          {p.attendanceDays}P / {p.leaveDays}L
                        </td>
                        <td className="py-3">{getStatusBadge(p.status)}</td>
                        <td className="py-3">
                          {p.status === "PENDING" && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleMarkPaid(p.id)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Mark Paid
                            </motion.button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
