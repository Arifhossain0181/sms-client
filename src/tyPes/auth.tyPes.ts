export type Role = "ADMIN" | "TEACHER" | "STUDENT";

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
