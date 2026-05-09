"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, LoginFormData } from "@/lib/validtation";
import { authService } from "@/service/auth.service";
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

export default function LoginForm() {
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
      const user = await authService.login(data);
      setUser(user);
      toast.success("Login successful");
      const redirect = searchParams.get("redirect");
      if (redirect && !redirect.startsWith("/login") && !redirect.startsWith("/register")) {
        router.push(redirect);
        return;
      }

      if (user?.role === "STUDENT") {
        try {
          await api.get("/students/me");
          router.push("/dashboard/student");
          return;
        } catch (error: unknown) {
          const status = (error as { response?: { status?: number } }).response?.status;
          if (status === 404) {
            router.push("/apply-for-admission");
            return;
          }
        }
      }

      const roleRoute = user?.role === "ADMIN"
        ? "/dashboard/admin"
        : user?.role === "TEACHER"
          ? "/dashboard/teacher"
          : "/dashboard/student";

      router.push(roleRoute);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Login failed"));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f4ee] pt-24 pb-16 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-amber-300/40 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 right-0 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 25, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-300/30 blur-3xl"
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 shadow-sm">
            Student Portal
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Welcome back, future-ready students.
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            Sign in to access classes, attendance, and results in one clean place.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <GraduationCap size={18} className="text-emerald-600" />
                Class-ready dashboard
              </div>
              <p className="mt-2 text-xs text-slate-500">Track lessons, notes, and upcoming exams.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ShieldCheck size={18} className="text-amber-600" />
                Secure student access
              </div>
              <p className="mt-2 text-xs text-slate-500">Built for safe, role-based logins.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm sm:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <BookOpenCheck size={18} className="text-rose-600" />
                Results in one click
              </div>
              <p className="mt-2 text-xs text-slate-500">See grades and attendance updates instantly.</p>
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
            <p className="text-sm text-slate-500">Use your student email and password.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="student@school.edu"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            New student?{" "}
            <Link href="/register" className="font-semibold text-emerald-700 hover:underline">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
