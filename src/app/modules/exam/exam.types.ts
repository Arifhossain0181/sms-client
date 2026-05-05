export interface Exam {
  id: string;
  name: string;
  subject?: {
    id: string;
    name: string;
  };
  subjectId: string;
  class?: {
    id: string;
    name: string;
  };
  classId: string;
  date: string;
  totalMarks: number;
  createdAt: string;
}

export interface CreateExamPayload {
  name: string;
  subjectId: string;
  classId: string;
  date: string;
  totalMarks: number;
}