export type NoticeTarget = "ALL" | "TEACHER" | "STUDENT";

export interface Notice {
  id: string;
  title: string;
  content: string;
  target: NoticeTarget;
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface CreateNoticePayload {
  title: string;
  content: string;
  target: NoticeTarget;
}