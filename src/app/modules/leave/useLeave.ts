import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { CreateLeavePayload, LeaveBalance, MyLeaveResponse } from "./leave.types";

export function useMyLeaveRequests(params?: { status?: string; leaveType?: string; page?: number; limit?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.leaveType) queryParams.set("leaveType", params.leaveType);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  const queryString = queryParams.toString();

  return useQuery({
    queryKey: ["my-leave-requests", params],
    queryFn: async (): Promise<MyLeaveResponse> => {
      const res = await api.get(`/hr/leave/me${queryString ? `?${queryString}` : ""}`);
      return res.data?.data ?? res.data;
    },
  });
}

export function useLeaveBalance(year?: number) {
  return useQuery({
    queryKey: ["my-leave-balance", year],
    queryFn: async (): Promise<LeaveBalance[]> => {
      const res = await api.get(`/hr/leave/staff/me/balance${year ? `?year=${year}` : ""}`);
      return res.data?.data ?? res.data;
    },
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateLeavePayload) => {
      const res = await api.post("/hr/leave", payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-balance"] });
    },
  });
}
