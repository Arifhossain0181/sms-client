"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateSubject, useUpdateSubject } from "./useSubjects";
import { useClasses } from "../class/useClasses";
import { Subject } from "./subject.types";

const schema = z.object({
  name:    z.string().min(1, "Subject নাম দাও"),
  code:    z.string().min(1, "Code দাও"),
  classId: z.string().min(1, "Class select করো"),
  fullMarks: z.number().min(1, "Full marks দাও"),
  passMarks: z.number().min(0, "Pass marks দাও"),
  isOptional: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  subject?: Subject | null;
  onClose: () => void;
}

export default function SubjectForm({ subject, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateSubject();
  const { mutate: update, isPending: updating } = useUpdateSubject();
  const { data: classes } = useClasses();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (subject) {
      reset({
        name: subject.name,
        code: subject.code,
        classId: subject.classId,
        fullMarks: subject.fullMarks ?? 100,
        passMarks: subject.passMarks ?? 33,
        isOptional: subject.isCompulsory === false,
      });
    }
  }, [subject, reset]);

  const onSubmit = (data: FormData) => {
    if (subject) {
      update({ id: subject.id, data }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{subject ? "Subject Edit" : "নতুন Subject"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject নাম</label>
            <input
              {...register("name")}
              placeholder="যেমন: Mathematics"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Code</label>
            <input
              {...register("code")}
              placeholder="যেমন: MATH-101"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
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
                  {cls.name} — {(cls.sections ?? []).map((section) => section.name).join(", ")}
                </option>
              ))}
            </select>
            {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Full Marks</label>
              <input
                {...register("fullMarks", { valueAsNumber: true })}
                type="number"
                min={1}
                placeholder="100"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.fullMarks && <p className="text-red-500 text-xs mt-1">{errors.fullMarks.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pass Marks</label>
              <input
                {...register("passMarks", { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="33"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.passMarks && <p className="text-red-500 text-xs mt-1">{errors.passMarks.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register("isOptional")}
              id="isOptional"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isOptional" className="text-sm">Optional subject</label>
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
              {creating || updating ? "Loading..." : subject ? "Update" : "Add Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}