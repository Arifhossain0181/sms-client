/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feesService } from "./fees.service";
import { CreateFeePayload, PayFeePayload, CashPaymentPayload } from "./fees.types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const useFees = () => {
  const { role } = useAuth();
  
  // STUDENT এর জন্য নিজের fees fetch করুন
  if (role === 'STUDENT') {
    return useQuery({
      queryKey: ["fees", "my-fees"],
      queryFn: feesService.getMyFees,
      retry: false
    });
  }
  
  // ADMIN/TEACHER এর জন্য সব fees fetch করুন
  return useQuery({
    queryKey: ["fees"],
    queryFn: feesService.getAll,
    enabled: role === 'SCHOOL_ADMIN' || role === 'ACCOUNTANT' || role === 'TEACHER',
    retry: false
  });
};

export const useFeesByStudent = (studentId: string) => {
  return useQuery({
    queryKey: ["fees", studentId],
    queryFn: () => feesService.getByStudent(studentId),
    enabled: !!studentId,
  });
};

export const useCreateFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFeePayload) => feesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast.success("Fee add হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const usePayFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayFeePayload }) =>
      feesService.pay(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast.success("Payment সফল!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Payment failed!");
    },
  });
};

export const useDeleteFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast.success("Fee delete হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useCashPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CashPaymentPayload) => feesService.payCash(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast.success("Cash payment recorded!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};