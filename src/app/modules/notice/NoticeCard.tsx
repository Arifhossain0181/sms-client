"use client";

import { useState } from "react";
import { useNotices, useDeleteNotice } from "./useNotices";
import NoticeForm from "./NoticeForm";
import { Notice } from "./notice.types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

const targetColor = {
  ALL:     "bg-blue-100 text-blue-700",
  TEACHER: "bg-purple-100 text-purple-700",
  STUDENT: "bg-green-100 text-green-700",
};

const targetLabel = {
  ALL:     "সবার জন্য",
  TEACHER: "শুধু Teacher",
  STUDENT: "শুধু Student",
};

export default function NoticeCard() {
  const { data: notices, isLoading } = useNotices();
  const { mutate: deleteNotice } = useDeleteNotice();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Notice | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterTarget, setFilterTarget] = useState("");

  const safeNotices = Array.isArray(notices) ? notices : [];
  const filtered = safeNotices.filter((n) =>
    filterTarget ? n.target === filterTarget : true
  );

  const handleEdit = (notice: Notice) => {
    setSelected(notice);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteNotice(id);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelected(null);
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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notices</h1>
          <p className="text-sm text-gray-500">মোট {safeNotices.length} টি notice</p>
        </div>

        {role && hasPermission(role, "post_notice") && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + New Notice
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["", "ALL", "TEACHER", "STUDENT"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterTarget(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
              filterTarget === t
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "" ? "সব" : targetLabel[t as keyof typeof targetLabel]}
          </button>
        ))}
      </div>

      {/* Notice Cards */}
      <div className="space-y-4">
        {filtered.map((notice) => (
          <div
            key={notice.id}
            className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500"
          >
            {/* Top */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">{notice.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${targetColor[notice.target]}`}>
                  {targetLabel[notice.target]}
                </span>
              </div>

              {role && hasPermission(role, "post_notice") && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(notice)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <p className={`text-sm text-gray-600 ${
              expanded === notice.id ? "" : "line-clamp-2"
            }`}>
              {notice.content}
            </p>

            {/* Read more */}
            {notice.content.length > 120 && (
              <button
                onClick={() =>
                  setExpanded(expanded === notice.id ? null : notice.id)
                }
                className="text-blue-600 text-xs mt-1 hover:underline"
              >
                {expanded === notice.id ? "কম দেখাও" : "আরো দেখাও"}
              </button>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
              <span>👤 {notice.createdBy?.name ?? "Admin"}</span>
              <span>📅 {formatDate(notice.createdAt)}</span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            কোনো notice নেই
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && <NoticeForm notice={selected} onClose={handleClose} />}
    </div>
  );
}