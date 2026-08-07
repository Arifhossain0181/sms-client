import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectService } from "./subject.service";
import { CreateSubjectPayload, Subject, SubjectQuery } from "./subject.types";
import { toast } from "sonner";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export const useSubjects = (query: SubjectQuery = {}) => {
  return useQuery<Subject[]>({
    queryKey: ["subjects", query],
    queryFn: () => subjectService.getAll(query),
  });
};

export const useSubject = (id: string) => {
  return useQuery<Subject>({
    queryKey: ["subjects", id],
    queryFn: () => subjectService.getById(id),
    enabled: !!id,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubjectPayload) => subjectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"], exact: false });
      toast.success("Subject created!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to create subject"));
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSubjectPayload> }) =>
      subjectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"], exact: false });
      toast.success("Subject updated!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update subject"));
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"], exact: false });
      toast.success("Subject deleted!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to delete subject"));
    },
  });
};

export const useMySubjects = () => {
  return useQuery<Subject[]>({
    queryKey: ["subjects", "mine"],
    queryFn: () => subjectService.getMySubjects(),
  });
};