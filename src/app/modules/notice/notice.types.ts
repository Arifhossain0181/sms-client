import { Role } from "../../../tyPes/auth.tyPes";

// same vocabulary as Role everywhere — no more audience<->target mapping
export type NoticeTarget = Role | "ALL";

export interface Notice {
  id: string;
  title: string;
  content: string;
  target: NoticeTarget;
  pinned: boolean; // req 3.2: pin important notices to the top
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
  pinned?: boolean;
}