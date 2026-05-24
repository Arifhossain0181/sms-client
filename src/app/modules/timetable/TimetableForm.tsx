"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTimetable, useUpdateTimetable } from "./useTimetable";
import { useClasses } from "../class/useClasses";
import { useSubjects } from "../subject/useSubjects";
import { useTeachers } from "../teachers/useTeachers";
import { Timetable } from "./timetable.types";

const schema = z.object({
  classId:   z.string().min(1, "Class select করো"),
  subjectId: z.string().min(1, "Subject select করো"),
  teacherId: z.string().min(1, "Teacher select করো"),
  day:       z.enum([
    "SATURDAY", "SUNDAY", "MONDAY",
    "TUESDAY", "WEDNESDAY", "THURSDAY",
  ]),
  startTime: z.string().min(1, "Start time দাও"),
  endTime:   z.string().min(1, "End time দাও"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  timetable?: Timetable | null;
  onClose: () => void;
}

export default function TimetableForm({ timetable, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateTimetable();
  const { mutate: update, isPending: updating } = useUpdateTimetable();
  const { data: classes }  = useClasses();
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (timetable) {
      reset({
        classId:   timetable.classId,
        subjectId: timetable.subjectId,
        teacherId: timetable.teacherId,
        day:       timetable.day,
        startTime: timetable.startTime,
        endTime:   timetable.endTime,
      });
    }
  }, [timetable, reset]);

  const onSubmit = (data: FormData) => {
    if (timetable) {
      update({ id: timetable.id, data }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {timetable ? "Timetable Edit" : "নতুন Class যোগ করো"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Class */}
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select
              {...register("classId")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Class</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} — {cls.section}
                </option>
              ))}
            </select>
            {errors.classId && (
              <p className="text-red-500 text-xs mt-1">{errors.classId.message}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select
              {...register("subjectId")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Subject</option>
              {subjects?.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            {errors.subjectId && (
              <p className="text-red-500 text-xs mt-1">{errors.subjectId.message}</p>
            )}
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-sm font-medium mb-1">Teacher</label>
            <select
              {...register("teacherId")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Teacher</option>
              {teachers?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.teacherId && (
              <p className="text-red-500 text-xs mt-1">{errors.teacherId.message}</p>
            )}
          </div>

          {/* Day */}
          <div>
            <label className="block text-sm font-medium mb-1">দিন</label>
            <select
              {...register("day")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Day</option>
              <option value="SATURDAY">শনিবার</option>
              <option value="SUNDAY">রবিবার</option>
              <option value="MONDAY">সোমবার</option>
              <option value="TUESDAY">মঙ্গলবার</option>
              <option value="WEDNESDAY">বুধবার</option>
              <option value="THURSDAY">বৃহস্পতিবার</option>
            </select>
            {errors.day && (
              <p className="text-red-500 text-xs mt-1">{errors.day.message}</p>
            )}
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                {...register("startTime")}
                type="time"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.startTime && (
                <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                {...register("endTime")}
                type="time"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.endTime && (
                <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || updating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              {creating || updating
                ? "Loading..."
                : timetable
                ? "Update"
                : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}