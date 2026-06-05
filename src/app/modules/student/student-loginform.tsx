"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, LoginFormData } from "@/lib/validtation";
import { useAuthStore } from "@/store/authstore";
import { motion } from "framer-motion";
import { GraduationCap, ShieldCheck, BookOpenCheck } from "lucide-react";
import api from "@/lib/axios";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export default function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api.post("/auth/student-login", data);
      
      if (!response.data?.data) {
        throw new Error("Invalid response from server");
      }

      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Set user in auth store
      setUser(user);

      toast.success("Student login successful");

      // Redirect to student dashboard
      const redirect = searchParams.get("redirect");
      if (redirect && !redirect.startsWith("/student-login") && !redirect.startsWith("/register")) {
        router.push(redirect);
        return;
      }

      router.push("/student-dashboard");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Student login failed"));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f4ee] pt-24 pb-16 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-300/40 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 right-0 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 25, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-300/30 blur-3xl"
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 shadow-sm">
            Student Portal
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Welcome back, student!
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            Sign in with your verified email to access your class routine, results, and all your information.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <GraduationCap size={18} className="text-blue-600" />
                Class Routine
              </div>
              <p className="mt-2 text-xs text-slate-500">View your daily schedule and class timings.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ShieldCheck size={18} className="text-indigo-600" />
                Verified Access
              </div>
              <p className="mt-2 text-xs text-slate-500">Login available only for verified students.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm sm:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <BookOpenCheck size={18} className="text-purple-600" />
                Results & Performance
              </div>
              <p className="mt-2 text-xs text-slate-500">Check your results, marks, and performance in one place.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Student Login</h2>
            <p className="text-sm text-slate-500">Login with your verified email and password.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="your.email@school.edu"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="rounded-xl bg-blue-50 p-3 border border-blue-100">
              <p className="text-xs text-blue-700">
                <span className="font-semibold">Note:</span> Only students with approved admission can login.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link href="/apply-for-admission" className="font-semibold text-blue-700 hover:underline">
              Apply for admission
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
