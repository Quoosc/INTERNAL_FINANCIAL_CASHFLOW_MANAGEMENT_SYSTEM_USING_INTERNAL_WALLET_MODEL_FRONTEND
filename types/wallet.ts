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

/** khớp với wallet.entity.DepositStatus */
export enum DepositStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
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
  transactionId: number;
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

/**
 * POST /api/v1/wallet/deposit — request body
 * Backend tự sinh depositCode — FE không cần truyền.
 */
export interface CreateDepositRequest {
  amount: number;    // min 10000 VND
  bankCode?: string; // e.g. "NCB" — optional VNPay bank shortcut
  locale?: string;   // "vn" | "en" — default "vn"
}

/**
 * POST /api/v1/wallet/deposit — response
 * GET  /api/v1/wallet/deposit/my — list item
 * khớp wallet.dto.response.DepositLogResponse
 */
export interface DepositLogResponse {
  id: number;
  depositCode: string;
  amount: number;
  status: DepositStatus;
  paymentUrl: string | null;   // VNPay URL — non-null khi vừa tạo
  vnpTransactionNo: string | null;
  paidAt: string | null;
  createdAt: string;
}

/**
 * POST /payments — request body
 *
 * Khớp backend `payment.dto.request.PaymentRequest`. Backend bắt buộc
 * `gateway`, `depositCode`, `depositInfo`, `amount`. Các trường khác optional.
 */
export interface PaymentCreateRequest {
  gateway: PaymentProvider; // e.g. VNPAY
  depositCode: string; // mã do FE sinh, max 100
  depositInfo: string; // mô tả ngắn (max 255), hiển thị trên cổng VNPay
  amount: number; // VND, ≥ 1000
  ipAddress?: string;
  returnUrl?: string;
  bankCode?: string;
  locale?: string;
  expireMinutes?: number;
}

/**
 * POST /payments — response
 *
 * Khớp backend `payment.dto.response.PaymentResponse`. `qrCode` (nếu có)
 * là chuỗi nội dung QR — FE convert sang data URL khi cần render.
 */
export interface PaymentCreateResponse {
  gateway: PaymentProvider | string;
  depositCode: string;
  transactionRef: string;
  paymentUrl: string;
  qrCode: string | null;
  status: string;
  message: string;
  expiredAt: string;
}

/** GET /payments/status?gateway=&transactionRef=... — response */
export interface PaymentStatusResponse {
  gateway: PaymentProvider | string;
  transactionRef: string;
  status: string;
  successful: boolean;
  message?: string;
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

// --- Accountant Ledger DTOs (khớp AccountantLedgerController) ---

/**
 * GET /api/v1/accountant/ledger — list row
 * khớp wallet.dto.response.AccountantLedgerItemResponse
 * amount is signed from CompanyFund perspective (negative = outflow)
 */
export interface AccountantLedgerItemResponse {
  id: number;
  transactionCode: string;
  type: TransactionType;
  status: TransactionStatus;
  direction: TransactionDirection;
  amount: number;
  balanceAfter: number;
  walletOwnerType: WalletOwnerType;
  ownerId: number;
  timestamp: string;
}

/**
 * Nested ledger entry in AccountantTransactionDetailResponse.ledgerEntries
 * khớp wallet.dto.response.AccountantLedgerEntryResponse
 */
export interface AccountantLedgerEntryItem {
  id: number;
  transactionCode: string;
  direction: TransactionDirection;
  amount: number;
  balanceAfter: number;
  walletOwnerType: WalletOwnerType;
  walletOwnerId: number;
  createdAt: string;
}

/**
 * GET /api/v1/accountant/ledger/{transactionId} — full detail
 * khớp wallet.dto.response.AccountantTransactionDetailResponse
 */
export interface AccountantTransactionDetailResponse {
  id: number;
  transactionCode: string;
  paymentRef: string | null;
  gatewayProvider: PaymentProvider | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  balanceAfter: number;
  referenceType: ReferenceType | null;
  referenceId: number | null;
  walletOwnerType: WalletOwnerType;
  walletOwnerId: number;
  description: string;
  ledgerEntries: AccountantLedgerEntryItem[];
  createdAt: string;
}

/** GET /api/v1/accountant/ledger — filter params */
export interface AccountantLedgerFilterParams {
  type?: TransactionType;
  status?: TransactionStatus;
  referenceType?: ReferenceType;
  from?: string;    // "YYYY-MM-DD"
  to?: string;      // "YYYY-MM-DD"
  page?: number;
  limit?: number;
}

// --- SSE Event Payloads ---
// Backend streams qua GET /api/v1/users/stream (text/event-stream).
// Mỗi SSE event name đi kèm data JSON là DTO trực tiếp (không wrap).
// Xem docs/API_CONTRACT.md §15.

/** SSE event `wallet.updated` — payload = full WalletResponse (replace state) */
export type WalletUpdatedEvent = WalletResponse;

/** SSE event `transaction.created` — payload = LedgerEntryResponse (prepend vào list) */
export type TransactionCreatedEvent = LedgerEntryResponse;
