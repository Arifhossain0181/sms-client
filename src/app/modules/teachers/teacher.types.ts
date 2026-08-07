export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | string;
  dateOfBirth?: string;
  subjectSpecialization?: string;
  joiningDate?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  experience?: number;
  address?: string;
  bloodGroup?: string;
  salary?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  subjectAssignments?: { id: string; subjectId: string; subject: { id: string; name: string; code: string; fullMarks: number; passMarks: number; isCompulsory: boolean; class: { id: string; name: string } } }[];
  sectionTeacher?: { id: string; class: { id: string; name: string } }[];
  classes?: string[];
  subject?: string;
  subjectId?: string;
  role?: string;
}

export interface CreateTeacherPayload {
  name: string;
  email: string;
  password?: string;
  TeachersId?: string;
  designation: string;
  department?: string;
  qualification: string;
  experience: number;
  phone: string;
  address: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  dateOfJoining: string;
  bloodGroup?: string;
  salary?: number;
  avatarUrl?: string;
  subjectId?: string;
}