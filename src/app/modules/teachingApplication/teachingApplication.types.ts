export type TeachingApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TeachingApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob: string;
  address: string;
  designation: string;
  department?: string;
  qualification: string;
  experience: number;
  subjectSpecialization?: string;
  expectedSalary?: number;
  resumeUrl?: string;
  coverLetter?: string;
  status: TeachingApplicationStatus;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface UpdateTeachingApplicationStatusPayload {
  status: TeachingApplicationStatus;
  rejectionReason?: string;
}
