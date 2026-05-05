"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight } from "lucide-react";

export default function Hero() {
	return (
		<section className="relative overflow-hidden bg-[#f7f4ed]">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
				<div className="absolute top-10 right-0 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
				<div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-200/40 blur-3xl" />
			</div>

			<div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
				<motion.div
					initial={{ opacity: 0, y: 18 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 shadow-sm"
				>
					<GraduationCap size={16} />
					Student Portal
				</motion.div>

				<div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
					<div>
						<h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
							Welcome to the new school experience.
						</h1>
						<p className="mt-4 text-base text-slate-600 sm:text-lg">
							Manage classes, attendance, and results from one place. Built for
							students, teachers, and admins to stay in sync.
						</p>

						<div className="mt-8 flex flex-wrap gap-3">
							<Link
								href="/login"
								className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700"
							>
								Login
								<ArrowRight size={16} />
							</Link>
							<Link
								href="/register"
								className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
							>
								Register
							</Link>
						</div>
					</div>

					<div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
						<div className="grid gap-4">
							<div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
								<p className="text-xs uppercase tracking-widest text-white/80">Daily Overview</p>
								<p className="mt-3 text-2xl font-bold">Attendance 98%</p>
								<p className="mt-1 text-sm text-white/80">Live class insights</p>
							</div>
							<div className="rounded-2xl border border-slate-100 bg-white p-5">
								<p className="text-xs uppercase tracking-widest text-slate-400">Upcoming</p>
								<p className="mt-3 text-lg font-semibold text-slate-800">Midterm Exams</p>
								<p className="mt-1 text-sm text-slate-500">Starts next week</p>
							</div>
							<div className="rounded-2xl border border-slate-100 bg-white p-5">
								<p className="text-xs uppercase tracking-widest text-slate-400">Student First</p>
								<p className="mt-3 text-lg font-semibold text-slate-800">Fast registration</p>
								<p className="mt-1 text-sm text-slate-500">Secure access for every learner</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
