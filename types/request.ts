import { BaseEntity } from "./api";

// =============================================================
// Request Enums - khớp với com.mkwang.backend.modules.request.entity.*
// =============================================================

/** khớp với request.entity.RequestType */
export enum RequestType {
  ADVANCE = "ADVANCE",         // Tạm ứng
  EXPENSE = "EXPENSE",         // Thanh toán chi phí
  REIMBURSE = "REIMBURSE",     // Hoàn ứng
  QUOTA_TOPUP = "QUOTA_TOPUP", // Xin cấp vốn
}

/** khớp với request.entity.RequestStatus */
export enum RequestStatus {
  PENDING_MANAGER = "PENDING_MANAGER",
  PENDING_ADMIN = "PENDING_ADMIN",
  APPROVED = "APPROVED",
  PAID = "PAID",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

/** khớp với request.entity.RequestAction */
export enum RequestAction {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  ESCALATE = "ESCALATE",
}

/** khớp với request.entity.RequestHistoryStatus */
export enum RequestHistoryStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELED = "CANCELED",
}

// =============================================================
// Request Interfaces - khớp với com.mkwang.backend.modules.request.entity.*
// =============================================================

/** khớp với request.entity.RequestAttachment */
export interface RequestAttachment {
  requestId: number;
  fileId: number;
  fileName: string;
  fileUrl: string;
}

/** khớp với request.entity.RequestHistory */
export interface RequestHistory extends BaseEntity {
  id: number;
  requestId: number;
  actorId: number;
  actorName: string;
  action: RequestAction;
  statusAfterAction: RequestHistoryStatus;
  comment: string | null;
}

/** khớp với request.entity.Request */
export interface Request extends BaseEntity {
  id: number;
  requestCode: string;
  requesterId: number;
  requesterName: string;
  projectId: number;
  projectName: string;
  phaseId: number;
  phaseName: string;
  type: RequestType;
  amount: number;
  approvedAmount: number | null;
  status: RequestStatus;
  rejectReason: string | null;
  description: string | null;
  attachments: RequestAttachment[];
  histories: RequestHistory[];
}
