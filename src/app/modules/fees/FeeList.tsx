"use client";

import { useState } from "react";
import { useFees, useDeleteFee } from "./useFees";
import CashPaymentModal from "@/app/modules/fees/CashPaymentModal";
import PaymentModal from "@/app/modules/fees/PaymentModal";
import { Fee } from "./fees.types";
import { formatDate, formatTaka } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

const statusColor = {
  PAID:    "bg-green-100 text-green-700",
  UNPAID:  "bg-red-100 text-red-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
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

  const safeFees = Array.isArray(fees) ? fees : [];
  const filtered = safeFees.filter((f) => {
    const matchSearch = f.student?.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = filterStatus ? f.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const handlePay = (fee: Fee) => {
    setSelectedFee(fee);
    setShowPayment(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteFee(id);
  };

  const handleClose = () => {
    setShowCash(false);
    setShowPayment(false);
    setSelectedFee(null);
  };

  // Summary
  const totalAmount  = safeFees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid    = safeFees.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalDue     = safeFees.reduce((sum, f) => sum + f.dueAmount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fees</h1>
          <p className="text-sm text-gray-500">মোট {safeFees.length} টি fee record</p>
        </div>

        {role && hasPermission(role, "manage_fees") && (
          <button
            onClick={() => setShowCash(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Cash Payment
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 mb-1">মোট Amount</p>
          <p className="text-xl font-bold text-gray-800">{formatTaka(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 mb-1">মোট Paid</p>
          <p className="text-xl font-bold text-green-600">{formatTaka(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 mb-1">মোট Due</p>
          <p className="text-xl font-bold text-red-600">{formatTaka(totalDue)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Student নাম দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">সব Status</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Student</th>
              <th className="px-6 py-3 text-left">Class</th>
              <th className="px-6 py-3 text-left">Month</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-left">Paid</th>
              <th className="px-6 py-3 text-left">Due</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((fee) => (
              <tr key={fee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">
                  {fee.student?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {fee.student?.class?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">{fee.month}</td>
                <td className="px-6 py-4 text-gray-600">{formatTaka(fee.amount)}</td>
                <td className="px-6 py-4 text-green-600 font-medium">
                  {formatTaka(fee.paidAmount)}
                </td>
                <td className="px-6 py-4 text-red-600 font-medium">
                  {formatTaka(fee.dueAmount)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[fee.status]}`}>
                    {fee.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {/* Pay button — UNPAID বা PARTIAL হলে */}
                    {role && hasPermission(role, "manage_fees") &&
                      fee.status !== "PAID" && (
                        <button
                          onClick={() => handlePay(fee)}
                          className="text-green-600 hover:underline text-xs font-medium"
                        >
                          Pay
                        </button>
                      )}
                    {role && hasPermission(role, "manage_fees") && (
                      <button
                        onClick={() => handleDelete(fee.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  কোনো fee record নেই
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCash && <CashPaymentModal onClose={handleClose} />}
      {showPayment && selectedFee && (
        <PaymentModal fee={selectedFee} onClose={handleClose} />
      )}
    </div>
  );
}