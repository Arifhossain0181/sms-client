/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admissionService } from"./admission.service";
import { CreateAdmissionPayload, AdmissionStatus } from "./admission.types";
import { toast } from "sonner";

export const useAdmissions = () => {
  return useQuery({
    queryKey: ["admissions"],
    queryFn: admissionService.getAll,
  });
};

export const useAdmissionClasses = () => {
  return useQuery({
    queryKey: ["admission-classes"],
    queryFn: admissionService.getPublicClasses,
  });
};

export const useAdmission = (id: string) => {
  return useQuery({
    queryKey: ["admissions", id],
    queryFn: () => admissionService.getById(id),
    enabled: !!id,
  });
};

export const useCreateAdmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdmissionPayload) =>
      admissionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      toast.success("Admission application জমা হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useUpdateAdmissionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdmissionStatus }) =>
      admissionService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      toast.success("Status update হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};

export const useDeleteAdmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => admissionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      toast.success("Admission delete হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed!");
    },
  });
};