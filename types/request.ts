import { BaseEntity } from "./api";

// =============================================================
// Request Enums - khớp với com.mkwang.backend.modules.request.entity.*
// =============================================================

/** khớp với request.entity.RequestType */
export enum RequestType {
  ADVANCE = "ADVANCE",             // Tạm ứng (Member xin tiền cất vào ví)
  EXPENSE = "EXPENSE",             // Thanh toán chi phí (Member xin tiền thanh toán cho NCC)
  REIMBURSE = "REIMBURSE",         // Hoàn ứng (Member nộp hóa đơn cấn trừ nợ Tạm ứng)
  PROJECT_TOPUP = "PROJECT_TOPUP", // Xin cấp vốn Dự án (Team Leader → Manager)
  QUOTA_TOPUP = "QUOTA_TOPUP",     // Xin cấp vốn Phòng ban (Manager → Admin)
}

/**
 * khớp với request.entity.RequestStatus
 *
 * NO ESCALATION — mỗi flow chỉ có DUY NHẤT 1 cấp duyệt.
 * PENDING_APPROVAL là status chung — approver xác định bởi request.type.
 */
export enum RequestStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",       // Chờ 1 cấp duyệt duy nhất (TL/Manager/Admin tùy type)
  PENDING_ACCOUNTANT = "PENDING_ACCOUNTANT",   // Chỉ Flow 1 — chờ KT kiểm tra chứng từ & giải ngân
  APPROVED = "APPROVED",                       // Đã duyệt nghiệp vụ (Flow 2&3 auto → PAID)
  PAID = "PAID",                               // Đã giải ngân / đã cấp vốn xong
  REJECTED = "REJECTED",                       // Bị từ chối
  CANCELLED = "CANCELLED",                     // Người tạo tự hủy (chỉ khi PENDING_APPROVAL)
}

/** khớp với request.entity.RequestAction — KHÔNG còn ESCALATE */
export enum RequestAction {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
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
