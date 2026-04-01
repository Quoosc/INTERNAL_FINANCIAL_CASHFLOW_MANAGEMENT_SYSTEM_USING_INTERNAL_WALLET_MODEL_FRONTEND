// =============================================================
// Organization Types - khớp với backend API_Spec.md v2.0
// =============================================================

/**
 * GET /admin/departments — response item (danh sách)
 */
export interface DepartmentListItem {
  id: number;
  name: string;
  code: string;
  manager: {
    id: number;
    fullName: string;
  } | null;
  employeeCount: number;
  totalProjectQuota: number;
  totalAvailableBalance: number;
  createdAt: string;
}

/**
 * GET /admin/departments/:id — response (chi tiết)
 */
export interface DepartmentDetailResponse {
  id: number;
  name: string;
  code: string;
  manager: {
    id: number;
    fullName: string;
  } | null;
  totalProjectQuota: number;
  totalAvailableBalance: number;
  members: DepartmentMemberItem[];
  createdAt: string;
  updatedAt: string;
}

/** Member item trong department detail response */
export interface DepartmentMemberItem {
  id: number;
  fullName: string;
  employeeCode: string;
  email: string;
  jobTitle: string | null;
  avatar: string | null;
  status: string;
}

// --- Request DTOs ---

/** POST /admin/departments — body */
export interface CreateDepartmentBody {
  name: string;
  code?: string;           // optional, auto-generate nếu không truyền
  managerId?: number;
  totalProjectQuota?: number;
}

/** PUT /admin/departments/:id — body */
export interface UpdateDepartmentBody {
  name?: string;
  managerId?: number;
  totalProjectQuota?: number;
}
