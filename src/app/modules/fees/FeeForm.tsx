"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateFee } from "./useFees";
import { useStudents } from "../student/useStudents";
import { toast } from "sonner";

const schema = z.object({
  studentId: z.string().min(1, "Student select করো"),
  title: z.string().min(1, "Title দাও"),
  type: z.enum(["TUITION", "ADMISSION", "EXAM"]),
  amount: z.number().min(1, "Amount দাও"),
  dueDate: z.string().min(1, "Due date দাও"),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
  onClose: () => void;
}

export default function FeeForm({ onClose }: Props) {
  const { mutate: create, isPending } = useCreateFee();
  const { data: students } = useStudents();

  const { register, handleSubmit, formState: { errors } } =
    useForm<FormInput, unknown, FormData>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const studentList = Array.isArray(students) ? students : [];
    const selectedStudent = studentList.find((s) => s.id === data.studentId);
    if (!selectedStudent?.classId) {
      toast.error("Student class missing");
      return;
    }
    create({ ...data, classId: selectedStudent.classId }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">নতুন Fee Add</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Student */}
          <div>
            <label className="block text-sm font-medium mb-1">Student</label>
            <select
              {...register("studentId")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Student select করো</option>
              {students?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.studentId && (
              <p className="text-red-500 text-xs mt-1">{errors.studentId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              {...register("title")}
              placeholder="Tuition Fee"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              {...register("type")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select type</option>
              <option value="TUITION">Tuition</option>
              <option value="ADMISSION">Admission</option>
              <option value="EXAM">Exam</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">Amount (৳)</label>
            <input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              placeholder="যেমন: 500"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              {...register("dueDate")}
              type="date"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.dueDate && (
              <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>
            )}
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
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              {isPending ? "Loading..." : "Add Fee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}