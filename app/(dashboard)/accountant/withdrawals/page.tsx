"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { ApiError } from "@/lib/api-client";
import {
  executeWithdraw,
  getAllWithdrawRequests,
  rejectWithdraw,
} from "@/lib/api";
import { RoleName, WithdrawRequestResponse, WithdrawStatus } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";

type WithdrawFilterTab = "ALL" | "PENDING" | "COMPLETED" | "REJECTED";

type WithdrawRequestListItem = WithdrawRequestResponse & {
  requester?: {
    fullName?: string;
  };
};

const TAB_LABELS: Record<WithdrawFilterTab, string> = {
  ALL: "Tất cả",
  PENDING: "Đang chờ",
  COMPLETED: "Hoàn tất",
  REJECTED: "Từ chối",
};

function getStatusClass(status: WithdrawStatus): string {
  if (status === WithdrawStatus.PENDING || status === WithdrawStatus.PROCESSING) {
    return "bg-amber-50 border-amber-200 text-amber-700";
  }

  if (status === WithdrawStatus.COMPLETED) {
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  }

  if (status === WithdrawStatus.REJECTED || status === WithdrawStatus.CANCELLED || status === WithdrawStatus.FAILED) {
    return "bg-rose-50 border-rose-200 text-rose-700";
  }

  return "bg-slate-500/15 border-slate-500/30 text-slate-600";
}

function getStatusLabel(status: WithdrawStatus): string {
  switch (status) {
    case WithdrawStatus.PENDING:
      return "Đang chờ";
    case WithdrawStatus.PROCESSING:
      return "Đang xử lý";
    case WithdrawStatus.COMPLETED:
      return "Hoàn tất";
    case WithdrawStatus.REJECTED:
      return "Từ chối";
    case WithdrawStatus.CANCELLED:
      return "Đã hủy";
    case WithdrawStatus.FAILED:
      return "Thất bại";
    default:
      return status;
  }
}

function mapTabToStatus(tab: WithdrawFilterTab): WithdrawStatus | undefined {
  if (tab === "PENDING") return WithdrawStatus.PENDING;
  if (tab === "COMPLETED") return WithdrawStatus.COMPLETED;
  if (tab === "REJECTED") return WithdrawStatus.REJECTED;
  return undefined;
}

export default function AccountantWithdrawalsPage() {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [filterTab, setFilterTab] = useState<WithdrawFilterTab>("PENDING");
  const [items, setItems] = useState<WithdrawRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [executingId, setExecutingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectId, setSelectedRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const statusFilter = useMemo(() => mapTabToStatus(filterTab), [filterTab]);
  const pendingCount = useMemo(
    () => items.filter((item) => item.status === WithdrawStatus.PENDING || item.status === WithdrawStatus.PROCESSING).length,
    [items],
  );
  const completedCount = useMemo(
    () => items.filter((item) => item.status === WithdrawStatus.COMPLETED).length,
    [items],
  );
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.amount, 0),
    [items],
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getAllWithdrawRequests(statusFilter, 0, 20);
      setItems((res.data.items ?? []) as WithdrawRequestListItem[]);
    } catch (err) {
      setItems([]);
      if (err instanceof ApiError) {
        toast.error(err.apiMessage);
      } else {
        toast.error("Không thể tải danh sách yêu cầu rút tiền.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleExecute = async (id: number) => {
    setExecutingId(id);

    try {
      await executeWithdraw(id);
      await loadRequests();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.apiMessage);
      } else {
        toast.error("Không thể thực hiện yêu cầu rút tiền.");
      }
    } finally {
      setExecutingId(null);
    }
  };

  const openRejectModal = (id: number) => {
    setSelectedRejectId(id);
    setRejectReason("");
    setRejectError(null);
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedRejectId) return;
    if (rejectReason.trim().length < 3) {
      setRejectError("Vui lòng nhập lý do từ chối.");
      return;
    }

    setRejectingId(selectedRejectId);
    setRejectError(null);

    try {
      await rejectWithdraw(selectedRejectId, rejectReason.trim());
      setShowRejectModal(false);
      await loadRequests();
    } catch (err) {
      if (err instanceof ApiError) {
        setRejectError(err.apiMessage);
      } else {
        setRejectError("Không thể từ chối yêu cầu rút tiền.");
      }
    } finally {
      setRejectingId(null);
    }
  };

  if (!hasRole(RoleName.ACCOUNTANT)) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-600">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Withdrawal processing
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Yêu cầu rút tiền</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Kiểm tra thông tin ngân hàng, thực hiện hoặc từ chối các yêu cầu rút tiền của nhân viên.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={loading}
            className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tải lại
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <WithdrawMetric label="Đang chờ" value={String(pendingCount)} helper="Cần kế toán xử lý" tone="amber" />
        <WithdrawMetric label="Hoàn tất" value={String(completedCount)} helper={`${items.length} yêu cầu đang hiển thị`} tone="emerald" />
        <WithdrawMetric label="Tổng giá trị" value={formatCurrency(totalAmount)} helper={TAB_LABELS[filterTab]} tone="blue" />
      </section>

      <div className="hidden">
        <h1 className="text-2xl font-bold text-slate-900">Yêu cầu rút tiền</h1>
        <p className="text-slate-500 mt-1">Quản lý và xử lý yêu cầu rút tiền của nhân viên.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Bộ lọc rút tiền</h2>
          <p className="mt-1 text-sm text-slate-500">Theo dõi nhanh các nhóm yêu cầu theo trạng thái xử lý.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "PENDING", "COMPLETED", "REJECTED"] as WithdrawFilterTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
              filterTab === tab
                ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20"
                : "bg-white border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}

        <button
          type="button"
          onClick={() => void loadRequests()}
          disabled={loading}
            className="ml-auto rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Tải lại
        </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-245">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="bg-blue-50/80 border-b border-slate-200">
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Người yêu cầu</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Số tiền</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Tài khoản ngân hàng</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngân hàng</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Ghi chú</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Thời gian tạo</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Không có yêu cầu nào.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-blue-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {item.requester?.fullName ?? `User #${item.userId}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.creditAccountName} - {item.creditAccount}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.creditBankName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-55 truncate">
                      {item.userNote || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDateTime(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getStatusClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === WithdrawStatus.PENDING ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleExecute(item.id)}
                            disabled={executingId === item.id || rejectingId === item.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium"
                          >
                            {executingId === item.id ? "Đang xử lý..." : "Thực hiện"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openRejectModal(item.id)}
                            disabled={executingId === item.id || rejectingId === item.id}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-medium"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowRejectModal(false)}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Từ chối yêu cầu rút tiền</h2>

              <textarea
                rows={4}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Nhập lý do từ chối"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 resize-none"
              />

              {rejectError && (
                <p className="text-sm text-rose-700">{rejectError}</p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleReject()}
                  disabled={rejectingId !== null}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm"
                >
                  {rejectingId !== null ? "Đang gửi..." : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawMetric({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "emerald" | "amber";
}) {
  const toneClass = {
    blue: "from-blue-50 to-indigo-50 border-blue-100 text-blue-700",
    emerald: "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700",
    amber: "from-amber-50 to-orange-50 border-amber-100 text-amber-700",
  }[tone];

  return (
    <div className={`rounded-2xl border bg-linear-to-br ${toneClass} p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}
