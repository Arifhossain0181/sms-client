export type AdmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Admission {
  id: string;
  applicantName: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  religion?: string;
  bloodGroup?: "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "O_POS" | "O_NEG" | "AB_POS" | "AB_NEG";
  address: string;
  gender: "MALE" | "FEMALE";
  dob: string;
  targetClassId: string;
  targetClass?: {
    id: string;
    name: string;
    numericLevel: number;
  };
  photoUrl?: string;
  birthCertUrl?: string;
  paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod?: "CASH" | "STRIPE";
  paymentAmount?: number;
  transactionId?: string;
  paymentDate?: string;
  status: AdmissionStatus;
  createdAt: string;
}

export interface CreateAdmissionPayload {
  applicantName: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  address: string;
  gender: "MALE" | "FEMALE";
  dob: string;
  targetClassId: string;
}

export interface AdmissionClassOption {
  id: string;
  name: string;
  numericLevel: number;
}