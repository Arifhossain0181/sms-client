"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Mail, MapPin, Phone, Search, Users, GraduationCap, UserRound, Compass, Lightbulb } from "lucide-react";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import Pagination from "@/components/ui/pagination";

type Teacher = {
  id: string;
  name: string;
  designation?: string | null;
  department: string;
};

type Overview = {
  school: {
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    principalName?: string | null;
    academicYear?: string | null;
  } | null;
  counts: { teachers: number; students: number };
  teachers: Teacher[];
};

export default function AboutPage() {
  useLenis();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const { data, isLoading, isError } = useQuery<Overview>({
    queryKey: ["public", "school-overview"],
    queryFn: async () => {
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        const response = await fetch("http://localhost:5000/api/v1/public/school-overview");
        if (!response.ok) throw new Error(`School overview request failed: ${response.status}`);
        const payload = await response.json();
        return payload?.data ?? payload;
      }

      const response = await api.get("/public/school-overview");
      return response.data?.data ?? response.data;
    },
    retry: false,
  });

  const teachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query
      ? (data?.teachers ?? []).filter((teacher) =>
          `${teacher.name} ${teacher.department} ${teacher.designation ?? ""}`.toLowerCase().includes(query),
        )
      : (data?.teachers ?? []);
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [data?.teachers, search, page, pageSize]);

  const totalFilteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data?.teachers?.length ?? 0;
    return (data?.teachers ?? []).filter((teacher) =>
      `${teacher.name} ${teacher.department} ${teacher.designation ?? ""}`.toLowerCase().includes(query),
    ).length;
  }, [data?.teachers, search]);

  const totalPages = Math.max(1, Math.ceil(totalFilteredTeachers / pageSize));
  const currentPage = Math.min(page, totalPages);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center text-sm text-slate-500">Loading school information...</div>;
  }

  if (isError || !data) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center text-sm text-rose-600 dark:text-rose-400">School information could not be loaded.</div>;
  }

  const school = data.school;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50/70 dark:bg-slate-950 px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-[30rem] w-[30rem] rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />

      <div className="relative mx-auto max-w-6xl space-y-6">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
          <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 px-6 py-8 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 sm:px-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">About</p>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">{school?.name ?? "Our School"}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">A connected learning community where students grow through excellent teaching, care, and opportunity.</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25"><Building2 className="h-8 w-8" /></div>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-slate-300">
              {school?.address && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-indigo-500" />{school.address}</span>}
              {school?.phone && <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-indigo-500" />{school.phone}</span>}
              {school?.email && <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-indigo-500" />{school.email}</span>}
            </div>
          </div>
          <div className="grid gap-4 border-t border-slate-200/70 p-5 dark:border-white/10 sm:grid-cols-3 sm:p-6">
            <div className="rounded-2xl bg-sky-50 p-4 dark:bg-sky-500/10"><p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">Students</p><p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{data.counts.students}</p></div>
            <div className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-500/10"><p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Teachers</p><p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{data.counts.teachers}</p></div>
            <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-500/10"><p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">Academic Year</p><p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{school?.academicYear ?? "Current"}</p></div>
          </div>
        </motion.section>

        <section className="grid gap-5 md:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-50 to-white p-6 shadow-lg dark:border-sky-500/20 dark:from-sky-500/10 dark:to-slate-900/70"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/25">
              <Compass className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Our Mission</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Learning with purpose</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              To provide every student with a caring, inclusive, and inspiring education that builds strong knowledge, character, confidence, and the skills to contribute meaningfully to the world.
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-6 shadow-lg dark:border-amber-500/20 dark:from-amber-500/10 dark:to-slate-900/70"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
              <Lightbulb className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Our Vision</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">A future-ready community</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              To be a trusted school community where curiosity is valued, talents are nurtured, and every learner is prepared to lead with empathy, creativity, and integrity.
            </p>
          </motion.article>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Our Faculty</p><h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Teachers and Departments</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Meet the educators supporting our students.</p></div>
            <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teachers..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
          </div>
          {teachers.length === 0 ? <p className="py-14 text-center text-sm text-slate-500 dark:text-slate-400">No teachers found.</p> : <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{teachers.map((teacher) => <div key={teacher.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><UserRound className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{teacher.name}</p><p className="truncate text-xs text-indigo-600 dark:text-indigo-300">{teacher.department}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{teacher.designation ?? "Teacher"}</p></div></div>)}</div>}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              summaryTemplate={(current, total) => `Showing page ${current} of ${total} · ${totalFilteredTeachers} teachers total`}
            />
          </div>
        </section>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Users className="h-4 w-4" /> {data.counts.students} students <GraduationCap className="ml-3 h-4 w-4" /> {data.counts.teachers} teachers</div>
      </div>
    </main>
  );
}