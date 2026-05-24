export interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  address: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  sectionId?: string;
  section?: {
    id: string;
    name: string;
  };
  classId: string;
  class?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface CreateStudentPayload {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: "MALE" | "FEMALE";
  dateOfBirth?: string;
  classId?: string;
}