/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { noticeService } from "./notice.service";
import { CreateNoticePayload } from "./notice.types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const useNotices = () => {
  const { role } = useAuth();
  return useQuery({
    queryKey: ["notices"],
    queryFn: role === "ADMIN" ? noticeService.getAll : noticeService.getFeed,
  });
};

export const useNotice = (id: string) => {
  return useQuery({
    queryKey: ["notices", id],
    queryFn: () => noticeService.getById(id),
    enabled: !!id,
  });
};

export const useCreateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNoticePayload) => noticeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice publish হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useUpdateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateNoticePayload> }) =>
      noticeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice update হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useDeleteNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noticeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice delete হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};