export interface Exam {
  id: string;
  name: string;
  type?: string;
  subject?: {
    id: string;
    name: string;
  };
  schedules?: {
    id: string;
    examDate: string;
    startTime: string;
    endTime: string;
    subject?: {
      id: string;
      name: string;
      fullMarks?: number;
    };
    class?: {
      id: string;
      name: string;
    };
  }[];
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