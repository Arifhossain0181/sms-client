import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { teachingApplicationService } from "./teachingApplication.service";
import { UpdateTeachingApplicationPayload, UpdateTeachingApplicationStatusPayload } from "./teachingApplication.types";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export const useTeachingApplications = () => {
  return useQuery({
    queryKey: ["teaching-applications"],
    queryFn: teachingApplicationService.getAll,
  });
};

export const useUpdateTeachingApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeachingApplicationStatusPayload }) =>
      teachingApplicationService.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaching-applications"] });
      toast.success("Application updated");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update"));
    },
  });
};

export const useUpdateTeachingApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeachingApplicationPayload }) =>
      teachingApplicationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaching-applications"] });
      toast.success("Application updated");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to update application")),
  });
};

export const useDeleteTeachingApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teachingApplicationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaching-applications"] });
      toast.success("Application deleted");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to delete application")),
  });
};
