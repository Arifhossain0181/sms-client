export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: "MALE" | "FEMALE" | string;
  dateOfBirth: string;
  subject?: string;
  subjectId: string;
  createdAt: string;
  joiningDate?: string;
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