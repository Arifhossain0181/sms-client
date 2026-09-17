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

  nationalId?: string;
  birthCertificateNo?: string;
  religion?: string;
  maritalStatus?: string;
  nationality?: string;
  fatherName?: string;
  motherName?: string;
  employmentType?: string;
  presentAddress?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  photoUrl?: string;
  cvUrl?: string;
  nidUrl?: string;
  birthCertUrl?: string;
  sscCertUrl?: string;
  hscCertUrl?: string;
  bscCertUrl?: string;
  mscCertUrl?: string;
  institution?: string;
  passingYear?: string;
  result?: string;
  previousOrganization?: string;
  previousDesignation?: string;
  convertedToTeacherId?: string;

  status: TeachingApplicationStatus;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface UpdateTeachingApplicationStatusPayload {
  status: TeachingApplicationStatus;
  rejectionReason?: string;
}
