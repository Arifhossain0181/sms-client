import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { noticeService } from "./notice.service";
import { CreateNoticePayload } from "./notice.types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useHydration } from "@/hooks/useHydration";

function errorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;
  return message || fallback;
}

export const useNotices = () => {
  const { role } = useAuth();
  const isHydrated = useHydration();

  const isAdmin = role === "SCHOOL_ADMIN";
  const queryFn = isAdmin ? noticeService.getAll : noticeService.getFeed;

  return useQuery({
    queryKey: ["notices"],
    queryFn,
    retry: false,
    // wait for hydration + role, so an unauthenticated client never fires
    // a request that's guaranteed to 401
    enabled: isHydrated && !!role,
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
      toast.success("Notice published!");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Failed to publish notice"));
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
      toast.success("Notice updated!");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Failed to update notice"));
    },
  });
};

// req 3.2: pin / unpin — optimistic update so the toggle feels instant
export const usePinNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      noticeService.togglePin(id, pinned),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast.success(updated.pinned ? "Notice pinned!" : "Notice unpinned!");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Failed to update pin status"));
    },
  });
};

export const useDeleteNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noticeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice deleted!");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Failed to delete notice"));
    },
  });
};