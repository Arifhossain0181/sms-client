export type FeeStatus = "PAID" | "UNPAID" | "PARTIAL";

export interface Fee {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    rollNumber?: string;
    class?: {
      id: string;
      name: string;
    };
  };
  feeType: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  month: string;
  status: FeeStatus;
  payments?: { id: string; amount: number; method: string; status: string; paidAt?: string; transactionId?: string; createdAt: string }[];
  createdAt: string;
}

export interface CreateFeePayload {
  studentId?: string;
  classId: string;
  title: string;
  type: "TUITION" | "ADMISSION" | "EXAM";
  amount: number;
  dueDate: string;
}

export interface PayFeePayload {
  amountPaid: number;
  method: "STRIPE" | "CASH";
  transactionId?: string;
  note?: string;
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

export interface FeeSummaryResponse {
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
  pendingCount: number;
  overdueCount: number;
  overDue: number;
}

export interface CollectionReportResponse {
  month: string;
  totalCollected: number;
  totalTransactions: number;
  byType: Record<string, number>;
  byMethod: Record<string, number>;
}

export interface OverdueFeeResponse {
  id: string;
  feeType: string;
  amount: number;
  Paidamount: number;
  dueDate: string;
  student: {
    user: { name: string };
    rollNumber: string;
  };
}

export interface OverdueReportResponse {
  data: OverdueFeeResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface TransactionResponse {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  note?: string;
  paidAt: string;
  createdAt: string;
  student: { user: { name: string; email: string } };
  feeStructure: { feeType: string; title: string; amount: number };
}

export interface TransactionsResponse {
  data: TransactionResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface MonthlyAnalyticsResponse {
  year: number;
  byMonth: { month: number; total: number; count: number }[];
  byMethod: Record<string, number>;
  byType: Record<string, { amount: number; paid: number }>;
}

export interface BulkCreatePayload {
  classId: string;
  type: "TUITION" | "ADMISSION" | "EXAM";
  title: string;
  amount: number;
  dueDate: string;
}