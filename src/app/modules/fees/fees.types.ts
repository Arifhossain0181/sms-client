export type FeeStatus = "PAID" | "UNPAID" | "PARTIAL";

export interface Fee {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    class?: {
      id: string;
      name: string;
    };
  };
  amount: number;
  paidAmount: number;
  dueAmount: number;
  month: string;
  status: FeeStatus;
  createdAt: string;
}

export interface CreateFeePayload {
  studentId: string;
  classId: string;
  title: string;
  type: "TUITION" | "ADMISSION" | "EXAM";
  amount: number;
  dueDate: string;
}

export interface PayFeePayload {
  paidAmount: number;
}

export interface CashPaymentPayload {
  studentId: string;
  type: "TUITION" | "ADMISSION" | "EXAM";
  amountPaid: number;
  dueDate?: string;
  transactionId?: string;
  note?: string;
}

export interface Invoice {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  year: number;
  month: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
  transactionId?: string;
  note?: string;
}

export interface CashPaymentResponse {
  fee: Fee;
  invoice: Invoice;
  payment: Payment;
}