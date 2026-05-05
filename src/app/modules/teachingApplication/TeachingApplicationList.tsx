"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import {
  TeachingApplication,
  TeachingApplicationStatus,
} from "./teachingApplication.types";
import {
  useTeachingApplications,
  useUpdateTeachingApplicationStatus,
} from "./useTeachingApplication";

const statusColor: Record<TeachingApplicationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function TeachingApplicationList() {
  const { data, isLoading } = useTeachingApplications();
  const { mutate: updateStatus } = useUpdateTeachingApplicationStatus();
  const { role } = useAuth();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<TeachingApplication | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const list = Array.isArray(data) ? data : [];
  const filtered = useMemo(() => {
    return list.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
        || item.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus ? item.status === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [list, search, filterStatus]);

  const handleApprove = (id: string) => {
    if (confirm("Approve করবেন?")) updateStatus({ id, data: { status: "APPROVED" } });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Reject reason লিখুন (optional)") ?? undefined;
    if (confirm("Reject করবেন?")) updateStatus({ id, data: { status: "REJECTED", rejectionReason: reason } });
  };

  const handleView = (item: TeachingApplication) => {
    setSelected(item);
    setShowDetail(true);
  };

  const handleClose = () => {
    setSelected(null);
    setShowDetail(false);
  };

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
          <h1 className="text-2xl font-bold text-gray-800">Teaching Applications</h1>
          <p className="text-sm text-gray-500">মোট {list.length} টি application</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="নাম বা email দিয়ে খুঁজুন..."
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
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">নাম</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Designation</th>
              <th className="px-6 py-3 text-left">Experience</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item: TeachingApplication) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">{item.name}</td>
                <td className="px-6 py-3">{item.email}</td>
                <td className="px-6 py-3">{item.phone}</td>
                <td className="px-6 py-3">{item.designation}</td>
                <td className="px-6 py-3">{item.experience} yrs</td>
                <td className="px-6 py-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[item.status]}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => handleView(item)}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                  {role && hasPermission(role, "create_teacher") ? (
                    item.status === "PENDING" ? (
                      <>
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="text-green-600 hover:underline ml-2"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="text-red-600 hover:underline ml-2"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs ml-2">No action</span>
                    )
                  ) : (
                    <span className="text-gray-400 text-xs ml-2">—</span>
                  )}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showDetail && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Teaching Application</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{selected.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{selected.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{selected.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Gender</p>
                <p className="font-medium">{selected.gender}</p>
              </div>
              <div>
                <p className="text-gray-500">Date of Birth</p>
                <p className="font-medium">{selected.dob}</p>
              </div>
              <div>
                <p className="text-gray-500">Designation</p>
                <p className="font-medium">{selected.designation}</p>
              </div>
              <div>
                <p className="text-gray-500">Department</p>
                <p className="font-medium">{selected.department || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Qualification</p>
                <p className="font-medium">{selected.qualification}</p>
              </div>
              <div>
                <p className="text-gray-500">Experience</p>
                <p className="font-medium">{selected.experience} yrs</p>
              </div>
              <div>
                <p className="text-gray-500">Subject</p>
                <p className="font-medium">{selected.subjectSpecialization || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Expected Salary</p>
                <p className="font-medium">{selected.expectedSalary ?? "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Address</p>
                <p className="font-medium">{selected.address}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Resume URL</p>
                <p className="font-medium break-words">{selected.resumeUrl || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Cover Letter</p>
                <p className="font-medium whitespace-pre-wrap">{selected.coverLetter || "—"}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
