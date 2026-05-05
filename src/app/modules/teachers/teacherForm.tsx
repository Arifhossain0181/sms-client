"use client";

import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTeacher, useUpdateTeacher } from "./useTeachers";
import { Teacher } from "./teacher.types";

const schema = z.object({
  name:        z.string().min(2, "নাম দাও"),
  email:       z.string().email("Valid email দাও"),
  TeachersId:  z.string().min(3, "Teacher ID দাও"),
  designation: z.string().min(2, "Designation দাও"),
  department:  z.string().optional(),
  qualification: z.string().min(2, "Qualification দাও"),
  experience:  z.coerce.number().min(0, "Experience দাও"),
  phone:       z.string().min(11, "Phone নম্বর দাও"),
  address:     z.string().min(3, "Address দাও"),
  gender:      z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().min(1, "Date of birth দাও"),
  dateOfJoining: z.string().min(1, "Joining date দাও"),
  bloodGroup:  z.string().optional(),
  salary:      z.coerce.number().optional(),
  subjectId:   z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
  teacher?: Teacher | null;
  onClose: () => void;
}

export default function TeacherForm({ teacher, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateTeacher();
  const { mutate: update, isPending: updating } = useUpdateTeacher();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormInput, unknown, FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (teacher) {
      reset({
        name:        teacher.name,
        email:       teacher.email,
        TeachersId:  "",
        designation: "",
        department:  "",
        qualification: "",
        experience:  0,
        phone:       teacher.phone,
        address:     teacher.address,
        gender:      teacher.gender,
        dateOfBirth: teacher.dateOfBirth?.slice(0, 10),
        dateOfJoining: "",
        bloodGroup:  "",
        salary:      undefined,
        subjectId:   teacher.subjectId,
      });
    }
  }, [teacher, reset]);

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (teacher) {
      const { TeachersId, ...rest } = data;
      update({ id: teacher.id, data: rest }, { onSuccess: onClose });
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
            {teacher ? "Teacher Edit" : "নতুন Teacher"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1">নাম</label>
            <input
              {...register("name")}
              placeholder="Teacher এর নাম"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

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


          <div>
            <label className="block text-sm font-medium mb-1">Teacher ID</label>
            <input
              {...register("TeachersId")}
              placeholder="EMP-001"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.TeachersId && <p className="text-red-500 text-xs mt-1">{errors.TeachersId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Designation</label>
            <input
              {...register("designation")}
              placeholder="Senior Teacher"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              {...register("department")}
              placeholder="Science"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Qualification</label>
            <input
              {...register("qualification")}
              placeholder="MSc"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.qualification && <p className="text-red-500 text-xs mt-1">{errors.qualification.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Experience (years)</label>
            <input
              {...register("experience")}
              type="number"
              min={0}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              {...register("phone")}
              placeholder="01XXXXXXXXX"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              {...register("gender")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              {...register("dateOfBirth")}
              type="date"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Joining Date</label>
            <input
              {...register("dateOfJoining")}
              type="date"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.dateOfJoining && <p className="text-red-500 text-xs mt-1">{errors.dateOfJoining.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject ID</label>
            <input
              {...register("subjectId")}
              placeholder="Subject ID"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.subjectId && <p className="text-red-500 text-xs mt-1">{errors.subjectId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Blood Group</label>
            <input
              {...register("bloodGroup")}
              placeholder="A+"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Salary</label>
            <input
              {...register("salary")}
              type="number"
              min={0}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              {isPending ? "Loading..." : teacher ? "Update" : "Add Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}