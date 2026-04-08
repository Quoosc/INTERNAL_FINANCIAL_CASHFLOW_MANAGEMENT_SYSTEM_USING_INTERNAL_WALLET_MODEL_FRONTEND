// =============================================================
// Dashboard Types - khớp với backend API_Spec.md v2.0
// Endpoints: GET /dashboard/{role}
// =============================================================

// --- Employee Dashboard ---

/** GET /dashboard/employee — response */
export interface EmployeeDashboardResponse {
  wallet: {
    balance: number;
    lockedBalance: number;
    availableBalance: number;
    // Legacy fallback fields (for older mock data)
    pendingBalance?: number;
    debtBalance?: number;
  };
  pendingRequestsCount: number;
  recentTransactions: {
    id: number;
    transactionCode: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
  recentPayslip: {
    id: number;
    payslipCode: string;
    periodName: string;
    finalNetSalary: number;
    status: string;
  } | null;
}

// --- Manager Dashboard ---

/** GET /dashboard/manager — response */
export interface ManagerDashboardResponse {
  departmentBudget: {
    totalProjectQuota: number;
    totalAvailableBalance: number;
    totalSpent: number;
  };
  projectStatusSummary: {
    active: number;
    planning: number;
    paused: number;
    closed: number;
  };
  pendingApprovalsCount: number;
  teamDebtSummary: {
    totalDebt: number;
    employeesWithDebt: number;
  };
}

// --- Accountant Dashboard ---

/** GET /dashboard/accountant — response */
export interface AccountantDashboardResponse {
  systemFundBalance: number;
  pendingDisbursementsCount: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  payrollStatus: {
    latestPeriod: string | null;
    status: string | null;
  };
}

// --- Admin Dashboard ---

/** GET /dashboard/admin — response */
export interface AdminDashboardResponse {
  totalUsers: number;
  totalDepartments: number;
  totalWalletBalance: number;
  recentAuditEvents: {
    id: number;
    actorName: string | null;
    action: string;
    entityName: string;
    createdAt: string;
  }[];
}
