"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api-client";
import {
  executeWithdraw,
  getAllWithdrawRequests,
  rejectWithdraw,
} from "@/lib/api";
import { RoleName, WithdrawRequestResponse, WithdrawStatus } from "@/types";

type WithdrawFilterTab = "ALL" | "PENDING" | "COMPLETED" | "REJECTED";

type WithdrawRequestListItem = WithdrawRequestResponse & {
  requester?: {
    fullName?: string;
  };
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

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
      return "Dang cho";
    case WithdrawStatus.PROCESSING:
      return "Dang xu ly";
    case WithdrawStatus.COMPLETED:
      return "Hoan tat";
    case WithdrawStatus.REJECTED:
      return "Tu choi";
    case WithdrawStatus.CANCELLED:
      return "Da huy";
    case WithdrawStatus.FAILED:
      return "That bai";
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

  const [filterTab, setFilterTab] = useState<WithdrawFilterTab>("PENDING");
  const [items, setItems] = useState<WithdrawRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [executingId, setExecutingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectId, setSelectedRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const statusFilter = useMemo(() => mapTabToStatus(filterTab), [filterTab]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getAllWithdrawRequests(statusFilter, 0, 20);
      setItems(res.data.content as WithdrawRequestListItem[]);
    } catch (err) {
      setItems([]);
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Khong the tai danh sach yeu cau rut tien.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleExecute = async (id: number) => {
    setExecutingId(id);
    setError(null);

    try {
      await executeWithdraw(id);
      await loadRequests();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Khong the thuc hien yeu cau rut tien.");
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
      setRejectError("Vui long nhap ly do tu choi.");
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
        setRejectError("Khong the tu choi yeu cau rut tien.");
      }
    } finally {
      setRejectingId(null);
    }
  };

  if (!hasRole(RoleName.ACCOUNTANT)) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-600">
        Ban khong co quyen truy cap trang nay.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Yeu cau rut tien</h1>
        <p className="text-slate-500 mt-1">Quan ly va xu ly yeu cau rut tien cua nhan vien.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "PENDING", "COMPLETED", "REJECTED"] as WithdrawFilterTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
              filterTab === tab
                ? "bg-blue-100 border-blue-300 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-blue-100"
            }`}
          >
            {tab}
          </button>
        ))}

        <button
          type="button"
          onClick={() => void loadRequests()}
          disabled={loading}
          className="ml-auto px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm"
        >
          Tai lai
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-245">
            <thead>
              <tr className="bg-white/40 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Nguoi yeu cau</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">So tien</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Tai khoan ngan hang</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Ngan hang</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Ghi chu</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Thoi gian tao</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Trang thai</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Dang tai du lieu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Khong co yeu cau nao.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200">
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
                            {executingId === item.id ? "Dang xu ly..." : "Thuc hien"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openRejectModal(item.id)}
                            disabled={executingId === item.id || rejectingId === item.id}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-medium"
                          >
                            Tu choi
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

      {error && (
        <div className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowRejectModal(false)}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Tu choi yeu cau rut tien</h2>

              <textarea
                rows={4}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Nhap ly do tu choi"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 resize-none"
              />

              {rejectError && (
                <p className="text-sm text-rose-700">{rejectError}</p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-slate-900 text-sm"
                >
                  Huy
                </button>
                <button
                  type="button"
                  onClick={() => void handleReject()}
                  disabled={rejectingId !== null}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm"
                >
                  {rejectingId !== null ? "Dang gui..." : "Xac nhan tu choi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
