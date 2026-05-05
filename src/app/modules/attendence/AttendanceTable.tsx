import { useAttendancesByClassAndDate } from "./useAttendance";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { useClasses } from "../class/useClasses";
export default function AttendanceTable() {
  const { data: classes } = useClasses();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const {data:attendances ,isPending} = useAttendancesByClassAndDate(classId, sectionId, date);
    
    const [search, setSearch] = useState("");

    const filtered = attendances?.filter((attendance) =>
      attendance.student?.name?.toLowerCase().includes(search.toLowerCase())
    );
    const statusColor = {
    PRESENT: "bg-green-100 text-green-700",
    ABSENT:  "bg-red-100 text-red-700",
    LATE:    "bg-yellow-100 text-yellow-700",
  }
  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Attendance Records</h1>
        <p className="text-sm text-gray-500">মোট {attendances?.length ?? 0} টি record</p>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Class</label>
          <select
            value={classId}
            onChange={(e) => {
              const nextClassId = e.target.value;
              setClassId(nextClassId);
              const selectedClass = (Array.isArray(classes) ? classes : []).find((c) => c.id === nextClassId);
              setSectionId(selectedClass?.sections?.[0]?.id ?? "");
            }}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Class select করুন</option>
            {(Array.isArray(classes) ? classes : []).map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} — {(cls.sections ?? []).map((section) => section.name).join(", ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Section</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Section select করুন</option>
            {(Array.isArray(classes) ? classes : [])
              .find((cls) => cls.id === classId)?.sections?.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name} (max {section.maxCapacity})
                </option>
              ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">তারিখ</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <input
        type="text"
        placeholder="Student নাম দিয়ে খুঁজুন..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Student</th>
              <th className="px-6 py-3 text-left">Class</th>
              <th className="px-6 py-3 text-left">তারিখ</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered?.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">
                  {a.student?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {a.class?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(a.date)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[a.status]}`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}

            {filtered?.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-400">
                  কোনো attendance record নেই
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}