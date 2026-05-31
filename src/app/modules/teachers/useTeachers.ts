import { toast } from "sonner";
import { teacherService } from "./teacher.service";
import { CreateTeacherPayload } from "./teacher.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export const useTeachers = () => {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: teacherService.getAll,
  });
};

export const useTeacher = (id: string) => {
  return useQuery({
    queryKey: ["teacher", id],
    queryFn: () => teacherService.getById(id),
  });
};
export const useCreateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTeacherPayload) => teacherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher add হয়েছে!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed!"));
    },
  });
};
export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTeacherPayload> }) =>
      teacherService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher update হয়েছে!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed!"));
    },
  });
};
   
export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher delete হয়েছে!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed!"));
    },
  });
};