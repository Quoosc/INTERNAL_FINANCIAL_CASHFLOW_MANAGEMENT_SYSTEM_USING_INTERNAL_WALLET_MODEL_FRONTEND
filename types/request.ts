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
 * Flow 3: DEPARTMENT_TOPUP → Manager → CFO approve → auto PAID
 */
export enum RequestType {
  ADVANCE = "ADVANCE",
  EXPENSE = "EXPENSE",
  REIMBURSE = "REIMBURSE",
  PROJECT_TOPUP = "PROJECT_TOPUP",
  DEPARTMENT_TOPUP = "DEPARTMENT_TOPUP",
}

/**
 * khớp với request.entity.RequestStatus — 8 giá trị
 *
 * Flow 1 (ADVANCE/EXPENSE/REIMBURSE):
 *   PENDING → APPROVED_BY_TEAM_LEADER → PENDING_ACCOUNTANT_EXECUTION → PAID
 *
 * Flow 2 (PROJECT_TOPUP):
 *   PENDING → APPROVED_BY_MANAGER → PAID (auto)
 *
 * Flow 3 (DEPARTMENT_TOPUP):
 *   PENDING → APPROVED_BY_CFO → PAID (auto)
 */
export enum RequestStatus {
  PENDING = "PENDING",
  APPROVED_BY_TEAM_LEADER = "APPROVED_BY_TEAM_LEADER",
  PENDING_ACCOUNTANT_EXECUTION = "PENDING_ACCOUNTANT_EXECUTION",
  APPROVED_BY_MANAGER = "APPROVED_BY_MANAGER",
  APPROVED_BY_CFO = "APPROVED_BY_CFO",
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
 * Flow 3 (DEPARTMENT_TOPUP): projectId/phaseId/categoryId = null
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

/** PUT /requests/:id — body (chỉ khi PENDING) */
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

// --- No realtime channel for request status ---
// Backend SSE không emit event riêng cho REQUEST_STATUS_CHANGED.
// Sau action approve / reject / disburse / cancel, caller phải tự refetch list/detail.
// Xem docs/API_CONTRACT.md §15.
