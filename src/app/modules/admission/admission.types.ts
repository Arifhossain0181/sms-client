export type AdmissionStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CASH" | "STRIPE";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type BloodGroup =
  | "A_POS"
  | "A_NEG"
  | "B_POS"
  | "B_NEG"
  | "O_POS"
  | "O_NEG"
  | "AB_POS"
  | "AB_NEG";

export interface Admission {
  id: string;
  applicantName: string;
  studentEmail: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  religion?: string;
  bloodGroup?: BloodGroup;
  address: string;
  gender: Gender;
  dob: string;
  targetClassId: string;
  targetClass?: {
    id: string;
    name: string;
    numericLevel: number;
  };
  photoUrl?: string;
  birthCertUrl?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentAmount?: number;
  transactionId?: string;
  paymentDate?: string;
  status: AdmissionStatus;
  rejectionReason?: string; // present on backend model, was missing here
  reviewedAt?: string; // lets the UI show when a decision was made
  studentId?: string; // set once APPROVED and converted — used to gate re-approval
  createdAt: string;
}

export interface CreateAdmissionPayload {
  applicantName: string;
  studentEmail: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  address: string;
  gender: Gender;
  dob: string;
  targetClassId: string;
  bloodGroup?: BloodGroup;
  religion?: string;
  photoUrl?: string;
  birthCertUrl?: string;
  paymentMethod?: PaymentMethod;
  paymentAmount?: number;
  transactionId?: string;
}

export interface UpdateAdmissionStatusPayload {
  status: AdmissionStatus;
  rejectionReason?: string; // required in practice when status is REJECTED
}

export interface AdmissionQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdmissionStatus;
  classId?: string;
}

export interface AdmissionListResponse {
  data: Admission[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface AdmissionClassOption {
  id: string;
  name: string;
  numericLevel: number;
}