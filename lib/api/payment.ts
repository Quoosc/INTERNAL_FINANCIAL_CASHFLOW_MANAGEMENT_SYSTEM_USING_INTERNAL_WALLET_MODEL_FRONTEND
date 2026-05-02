// =============================================================
// Deposit API — khớp DepositController (/api/v1/wallet/deposit)
// =============================================================

import { api } from "@/lib/api-client";
import { DepositLogResponse } from "@/types";

/** POST /api/v1/wallet/deposit — tạo URL nạp tiền qua VNPay. Backend tự sinh depositCode. */
export async function createDeposit(input: {
  amount: number;
  bankCode?: string;
  locale?: string;
}) {
  return api.post<DepositLogResponse>("/api/v1/wallet/deposit", {
    amount: input.amount,
    bankCode: input.bankCode,
    locale: input.locale ?? "vn",
  });
}

/** GET /api/v1/wallet/deposit/my — lịch sử nạp tiền của user hiện tại (Spring Page, 0-indexed). */
export async function getMyDeposits(page = 0, size = 10) {
  return api.get<{
    content: DepositLogResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }>(`/api/v1/wallet/deposit/my?page=${page}&size=${size}`);
}
