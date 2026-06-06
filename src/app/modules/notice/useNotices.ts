/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { noticeService } from "./notice.service";
import { CreateNoticePayload } from "./notice.types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useHydration } from "@/hooks/useHydration";

export const useNotices = () => {
  const { role } = useAuth();
  const isHydrated = useHydration();
  
  const isAdmin = role === "ADMIN";
  const queryFn = isAdmin ? noticeService.getAll : noticeService.getFeed;
  
  console.log(`[NOTICE-HOOK] User role: ${role}, Hydrated: ${isHydrated}, Using: ${isAdmin ? 'getAll()' : 'getFeed()'}`);
  
  return useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      console.log(`[NOTICE-HOOK] Fetching notices...`);
      
      // Debug token state
      if (typeof window !== "undefined") {
        const getCookie = (name: string) => {
          const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
          return match ? match[2] : null;
        };
        const tokenCookie = getCookie("accessToken");
        const tokenStorage = localStorage.getItem("accessToken");
        console.log(`[NOTICE-HOOK] Token state:`, {
          cookie: tokenCookie ? `✅ (${tokenCookie.length} chars)` : "❌",
          storage: tokenStorage ? `✅ (${tokenStorage.length} chars)` : "❌"
        });
      }
      
      try {
        const data = await queryFn();
        console.log(`[NOTICE-HOOK] ✅ Fetched ${data.length} notices`);
        return data;
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } }).response?.status;
        console.error(`[NOTICE-HOOK] ❌ Error (${status}):`, error);
        throw error;
      }
    },
    retry: false,
    enabled: isHydrated && !!role,  // Only run query after hydration and when role is available
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