/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examService } from "@/app/modules/exam/exam.service";
import { CreateExamPayload } from "@/app/modules/exam/exam.types";
import { toast } from "sonner";

export const useExams = () => {
  return useQuery({
    queryKey: ["exams"],
    queryFn:async() =>{
       const data= await examService.getAll();
         console.log("Exam data:", data);
         return data;
      }


  });
};

export const useExam = (id: string) => {
  return useQuery({
    queryKey: ["exams", id],
    queryFn: () => examService.getById(id),
    enabled: !!id,
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExamPayload) => examService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam added!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExamPayload> }) =>
      examService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam updated!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useDeleteExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam deleted!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};