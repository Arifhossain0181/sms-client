export interface Subject {
  id: string;
  name: string;
  code: string;
  classId: string;
  fullMarks?: number;
  passMarks?: number;
  isCompulsory?: boolean;
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
  isOptional?: boolean;
}