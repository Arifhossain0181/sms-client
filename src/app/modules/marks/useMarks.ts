import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marksService } from "./marks.service";
import { TeacherExam, TeacherMarksResponse, SubmitExamMarksPayload } from "./marks.types";
import { toast } from "sonner";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export const useTeacherExams = () => {
  return useQuery<TeacherExam[]>({
    queryKey: ["teacher-exams"],
    queryFn: marksService.getTeacherExams,
  });
};

export const useTeacherMarksForExam = (examId: string | undefined) => {
  return useQuery<TeacherMarksResponse>({
    queryKey: ["teacher-marks", examId],
    queryFn: () => marksService.getTeacherMarksForExam(examId!),
    enabled: !!examId,
  });
};

export const useStudentsForExam = (examId: string | undefined) => {
  return useQuery<TeacherMarksResponse>({
    queryKey: ["teacher-students-for-exam", examId],
    queryFn: () => marksService.getStudentsForExam(examId!),
    enabled: !!examId,
  });
};

export const useSubmitExamMarks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, payload }: { examId: string; payload: SubmitExamMarksPayload }) =>
      marksService.submitExamMarks(examId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-marks"], exact: false });
      toast.success("Marks submitted successfully!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to submit marks"));
    },
  });
};
