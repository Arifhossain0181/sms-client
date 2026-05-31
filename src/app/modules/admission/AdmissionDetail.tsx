"use client";

import { Admission } from "./admission.types";
import { formatDate } from "@/lib/utils";
import { useUpdateAdmissionStatus } from "./useAdmission";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

const statusColor = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

interface Props {
  admission: Admission;
  onClose: () => void;
}

export default function AdmissionDetail({ admission, onClose }: Props) {
  const { mutate: updateStatus, isPending } = useUpdateAdmissionStatus();
  const { role } = useAuth();

  const handleApprove = () => {
    updateStatus(
      { id: admission.id, status: "APPROVED" },
      { onSuccess: onClose }
    );
  };

  const handleReject = () => {
    updateStatus(
      { id: admission.id, status: "REJECTED" },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Admission Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[admission.status]}`}>
            {admission.status}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">নাম</p>
            <p className="font-medium">{admission.applicantName}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Gender</p>
            <p className="font-medium">{admission.gender}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Email</p>
            <p className="font-medium">{admission.guardianEmail}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Phone</p>
            <p className="font-medium">{admission.guardianPhone}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Date of Birth</p>
            <p className="font-medium">{formatDate(admission.dob)}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Class</p>
            <p className="font-medium">
              {admission.targetClass?.name} (Class {admission.targetClass?.numericLevel})
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Guardian Name</p>
            <p className="font-medium">{admission.guardianName}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Blood Group</p>
            <p className="font-medium">{admission.bloodGroup ?? "—"}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Religion</p>
            <p className="font-medium">{admission.religion ?? "—"}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Payment Status</p>
            <p className="font-medium">{admission.paymentStatus ?? "—"}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Payment Method</p>
            <p className="font-medium">{admission.paymentMethod ?? "—"}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Paid Amount</p>
            <p className="font-medium">{admission.paymentAmount ?? "—"}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Transaction ID</p>
            <p className="font-medium">{admission.transactionId ?? "—"}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 col-span-2">
            <p className="text-gray-500 text-xs mb-1">Address</p>
            <p className="font-medium">{admission.address}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 col-span-2">
            <p className="text-gray-500 text-xs mb-1">Apply তারিখ</p>
            <p className="font-medium">{formatDate(admission.createdAt)}</p>
          </div>
        </div>

        {/* Approve/Reject Buttons — শুধু PENDING এ */}
        {role &&
          hasPermission(role, "manage_admission") &&
          admission.status === "PENDING" && (
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={isPending}
                className="flex-1 border border-red-300 text-red-600 py-2.5 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm disabled:opacity-50"
              >
                {isPending ? "Processing..." : "Approve"}
              </button>
            </div>
          )}
      </div>
    </div>
  );
}