/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timetableService } from "./timetable.service";
import { CreateTimetablePayload } from "./timetable.types";
import { toast } from "sonner";

export const useTimetables = () => {
  return useQuery({
    queryKey: ["timetables"],
    queryFn: timetableService.getAll,
  });
};

export const useMyTimetable = (enabled = true) => {
  return useQuery({
    queryKey: ["timetables", "my-routine"],
    queryFn: timetableService.getMyRoutine,
    enabled,
  });
};

export const useTimetableByClass = (classId: string) => {
  return useQuery({
    queryKey: ["timetables", classId],
    queryFn: () => timetableService.getByClass(classId),
    enabled: !!classId,
  });
};

export const useTimetableByTeacher = (teacherId: string, enabled = true) => {
  return useQuery({
    queryKey: ["timetables", "teacher", teacherId],
    queryFn: () => timetableService.getByTeacher(teacherId),
    enabled: enabled && !!teacherId,
  });
};

export const useCreateTimetable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimetablePayload) =>
      timetableService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetables"] });
      toast.success("Timetable added!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useUpdateTimetable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateTimetablePayload>;
    }) => timetableService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetables"] });
      toast.success("Timetable updated!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useDeleteTimetable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timetableService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetables"] });
      toast.success("Timetable deleted!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};