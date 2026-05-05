"use client";

import { useState } from "react";
import { useExams, useDeleteExam } from "@/app/modules/exam/useExams";
import ExamForm from "./ExamForm";
import { Exam } from "@/app/modules/exam/exam.types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

export default function ExamList() {
  const { data: exams, isLoading } = useExams();
  const { mutate: deleteExam } = useDeleteExam();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Exam | null>(null);
  const [search, setSearch] = useState("");

  const filtered = exams?.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (exam: Exam) => {
    setSelected(exam);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteExam(id);
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
          <h1 className="text-2xl font-bold text-gray-800">Exams</h1>
          <p className="text-sm text-gray-500">মোট {exams?.length ?? 0} টি exam</p>
        </div>

        {role && hasPermission(role, "add_result") && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Exam
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Exam নাম দিয়ে খুঁজুন..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Exam নাম</th>
              <th className="px-6 py-3 text-left">Subject</th>
              <th className="px-6 py-3 text-left">Class</th>
              <th className="px-6 py-3 text-left">তারিখ</th>
              <th className="px-6 py-3 text-left">Total Marks</th>
              {role && hasPermission(role, "add_result") && (
                <th className="px-6 py-3 text-left">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered?.map((exam) => (
              <tr key={exam.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">
                  {exam.name}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {exam.subject?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {exam.class?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(exam.date)}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {exam.totalMarks}
                </td>
                {role && hasPermission(role, "add_result") && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(exam)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {filtered?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  কোনো exam পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && <ExamForm exam={selected} onClose={handleClose} />}
    </div>
  );
}