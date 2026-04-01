// =============================================================
// Request Types - khớp với backend API_Spec.md v2.0
// Kiến trúc: 3 Flows, 5 Roles, NO Escalation
// =============================================================

// --- Enums ---

/**
 * khớp với request.entity.RequestType — 5 giá trị
 *
 * Flow 1: ADVANCE, EXPENSE, REIMBURSE → Employee → TL approve → Accountant payout
 * Flow 2: PROJECT_TOPUP → TL → Manager approve → auto PAID
 * Flow 3: QUOTA_TOPUP → Manager → Admin approve → auto PAID
 */
export enum RequestType {
  ADVANCE = "ADVANCE",
  EXPENSE = "EXPENSE",
  REIMBURSE = "REIMBURSE",
  PROJECT_TOPUP = "PROJECT_TOPUP",
  QUOTA_TOPUP = "QUOTA_TOPUP",
}

/**
 * khớp với request.entity.RequestStatus — 6 giá trị
 *
 * PENDING_APPROVAL: chờ 1 cấp duyệt duy nhất (TL/Manager/Admin tùy type)
 * KHÔNG có PENDING_MANAGER / PENDING_ADMIN
 */
export enum RequestStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  PENDING_ACCOUNTANT = "PENDING_ACCOUNTANT",
  APPROVED = "APPROVED",
  PAID = "PAID",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

/**
 * khớp với request.entity.RequestAction — 4 giá trị
 * KHÔNG có ESCALATE
 */
export enum RequestAction {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  PAYOUT = "PAYOUT",
  CANCEL = "CANCEL",
}

// --- Common Response DTOs ---

/** File attachment trong request response */
export interface RequestAttachmentResponse {
  fileId: number;
  fileName: string;
  cloudinaryPublicId?: string;
  url: string;                      // Signed URL Cloudinary (15 min)
  fileType: string;
  size: number;
}

/** Một dòng trong timeline (lịch sử duyệt) */
export interface RequestTimelineEntry {
  id: number;
  action: RequestAction;
  statusAfterAction: RequestStatus;
  actorId: number;
  actorName: string;
  comment: string | null;
  createdAt: string;
}

// --- Employee Request DTOs ---

/**
 * GET /requests — response item (danh sách request của employee)
 */
export interface RequestListItem {
  id: number;
  requestCode: string;
  type: RequestType;
  status: RequestStatus;
  amount: number;
  approvedAmount: number | null;
  description: string | null;
  rejectReason: string | null;
  projectId: number | null;
  projectName: string | null;
  phaseId: number | null;
  phaseName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /requests/:id — response (chi tiết request)
 */
export interface RequestDetailResponse extends RequestListItem {
  projectCode: string | null;
  phaseCode: string | null;
  requesterId: number;
  requesterName: string;
  attachments: RequestAttachmentResponse[];
  timeline: RequestTimelineEntry[];
}

/**
 * GET /requests/summary — response
 */
export interface RequestSummaryResponse {
  totalPendingApproval: number;
  totalPendingAccountant: number;
  totalApproved: number;
  totalRejected: number;
  totalPaid: number;
  totalCancelled: number;
}

// --- Employee Request Body DTOs ---

/**
 * POST /requests — body
 *
 * Flow 1 (ADVANCE/EXPENSE/REIMBURSE): projectId + phaseId + categoryId bắt buộc
 * Flow 2 (PROJECT_TOPUP): projectId bắt buộc, phaseId/categoryId = null
 * Flow 3 (QUOTA_TOPUP): projectId/phaseId/categoryId = null
 */
export interface CreateRequestBody {
  type: RequestType;
  projectId?: number;
  phaseId?: number;
  categoryId?: number;
  amount: number;
  description: string;
  attachmentFileIds?: number[];    // file_storages.id
}

/** PUT /requests/:id — body (chỉ khi PENDING_APPROVAL) */
export interface UpdateRequestBody {
  amount?: number;
  description?: string;
  attachmentFileIds?: number[];
}

// --- Employee Request Filter Params ---

/** GET /requests — query params */
export interface RequestFilterParams {
  type?: RequestType;
  status?: RequestStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// --- WebSocket Payloads ---

/** /user/queue/requests — message payload */
export interface RequestStatusUpdateMessage {
  type: "REQUEST_STATUS_CHANGED";
  data: {
    id: number;
    requestCode: string;
    previousStatus: RequestStatus;
    newStatus: RequestStatus;
    approvedAmount: number | null;
    rejectReason: string | null;
    actor: {
      id: number;
      fullName: string;
      role: string;
    };
    comment: string | null;
    updatedAt: string;
  };
  timestamp: string;
}
