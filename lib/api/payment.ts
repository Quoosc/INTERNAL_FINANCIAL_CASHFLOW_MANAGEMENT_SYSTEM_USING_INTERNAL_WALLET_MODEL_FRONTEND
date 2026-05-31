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

/** GET /api/v1/wallet/deposit/my — lịch sử nạp tiền của user hiện tại (0-indexed page). */
export async function getMyDeposits(
  page = 0,
  size = 10,
  filters?: { status?: string; from?: string; to?: string },
) {
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("size", String(size));
  if (filters?.status) q.set("status", filters.status);
  if (filters?.from)   q.set("from",   filters.from);
  if (filters?.to)     q.set("to",     filters.to);
  return api.get<{
    items: DepositLogResponse[];
    total: number;
    totalPages: number;
    page: number;
    size: number;
  }>(`/api/v1/wallet/deposit/my?${q.toString()}`);
}
