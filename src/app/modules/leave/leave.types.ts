export interface LeaveRequest {
  id: string;
  staffId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  staffId: string;
  leaveType: LeaveType;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
}

export interface MyLeaveResponse {
  leaves: LeaveRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'PATERNITY';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreateLeavePayload {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}
