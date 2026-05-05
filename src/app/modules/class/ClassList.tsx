"use client";

import { useState } from "react";
import { useClasses, useDeleteClass } from "./useClasses";
import ClassForm from "./ClassForm";
import { Class } from "./class.types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

export default function ClassList() {
  const { data: classes, isLoading } = useClasses();
  const { mutate: deleteClass } = useDeleteClass();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Class | null>(null);
  const [search, setSearch] = useState("");

  const classList = Array.isArray(classes) ? classes : [];
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const searchKey = normalize(search);
  const filtered = classList.filter((c) =>
    normalize(c.name).includes(searchKey)
  );

  const handleEdit = (cls: Class) => {
    setSelected(cls);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteClass(id);
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
          <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
          <p className="text-sm text-gray-500">মোট {classList.length} টি class</p>
        </div>

        {role && hasPermission(role, "manage_classes") && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Class
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Class নাম দিয়ে খুঁজুন..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Class নাম</th>
              <th className="px-6 py-3 text-left">Numeric Level</th>
              <th className="px-6 py-3 text-left">Sections</th>
              <th className="px-6 py-3 text-left">Section Capacity</th>
              <th className="px-6 py-3 text-left">Students</th>
              <th className="px-6 py-3 text-left">তৈরির তারিখ</th>
              {role && hasPermission(role, "manage_classes") && (
                <th className="px-6 py-3 text-left">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((cls) => (
              <tr key={cls.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{cls.name}</td>
                <td className="px-6 py-4 text-gray-600">{cls.numericLevel}</td>
                <td className="px-6 py-4 text-gray-600">
                  {(cls.sections ?? []).map((section) => section.name).join(", ") || "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {(cls.sections ?? []).map((section) => section.maxCapacity).join(", ") || "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {cls.students?.length ?? 0} জন
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(cls.createdAt)}
                </td>
                {role && hasPermission(role, "manage_classes") && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(cls)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
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
                  কোনো class পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && <ClassForm cls={selected} onClose={handleClose} />}
    </div>
  );
}