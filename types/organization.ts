import { BaseEntity } from "./api";

// =============================================================
// Organization Interfaces - khớp với com.mkwang.backend.modules.organization.entity.*
// =============================================================

/** khớp với organization.entity.Department */
export interface Department extends BaseEntity {
  id: number;
  name: string;
  code: string;
  managerId: number | null;
  managerName: string | null;
  totalProjectQuota: number;
  totalAvailableBalance: number;
}
