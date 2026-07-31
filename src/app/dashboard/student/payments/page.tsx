"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  createdAt: string;
  fee?: {
    id: string;
    type: string;
    month: string;
    dueDate: string;
    amount: number;
  };
};

type FeeSummary = {
  totalDue: number;
  totalPaid: number;
  totalOverdue: number;
  payments: Payment[];
};

const statusStyles: Record<string, { badge: string; label: string }> = {
  PAID: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    label: "Paid",
  },
  PENDING: {
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    label: "Pending",
  },
  PARTIAL: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    label: "Partial",
  },
  WAIVED: {
    badge: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
    label: "Waived",
  },
};

export default function StudentPaymentsPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FeeSummary | null>(null);

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/fees/my-fees");
        const data = unwrap<FeeSummary>(res);
        setSummary(data);
      } catch (err) {
        setError("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  const payments = summary?.payments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">Your fee and payment history.</p>
        </div>
        <Link href="/dashboard/student" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Due", value: `৳${summary.totalDue.toLocaleString()}` },
            { label: "Total Paid", value: `৳${summary.totalPaid.toLocaleString()}` },
            { label: "Total Overdue", value: `৳${summary.totalOverdue.toLocaleString()}` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && payments.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft text-center text-sm text-muted-foreground">
          No payment records found.
        </div>
      )}

      {!loading && payments.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Fee Type</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Method</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Transaction ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {payments.map((payment) => {
                  const style = statusStyles[payment.status] ?? statusStyles.PENDING;
                  return (
                    <tr key={payment.id}>
                      <td className="py-3 px-4 text-foreground">{formatDate(payment.createdAt)}</td>
                      <td className="py-3 px-4 text-foreground">{payment.fee?.type ?? "-"}</td>
                      <td className="py-3 px-4 text-foreground">৳{payment.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-foreground capitalize">{payment.method?.toLowerCase() ?? "-"}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${style.badge}`}>{style.label}</span>
                      </td>
                      <td className="py-3 px-4 text-foreground text-xs">{payment.transactionId ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
