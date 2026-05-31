"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/axios";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dob: z.string().min(1, "Date of birth required"),
  address: z.string().min(3, "Address required"),
  designation: z.string().min(2, "Designation required"),
  department: z.string().optional(),
  qualification: z.string().min(2, "Qualification required"),
  experience: z.coerce.number().min(0, "Experience required"),
  subjectSpecialization: z.string().optional(),
  expectedSalary: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
  resumeUrl: z.string().url("Valid URL required").optional().or(z.literal("")),
  coverLetter: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

export default function ApplyForTeaching() {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormInput, unknown, FormData>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setSubmitting(true);
      await api.post("/teaching/apply", data);
      toast.success("Application submitted successfully");
      reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Apply for Teaching</h1>
          <p className="text-slate-600 mt-2">
            Fill in your details to apply for a teaching position.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-2xl p-6 shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                {...register("name")}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                {...register("phone")}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="01XXXXXXXXX"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
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
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                {...register("dob")}
                type="date"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <input
                {...register("designation")}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Senior Teacher"
              />
              {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input
                {...register("department")}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Qualification</label>
              <input
                {...register("qualification")}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MSc / B.Ed"
              />
              {errors.qualification && <p className="text-xs text-red-500 mt-1">{errors.qualification.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Experience (years)</label>
              <input
                {...register("experience")}
                type="number"
                min={0}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject Specialization</label>
              <input
                {...register("subjectSpecialization")}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mathematics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Expected Salary</label>
              <input
                {...register("expectedSalary")}
                type="number"
                min={0}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Resume URL</label>
              <input
                {...register("resumeUrl")}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
              {errors.resumeUrl && <p className="text-xs text-red-500 mt-1">{errors.resumeUrl.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              {...register("address")}
              rows={3}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Your address"
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cover Letter</label>
            <textarea
              {...register("coverLetter")}
              rows={4}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Tell us about your teaching experience and motivation"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="reset"
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-lg text-sm border border-slate-200 text-slate-700"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
