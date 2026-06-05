"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authstore";
import {
  User,
  BookOpen,
  Clock,
  BarChart3,
  LogOut,
  Loader,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface StudentData {
  profile: {
    id: string;
    userId: string;
    studentId: string;
    name: string;
    email: string;
    dob: string;
    gender: string;
    bloodGroup: string;
    photo: string;
    address: string;
    rollNumber: number;
    class: {
      id: string;
      name: string;
    };
    section: {
      id: string;
      name: string;
    };
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  results: {
    results: Array<{
      id: string;
      marksObtained: number;
      exam: { name: string };
      subject: { name: string };
    }>;
    totalObtained: number;
    totalPossible: number;
    percentage: number;
  };
  routine: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject: { name: string };
    teacher: { name: string };
    roomNumber?: string;
  }>;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (!user) {
          router.push("/student-login");
          return;
        }

        const response = await api.get("/students/dashboard/my-dashboard");
        setDashboardData(response.data.data);
        setError(null);
      } catch (err: unknown) {
        const errorMsg =
          err && typeof err === "object" && "response" in err
            ? (err as any).response?.data?.message || "Failed to load dashboard"
            : "Failed to load dashboard";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, router]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/student-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-slate-900">Error Loading Dashboard</h2>
              <p className="text-sm text-slate-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/student-login")}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const days = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];
  const routineByDay = days.map((day) => ({
    day,
    classes: dashboardData.routine.filter((r) => r.dayOfWeek === day),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Student Dashboard</h1>
              <p className="text-xs text-slate-500">
                {dashboardData.profile.class.name} - {dashboardData.profile.section.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Card */}
        <div className="grid gap-8">
          {/* Top Section - Profile & Quick Stats */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-24"></div>
              <div className="p-6">
                <div className="flex justify-center -mt-16 mb-4">
                  <div className="w-24 h-24 bg-slate-100 rounded-full border-4 border-white flex items-center justify-center shadow-md">
                    {dashboardData.profile.photo ? (
                      <img
                        src={dashboardData.profile.photo}
                        alt={dashboardData.profile.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                </div>
                <h2 className="text-center text-lg font-bold text-slate-900">
                  {dashboardData.profile.name}
                </h2>
                <p className="text-center text-xs text-slate-500 mt-1">
                  Roll No. {dashboardData.profile.rollNumber}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 text-xs">
                  <div>
                    <p className="text-slate-500 font-medium">Student ID</p>
                    <p className="text-slate-900 font-semibold">
                      {dashboardData.profile.studentId}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Email</p>
                    <p className="text-slate-900 break-all">
                      {dashboardData.profile.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Date of Birth</p>
                    <p className="text-slate-900">
                      {new Date(dashboardData.profile.dob).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Gender</p>
                    <p className="text-slate-900 capitalize">
                      {dashboardData.profile.gender}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
              {/* Attendance Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 rounded-lg p-2">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Attendance</h3>
                </div>
                <p className="text-3xl font-bold">
                  {dashboardData.attendance.percentage}%
                </p>
                <p className="text-sm text-emerald-100 mt-2">
                  {dashboardData.attendance.present}/{dashboardData.attendance.total} present
                </p>
              </div>

              {/* Results Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 rounded-lg p-2">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Performance</h3>
                </div>
                <p className="text-3xl font-bold">
                  {dashboardData.results.percentage}%
                </p>
                <p className="text-sm text-blue-100 mt-2">
                  {dashboardData.results.totalObtained}/{dashboardData.results.totalPossible}
                </p>
              </div>

              {/* Class Info Card */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 rounded-lg p-2">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Class</h3>
                </div>
                <p className="text-2xl font-bold">{dashboardData.profile.class.name}</p>
                <p className="text-sm text-purple-100 mt-2">
                  Section: {dashboardData.profile.section.name}
                </p>
              </div>
            </div>
          </div>

          {/* Class Routine */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Class Routine
              </h2>
            </div>
            <div className="overflow-x-auto">
              <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                {routineByDay.map((day) => (
                  <div key={day.day} className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 text-sm mb-3 capitalize">
                      {day.day.charAt(0) + day.day.slice(1).toLowerCase()}
                    </h3>
                    <div className="space-y-2">
                      {day.classes.length > 0 ? (
                        day.classes.map((cls) => (
                          <div
                            key={cls.id}
                            className="text-xs bg-blue-50 border border-blue-200 rounded p-2"
                          >
                            <p className="font-semibold text-slate-900">
                              {cls.subject.name}
                            </p>
                            <p className="text-slate-600 text-xs mt-1">
                              {cls.startTime} - {cls.endTime}
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                              {cls.teacher.name}
                            </p>
                            {cls.roomNumber && (
                              <p className="text-slate-500 text-xs">
                                Room: {cls.roomNumber}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-xs italic">No classes</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results & Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Results */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Recent Results
                </h2>
              </div>
              <div className="divide-y divide-slate-200">
                {dashboardData.results.results.length > 0 ? (
                  dashboardData.results.results.slice(0, 5).map((result) => (
                    <div
                      key={result.id}
                      className="px-6 py-4 flex justify-between items-center hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {result.subject.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {result.exam.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {result.marksObtained}
                        </p>
                        <p className="text-xs text-slate-500">/ 100</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-slate-500 text-sm">No results yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Attendance Summary
                </h2>
              </div>
              <div className="px-6 py-8">
                <div className="grid gap-6">
                  <div className="text-center pb-6 border-b border-slate-200">
                    <p className="text-4xl font-bold text-slate-900">
                      {dashboardData.attendance.percentage}%
                    </p>
                    <p className="text-sm text-slate-600 mt-2">Overall Attendance</p>
                  </div>

                  <div className="grid gap-4">
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-sm font-medium text-slate-700">Present</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {dashboardData.attendance.present}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-sm font-medium text-slate-700">Absent</span>
                      <span className="text-lg font-bold text-red-600">
                        {dashboardData.attendance.absent}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-sm font-medium text-slate-700">Late</span>
                      <span className="text-lg font-bold text-yellow-600">
                        {dashboardData.attendance.late}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm font-medium text-slate-700">Total Days</span>
                      <span className="text-lg font-bold text-blue-600">
                        {dashboardData.attendance.total}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
