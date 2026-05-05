"use client";

import { useState } from "react";
import { useTimetables, useDeleteTimetable } from "../timetable/useTimetable";
import { useClasses } from "../class/useClasses";
import TimetableForm from "./TimetableForm";
import { Timetable, DayOfWeek } from "./timetable.types";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

// বাংলাদেশের school schedule অনুযায়ী দিন
const DAYS: DayOfWeek[] = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
];

const dayLabel: Record<DayOfWeek, string> = {
  SATURDAY:  "শনিবার",
  SUNDAY:    "রবিবার",
  MONDAY:    "সোমবার",
  TUESDAY:   "মঙ্গলবার",
  WEDNESDAY: "বুধবার",
  THURSDAY:  "বৃহস্পতিবার",
};

const subjectColors = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-yellow-100 text-yellow-700 border-yellow-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-orange-100 text-orange-700 border-orange-200",
];

export default function TimetableGrid() {
  const { data: timetables, isLoading } = useTimetables();
  const { data: classes } = useClasses();
  const { mutate: deleteTimetable } = useDeleteTimetable();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Timetable | null>(null);
  const [classId, setClassId] = useState("");

  // Class filter
  const filtered = timetables?.filter((t) =>
    classId ? t.classId === classId : true
  );

  // Day অনুযায়ী group করো
  const groupedByDay = DAYS.reduce((acc, day) => {
    acc[day] = filtered?.filter((t) => t.day === day) ?? [];
    return acc;
  }, {} as Record<DayOfWeek, Timetable[]>);

  // Subject color assign
  const subjectColorMap: Record<string, string> = {};
  let colorIndex = 0;
  filtered?.forEach((t) => {
    if (!subjectColorMap[t.subjectId]) {
      subjectColorMap[t.subjectId] =
        subjectColors[colorIndex % subjectColors.length];
      colorIndex++;
    }
  });

  const handleEdit = (t: Timetable) => {
    setSelected(t);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteTimetable(id);
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
          <h1 className="text-2xl font-bold text-gray-800">Timetable</h1>
          <p className="text-sm text-gray-500">Class অনুযায়ী সাপ্তাহিক রুটিন</p>
        </div>

        {role && hasPermission(role, "manage_timetable") && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Class
          </button>
        )}
      </div>

      {/* Class Filter */}
      <div className="mb-6">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">সব Class</option>
          {classes?.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} — {cls.section}
            </option>
          ))}
        </select>
      </div>

      {/* Grid View */}
      <div className="space-y-4">
        {DAYS.map((day) => (
          <div key={day} className="bg-white rounded-xl shadow overflow-hidden">

            {/* Day Header */}
            <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
              <span className="font-semibold">{dayLabel[day]}</span>
              <span className="text-xs text-gray-400">
                {groupedByDay[day].length} টি class
              </span>
            </div>

            {/* Classes for this day */}
            {groupedByDay[day].length > 0 ? (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedByDay[day]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((t) => (
                    <div
                      key={t.id}
                      className={`rounded-lg border p-3 ${
                        subjectColorMap[t.subjectId] ?? subjectColors[0]
                      }`}
                    >
                      {/* Subject + Time */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">
                          {t.subject?.name ?? "—"}
                        </span>
                        <span className="text-xs opacity-70">
                          {t.startTime} - {t.endTime}
                        </span>
                      </div>

                      {/* Teacher */}
                      <p className="text-xs opacity-70">
                        👤 {t.teacher?.name ?? "—"}
                      </p>

                      {/* Class */}
                      <p className="text-xs opacity-70">
                        🏫 {t.class?.name} — {t.class?.section}
                      </p>

                      {/* Actions */}
                      {role && hasPermission(role, "manage_timetable") && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-current border-opacity-20">
                          <button
                            onClick={() => handleEdit(t)}
                            className="text-xs hover:underline opacity-80"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-xs hover:underline opacity-80"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-gray-400">
                এই দিনে কোনো class নেই
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <TimetableForm timetable={selected} onClose={handleClose} />
      )}
    </div>
  );
}