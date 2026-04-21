"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/wallet-context";
import { ApiError } from "@/lib/api-client";
import { cancelWithdrawRequest, createWithdrawRequest, getMyWithdrawRequests } from "@/lib/api";
import { formatCurrency, formatDateTime, formatInputAmount, parseAmountInput } from "@/lib/format";
import { ErrorAlert } from "@/components/ui/error-alert";
import { EmptyState } from "@/components/ui/loading-skeleton";
import { WithdrawRequestResponse, WithdrawStatus } from "@/types";

function getWithdrawStatusClass(status: WithdrawStatus): string {
  if (status === WithdrawStatus.PENDING) {
    return "bg-amber-50 border-amber-200 text-amber-700";
  }

  if (status === WithdrawStatus.COMPLETED || status === ("APPROVED" as WithdrawStatus)) {
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  }

  if (
    status === WithdrawStatus.REJECTED ||
    status === WithdrawStatus.CANCELLED ||
    status === WithdrawStatus.FAILED
  ) {
    return "bg-rose-50 border-rose-200 text-rose-700";
  }

  return "bg-slate-500/15 border-slate-500/30 text-slate-600";
}

function getWithdrawStatusLabel(status: WithdrawStatus): string {
  switch (status) {
    case WithdrawStatus.PENDING:
      return "Đang chờ";
    case WithdrawStatus.COMPLETED:
      return "Hoàn tất";
    case WithdrawStatus.REJECTED:
      return "Từ chối";
    case WithdrawStatus.CANCELLED:
      return "Đã hủy";
    case WithdrawStatus.FAILED:
      return "Thất bại";
    case WithdrawStatus.PROCESSING:
      return "Đang xử lý";
    default:
      return status;
  }
}

export default function WithdrawPage() {
  const router = useRouter();
  const { wallet, isLoading: walletLoading, fetchWallet } = useWallet();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WithdrawRequestResponse | null>(null);
  const [history, setHistory] = useState<WithdrawRequestResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);
  const amountDisplay = useMemo(() => formatInputAmount(amount), [amount]);
  const currentBalance = wallet?.balance ?? 0;
  const availableBalance = wallet?.availableBalance ?? wallet?.balance ?? 0;

  const loadWithdrawHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const res = await getMyWithdrawRequests(0, 10);
      setHistory(res.data.content);
    } catch (err) {
      setHistory([]);
      if (err instanceof ApiError) {
        setHistoryError(err.apiMessage);
      } else {
        setHistoryError("Không thể tải lịch sử rút tiền.");
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchWallet();
    void loadWithdrawHistory();
  }, [fetchWallet]);

  const validateAmount = (): boolean => {
    if (!wallet) {
      setError("Không thể tải thông tin ví. Vui lòng thử lại.");
      return false;
    }

    if (amountNumber <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ.");
      return false;
    }

    if (amountNumber < 10_000) {
      setError("Số tiền rút tối thiểu là 10.000 ₫.");
      return false;
    }

    if (amountNumber > availableBalance) {
      setError("Số tiền rút không được vượt quá số dư khả dụng.");
      return false;
    }

    return true;
  };

  const handleAmountChange = (value: string) => {
    setAmount(parseAmountInput(value));
  };

  const handleSubmitWithdraw = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateAmount()) return;

    setLoading(true);

    try {
      const res = await createWithdrawRequest({
        amount: amountNumber,
        userNote: note.trim() || undefined,
      });

      setResult(res.data);
      await fetchWallet();
      await loadWithdrawHistory();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể kết nối API. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (id: number) => {
    setCancellingId(id);
    setHistoryError(null);

    try {
      await cancelWithdrawRequest(id);
      await fetchWallet();
      await loadWithdrawHistory();
    } catch (err) {
      if (err instanceof ApiError) {
        setHistoryError(err.apiMessage);
      } else {
        setHistoryError("Không thể hủy yêu cầu rút tiền.");
      }
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rút tiền</h1>
        <p className="text-slate-500 mt-1">Tạo yêu cầu rút tiền từ ví nội bộ về tài khoản ngân hàng.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-sm text-slate-500">Số dư hiện tại</p>
        {walletLoading ? (
          <div className="mt-2 h-9 w-48 rounded bg-slate-100 animate-pulse" />
        ) : (
          <>
            <p className="text-3xl font-bold text-slate-900 mt-2">{formatCurrency(currentBalance)}</p>
            <p className="text-sm text-slate-500 mt-1">Khả dụng: {formatCurrency(availableBalance)}</p>
          </>
        )}
      </div>

      {!result ? (
        <form onSubmit={handleSubmitWithdraw} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-2">
              Số tiền rút
            </label>
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amountDisplay}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Nhập số tiền"
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <p className="text-xs text-slate-500 mt-1">Tối thiểu: 10.000 ₫ — Khả dụng: {formatCurrency(availableBalance)}</p>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-slate-600 mb-2">
              Ghi chú (không bắt buộc)
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Rút tiền chi tiêu cá nhân"
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {error && <ErrorAlert message={error} />}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {loading ? "Đang gửi yêu cầu..." : "Gửi yêu cầu rút tiền"}
          </button>
        </form>
      ) : (
        <div className="bg-white border border-emerald-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Đã tạo yêu cầu rút tiền</h2>
              <p className="text-sm text-slate-500">Yêu cầu đang chờ xử lý bởi kế toán.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow label="Mã yêu cầu" value={result.withdrawCode} />
            <InfoRow label="Trạng thái" value={result.status} />
            <InfoRow label="Số tiền" value={formatCurrency(result.amount)} />
            <InfoRow label="Thời gian tạo" value={formatDateTime(result.createdAt)} />
            <InfoRow label="Ngân hàng" value={result.creditBankName} />
            <InfoRow label="Tài khoản" value={`${result.creditAccountName} - ${result.creditAccount}`} />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
            >
              Về ví
            </Link>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setAmount("");
                setNote("");
                setError(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              Tạo yêu cầu mới
            </button>
          </div>
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Lịch sử yêu cầu rút tiền</h2>
          <button
            type="button"
            onClick={() => void loadWithdrawHistory()}
            disabled={historyLoading}
            className="px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-xs font-medium"
          >
            Tải lại
          </button>
        </div>

        {historyLoading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Đang tải lịch sử...</div>
        ) : history.length === 0 ? (
          <EmptyState message="Chưa có yêu cầu rút tiền nào." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-180">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-3 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số tiền</th>
                  <th className="px-3 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-3 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ghi chú</th>
                  <th className="px-3 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian tạo</th>
                  <th className="px-3 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {history.map((request) => (
                  <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-3.5 text-sm text-slate-900 font-medium">{formatCurrency(request.amount)}</td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getWithdrawStatusClass(request.status)}`}>
                        {getWithdrawStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-sm text-slate-600 max-w-70 truncate">{request.userNote || "—"}</td>
                    <td className="px-3 py-3.5 text-sm text-slate-500">{formatDateTime(request.createdAt)}</td>
                    <td className="px-3 py-3.5 text-right">
                      {request.status === WithdrawStatus.PENDING ? (
                        <button
                          type="button"
                          onClick={() => void handleCancelRequest(request.id)}
                          disabled={cancellingId === request.id}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-medium"
                        >
                          {cancellingId === request.id ? "Đang hủy..." : "Hủy"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {historyError && <ErrorAlert message={historyError} />}
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-900 font-medium mt-1">{value}</p>
    </div>
  );
}
