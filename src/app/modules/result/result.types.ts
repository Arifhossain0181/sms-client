export interface Result {
  id: string;
  examId: string;
  exam?: {
    id: string;
    name: string;
    totalMarks: number;
  };
  studentId: string;
  student?: {
    id: string;
    name: string;
  };
  marksObtained: number;
  grade: string;
  createdAt: string;
}

export interface CreateResultPayload {
  examId: string;
  studentId: string;
  marks: Array<{
    subjectId: string;
    marksObtained: number;
  }>;
}