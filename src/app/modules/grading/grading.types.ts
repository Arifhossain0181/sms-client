export interface GradingRule {
  id: string;
  classId: string;
  academicYear: string | null;
  minMark: number;
  maxMark: number;
  grade: string;
  gpaPoint: number;
  isPassing: boolean;
  createdAt: string;
}

export interface CreateGradingRulePayload {
  classId: string;
  academicYear?: string;
  minMark: number;
  maxMark: number;
  grade: string;
  gpaPoint: number;
  isPassing?: boolean;
}

export interface UpdateGradingRulePayload {
  minMark?: number;
  maxMark?: number;
  grade?: string;
  gpaPoint?: number;
  isPassing?: boolean;
}

export interface BulkUpsertGradingRulesPayload {
  classId: string;
  academicYear?: string;
  rows: {
    minMark: number;
    maxMark: number;
    grade: string;
    gpaPoint: number;
    isPassing?: boolean;
  }[];
}
