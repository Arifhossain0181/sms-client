"use client";

import { useStudent } from "@/hooks/useStudents";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
}

export default function StudentCard({ id }: Props) {
  const { data: student, isLoading } = useStudent(id);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20 text-gray-400">Student পাওয়া যায়নি</div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline mb-4 flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="bg-white rounded-2xl shadow p-6">

        {/* Top */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
            <p className="text-sm text-gray-500">{student.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              student.gender === "MALE"
                ? "bg-blue-100 text-blue-700"
                : "bg-pink-100 text-pink-700"
            }`}>
              {student.gender}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Phone</p>
            <p className="font-medium">{student.phone}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Class</p>
            <p className="font-medium">{student.class?.name ?? "—"}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Date of Birth</p>
            <p className="font-medium">{formatDate(student.dateOfBirth)}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">যোগ দেওয়ার তারিখ</p>
            <p className="font-medium">{formatDate(student.createdAt)}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 col-span-2">
            <p className="text-gray-500 text-xs mb-1">Address</p>
            <p className="font-medium">{student.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}