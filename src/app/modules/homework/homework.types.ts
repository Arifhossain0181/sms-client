export type HomeworkStatusFilter = "ALL" | "PENDING" | "REVIEWED" | "OVERDUE";

export interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isReviewed: boolean;
  isOverdue: boolean;
  createdAt: string;
  section: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string;
    employeeId: string;
    user: {
      name: string;
    };
  };
  viewedCount?: number;
  totalStudents?: number;
}

export interface CreateHomeworkPayload {
  sectionId: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
}

export interface UpdateHomeworkPayload {
  title?: string;
  description?: string;
  dueDate?: string;
}

export interface HomeworkListResponse {
  data: Homework[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EvaluationDetails {
  homework: Homework;
  students: {
    id: string;
    name: string;
    rollNumber: number;
    hasViewed: boolean;
    viewedAt: string | null;
  }[];
  stats: {
    totalStudents: number;
    viewedCount: number;
    notViewedCount: number;
    viewPercentage: number;
  };
}
