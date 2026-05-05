"use client";

import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateExam, useUpdateExam } from "./useExams";
import { useClasses } from "../class/useClasses";
import { useSubjects } from "../subject/useSubjects";
import { Exam } from "./exam.types";

const schema = z.object({
  name:       z.string().min(1, "Exam নাম দাও"),
  subjectId:  z.string().min(1, "Subject select করো"),
  classId:    z.string().min(1, "Class select করো"),
  date:       z.string().min(1, "Date দাও"),
  totalMarks: z.coerce.number().min(1, "Total marks দাও"),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
  exam?: Exam | null;
  onClose: () => void;
}

export default function ExamForm({ exam, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateExam();
  const { mutate: update, isPending: updating } = useUpdateExam();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormInput, unknown, FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (exam) {
      reset({
        name: exam.name,
        subjectId: exam.subjectId,
        classId: exam.classId,
        date: exam.date?.slice(0, 10),
        totalMarks: exam.totalMarks,
      });
    }
  }, [exam, reset]);

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (exam) {
      update({ id: exam.id, data }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{exam ? "Exam Edit" : "নতুন Exam"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Exam নাম</label>
            <input
              {...register("name")}
              placeholder="যেমন: Half Yearly"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select
              {...register("subjectId")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Subject</option>
              {subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            {errors.subjectId && <p className="text-red-500 text-xs mt-1">{errors.subjectId.message}</p>}
          </div>

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
            {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">তারিখ</label>
            <input
              {...register("date")}
              type="date"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Total Marks</label>
            <input
              {...register("totalMarks")}
              type="number"
              placeholder="যেমন: 100"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.totalMarks && <p className="text-red-500 text-xs mt-1">{errors.totalMarks.message}</p>}
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
              {creating || updating ? "Loading..." : exam ? "Update" : "Add Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
