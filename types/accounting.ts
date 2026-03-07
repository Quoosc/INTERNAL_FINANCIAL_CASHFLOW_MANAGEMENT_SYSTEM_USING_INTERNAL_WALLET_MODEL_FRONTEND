import { BaseEntity } from "./api";

// =============================================================
// Accounting Enums - khớp với com.mkwang.backend.modules.accounting.entity.*
// =============================================================

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

// =============================================================
// Accounting Interfaces - khớp với com.mkwang.backend.modules.accounting.entity.*
// =============================================================

/** khớp với accounting.entity.Payslip */
export interface Payslip extends BaseEntity {
  id: number;
  payslipCode: string;
  periodId: number;
  userId: number;
  userName: string;
  baseSalary: number;
  bonus: number;
  allowance: number;
  deduction: number;
  advanceDeduct: number;
  finalNetSalary: number;
  status: PayslipStatus;
  paymentDate: string | null;
  grossSalary: number; // computed: baseSalary + bonus - deduction
}

/** khớp với accounting.entity.PayrollPeriod */
export interface PayrollPeriod extends BaseEntity {
  id: number;
  periodCode: string;
  name: string;
  month: number;
  year: number;
  startDate: string | null;
  endDate: string | null;
  status: PayrollStatus;
  payslips: Payslip[];
}

/** khớp với accounting.entity.SystemFund */
export interface SystemFund extends BaseEntity {
  id: number;
  totalBalance: number;
  bankAccount: string | null;
  bankName: string | null;
}
