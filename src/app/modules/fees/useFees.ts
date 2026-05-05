/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feesService } from "./fees.service";
import { CreateFeePayload, PayFeePayload, CashPaymentPayload } from "./fees.types";
import { toast } from "sonner";

export const useFees = () => {
  return useQuery({
    queryKey: ["fees"],
    queryFn: feesService.getAll,
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