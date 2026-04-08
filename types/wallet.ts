// =============================================================
// Wallet Types - khớp với backend modules/wallet (v3.0)
// Cập nhật: WalletResponse, TransactionResponse đã đổi fields
//           Thêm WithdrawRequestResponse, LedgerEntryResponse
//           Các enum được đồng bộ với backend entity
// =============================================================

// --- Enums ---

/**
 * khớp với wallet.entity.PaymentProvider
 * Cập nhật: INTERNAL (chuyển nội bộ), MOCK_BANK (rút tiền qua MockBank)
 */
export enum PaymentProvider {
  VNPAY = "VNPAY",
  INTERNAL = "INTERNAL",
  MOCK_BANK = "MOCK_BANK",
}

/**
 * khớp với wallet.entity.TransactionType
 * Cập nhật: thêm SYSTEM_TOPUP, ADVANCE_RETURN, REVERSAL
 */
export enum TransactionType {
  // Deposit / Withdraw (User ↔ External)
  DEPOSIT = "DEPOSIT",
  WITHDRAW = "WITHDRAW",

  // Internal fund allocation
  SYSTEM_TOPUP = "SYSTEM_TOPUP",
  DEPT_QUOTA_ALLOCATION = "DEPT_QUOTA_ALLOCATION",
  PROJECT_QUOTA_ALLOCATION = "PROJECT_QUOTA_ALLOCATION",

  // Disbursement
  REQUEST_PAYMENT = "REQUEST_PAYMENT",
  PAYSLIP_PAYMENT = "PAYSLIP_PAYMENT",

  // Advance settlement
  ADVANCE_RETURN = "ADVANCE_RETURN",

  // Correction
  REVERSAL = "REVERSAL",
  SYSTEM_ADJUSTMENT = "SYSTEM_ADJUSTMENT",
}

/** khớp với wallet.entity.TransactionStatus */
export enum TransactionStatus {
  SUCCESS = "SUCCESS",
  PENDING = "PENDING",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

/** khớp với wallet.entity.TransactionDirection */
export enum TransactionDirection {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

/**
 * khớp với wallet.entity.ReferenceType
 * Cập nhật: thêm ADVANCE_BALANCE, WITHDRAWAL, DEPOSIT
 */
export enum ReferenceType {
  REQUEST = "REQUEST",
  PAYSLIP = "PAYSLIP",
  PROJECT = "PROJECT",
  DEPARTMENT = "DEPARTMENT",
  ADVANCE_BALANCE = "ADVANCE_BALANCE",
  SYSTEM = "SYSTEM",
  WITHDRAWAL = "WITHDRAWAL",
  DEPOSIT = "DEPOSIT",
}

/**
 * khớp với wallet.entity.WalletOwnerType
 * Cập nhật: SYSTEM_FUND → COMPANY_FUND, thêm FLOAT_MAIN
 */
export enum WalletOwnerType {
  USER = "USER",
  DEPARTMENT = "DEPARTMENT",
  PROJECT = "PROJECT",
  COMPANY_FUND = "COMPANY_FUND",
  FLOAT_MAIN = "FLOAT_MAIN",
}

/**
 * khớp với wallet.entity.WithdrawStatus
 * State machine:
 *   PENDING → PROCESSING → COMPLETED | FAILED
 *   PENDING → CANCELLED (user cancel)
 *   PENDING → REJECTED (accountant reject)
 */
export enum WithdrawStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

// --- Response DTOs (khớp backend DTO v3.0) ---

/**
 * WalletResponse — khớp wallet.dto.response.WalletResponse
 *
 * Breaking change từ v2.0:
 *   - pendingBalance → lockedBalance
 *   - debtBalance: REMOVED
 *   - version: REMOVED
 *   - Thêm: ownerType, ownerId, availableBalance
 */
export interface WalletResponse {
  id: number;
  ownerType: WalletOwnerType;
  ownerId: number;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
}

/**
 * TransactionResponse — khớp wallet.dto.response.TransactionResponse
 *
 * Đơn giản hóa so với v2.0:
 *   - REMOVED: balanceAfter, paymentRef, gatewayProvider, walletId, walletOwnerName, actorId, actorName, relatedTransactionId, updatedAt
 */
export interface TransactionResponse {
  id: number;
  transactionCode: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  referenceType: ReferenceType;
  referenceId: number;
  description: string;
  createdAt: string;
}

/**
 * LedgerEntryResponse — MỚI, khớp wallet.dto.response.LedgerEntryResponse
 * Dùng cho sao kê ví (ledger history)
 */
export interface LedgerEntryResponse {
  id: number;
  transactionCode: string;
  direction: TransactionDirection;
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

/**
 * WithdrawRequestResponse — MỚI, khớp wallet.dto.response.WithdrawRequestResponse
 * Trả về từ tất cả withdraw endpoints
 */
export interface WithdrawRequestResponse {
  id: number;
  withdrawCode: string;
  userId: number;
  amount: number;

  // Bank snapshot (lấy từ UserProfile lúc tạo)
  creditAccount: string;
  creditAccountName: string;
  creditBankCode: string;
  creditBankName: string;

  userNote: string | null;
  status: WithdrawStatus;

  // Filled after processing
  bankTransactionId: string | null;
  accountantNote: string | null;
  executedBy: number | null;
  executedAt: string | null;
  transactionId: number | null;
  failureReason: string | null;

  // Audit timestamps
  createdAt: string;
  updatedAt: string;
}

// --- Request DTOs ---

/**
 * POST /api/v1/withdrawals — body
 * Bank info tự động đọc từ UserProfile — KHÔNG cần truyền
 */
export interface CreateWithdrawRequest {
  amount: number;       // min: 10000
  userNote?: string;    // optional
}

/**
 * PUT /api/v1/withdrawals/{id}/execute hoặc reject — body
 */
export interface ProcessWithdrawRequest {
  note?: string;
}

/** POST /wallet/deposit/generate-qr — body */
export interface DepositQRRequest {
  amount: number;
  description?: string;
}

/** POST /wallet/deposit/generate-qr — response */
export interface DepositQRResponse {
  qrCodeUrl: string;
  amount: number;
  bankAccount: string;
  bankName: string;
  accountOwner: string;
  description: string;
  expiresAt: string;
}

// --- Filter Params ---

/** GET /api/v1/withdrawals — query params (Accountant) */
export interface WithdrawFilterParams {
  status?: WithdrawStatus;
  page?: number;
  size?: number;
}

/** Wallet ledger history query params */
export interface LedgerFilterParams {
  from?: string;    // "YYYY-MM-DD"
  to?: string;      // "YYYY-MM-DD"
  page?: number;
  size?: number;
}

// --- WebSocket Payloads ---

/** /user/queue/wallet — message payload */
export interface WalletUpdateMessage {
  type: "WALLET_UPDATED";
  data: {
    walletId: number;
    balance: number;
    lockedBalance: number;
    availableBalance: number;
    transaction: TransactionResponse;
  };
  timestamp: string;
}
