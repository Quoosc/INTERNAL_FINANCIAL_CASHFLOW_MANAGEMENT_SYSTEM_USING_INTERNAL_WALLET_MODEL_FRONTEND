// =============================================================
// Payment API — khớp PaymentController (/api/v1/payments)
//
// Backend (PaymentController.java):
//   POST   /payments                              -> PaymentResponse
//   GET    /payments/status?gateway&transactionRef -> PaymentStatusResponse
//   POST   /payments/cancel                       -> PaymentCancelResponse
//
// FE dùng cho luồng nạp tiền VNPay: tạo URL thanh toán, kiểm tra status.
// =============================================================

import { api } from "@/lib/api-client";
import {
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentProvider,
  PaymentStatusResponse,
} from "@/types";

const DEPOSIT_CODE_PREFIX = "DEP";

/** Sinh `depositCode` ngẫu nhiên dạng `DEP-YYYYMMDD-XXXX` (max 100 chars). */
export function generateDepositCode(): string {
  const now = new Date();
  const yyyymmdd =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${DEPOSIT_CODE_PREFIX}-${yyyymmdd}-${random}`;
}

export interface CreateDepositInput {
  amount: number;
  depositInfo?: string;
  gateway?: PaymentProvider;
  expireMinutes?: number;
  bankCode?: string;
  locale?: string;
  returnUrl?: string;
}

/** POST /api/v1/payments — tạo URL/QR nạp tiền qua cổng (mặc định VNPAY). */
export async function createDeposit(input: CreateDepositInput) {
  const body: PaymentCreateRequest = {
    gateway: input.gateway ?? PaymentProvider.VNPAY,
    depositCode: generateDepositCode(),
    depositInfo: input.depositInfo?.trim() || "Nap tien vao vi noi bo",
    amount: input.amount,
    bankCode: input.bankCode,
    locale: input.locale ?? "vn",
    returnUrl: input.returnUrl,
    expireMinutes: input.expireMinutes,
  };
  return api.post<PaymentCreateResponse>("/api/v1/payments", body);
}

/**
 * GET /api/v1/payments/status — kiểm tra trạng thái 1 giao dịch nạp.
 *
 * Backend bắt buộc cả `gateway` lẫn `transactionRef`. Đừng gọi mà bỏ
 * `gateway` — khi đó request sẽ 400.
 */
export async function getPaymentStatus(
  transactionRef: string,
  gateway: PaymentProvider = PaymentProvider.VNPAY,
) {
  const params = new URLSearchParams({
    gateway,
    transactionRef,
  });
  return api.get<PaymentStatusResponse>(`/api/v1/payments/status?${params.toString()}`);
}
