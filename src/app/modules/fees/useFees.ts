import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feesService } from "./fees.service";
import { CreateFeePayload, PayFeePayload, CashPaymentPayload } from "./fees.types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

function errorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;
  return message || fallback;
}

export const useFees = () => {
  const { role } = useAuth();
  const isStudent = role === "STUDENT";

  // one useQuery call, always — never call hooks conditionally (React Rules of Hooks).
  // queryFn/queryKey/enabled all just vary based on role instead.
  return useQuery({
    queryKey: isStudent ? ["fees", "my-fees"] : ["fees"],
    queryFn: isStudent ? feesService.getMyFees : feesService.getAll,
    enabled: isStudent || (!!role && hasPermission(role, "manage_fees")),
    retry: false,
  });
};

export const useFeesByStudent = (studentId: string) => {
  return useQuery({
    queryKey: ["fees", "student", studentId],
    queryFn: () => feesService.getByStudent(studentId),
    enabled: !!studentId,
  });
};

export const useCreateFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFeePayload) => feesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"], exact: false });
      toast.success("Fee added!");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Failed to add fee"));
    },
  });
};

export const usePayFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayFeePayload }) => feesService.pay(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"], exact: false });
      toast.success("Payment successful!");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Payment failed"));
    },
  });
};

export const useDeleteFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"], exact: false });
      toast.success("Fee deleted!");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Failed to delete fee"));
    },
  });
};

export const useCashPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CashPaymentPayload) => feesService.payCash(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"], exact: false });
      toast.success("Cash payment recorded!");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Failed to record payment"));
    },
  });
};