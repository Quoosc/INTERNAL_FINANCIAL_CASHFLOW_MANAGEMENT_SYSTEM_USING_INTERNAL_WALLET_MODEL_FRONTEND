// =============================================================
// Wallet Types - khớp với backend API_Spec.md v2.0
// =============================================================

// --- Enums ---

/** khớp với wallet.entity.PaymentProvider */
export enum PaymentProvider {
  PAYOS = "PAYOS",
  MOMO = "MOMO",
  VNPAY = "VNPAY",
  ZALOPAY = "ZALOPAY",
  INTERNAL_WALLET = "INTERNAL_WALLET",
}

/**
 * khớp với wallet.entity.TransactionType
 *
 * Thêm: DEPT_QUOTA_ALLOCATION, PROJECT_QUOTA_ALLOCATION (4-tầng quỹ)
 */
export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAW = "WITHDRAW",
  REQUEST_PAYMENT = "REQUEST_PAYMENT",
  PAYSLIP_PAYMENT = "PAYSLIP_PAYMENT",
  SYSTEM_ADJUSTMENT = "SYSTEM_ADJUSTMENT",
  DEPT_QUOTA_ALLOCATION = "DEPT_QUOTA_ALLOCATION",
  PROJECT_QUOTA_ALLOCATION = "PROJECT_QUOTA_ALLOCATION",
}

/** khớp với wallet.entity.TransactionStatus */
export enum TransactionStatus {
  SUCCESS = "SUCCESS",
  PENDING = "PENDING",
  FAILED = "FAILED",
}

/**
 * khớp với wallet.entity.ReferenceType
 *
 * Thêm: PROJECT, DEPARTMENT, SYSTEM (cho 4-tầng quỹ transactions)
 */
export enum ReferenceType {
  REQUEST = "REQUEST",
  PAYSLIP = "PAYSLIP",
  PROJECT = "PROJECT",
  DEPARTMENT = "DEPARTMENT",
  SYSTEM = "SYSTEM",
}

// --- Response DTOs (khớp API Spec) ---

/**
 * GET /wallet — response
 *
 * > balance: tiền khả dụng (có thể rút/chi)
 * > pendingBalance: tiền treo (đang chờ xử lý rút)
 * > debtBalance: dư nợ tạm ứng
 * > version: dùng cho Optimistic Locking
 */
export interface WalletResponse {
  id: number;
  balance: number;
  pendingBalance: number;
  debtBalance: number;
  version: number;
}

/**
 * GET /wallet/transactions — response item
 *
 * > amount: số dương = tiền vào, số âm = tiền ra
 * > balanceAfter: snapshot số dư sau giao dịch
 */
export interface TransactionResponse {
  id: number;
  transactionCode: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  balanceAfter: number;
  referenceType: ReferenceType | null;
  referenceId: number | null;
  description: string | null;
  createdAt: string;
}

/**
 * Transaction detail đầy đủ (dùng cho Ledger)
 *
 * > paymentRef: mã tham chiếu cổng thanh toán, nullable
 * > relatedTransactionId: giao dịch đối ứng (bút toán kép), nullable
 */
export interface TransactionDetailResponse extends TransactionResponse {
  paymentRef: string | null;
  gatewayProvider: PaymentProvider | null;
  walletId: number;
  walletOwnerName: string;
  actorId: number | null;
  actorName: string | null;
  relatedTransactionId: number | null;
  updatedAt: string;
}

// --- Request DTOs ---

/** POST /wallet/withdraw — body */
export interface WithdrawRequest {
  amount: number;
  pin: string;
}

/** POST /wallet/withdraw — response */
export interface WithdrawResponse {
  id: number;
  transactionCode: string;
  type: "WITHDRAW";
  status: TransactionStatus;
  amount: number;
  balanceAfter: number;
  createdAt: string;
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

/** GET /wallet/transactions — query params */
export interface TransactionFilterParams {
  type?: TransactionType;
  status?: TransactionStatus;
  from?: string;    // "YYYY-MM-DD"
  to?: string;      // "YYYY-MM-DD"
  page?: number;
  limit?: number;
}

// --- WebSocket Payloads ---

/** /user/queue/wallet — message payload */
export interface WalletUpdateMessage {
  type: "WALLET_UPDATED";
  data: {
    walletId: number;
    balance: number;
    pendingBalance: number;
    debtBalance: number;
    version: number;
    transaction: TransactionResponse;
  };
  timestamp: string;
}
