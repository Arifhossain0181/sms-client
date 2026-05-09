"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { hasPermission } from "@/config/roles";
import StudentForm from "./StudentForm";
import { useDeleteStudent, useStudents } from "./useStudents";
import { Student } from "./student.types";

export default function StudentList() {
  const { data: students, isLoading } = useStudents();
  const { mutate: deleteStudent } = useDeleteStudent();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [search, setSearch] = useState("");

  const studentList = Array.isArray(students) ? students : [];
  const filteredStudents = studentList.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      (student.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (student: Student) => {
    setSelected(student);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      deleteStudent(id);
    }
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
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-sm text-gray-500">মোট{studentList.length} জন student</p>
        </div>

        {role && hasPermission(role, "create_student") && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Student
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
              <th className="px-6 py-3 text-left">Class</th>
              <th className="px-6 py-3 text-left">Gender</th>
              <th className="px-6 py-3 text-left">যোগ দেওয়ার তারিখ</th>
              {role && hasPermission(role, "edit_student") && (
                <th className="px-6 py-3 text-left">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">
                  <Link
                    href={`/students/${student.id}`}
                    className="hover:text-blue-600 hover:underline"
                  >
                    {student.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">{student.email ?? "—"}</td>
                <td className="px-6 py-4 text-gray-600">{student.phone ?? "—"}</td>
                <td className="px-6 py-4 text-gray-600">
                  {student.class?.name ?? "—"}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.gender === "MALE"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-pink-100 text-pink-700"
                  }`}>
                    {student.gender}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(student.createdAt)}
                </td>
                {role && hasPermission(role, "edit_student") && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      {hasPermission(role, "delete_student") && (
                        <button
                          onClick={() => handleDelete(student.id)}
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

            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  কোনো student পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && <StudentForm student={selected} onClose={handleClose} />}
    </div>
  );
}
