"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerSchema, RegisterFormData } from "@/lib/validtation";
import { authService } from "@/service/auth.service";
import { useAuthStore } from "@/store/authstore";
import { motion } from "framer-motion";
import { BadgeCheck, Users, Sparkles } from "lucide-react";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export default function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "STUDENT" },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authService.register(data);
      toast.success("Registration successful! You can now log in");
      router.push("/login");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Registration failed"));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f5f0] pt-24 pb-16 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-16 right-1/3 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl"
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 shadow-sm">
            Student Registration
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Start your student journey in minutes.
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            Create a student account to access attendance, homework, and results.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <BadgeCheck size={18} className="text-emerald-600" />
                Verified student access
              </div>
              <p className="mt-2 text-xs text-slate-500">Your role is secured as Student.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Users size={18} className="text-amber-600" />
                Class community
              </div>
              <p className="mt-2 text-xs text-slate-500">Join your class and view shared notices.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm sm:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Sparkles size={18} className="text-rose-600" />
                Simple, fast onboarding
              </div>
              <p className="mt-2 text-xs text-slate-500">No extra steps — just your name, email, password.</p>
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
            <h2 className="text-2xl font-bold text-slate-900">Create Student Account</h2>
            <p className="text-sm text-slate-500">This registration is only for students.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" value="STUDENT" {...register("role")} />
            <div>
              <label htmlFor="register-username" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
              <input
                id="register-username"
                {...register("username")}
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-email" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input
                id="register-email"
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="student@school.edu"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="register-password" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
              <input
                id="register-password"
                {...register("password")}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Register"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-rose-700 hover:underline">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}