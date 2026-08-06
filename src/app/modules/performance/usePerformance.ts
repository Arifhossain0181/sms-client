import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { MyPerformanceResponse, PerformanceReview } from "./performance.types";

export function useMyPerformanceReviews() {
  return useQuery({
    queryKey: ["my-performance-reviews"],
    queryFn: async (): Promise<MyPerformanceResponse> => {
      const res = await api.get("/hr/performance/me");
      return res.data?.data ?? res.data;
    },
  });
}

export function usePerformanceReviews() {
  return useQuery({
    queryKey: ["all-performance-reviews"],
    queryFn: async (): Promise<PerformanceReview[]> => {
      const res = await api.get("/hr/performance");
      return res.data?.data ?? res.data;
    },
  });
}
