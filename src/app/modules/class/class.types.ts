export interface Class {
  id: string;
  name: string;
  numericLevel: number;
  sections?: { id: string; name: string; maxCapacity: number }[];
  students?: { id: string; name: string }[];
  createdAt: string;
}

export interface CreateClassPayload {
  name: string;
  numericLevel: number;
}

export interface CreateSectionPayload {
  name: string;
  classId: string;
  maxCapacity?: number;
}