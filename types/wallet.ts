import { BaseEntity } from "./api";

// =============================================================
// Wallet Enums - khớp với com.mkwang.backend.modules.wallet.entity.*
// =============================================================

/** khớp với wallet.entity.PaymentProvider */
export enum PaymentProvider {
  PAYOS = "PAYOS",
  MOMO = "MOMO",
  VNPAY = "VNPAY",
  ZALOPAY = "ZALOPAY",
  INTERNAL_WALLET = "INTERNAL_WALLET",
}

/** khớp với wallet.entity.TransactionType */
export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAW = "WITHDRAW",
  REQUEST_PAYMENT = "REQUEST_PAYMENT",
  PAYSLIP_PAYMENT = "PAYSLIP_PAYMENT",
  SYSTEM_ADJUSTMENT = "SYSTEM_ADJUSTMENT",
}

/** khớp với wallet.entity.TransactionStatus */
export enum TransactionStatus {
  SUCCESS = "SUCCESS",
  PENDING = "PENDING",
  FAILED = "FAILED",
}

/** khớp với wallet.entity.ReferenceType */
export enum ReferenceType {
  REQUEST = "REQUEST",
  PAYSLIP = "PAYSLIP",
}

// =============================================================
// Wallet Interfaces - khớp với com.mkwang.backend.modules.wallet.entity.*
// =============================================================

/** khớp với wallet.entity.Wallet */
export interface Wallet extends BaseEntity {
  id: number;
  userId: number;
  balance: number; // Java BigDecimal -> number (sử dụng string nếu cần precision cao)
  pendingBalance: number;
  debtBalance: number;
  version: number; // Optimistic locking
  availableBalance: number; // computed: balance - pendingBalance
}

/** khớp với wallet.entity.Transaction */
export interface Transaction extends BaseEntity {
  id: number;
  transactionCode: string;
  paymentRef: string | null;
  gatewayProvider: PaymentProvider | null;
  walletId: number;
  amount: number;
  balanceAfter: number;
  type: TransactionType;
  status: TransactionStatus;
  referenceType: ReferenceType | null;
  referenceId: number | null;
  relatedTransactionId: number | null;
  actorId: number | null;
  description: string | null;
}
