import { z } from "zod"
import type { Role } from "@/tyPes/auth.tyPes"

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export const registerSchema = z.object({
    username: z.string().min(3, { message: "Username must be at least 3 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    role: z.enum(["SUPER_ADMIN", "SCHOOL_ADMIN", "ACCOUNTANT", "LIBRARIAN", "TEACHER", "STUDENT", "PARENT", "RECEPTIONIST", "EXAM_CONTROLLER", "HR"], { message: "Invalid role" }),
})
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
