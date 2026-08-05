import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { admissionService } from "./admission.service";
import {
  AdmissionQuery,
  CreateAdmissionPayload,
  UpdateAdmissionStatusPayload,
} from "./admission.types";

function errorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;
  return message || fallback;
}

// server-side pagination — never fetches the whole table
export function useAdmissions(query: AdmissionQuery = {}, enabled: boolean = true) {
  return useQuery({
    queryKey: ["admissions", query],
    queryFn: () => admissionService.getAll(query),
    placeholderData: (prev) => prev,
    enabled,
  });
}

export function useAdmission(id: string) {
  return useQuery({
    queryKey: ["admissions", id],
    queryFn: () => admissionService.getById(id),
    enabled: !!id,
  });
}

// true totals across ALL pages — don't compute this from a paginated array
export function useAdmissionStats() {
  return useQuery({
    queryKey: ["admissions", "stats"],
    queryFn: () => admissionService.getStats(),
  });
}

// class list rarely changes — cached for 10 min so opening the form
// repeatedly doesn't refetch every time
export function useAdmissionClasses() {
  return useQuery({
    queryKey: ["admissions", "classes"],
    queryFn: () => admissionService.getPublicClasses(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdmissionPayload) => admissionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"], exact: false });
      toast.success("Admission created!");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Failed to create admission"));
    },
  });
}

export function useUpdateAdmissionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateAdmissionStatusPayload) =>
      admissionService.updateStatus(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admissions", updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ["admissions"], exact: false });
      toast.success(updated.status === "APPROVED" ? "Admission approved!" : "Admission rejected");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Failed to update admission status"));
    },
  });
}

export function useDeleteAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => admissionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"], exact: false });
      toast.success("Admission deleted");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Failed to delete admission"));
    },
  });
}