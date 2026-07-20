"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Wallet, Search, CheckCircle2, FileText } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground mt-1">
            Monthly salary generation and payment tracking
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          placeholder="Filter by year (e.g. 2026)"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="w-48 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : payrolls.length === 0 ? (
          <p className="text-xs text-muted-foreground">No payroll records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
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
              <tbody className="divide-y divide-border/60">
                {payrolls.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3">
                      <p className="font-medium">{p.staff.name}</p>
                      <p className="text-xs text-muted-foreground">{p.staff.employeeId}</p>
                    </td>
                    <td className="py-3">
                      {monthNames[p.month - 1]} {p.year}
                    </td>
                    <td className="py-3 text-right">৳{p.basicPay.toLocaleString()}</td>
                    <td className="py-3 text-right text-emerald-600">+৳{p.allowances.toLocaleString()}</td>
                    <td className="py-3 text-right text-red-600">-৳{p.deductions.toLocaleString()}</td>
                    <td className="py-3 text-right font-semibold">৳{p.netSalary.toLocaleString()}</td>
                    <td className="py-3 text-center text-xs text-muted-foreground">
                      {p.attendanceDays}P / {p.leaveDays}L
                    </td>
                    <td className="py-3">{getStatusBadge(p.status)}</td>
                    <td className="py-3">
                      {p.status === "PENDING" && (
                        <button
                          onClick={() => handleMarkPaid(p.id)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Mark Paid
                        </button>
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
  );
}
