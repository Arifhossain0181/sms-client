"use client";

import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateClass, useUpdateClass } from "./useClasses";
import { classService } from "./class.service";
import { Class } from "./class.types";

const schema = z.object({
  name:     z.string().min(1, "Class নাম দাও"),
  numericLevel: z.coerce.number().min(1, "Numeric level দাও"),
  sectionName: z.string().optional(),
  sectionCapacity: z.coerce.number().optional(),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
  cls?: Class | null;
  onClose: () => void;
}

export default function ClassForm({ cls, onClose }: Props) {
  const { mutateAsync: create, isPending: creating } = useCreateClass();
  const { mutateAsync: update, isPending: updating } = useUpdateClass();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormInput, unknown, FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (cls) {
      reset({ name: cls.name, numericLevel: cls.numericLevel });
    }
  }, [cls, reset]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (cls) {
      const { sectionName, sectionCapacity, ...classData } = data;
      await update({ id: cls.id, data: classData });

      if (sectionName) {
        await classService.createSection({
          classId: cls.id,
          name: sectionName,
          maxCapacity: sectionCapacity,
        });
      }

      onClose();
    } else {
      const { sectionName, sectionCapacity, ...classData } = data;
      const created = await create(classData);

      if (sectionName && created?.id) {
        await classService.createSection({
          classId: created.id,
          name: sectionName,
          maxCapacity: sectionCapacity,
        });
      }

      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{cls ? "Class Edit" : "নতুন Class"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Class নাম</label>
            <input
              {...register("name")}
              placeholder="যেমন: Class 6"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Numeric Level</label>
            <input
              {...register("numericLevel")}
              type="number"
              min={1}
              placeholder="যেমন: 6"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.numericLevel && <p className="text-red-500 text-xs mt-1">{errors.numericLevel.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Section (optional)</label>
            <input
              {...register("sectionName")}
              placeholder={cls ? "নতুন section যোগ করুন (যেমন: A)" : "যেমন: A"}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Section Capacity (optional)</label>
            <input
              {...register("sectionCapacity")}
              type="number"
              min={1}
              placeholder="যেমন: 40"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              {creating || updating ? "Loading..." : cls ? "Update" : "Add Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}