import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classService } from "./class.service";
import { Class, CreateClassPayload } from "./class.types";
import { toast } from "sonner";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export const useClasses = () => {
  return useQuery<Class[]>({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });
};

export const useClass = (id: string) => {
  return useQuery<Class>({
    queryKey: ["classes", id],
    queryFn: () => classService.getById(id),
    enabled: !!id,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassPayload) => classService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class add হয়েছে!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed!"));
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateClassPayload> }) =>
      classService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class update হয়েছে!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed!"));
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class delete হয়েছে!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed!"));
    },
  });
};