"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  GraduationCap,
  Inbox,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";

type Student = {
  id: string;
  name: string;
  email?: string;
  guardianEmail?: string;
  phone?: string | null;
  address?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | string;
  dateOfBirth?: string;
  rollNumber?: string | number;
  section?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  isActive?: boolean;
  parent?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
};

type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const LIMIT = 12;

function fmtDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function genderLabel(gender?: string) {
  if (!gender) return "Unknown";
  return gender.charAt(0) + gender.slice(1).toLowerCase();
}

function genderTone(gender?: string) {
  switch (gender) {
    case "MALE":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "FEMALE":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function getStudentTitle(student: Student) {
  const roll = student.rollNumber ? `Roll #${student.rollNumber}` : "No roll";
  const className = student.class?.name ?? "Class";
  const sectionName = student.section?.name ? ` • ${student.section.name}` : "";
  return `${className}${sectionName} • ${roll}`;
}

export default function Page() {
  const router = useRouter();
  const { role, user } = useAuth();
  const teacherId = user?.id ?? "";
  const canLoad = role === "TEACHER" && !!teacherId;

  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);

  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    if (!canLoad) return;

    let isMounted = true;

    const loadStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string> = {
          page: String(page),
          limit: String(LIMIT),
        };

        if (search.trim()) params.search = search.trim();
        if (genderFilter) params.gender = genderFilter;

        const res = await api.get(`/teachers/${teacherId}/students`, { params });
        const payload = res.data?.data ?? res.data ?? {};
        const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        const metaData: Meta = payload?.meta ?? {
          total: list.length,
          page,
          limit: LIMIT,
          totalPages: Math.max(1, Math.ceil((list.length || 1) / LIMIT)),
        };

        if (!isMounted) return;
        setStudents(list);
        setMeta(metaData);
      } catch (err) {
        if (!isMounted) return;
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "We could not load your students right now."
        );
        setStudents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, [canLoad, teacherId, page, search, genderFilter]);

  const activeCount = useMemo(
    () => students.filter((student) => student.isActive !== false).length,
    [students]
  );
  const inactiveCount = students.length - activeCount;
  const classCount = useMemo(
    () => new Set(students.map((student) => student.class?.id).filter(Boolean)).size,
    [students]
  );

  const selectedSince = useMemo(() => fmtDate(selected?.createdAt), [selected]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleGenderChange = (value: string) => {
    setGenderFilter(value);
    setPage(1);
  };

  if (!canLoad) {
    return (
      <div className="w-full max-w-none rounded-3xl border border-rose-200/60 bg-rose-50/70 p-6 text-rose-800 shadow-sm">
        <p className="font-semibold">Teacher student list is available for teacher accounts only.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-none space-y-6 overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-violet-500/10 blur-3xl" />
      <div className="absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="absolute -left-20 top-40 -z-10 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-[2rem] border border-white/40 bg-white/75 p-6 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-2xl"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />
              Live backend students
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
                My Students
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 lg:text-base">
                Students from your assigned classes are loaded directly from the backend, with searchable and paginated records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
            <StatCard icon={<Users className="h-4 w-4" />} label="Students" value={String(meta.total)} />
            <StatCard icon={<GraduationCap className="h-4 w-4" />} label="Classes" value={String(classCount)} />
            <StatCard icon={<Clock3 className="h-4 w-4" />} label="Active" value={String(activeCount)} />
            <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Inactive" value={String(inactiveCount)} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Badge icon={<Sparkles className="h-3.5 w-3.5" />} text="Teacher students endpoint connected" />
          <Badge icon={<CalendarDays className="h-3.5 w-3.5" />} text={`Page ${meta.page} of ${meta.totalPages}`} />
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Search and filter</h2>
                  <p className="text-xs text-slate-500">Search by name or roll, then narrow by gender.</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setPage(1);
                  setSearch("");
                  setGenderFilter("");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="relative lg:col-span-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search student name or roll number"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                />
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={genderFilter}
                  onChange={(e) => handleGenderChange(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                >
                  <option value="">All genders</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-56 rounded-3xl border border-white/40 bg-white/80 p-5 shadow-sm backdrop-blur-xl animate-pulse"
                >
                  <div className="h-14 rounded-2xl bg-slate-200/70" />
                  <div className="mt-4 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-slate-200/70" />
                    <div className="h-4 w-1/2 rounded bg-slate-200/70" />
                    <div className="h-4 w-5/6 rounded bg-slate-200/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-200/60 bg-rose-50/80 p-6 text-rose-800 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">Could not load students</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-6 py-14 text-center shadow-[0_16px_50px_-30px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <Inbox className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">No students found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filter options.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {students.map((student, index) => (
                <motion.button
                  key={student.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setSelected(student)}
                  className="group rounded-3xl border border-white/40 bg-white/80 p-5 text-left shadow-[0_16px_50px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_20px_60px_-28px_rgba(15,23,42,0.45)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
                      {initials(student.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-sky-700">
                            {student.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">{getStudentTitle(student)}</p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${genderTone(student.gender)}`}
                        >
                          {genderLabel(student.gender)}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-600">
                        <InfoRow icon={<Mail className="h-3.5 w-3.5" />} value={student.email ?? "—"} />
                        <InfoRow icon={<Phone className="h-3.5 w-3.5" />} value={student.phone ?? "—"} />
                        <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} value={student.address ?? "—"} />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200/80 pt-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <Clock3 className="h-3.5 w-3.5" />
                          {fmtDate(student.createdAt)}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            student.isActive === false
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {student.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {!loading && !error && meta.totalPages > 1 && (
            <div className="flex flex-col gap-3 rounded-3xl border border-white/40 bg-white/80 p-4 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing page {meta.page} of {meta.totalPages}. Total {meta.total} students.
              </p>

              <div className="flex items-center gap-2">
                <PageButton
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  icon={<ChevronLeft className="h-4 w-4" />}
                />

                {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, index) => {
                  const start =
                    meta.totalPages <= 5
                      ? 1
                      : Math.max(1, Math.min(page - 2, meta.totalPages - 4));
                  const current = start + index;

                  return (
                    <button
                      key={current}
                      onClick={() => setPage(current)}
                      className={`h-9 min-w-9 rounded-full px-3 text-xs font-semibold transition ${
                        current === page
                          ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700"
                      }`}
                    >
                      {current}
                    </button>
                  );
                })}

                <PageButton
                  onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                  disabled={page === meta.totalPages}
                  icon={<ChevronRight className="h-4 w-4" />}
                />
              </div>
            </div>
          )}
        </div>

        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:col-span-4 rounded-[2rem] border border-white/40 bg-white/80 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Student Summary</h2>
              <p className="text-xs text-slate-500">Quick details from the backend.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <NoteCard
              title="Backend connection"
              text="This page reads from the teacher students endpoint and respects paging, search, and gender filters."
            />
            <NoteCard
              title="Assigned classes only"
              text="Teachers only see students from classes assigned to them by the backend."
            />
            <NoteCard
              title="Notification-style colors"
              text="The accent palette is aligned to the notification page's sky, indigo, and violet gradients."
            />
          </div>

          {selected && (
            <div className="mt-5 rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/25">
                  {initials(selected.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{selected.name}</p>
                  <p className="text-xs text-slate-500">{getStudentTitle(selected)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-700">
                <DetailLine label="Email" value={selected.email ?? "—"} />
                <DetailLine label="Phone" value={selected.phone ?? "—"} />
                <DetailLine label="Guardian" value={selected.parent?.name ?? "—"} />
                <DetailLine label="Joined" value={selectedSince} />
              </div>
            </div>
          )}
        </motion.aside>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.button
              aria-label="Close student details"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/40 bg-white/85 shadow-[0_24px_90px_-40px_rgba(15,23,42,0.5)] backdrop-blur-2xl"
            >
              <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/30">
                      {initials(selected.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{selected.name}</h3>
                      <p className="text-sm text-slate-500">{getStudentTitle(selected)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">
                <SectionCard title="Academic">
                  <DetailLine label="Class" value={selected.class?.name ?? "—"} />
                  <DetailLine label="Section" value={selected.section?.name ?? "—"} />
                  <DetailLine label="Roll" value={selected.rollNumber ?? "—"} />
                  <DetailLine label="Gender" value={genderLabel(selected.gender)} />
                </SectionCard>

                <SectionCard title="Contact">
                  <DetailLine label="Email" value={selected.email ?? "—"} />
                  <DetailLine label="Phone" value={selected.phone ?? "—"} />
                  <DetailLine label="Address" value={selected.address ?? "—"} />
                  <DetailLine label="DOB" value={fmtDate(selected.dateOfBirth)} />
                </SectionCard>

                <SectionCard title="Guardian">
                  <DetailLine label="Name" value={selected.parent?.name ?? "—"} />
                  <DetailLine label="Phone" value={selected.parent?.phone ?? "—"} />
                  <DetailLine label="Relation" value={selected.parent?.relation ?? "—"} />
                  <DetailLine label="Guardian Email" value={selected.guardianEmail ?? "—"} />
                </SectionCard>

                <SectionCard title="Status">
                  <DetailLine label="Status" value={selected.isActive === false ? "Inactive" : "Active"} />
                  <DetailLine label="Joined" value={fmtDate(selected.createdAt)} />
                  <DetailLine label="Student ID" value={selected.id} />
                </SectionCard>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-4 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Badge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
      {icon}
      {text}
    </div>
  );
}

function InfoRow({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sky-500">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-3 space-y-2 text-xs text-slate-700">{children}</div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[65%] text-right font-medium text-slate-900 break-words">{String(value)}</span>
    </div>
  );
}

function PageButton({
  onClick,
  disabled,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

function NoteCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}
