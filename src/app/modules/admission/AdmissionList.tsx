"use client";

import { useState } from "react";
import { useAdmissions, useUpdateAdmissionStatus, useDeleteAdmission } from "./useAdmission";
import AdmissionForm from "./AdmissionForm";
import AdmissionDetail from "./AdmissionDetail";
import { hasPermission } from "@/config/roles";
import { useAuth } from "@/hooks/useAuth";
import type { Admission } from "./admission.types";

const statusColor = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdmissionList() {
  const { data: admissions, isLoading } = useAdmissions();
  const { mutate: updateStatus } = useUpdateAdmissionStatus();
  const { mutate: deleteAdmission } = useDeleteAdmission();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Admission | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const admissionList = Array.isArray(admissions) ? admissions : [];
  const filtered = admissionList.filter((a) => {
    const matchSearch = a.applicantName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = filterStatus ? a.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const handleApprove = (id: string) => {
    if (confirm("Approve করবেন?")) updateStatus({ id, status: "APPROVED" });
  };

  const handleReject = (id: string) => {
    if (confirm("Reject করবেন?")) updateStatus({ id, status: "REJECTED" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteAdmission(id);
  };

  const handleDetail = (admission: Admission) => {
    setSelected(admission);
    setShowDetail(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setShowDetail(false);
    setSelected(null);
  };

  const pending = admissionList.filter((a) => a.status === "PENDING").length;
  const approved = admissionList.filter((a) => a.status === "APPROVED").length;
  const rejected = admissionList.filter((a) => a.status === "REJECTED").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admission</h1>
          <p className="text-sm text-gray-500">
            মোট {admissionList.length} টি application
          </p>
        </div>

        {role && hasPermission(role, "manage_admission") && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + New Admission
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-400">
          <p className="text-xs text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-400">
          <p className="text-xs text-gray-500 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-600">{approved}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-400">
          <p className="text-xs text-gray-500 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{rejected}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4 sm:flex-row">
        <input
          type="text"
          placeholder="নাম দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:flex-1 sm:max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">সব Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="grid gap-4 md:hidden">
        {filtered.map((admission) => (
          <div key={admission.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{admission.applicantName}</p>
                <p className="text-xs text-gray-500">{admission.guardianEmail}</p>
                <p className="text-xs text-gray-500">{admission.guardianPhone}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[admission.status]}`}
              >
                {admission.status}
              </span>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <p>
                Class: {admission.targetClass?.name} (Class {admission.targetClass?.numericLevel})
              </p>
              <p>Apply: {admission.createdAt}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <button
                onClick={() => handleDetail(admission)}
                className="text-blue-600 hover:underline"
              >
                View
              </button>
              {role && hasPermission(role, "manage_admission") && (
                <>
                  <button
                    onClick={() => handleApprove(admission.id)}
                    disabled={admission.status === "APPROVED"}
                    className={
                      admission.status === "APPROVED"
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-green-600 hover:underline"
                    }
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(admission.id)}
                    disabled={admission.status === "APPROVED"}
                    className={
                      admission.status === "APPROVED"
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-600 hover:underline"
                    }
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleDelete(admission.id)}
                    className="text-gray-600 hover:underline"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-6 text-gray-500">No admissions found.</div>
        )}
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">নাম</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Class</th>
              <th className="px-6 py-3 text-left">Apply তারিখ</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((admission) => (
              <tr key={admission.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">{admission.applicantName}</td>
                <td className="px-6 py-3">{admission.guardianEmail}</td>
                <td className="px-6 py-3">{admission.guardianPhone}</td>
                <td className="px-6 py-3">
                  {admission.targetClass?.name} (Class {admission.targetClass?.numericLevel})
                </td>
                <td className="px-6 py-3">{admission.createdAt}</td>
                <td className="px-6 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[admission.status]}`}
                  >
                    {admission.status}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => handleDetail(admission)}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                  {role && hasPermission(role, "manage_admission") && (
                    <>
                      <button
                        onClick={() => handleApprove(admission.id)}
                        disabled={admission.status === "APPROVED"}
                        className={`ml-2 ${
                          admission.status === "APPROVED"
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-green-600 hover:underline"
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(admission.id)}
                        disabled={admission.status === "APPROVED"}
                        className={`ml-2 ${
                          admission.status === "APPROVED"
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-600 hover:underline"
                        }`}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDelete(admission.id)}
                        className="text-gray-600 hover:underline ml-2"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No admissions found.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {showForm && <AdmissionForm onClose={handleClose} />}
      {showDetail && selected && (
        <AdmissionDetail admission={selected} onClose={handleClose} />
      )}
    </div>
  );
}