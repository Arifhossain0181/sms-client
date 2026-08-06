export interface MarkEntry {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  marksObtained: number;
  status: string;
  rejectReason?: string | null;
  createdAt: string;
  student: {
    id: string;
    studentId?: string;
    name: string;
    rollNumber: string | number;
    section: {
      name: string;
      class: {
        id: string;
        name: string;
      };
    };
  };
  subject: {
    id: string;
    name: string;
    fullMarks: number;
    passMarks: number;
  };
  teacher?: {
    id: string;
    name: string;
  };
}

export interface TeacherExam {
  id: string;
  name: string;
  type: string;
  totalMarks?: number;
  schedules: Array<{
    id: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    examDate: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface TeacherMarksResponse {
  examId: string;
  teacherId: string;
  totalStudents: number;
  totalEntries: number;
  students: Array<{
    student: MarkEntry['student'];
    subjectMarks: Array<{
      subjectId: string;
      subjectName: string;
      marksObtained: number;
      fullMarks: number;
      passMarks: number;
      grade: string | null;
      gpa: number | null;
      status: string;
    }>;
  }>;
}

export interface SubmitMarkEntryDto {
  studentId: string;
  subjectId: string;
  marksObtained: number;
  teacherId?: string;
}

export interface SubmitExamMarksPayload {
  entries: SubmitMarkEntryDto[];
}
