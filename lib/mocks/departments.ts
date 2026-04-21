import { AdminUserListItem, DepartmentListItem } from "@/types";

// TODO: Remove when Sprint 2 API is ready
export const MOCK_DEPARTMENTS: DepartmentListItem[] = [
  {
    id: 1,
    name: "Phòng CNTT",
    code: "IT",
    manager: { id: 5, fullName: "Trần Thị Bích" },
    employeeCount: 20,
    totalProjectQuota: 800_000_000,
    totalAvailableBalance: 524_500_000,
    createdAt: "2026-01-01T08:00:00",
  },
  {
    id: 2,
    name: "Phòng Kinh doanh",
    code: "SALES",
    manager: { id: 6, fullName: "Nguyễn Văn Tùng" },
    employeeCount: 15,
    totalProjectQuota: 500_000_000,
    totalAvailableBalance: 230_000_000,
    createdAt: "2026-01-01T08:00:00",
  },
  {
    id: 3,
    name: "Phòng Tài chính",
    code: "FIN",
    manager: { id: 7, fullName: "Phạm Hoài Nam" },
    employeeCount: 10,
    totalProjectQuota: 450_000_000,
    totalAvailableBalance: 190_000_000,
    createdAt: "2026-01-01T08:00:00",
  },
];

// TODO: Remove when Sprint 2 API is ready
export const MOCK_MANAGERS: AdminUserListItem[] = [
  {
    id: 5,
    fullName: "Trần Thị Bích",
    email: "manager.it@ifms.vn",
    employeeCode: "MGR001",
    role: "MANAGER",
    departmentId: 1,
    departmentName: "Phòng CNTT",
    jobTitle: "Manager IT",
    avatar: null,
    debtBalance: 0,
    status: "ACTIVE",
    createdAt: "2026-01-02T08:00:00",
  },
  {
    id: 6,
    fullName: "Nguyễn Văn Tùng",
    email: "manager.sales@ifms.vn",
    employeeCode: "MGR002",
    role: "MANAGER",
    departmentId: 2,
    departmentName: "Phòng Kinh doanh",
    jobTitle: "Manager Sales",
    avatar: null,
    debtBalance: 0,
    status: "ACTIVE",
    createdAt: "2026-01-02T08:00:00",
  },
];
