export const ROLES = [
  "SUPER_ADMIN",
  "SCHOOL_ADMIN",
  "ACCOUNTANT",
  "TEACHER",
  "STUDENT",
  "PARENT",
  "EXAM_CONTROLLER",
  "HR",
] as const;

export type Role = typeof ROLES[number];

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
}
export interface LoginPayload{
    email: string;
    password: string;
}
export interface RegisterPayload{
    username: string;
    email: string;
    password: string;
    role: Role;
}
