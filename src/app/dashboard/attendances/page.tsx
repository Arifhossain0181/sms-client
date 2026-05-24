"use client";

import { useState } from "react";
import AttendanceTable from "@/app/modules/attendence/AttendanceTable";
import MarkAttendance from "@/app/modules/attendence/MarkAttendance";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

export default function AttendancePage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<"list" | "mark">("list");

  return (
    <div>
      {/* Tab */}
      <div className="flex gap-2 px-6 pt-6">
        <button
          onClick={() => setTab("list")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === "list"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Attendance Records
        </button>

        {role && hasPermission(role, "mark_attendance") && (
          <button
            onClick={() => setTab("mark")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "mark"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Attendance নিন
          </button>
        )}
      </div>

      {/* Content */}
      {tab === "list" ? <AttendanceTable /> : <MarkAttendance />}
    </div>
  );
}