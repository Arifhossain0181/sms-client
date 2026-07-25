import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { homeworkService } from "./homework.service";
import { Homework, HomeworkListResponse, HomeworkStatusFilter } from "./homework.types";
import { toast } from "sonner";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export const useMyHomework = (params?: { sectionId?: string; subjectId?: string; status?: HomeworkStatusFilter; page?: number; pageSize?: number }) => {
  return useQuery<HomeworkListResponse>({
    queryKey: ["homework", "mine", params],
    queryFn: () => homeworkService.listMine(params),
  });
};

export const useOverdueHomework = () => {
  return useQuery<Homework[]>({
    queryKey: ["homework", "overdue"],
    queryFn: homeworkService.listOverdue,
  });
};

export const useHomeworkDetail = (id: string | undefined) => {
  return useQuery<Homework>({
    queryKey: ["homework", id],
    queryFn: () => homeworkService.getById(id!),
    enabled: !!id,
  });
};

export const useCreateHomework = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof homeworkService.create>[0]) => homeworkService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"], exact: false });
      toast.success("Homework created!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to create homework"));
    },
  });
};

export const useUpdateHomework = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof homeworkService.update>[1] }) =>
      homeworkService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"], exact: false });
      toast.success("Homework updated!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update homework"));
    },
  });
};

export const useMarkHomeworkReviewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homeworkService.markReviewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"], exact: false });
      toast.success("Homework marked as reviewed!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to mark as reviewed"));
    },
  });
};

export const useDeleteHomework = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homeworkService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"], exact: false });
      toast.success("Homework deleted!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to delete homework"));
    },
  });
};
