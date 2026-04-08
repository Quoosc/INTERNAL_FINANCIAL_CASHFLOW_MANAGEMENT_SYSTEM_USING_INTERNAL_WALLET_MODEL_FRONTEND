// =============================================================
// Withdrawal API — khớp với WithdrawController (/api/v1/withdrawals)
// =============================================================

import { api } from "@/lib/api-client";
import type {
  CreateWithdrawRequest,
  WithdrawRequestResponse,
  WithdrawStatus,
} from "@/types";

// Spring Data Page<T> response format
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // 0-indexed page
  size: number;
}

// ── User Endpoints (Permission: WALLET_WITHDRAW) ──────────────

/** POST /api/v1/withdrawals — Tạo yêu cầu rút tiền */
export async function createWithdrawRequest(data: CreateWithdrawRequest) {
  return api.post<WithdrawRequestResponse>("/api/v1/withdrawals", data);
}

/** DELETE /api/v1/withdrawals/{id} — Hủy yêu cầu (chỉ PENDING) */
export async function cancelWithdrawRequest(id: number) {
  return api.delete<WithdrawRequestResponse>(`/api/v1/withdrawals/${id}`);
}

/** GET /api/v1/withdrawals/my — Lịch sử rút tiền cá nhân */
export async function getMyWithdrawRequests(page = 0, size = 10) {
  return api.get<SpringPage<WithdrawRequestResponse>>(
    `/api/v1/withdrawals/my?page=${page}&size=${size}`
  );
}

// ── Accountant Endpoints (Permission: TRANSACTION_APPROVE_WITHDRAW) ──

/** GET /api/v1/withdrawals — Danh sách tất cả yêu cầu */
export async function getAllWithdrawRequests(
  status?: WithdrawStatus,
  page = 0,
  size = 20
) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("size", String(size));
  return api.get<SpringPage<WithdrawRequestResponse>>(
    `/api/v1/withdrawals?${params.toString()}`
  );
}

/** PUT /api/v1/withdrawals/{id}/execute — Thực thi qua MockBank */
export async function executeWithdraw(id: number, note?: string) {
  return api.put<WithdrawRequestResponse>(
    `/api/v1/withdrawals/${id}/execute`,
    note ? { note } : undefined
  );
}

/** PUT /api/v1/withdrawals/{id}/reject — Từ chối + unlock funds */
export async function rejectWithdraw(id: number, note: string) {
  return api.put<WithdrawRequestResponse>(
    `/api/v1/withdrawals/${id}/reject`,
    { note }
  );
}
