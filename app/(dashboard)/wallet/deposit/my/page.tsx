"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getMyDeposits } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { DepositLogResponse, DepositStatus } from "@/types";

const PAGE_SIZE = 10;

function getStatusLabel(status: DepositStatus): string {
  switch (status) {
    case DepositStatus.COMPLETED:
      return "Thành công";
    case DepositStatus.PENDING:
      return "Đang chờ";
    case DepositStatus.FAILED:
      return "Thất bại";
    default:
      return status;
  }
}

function getStatusClass(status: DepositStatus): string {
  switch (status) {
    case DepositStatus.COMPLETED:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case DepositStatus.PENDING:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case DepositStatus.FAILED:
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-500/15 text-slate-600 border-slate-500/30";
  }
}

export default function DepositHistoryPage() {
  const [deposits, setDeposits] = useState<DepositLogResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDeposits = useCallback(async (nextPage: number) => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    try {
      const res = await getMyDeposits(nextPage, PAGE_SIZE);
      if (cancelled) return;

      setDeposits(res.data.content);
      setTotal(res.data.totalElements);
      setTotalPages(Math.max(1, res.data.totalPages));
      setPage(res.data.number);
    } catch (err) {
      if (cancelled) return;

      setDeposits([]);
      setTotal(0);
      setTotalPages(1);

      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể tải lịch sử nạp tiền.");
      }
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadDeposits(0);
  }, [loadDeposits]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === page) return;
    void loadDeposits(nextPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/wallet/deposit"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lịch sử nạp tiền</h1>
        <p className="text-slate-500 mt-1">Toàn bộ các lần nạp tiền VNPay của bạn.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200">
            <thead>
              <tr className="border-b border-slate-200 bg-white/40">
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mã nạp tiền
                </th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Số tiền
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Trạng thái
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mã giao dịch VNPay
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Thời gian thanh toán
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ngày tạo
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Đang tải lịch sử nạp tiền...
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Chưa có lịch sử nạp tiền.
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr
                    key={deposit.id}
                    className="border-b border-slate-200 hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-slate-900">{deposit.depositCode}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-emerald-700">
                        +{formatCurrency(deposit.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full border text-xs ${getStatusClass(deposit.status)}`}
                        >
                          {getStatusLabel(deposit.status)}
                        </span>
                        {deposit.status === DepositStatus.PENDING && deposit.paymentUrl && (
                          <button
                            type="button"
                            onClick={() => window.open(deposit.paymentUrl!, "_blank", "noopener,noreferrer")}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Thanh toán
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {deposit.vnpTransactionNo ? (
                        <span className="font-mono text-xs text-slate-700">{deposit.vnpTransactionNo}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDateTime(deposit.paidAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDateTime(deposit.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200 bg-blue-50">
          <p className="text-sm text-slate-500">
            Tổng {total} giao dịch • Trang {page + 1}/{totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 0 || loading}
              className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
