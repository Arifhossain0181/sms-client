/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resultService } from "./result.service";
import { CreateResultPayload } from "./result.types";
import { toast } from "sonner";

export const useResults = () => {
  return useQuery({
    queryKey: ["results"],
    queryFn: resultService.getAll,
  });
};

export const useResultsByExam = (examId: string) => {
  return useQuery({
    queryKey: ["results", examId],
    queryFn: () => resultService.getByExam(examId),
    enabled: !!examId,
  });
};

export const useResultsByStudent = (studentId: string) => {
  return useQuery({
    queryKey: ["results", "student", studentId],
    queryFn: () => resultService.getByStudent(studentId),
    enabled: !!studentId,
  });
};

export const useCreateBulkResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateResultPayload[]) => resultService.createBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast.success("Result save হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useUpdateResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, marksObtained }: { id: string; marksObtained: number }) =>
      resultService.update(id, marksObtained),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast.success("Result update হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useDeleteResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resultService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast.success("Result delete হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};