/* eslint-disable @typescript-eslint/no-explicit-any */
import { attendanceService } from "./attendance.service"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { TakeAttendancePayload } from "./attendance.types"
import { toast } from "sonner"


// Fetch attendance by class, section, and date
export const useAttendancesByClassAndDate = (classId: string, sectionId: string, date: string) => {
    return useQuery({
    queryKey: ["attendances", classId, sectionId, date],
    queryFn: () => attendanceService.getByClassAndDate(classId, sectionId, date),
    enabled: Boolean(classId && sectionId && date),
    })
}

// Fetch a student's attendance
export const useAttendancesByStudent = (studentId: string) => {
    return useQuery({
        queryKey: ["attendances", studentId],
        queryFn: () => attendanceService.getByStudent(studentId),
    })
}

// Submit attendance for all students
export const useTakeAttendance = () =>{
    const queryClient = useQueryClient()
    return useMutation({
    mutationFn: (data: TakeAttendancePayload) => attendanceService.takeAttendance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendances"] })
        },
        onError: ( err: any) => {
     toast.error(err?.response?.data?.message || "Failed to create attendance")
        }
    })
}

// Single update
export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      attendanceService.update(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Attendance updated!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useMonthlyReport = (classId: string, sectionId: string, month: number, year: number) => {
  return useQuery({
    queryKey: ["attendance-monthly-report", classId, sectionId, month, year],
    queryFn: () => attendanceService.getMonthlyReport(classId, sectionId, month, year),
    enabled: Boolean(classId && sectionId && month && year),
  });
};

export const useYearlyReport = (classId: string, sectionId: string, year: number) => {
  return useQuery({
    queryKey: ["attendance-yearly-report", classId, sectionId, year],
    queryFn: () => attendanceService.getYearlyReport(classId, sectionId, year),
    enabled: Boolean(classId && sectionId && year),
  });
};