export type PerformanceRating = 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'POOR';

export interface PerformanceReview {
  id: string;
  staffId: string;
  reviewDate: string;
  rating: PerformanceRating;
  strengths?: string;
  areasToImprove?: string;
  comments?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: string;
    name: string;
    employeeId: string;
    designation?: string;
  };
}

export interface MyPerformanceResponse {
  reviews: PerformanceReview[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
