export interface Student {
  id: string;
  name: string;
  email?: string;
  guardianEmail?: string;
  phone?: string | null;
  address: string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth: string;
  rollNumber?: string;
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
  isActive?: boolean;
}

export interface CreateStudentPayload {
  name: string;
  email?: string; // Optional for admin mode, required for student self-registration
  password?: string;
  phone: string;
  address: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  rollNumber: string;
  classId: string;
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianRelation: string;
}