
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateStudent, useUpdateStudent } from "./useStudents";
import { Student } from "./student.types";

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
  classId: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional() ,
    address: z.string().optional(),
    dateOfBirth: z.string().optional(),
    profilePicture: z.string().optional(),
    enrollmentDate: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
type FormData = z.infer<typeof schema>;
interface  Props{
    student?:Student | null;
    onClose: () => void;
}


export default function StudentForm({ student, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateStudent();
  const { mutate: update, isPending: updating } = useUpdateStudent();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

      // Edit mode এ form fill করো
  useEffect(() => {
    if (student) {
      reset({
        name:        student.name,
        email:       student.email,
        phone:       student.phone,
        address:     student.address,
        gender:      student.gender,
        dateOfBirth: student.dateOfBirth?.slice(0, 10),
        classId:     student.classId,
      });
    }
  }, [student, reset]);

  const onSubmit = (data: FormData) => {
    if (student) {
      update({ id: student.id, data }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
    }
  };

  const isPending = creating || updating;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {student ? "Student Edit" : "নতুন Student"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">নাম</label>
            <input
              {...register("name")}
              placeholder="Student এর নাম"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="email@example.com"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              {...register("phone")}
              placeholder="01XXXXXXXXX"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              {...register("gender")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              {...register("dateOfBirth")}
              type="date"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>}
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium mb-1">Class ID</label>
            <input
              {...register("classId")}
              placeholder="Class ID"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId.message}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              {...register("address")}
              placeholder="ঠিকানা"
              rows={3}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "Loading..." : student ? "Update" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}