import { toast } from "sonner"
import { CreateStudentPayload } from "./student.types"
import { studentService } from "./student.service"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export const useStudents = () => {
    const { role } = useAuth();
    
    // Only fetch if user is ADMIN or TEACHER
    const isAllowedRole = role === 'SCHOOL_ADMIN' || role === 'TEACHER' || role === 'HR';
    
    return useQuery({
        queryKey : ["students"],
        queryFn : studentService.getAll,
        enabled: isAllowedRole, // Don't fetch if not authorized
        retry: false // Don't retry on 403 errors
    })
}

export const useStudent = (id: string) => {
    return useQuery({
        queryKey : ["students", id],
        queryFn : () => studentService.getById(id),
        enabled:!!id
    })
}
const getErrorMessage = (err: unknown, fallback: string) => {
    if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) return response.data.message;
    }
    if (err instanceof Error && err.message) return err.message;
    console.error("Full error:", err);
    return fallback;
};

export const useCreateStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:(data :CreateStudentPayload) => {
            console.log("Creating student with data:", data);
            return studentService.create(data);
        },
        onSuccess:() => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast.success("Student created successfully")
        },
        onError:(err: unknown) => {
            console.error("Student creation error:", err);
            toast.error(getErrorMessage(err, "Failed to create student"))
        }
    })

}

export const useUpdateStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:({id, data} : {id: string, data: CreateStudentPayload}) => studentService.update(id, data),
        onSuccess:() => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast.success("Student updated successfully")
        },
        onError:(err: unknown) => {
            toast.error(getErrorMessage(err, "Failed to update student"))
        }
    })
}

export const useDeleteStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:(id: string) => studentService.delete(id),
        onSuccess:() => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast.success("Student deleted successfully")
        },
        onError:(err: unknown) => {
            toast.error(getErrorMessage(err, "Failed to delete student"))
        }
    })


}