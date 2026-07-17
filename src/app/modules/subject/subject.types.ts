export interface Subject {
  id: string;
  name: string;
  code: string;
  classId: string;
  fullMarks: number;
  passMarks: number;
  isCompulsory: boolean;
  class?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface CreateSubjectPayload {
  name: string;
  code: string;
  classId: string;
  fullMarks: number;
  passMarks: number;
  isCompulsory?: boolean; // same field as Subject.isCompulsory — no more isOptional/isCompulsory mismatch
}

export interface SubjectQuery {
  classId?: string;
}