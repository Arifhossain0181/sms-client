"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { toast } from "sonner";
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Save,
  UserCheck,
  UserX,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AttendanceRecord = {
  id: string;
  staffId: string;
  staffName: string;
  employeeId: string;
  designation?: string | null;
  department?: string | null;
  staffType?: string | null;
  personType?: "STAFF" | "TEACHER";
  status: string;
  note?: string | null;
};

type StaffMember = {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  designation?: string | null;
  department?: { name: string } | string | null;
  staffType?: string | null;
  phone?: string;
  personType?: "STAFF" | "TEACHER";
};

type DailyAttendanceResponse = {
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  records: AttendanceRecord[];
};

type StaffDirectoryItem = {
  id?: string;
  name?: string;
  email?: string;
  employeeId?: string | null;
  designation?: string | null;
  subject?: string | null;
  department?: { name: string } | string | null;
  staffType?: string | null;
  phone?: string | null;
};

type TeacherDirectoryItem = {
  id?: string;
  name?: string;
  email?: string;
  employeeId?: string | null;
  teacherId?: string | null;
  designation?: string | null;
  subject?: string | null;
  department?: { name: string } | string | null;
  phone?: string | null;
};

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present", cls: "bg-emerald-100 text-emerald-700" },
  { value: "ABSENT", label: "Absent", cls: "bg-red-100 text-red-700" },
  { value: "LATE", label: "Late", cls: "bg-amber-100 text-amber-700" },
] as const;

const getStatusBadge = (status: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    PRESENT: { cls: "bg-emerald-100 text-emerald-700", label: "Present" },
    ABSENT: { cls: "bg-red-100 text-red-700", label: "Absent" },
    LATE: { cls: "bg-amber-100 text-amber-700", label: "Late" },
  };
  const s = map[status] ?? { cls: "bg-gray-100 text-gray-700", label: status };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function AttendancePage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"view" | "mark">("view");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [staffTypeFilter, setStaffTypeFilter] = useState("");

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const { isLoading: loadingDaily } = useQuery({
    queryKey: ["hr", "attendance", "daily", date],
    queryFn: async () => {
      const res = await api.get(`/hr/attendance/daily?date=${date}`);
      const payload = res.data?.data ?? res.data;
      const data = payload as DailyAttendanceResponse;
      setRecords(data.records ?? []);
      return data;
    },
    enabled: mode === "view" || mode === "mark",
  });

  const { isLoading: loadingStaff } = useQuery({
    queryKey: ["hr", "staff", "directory"],
    queryFn: async () => {
      const [staffRes, teachingRes] = await Promise.all([
        api.get("/hr/staff/directory"),
        api.get("/teaching"),
      ]);

      const staffPayload = staffRes.data?.data ?? staffRes.data;
      const teachingPayload = teachingRes.data?.data ?? teachingRes.data;

      const staffData = Array.isArray(staffPayload) ? (staffPayload as StaffDirectoryItem[]) : [];
      const teacherData = Array.isArray(teachingPayload?.data)
        ? (teachingPayload.data as TeacherDirectoryItem[])
        : Array.isArray(teachingPayload)
          ? (teachingPayload as TeacherDirectoryItem[])
          : [];

      const merged: StaffMember[] = [
        ...staffData.map((person) => ({
          id: person.id ?? "",
          name: person.name ?? "Unknown Staff",
          email: person.email ?? "",
          employeeId: person.employeeId ?? "—",
          designation: person.designation ?? person.subject ?? "—",
          department:
            typeof person.department === "string"
              ? { name: person.department }
              : person.department ?? null,
          staffType: person.staffType ?? person.subject ?? "STAFF",
          phone: person.phone ?? undefined,
          personType: "STAFF" as const,
        })),
        ...teacherData.map((person) => ({
          id: person.id ?? "",
          name: person.name ?? "Unknown Teacher",
          email: person.email ?? "",
          employeeId: person.employeeId ?? person.teacherId ?? "—",
          designation: person.designation ?? person.subject ?? "—",
          department:
            typeof person.department === "string"
              ? { name: person.department }
              : person.department ?? null,
          staffType: person.subject ?? person.designation ?? "TEACHING",
          phone: person.phone ?? undefined,
          personType: "TEACHER" as const,
        })),
      ];

      setStaffList(merged);
      return merged;
    },
    enabled: mode === "mark",
  });

  const bulkAttendanceMutation = useMutation({
    mutationFn: async (payload: { date: string; attendances: { staffId?: string; teacherId?: string; personType?: "STAFF" | "TEACHER"; status: string; note?: string }[] }) => {
      const res = await api.post("/hr/attendance/bulk", payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      toast.success("Attendance saved successfully!");
      setMode("view");
      queryClient.invalidateQueries({ queryKey: ["hr", "attendance", "daily"] });
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to save attendance");
    },
  });

  const singleAttendanceMutation = useMutation({
    mutationFn: async (payload: { staffId?: string; teacherId?: string; personType?: "STAFF" | "TEACHER"; date: string; status: string; note?: string }) => {
      const res = await api.post("/hr/attendance", payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      toast.success("Attendance updated!");
      queryClient.invalidateQueries({ queryKey: ["hr", "attendance", "daily"] });
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to update");
    },
  });

  const loading = loadingDaily;

  const stats = useMemo(() => {
    const present = records.filter((r) => r.status === "PRESENT").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const total = records.length || staffList.length;
    const unmarked = Math.max(0, total - present - absent - late);
    return { present, absent, late, unmarked, total };
  }, [records, staffList]);

  const filteredStaff = useMemo(() => {
    let list = [...staffList];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.employeeId.toLowerCase().includes(q) ||
          s.designation?.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (departmentFilter) {
      list = list.filter((s) =>
        (typeof s.department === "string" ? s.department : s.department?.name) === departmentFilter
      );
    }

    if (staffTypeFilter === "TEACHING") {
      list = list.filter((s) => s.personType === "TEACHER");
    } else if (staffTypeFilter === "NON_TEACHING") {
      list = list.filter((s) => s.personType === "STAFF");
    }

    return list;
  }, [staffList, search, departmentFilter, staffTypeFilter]);

  const departments = useMemo(() => {
    const depts = new Map<string, string>();
    staffList.forEach((s) => {
      const departmentName = typeof s.department === "string" ? s.department : s.department?.name;
      if (departmentName) depts.set(departmentName, departmentName);
    });
    return Array.from(depts.values()).sort();
  }, [staffList]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach((r) => {
      map.set(`${r.personType ?? "STAFF"}:${r.staffId}`, r);
    });
    return map;
  }, [records]);

  const handleStatusChange = (personId: string, status: string, personType?: "STAFF" | "TEACHER") => {
    const resolvedType = personType ?? staffList.find((person) => person.id === personId)?.personType ?? "STAFF";

    setRecords((prev) => {
      const existing = prev.find((r) => r.staffId === personId && (r.personType ?? "STAFF") === resolvedType);
      if (existing) {
        return prev.map((r) =>
          r.staffId === personId && (r.personType ?? "STAFF") === resolvedType ? { ...r, status } : r
        );
      }
      const staff = staffList.find((s) => s.id === personId);
      if (!staff) return prev;
      const newRecord: AttendanceRecord = {
        id: `temp-${personId}-${date}`,
        staffId: staff.id,
        staffName: staff.name,
        employeeId: staff.employeeId,
        designation: staff.designation,
        department: typeof staff.department === "string" ? staff.department : staff.department?.name,
        staffType: staff.staffType,
        personType: resolvedType,
        status,
      };
      return [...prev, newRecord];
    });
  };

  const handleNoteChange = (personId: string, note: string, personType?: "STAFF" | "TEACHER") => {
    const resolvedType = personType ?? staffList.find((person) => person.id === personId)?.personType ?? "STAFF";

    setRecords((prev) =>
      prev.map((r) =>
        r.staffId === personId && (r.personType ?? "STAFF") === resolvedType ? { ...r, note } : r
      )
    );
  };

  const handleBulkSave = async () => {
    setSaving(true);
    try {
      const attendances = filteredStaff
        .map((person) => {
          const record = records.find(
            (r) => r.staffId === person.id && (r.personType ?? "STAFF") === (person.personType ?? "STAFF")
          );
          const status = record?.status || "PRESENT";
          const note = record?.note || "";

          return person.personType === "TEACHER"
            ? { teacherId: person.id, personType: "TEACHER" as const, status, note }
            : { staffId: person.id, personType: "STAFF" as const, status, note };
        })
        .filter((a) => a.staffId || a.teacherId);

      await bulkAttendanceMutation.mutateAsync({
        date,
        attendances,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSingleSave = async (personId: string, status: string, note?: string, personType?: "STAFF" | "TEACHER") => {
    const resolvedType = personType ?? staffList.find((person) => person.id === personId)?.personType ?? "STAFF";

    await singleAttendanceMutation.mutateAsync({
      ...(resolvedType === "TEACHER" ? { teacherId: personId } : { staffId: personId }),
      personType: resolvedType,
      date,
      status,
      note: note || "",
    });
  };

  const handleMarkAll = (status: "PRESENT" | "ABSENT" | "LATE") => {
    setRecords((prev) => {
      const updated = [...prev];
      filteredStaff.forEach((staff) => {
        const personType = staff.personType ?? "STAFF";
        const existingIndex = updated.findIndex(
          (r) => r.staffId === staff.id && (r.personType ?? "STAFF") === personType
        );
        if (existingIndex >= 0) {
          updated[existingIndex] = { ...updated[existingIndex], status };
        } else {
          updated.push({
            id: `temp-${staff.id}-${date}`,
            staffId: staff.id,
            staffName: staff.name,
            employeeId: staff.employeeId,
            designation: staff.designation,
            department: typeof staff.department === "string" ? staff.department : staff.department?.name,
            staffType: staff.staffType,
            personType,
            status,
          });
        }
      });
      return updated;
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Staff & Teacher Attendance Report", 14, 18);
    doc.setFontSize(11);
    doc.text(`Date: ${date}`, 14, 26);
    doc.text(`Total: ${stats.total} | Present: ${stats.present} | Absent: ${stats.absent} | Late: ${stats.late}`, 14, 33);

    autoTable(doc, {
      startY: 40,
      head: [["Name", "Employee ID", "Designation", "Department", "Status", "Note"]],
      body: records.map((r) => [
        r.staffName,
        r.employeeId,
        r.designation || "",
        r.department || "—",
        r.status,
        r.note || "—",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`staff-attendance-${date}.pdf`);
    toast.success("PDF exported!");
  };

  const statCards = [
    {
      label: "Total Staff",
      value: stats.total.toString(),
      icon: <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
    },
    {
      label: "Present",
      value: stats.present.toString(),
      icon: <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      label: "Absent",
      value: stats.absent.toString(),
      icon: <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />,
    },
    {
      label: "Late",
      value: stats.late.toString(),
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    },
    {
      label: "Unmarked",
      value: stats.unmarked.toString(),
      icon: <Clock className="h-5 w-5 text-slate-500 dark:text-slate-400" />,
    },
  ];

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-300/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-7xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Staff & Teacher Attendance
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <CalendarCheck className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Daily attendance tracking for all staff and teachers
                </p>
              </div>
              <div className="flex items-center gap-2">
                {mode === "view" ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMode("mark")}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                  >
                    <UserCheck className="h-4 w-4" /> Mark Attendance
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMode("view")}
                    className="rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                  >
                    Cancel
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
              </div>

              {mode === "mark" && (
                <>
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search staff..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>

                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={staffTypeFilter}
                    onChange={(e) => setStaffTypeFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  >
                    <option value="">All Types</option>
                    <option value="TEACHING">Teaching</option>
                    <option value="NON_TEACHING">Non-Teaching</option>
                  </select>
                </>
              )}

              {mode === "view" && records.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportPDF}
                  className="ml-auto flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                >
                  <FileText className="h-4 w-4" /> Export PDF
                </motion.button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0 mb-3" />
                      <Skeleton className="h-3 w-20 rounded-md mb-2" />
                      <Skeleton className="h-6 w-12 rounded-md" />
                    </div>
                  ))
                : statCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl flex items-center gap-4 hover:shadow-2xl transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {card.icon}
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {card.label}
                        </p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                          {card.value}
                        </p>
                      </div>
                    </motion.div>
                  ))}
            </div>

            {mode === "mark" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Quick Actions:
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMarkAll("PRESENT")}
                  className="flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20"
                >
                  <CheckCircle2 className="h-3 w-3" /> Mark All Present
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMarkAll("ABSENT")}
                  className="flex items-center gap-1 rounded-lg bg-red-100 dark:bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20"
                >
                  <XCircle className="h-3 w-3" /> Mark All Absent
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMarkAll("LATE")}
                  className="flex items-center gap-1 rounded-lg bg-amber-100 dark:bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/20"
                >
                  <Clock className="h-3 w-3" /> Mark All Late
                </motion.button>
                <div className="ml-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBulkSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Attendance"}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {mode === "view" ? (
              <ViewModeTable
                loading={loading}
                records={records}
                onCycleStatus={handleSingleSave}
              />
            ) : (
              <MarkModeTable
                loading={loadingStaff}
                filteredStaff={filteredStaff}
                staffList={staffList}
                attendanceMap={attendanceMap}
                onStatusChange={handleStatusChange}
                onNoteChange={handleNoteChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewModeTable({ loading, records, onCycleStatus }: { loading: boolean; records: AttendanceRecord[]; onCycleStatus: (staffId: string, status: string, personType?: "STAFF" | "TEACHER") => void }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-4 flex-1">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-12 shadow-xl text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20 mx-auto"
        >
          <CalendarCheck className="w-10 h-10 text-indigo-400" />
        </motion.div>
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
          No attendance records for this date
        </h3>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
          Switch to Mark Attendance to record staff and teacher attendance.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30"
        >
          Mark Attendance
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <th className="pb-2 font-medium">Person</th>
              <th className="pb-2 font-medium">Employee ID</th>
              <th className="pb-2 font-medium">Designation</th>
              <th className="pb-2 font-medium">Department</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Note</th>
              <th className="pb-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {records.map((r) => (
              <tr key={r.id}>
                <td className="py-3">
                  <div className="font-medium text-slate-900 dark:text-white">{r.staffName}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {r.personType === "TEACHER" ? "Teacher" : "Staff"}
                  </div>
                </td>
                <td className="py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{r.employeeId}</td>
                <td className="py-3 text-slate-700 dark:text-slate-200">{r.designation || "—"}</td>
                <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                  {r.department || "—"}
                </td>
                <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                  {r.staffType || (r.personType === "TEACHER" ? "Teaching" : "—")}
                </td>
                <td className="py-3">{getStatusBadge(r.status)}</td>
                <td className="py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                  {r.note || "—"}
                </td>
                <td className="py-3 text-right">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const newStatus =
                        r.status === "PRESENT"
                          ? "ABSENT"
                          : r.status === "ABSENT"
                            ? "LATE"
                            : "PRESENT";
                      onCycleStatus(r.staffId, newStatus, r.personType ?? "STAFF");
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Cycle Status
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarkModeTable({
  loading,
  filteredStaff,
  staffList,
  attendanceMap,
  onStatusChange,
  onNoteChange,
}: {
  loading: boolean;
  filteredStaff: StaffMember[];
  staffList: StaffMember[];
  attendanceMap: Map<string, AttendanceRecord>;
  onStatusChange: (staffId: string, status: string, personType?: "STAFF" | "TEACHER") => void;
  onNoteChange: (staffId: string, note: string, personType?: "STAFF" | "TEACHER") => void;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-4 flex-1">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-40 rounded-md" />
                </div>
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-8 w-32 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filteredStaff.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-12 shadow-xl text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20 mx-auto"
        >
          <Users className="w-10 h-10 text-indigo-400" />
        </motion.div>
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
          {filteredStaff.length === 0 && staffList.length === 0
            ? "No staff members found"
            : "No staff match your filters"}
        </h3>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
          {filteredStaff.length === 0 && staffList.length === 0
            ? "Add staff first to mark attendance."
            : "Try adjusting your search or filters."}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <th className="pb-2 font-medium">Staff</th>
              <th className="pb-2 font-medium">Employee ID</th>
              <th className="pb-2 font-medium">Designation</th>
              <th className="pb-2 font-medium">Department</th>
              <th className="pb-2 font-medium text-center">Status</th>
              <th className="pb-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredStaff.map((staff) => {
              const personType = staff.personType ?? "STAFF";
              const record = attendanceMap.get(`${personType}:${staff.id}`);
              const currentStatus = record?.status || "PRESENT";
              return (
                <tr key={`${personType}-${staff.id}`}>
                  <td className="py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{staff.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {staff.email}
                    </p>
                  </td>
                  <td className="py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {staff.employeeId}
                  </td>
                  <td className="py-3 text-slate-700 dark:text-slate-200">{staff.designation}</td>
                  <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                    {(typeof staff.department === "string" ? staff.department : staff.department?.name) || "—"}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {STATUS_OPTIONS.map((opt) => (
                        <motion.button
                          key={opt.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            onStatusChange(staff.id, opt.value, personType)
                          }
                          className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                            currentStatus === opt.value
                              ? opt.cls + " ring-2 ring-offset-1 ring-indigo-400"
                              : "bg-white/60 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10"
                          }`}
                        >
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <input
                      type="text"
                      value={record?.note || ""}
                      onChange={(e) =>
                        onNoteChange(staff.id, e.target.value, personType)
                      }
                      placeholder="Optional note"
                      className="w-full min-w-[120px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
