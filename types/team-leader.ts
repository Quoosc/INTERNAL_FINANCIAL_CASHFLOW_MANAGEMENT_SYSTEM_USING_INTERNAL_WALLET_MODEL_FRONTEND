// =============================================================
// Team Leader Types - khớp với backend API_Spec.md v2.0
// Endpoints prefix: /team-leader/*
// =============================================================

import type { RequestAttachmentResponse, RequestStatus, RequestType } from "./request";
import type { ProjectDetailResponse, ProjectPhaseResponse, ProjectRole } from "./project";

// --- TL Projects ---

/** GET /team-leader/projects — response item */
export interface TLProjectListItem {
  id: number;
  projectCode: string;
  name: string;
  status: string;
  totalBudget: number;
  availableBudget: number;
  totalSpent: number;
  memberCount: number;
  currentPhaseId: number | null;
  currentPhaseName: string | null;
  createdAt: string;
}

/** GET /team-leader/projects/:id — response (reuse ProjectDetailResponse) */
export type TLProjectDetailResponse = ProjectDetailResponse;

// --- TL Approvals (Flow 1) ---

/** Requester info trong approval cards */
export interface ApprovalRequester {
  id: number;
  fullName: string;
  avatar: string | null;
  employeeCode: string;
  jobTitle: string | null;
  email: string;
}

/** Project info trong approval cards */
export interface ApprovalProject {
  id: number;
  projectCode: string;
  name: string;
}

/** Phase info trong approval cards (có budget) */
export interface ApprovalPhase {
  id: number;
  phaseCode: string;
  name: string;
  budgetLimit: number;
  currentSpent: number;
}

/** Category info trong approval cards */
export interface ApprovalCategory {
  id: number;
  name: string;
}

/** GET /team-leader/approvals — response item */
export interface TLApprovalListItem {
  id: number;
  requestCode: string;
  type: RequestType;
  status: RequestStatus;
  amount: number;
  description: string | null;
  requester: ApprovalRequester;
  project: ApprovalProject;
  phase: ApprovalPhase;
  category: ApprovalCategory;
  attachments: RequestAttachmentResponse[];
  createdAt: string;
}

/** POST /team-leader/approvals/:id/approve — body */
export interface TLApproveBody {
  comment?: string;
  approvedAmount?: number;    // mặc định = amount nếu không gửi
}

/** POST /team-leader/approvals/:id/reject — body */
export interface TLRejectBody {
  reason: string;             // bắt buộc
}

/** POST /team-leader/approvals/:id/approve — response */
export interface TLApproveResponse {
  id: number;
  requestCode: string;
  status: "PENDING_ACCOUNTANT";
  approvedAmount: number;
  comment: string | null;
}

/** POST /team-leader/approvals/:id/reject — response */
export interface TLRejectResponse {
  id: number;
  requestCode: string;
  status: "REJECTED";
  rejectReason: string;
}

// --- TL Team Members ---

/** Project summary trong team member */
export interface TeamMemberProject {
  projectId: number;
  projectCode: string;
  projectName: string;
  position: string;
}

/** GET /team-leader/team-members — response item */
export interface TLTeamMemberListItem {
  id: number;
  fullName: string;
  email: string;
  employeeCode: string;
  avatar: string | null;
  jobTitle: string | null;
  status: string;
  debtBalance: number;
  pendingRequestsCount: number;
  projects: TeamMemberProject[];
}

/** Recent request summary trong team member detail */
export interface TeamMemberRecentRequest {
  id: number;
  requestCode: string;
  type: RequestType;
  amount: number;
  status: RequestStatus;
  projectCode: string;
  categoryName: string | null;
  createdAt: string;
}

/** GET /team-leader/team-members/:userId — response */
export interface TLTeamMemberDetailResponse {
  id: number;
  fullName: string;
  email: string;
  employeeCode: string;
  avatar: string | null;
  jobTitle: string | null;
  phoneNumber: string | null;
  status: string;
  debtBalance: number;
  pendingRequestsCount: number;
  projects: (TeamMemberProject & { joinedAt: string })[];
  recentRequests: TeamMemberRecentRequest[];
}

// --- Filter Params ---

/** GET /team-leader/approvals — query params */
export interface TLApprovalFilterParams {
  type?: RequestType;
  projectId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

/** GET /team-leader/team-members — query params */
export interface TLTeamMemberFilterParams {
  projectId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

/** GET /team-leader/projects — query params */
export interface TLProjectFilterParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}
