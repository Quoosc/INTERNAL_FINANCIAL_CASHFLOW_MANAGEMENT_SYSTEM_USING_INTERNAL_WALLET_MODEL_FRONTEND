// =============================================================
// Accounting Types - khớp với backend API_Spec.md v2.0
// =============================================================

// --- Enums ---

/** khớp với accounting.entity.PayrollStatus */
export enum PayrollStatus {
  DRAFT = "DRAFT",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
}

/** khớp với accounting.entity.PayslipStatus */
export enum PayslipStatus {
  DRAFT = "DRAFT",
  PAID = "PAID",
}

// --- Employee Payslip DTOs ---

/** GET /payslips — response item (Employee view) */
export interface PayslipListItem {
  id: number;
  payslipCode: string;
  periodId: number;
  periodName: string;
  month: number;
  year: number;
  status: PayslipStatus;
  finalNetSalary: number;
}

/** GET /payslips/:id — response (Employee payslip detail) */
export interface PayslipDetailResponse {
  id: number;
  payslipCode: string;
  periodId: number;
  periodName: string;
  month: number;
  year: number;
  status: PayslipStatus;
  baseSalary: number;
  bonus: number;
  allowance: number;
  totalEarnings: number;       // computed: baseSalary + bonus + allowance
  deduction: number;
  advanceDeduct: number;
  totalDeduction: number;      // computed: deduction + advanceDeduct
  finalNetSalary: number;
  employee: {
    id: number;
    fullName: string;
    employeeCode: string;
    departmentName: string;
    jobTitle: string;
    bankName: string;
    bankAccountNum: string;    // masked: ****6789
  };
}

// --- Accountant Payroll DTOs ---

/** GET /accountant/payroll — response item (danh sách kỳ lương) */
export interface PayrollPeriodListItem {
  id: number;
  periodCode: string;
  name: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  status: PayrollStatus;
  employeeCount: number;
  totalNetPayroll: number;
  createdAt: string;
  updatedAt: string;
}

/** Entry trong bảng lương (payslip trong payroll detail) */
export interface PayrollEntry {
  id: number;
  payslipCode: string;
  userId: number;
  fullName: string;
  avatar: string | null;
  employeeCode: string;
  jobTitle: string | null;
  baseSalary: number;
  bonus: number;
  allowance: number;
  deduction: number;
  advanceDeduct: number;
  finalNetSalary: number;
  status: PayslipStatus;
}

/** GET /accountant/payroll/:periodId — response (chi tiết bảng lương) */
export interface PayrollDetailResponse {
  id: number;
  periodCode: string;
  name: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  status: PayrollStatus;
  employeeCount: number;
  totalNetPayroll: number;
  entries: PayrollEntry[];
  createdAt: string;
  updatedAt: string;
}

/** POST /accountant/payroll/:periodId/import — response */
export interface PayrollImportResponse {
  periodId: number;
  periodCode: string;
  status: PayrollStatus;
  totalRows: number;
  successCount: number;
  errorCount: number;
  entries: PayrollImportEntry[];
  errors: PayrollImportError[];
  totalNetPayroll: number;
}

export interface PayrollImportEntry extends PayrollEntry {
  importStatus: "ok" | "error";
  importError: string | null;
}

export interface PayrollImportError {
  row: number;
  field: string;
  message: string;
}

/** POST /accountant/payroll/:periodId/auto-netting — response */
export interface AutoNettingResponse {
  periodId: number;
  periodCode: string;
  totalAdvanceDeducted: number;
  summary: AutoNettingSummaryItem[];
}

export interface AutoNettingSummaryItem {
  userId: number;
  employeeCode: string;
  fullName: string;
  outstandingDebt: number;
  deductedAmount: number;
  remainingDebt: number;
  note: string;
}

/** POST /accountant/payroll/:periodId/run — response */
export interface PayrollRunResponse {
  periodId: number;
  periodCode: string;
  status: PayrollStatus;
  payslipsGenerated: number;
  totalNetPayroll: number;
}

// --- Request DTOs ---

/** POST /accountant/payroll — body */
export interface CreatePayrollPeriodBody {
  name: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
}

/** PUT /accountant/payroll/:periodId/entries/:payslipId — body */
export interface UpdatePayslipEntryBody {
  baseSalary?: number;
  bonus?: number;
  allowance?: number;
  deduction?: number;
  advanceDeduct?: number;
}

// --- System Fund ---

/** accounting.entity.SystemFund */
export interface SystemFund {
  id: number;
  totalBalance: number;
  bankAccount: string | null;
  bankName: string | null;
}

// --- Ledger DTOs ---

/** GET /accountant/ledger/summary — response */
export interface LedgerSummaryResponse {
  currentBalance: number;
  totalInflow: number;
  totalOutflow: number;
  transactionCount: number;
}
