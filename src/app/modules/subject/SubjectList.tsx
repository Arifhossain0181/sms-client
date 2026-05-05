"use client";

import { useState } from "react";
import { useSubjects, useDeleteSubject } from "./useSubjects";
import SubjectForm from "./SubjectForm";
import { Subject } from "./subject.types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

export default function SubjectList() {
  const { data: subjects, isLoading } = useSubjects();
  const { mutate: deleteSubject } = useDeleteSubject();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [search, setSearch] = useState("");

  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const filtered = safeSubjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (subject: Subject) => {
    setSelected(subject);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteSubject(id);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
          <p className="text-sm text-gray-500">মোট {safeSubjects.length} টি subject</p>
        </div>

        {role && hasPermission(role, "manage_classes") && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Subject
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="নাম বা code দিয়ে খুঁজুন..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Subject নাম</th>
              <th className="px-6 py-3 text-left">Code</th>
              <th className="px-6 py-3 text-left">Class</th>
              <th className="px-6 py-3 text-left">Teacher</th>
              <th className="px-6 py-3 text-left">তৈরির তারিখ</th>
              {role && hasPermission(role, "manage_classes") && (
                <th className="px-6 py-3 text-left">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((subject) => (
              <tr key={subject.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{subject.name}</td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                    {subject.code}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{subject.class?.name ?? "—"}</td>
                <td className="px-6 py-4 text-gray-600">{subject.teacher?.name ?? "—"}</td>
                <td className="px-6 py-4 text-gray-600">{formatDate(subject.createdAt)}</td>
                {role && hasPermission(role, "manage_classes") && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  কোনো subject পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && <SubjectForm subject={selected} onClose={handleClose} />}
    </div>
  );
}