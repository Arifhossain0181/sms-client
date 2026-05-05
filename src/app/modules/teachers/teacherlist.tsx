"use client";

import Link from "next/link";
import { useState } from "react";
import { useTeachers, useDeleteTeacher } from "./useTeachers";
import TeacherForm from "./teacherForm";
import { Teacher } from "./teacher.types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

export default function TeacherList() {
  const { data: teachers, isLoading } = useTeachers();
  const { mutate: deleteTeacher } = useDeleteTeacher();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [search, setSearch] = useState("");

  const teacherList = Array.isArray(teachers) ? teachers : [];
  const filtered = teacherList.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (teacher: Teacher) => {
    setSelected(teacher);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteTeacher(id);
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
          <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
          <p className="text-sm text-gray-500">মোট {teacherList.length} জন teacher</p>
        </div>

        {role && hasPermission(role, "create_teacher") && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Teacher
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="নাম বা email দিয়ে খুঁজুন..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">নাম</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Subject</th>
              <th className="px-6 py-3 text-left">Gender</th>
              <th className="px-6 py-3 text-left">যোগ দেওয়ার তারিখ</th>
              {role && hasPermission(role, "edit_teacher") && (
                <th className="px-6 py-3 text-left">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">
                  <Link
                    href={`/teachers/${teacher.id}`}
                    className="hover:text-blue-600 hover:underline"
                  >
                    {teacher.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">{teacher.email}</td>
                <td className="px-6 py-4 text-gray-600">{teacher.phone}</td>
                <td className="px-6 py-4 text-gray-600">
                  {teacher.subject?.name ?? "—"}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    teacher.gender === "MALE"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-pink-100 text-pink-700"
                  }`}>
                    {teacher.gender}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(teacher.createdAt)}
                </td>
                {role && hasPermission(role, "edit_teacher") && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      {hasPermission(role, "delete_teacher") && (
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  কোনো teacher পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <TeacherForm teacher={selected} onClose={handleClose} />
      )}
    </div>
  );
}