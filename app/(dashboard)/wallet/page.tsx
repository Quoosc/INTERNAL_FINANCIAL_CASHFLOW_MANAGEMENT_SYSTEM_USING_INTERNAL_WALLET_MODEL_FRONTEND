"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { ApiError, api } from "@/lib/api-client";
import { createWithdrawRequest, createDeposit } from "@/lib/api";
import { withdrawSchema, depositSchema } from "@/lib/schemas";
import { formatCurrency, formatDateTime, formatInputAmount, parseAmountInput } from "@/lib/format";
import { ErrorAlert } from "@/components/ui/error-alert";
import { useToast } from "@/contexts/toast-context";
import {
  DepositLogResponse,
  PaginatedResponse,
  TransactionResponse,
  TransactionStatus,
  TransactionType,
  WithdrawRequestResponse,
} from "@/types";


function DepositModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [qrData, setQrData] = useState<DepositLogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const amountNum = useMemo(() => Number(amount || 0), [amount]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validation = depositSchema.safeParse({ amount: amountNum });
    if (!validation.success) {
      setError(validation.error.flatten().fieldErrors.amount?.[0] ?? "Số tiền không hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      const res = await createDeposit({ amount: amountNum });
      setQrData(res.data);
      toast.success("Tạo liên kết thanh toán thành công!");
    } catch (err) {
      if (err instanceof ApiError) setError(err.apiMessage);
      else setError("Không thể tạo liên kết thanh toán VNPay.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Đóng" />
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Nạp tiền qua VNPay</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!qrData ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Số tiền nạp</label>
                <input
                  type="text" inputMode="numeric" placeholder="Nhập số tiền"
                  value={amount}
                  onChange={(e) => setAmount(parseAmountInput(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <div className="flex items-center justify-between gap-3 mt-1 text-xs">
                  <p className="text-slate-500">Tối thiểu: 10.000 ₫</p>
                  {amountNum > 0 && (
                    <p className="font-medium text-slate-700">{formatCurrency(amountNum)}</p>
                  )}
                </div>
              </div>
              {error && <ErrorAlert message={error} />}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold transition-colors">
                {loading ? "Đang tạo..." : "Tạo thanh toán"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button type="button" onClick={() => { setQrData(null); setAmount(""); setError(null); }} className="text-xs text-blue-700 hover:text-blue-600">
                  Tạo mới
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Mã nạp tiền</span><span className="font-mono text-slate-900 text-xs">{qrData.depositCode}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Số tiền</span><span className="font-semibold text-slate-900">{formatCurrency(qrData.amount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Trạng thái</span><span className="text-slate-900">{qrData.status}</span></div>
              </div>

              {qrData.paymentUrl && (
                <p className="text-xs text-blue-600">Số dư ví sẽ tự động cập nhật sau khi giao dịch thành công.</p>
              )}

              <button
                type="button"
                disabled={!qrData.paymentUrl}
                onClick={() => { if (qrData.paymentUrl) window.open(qrData.paymentUrl, "_blank", "noopener,noreferrer"); }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                Thanh toán VNPay
              </button>

              <button
                type="button"
                onClick={async () => { await navigator.clipboard.writeText(qrData.depositCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
              >
                {copied ? "Đã sao chép mã" : "Sao chép mã nạp tiền"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WithdrawModal({ wallet: walletProp, onClose }: { wallet: { availableBalance: number; balance: number } | null; onClose: () => void }) {
  const { fetchWallet } = useWallet();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WithdrawRequestResponse | null>(null);

  const amountNum = useMemo(() => Number(amount || 0), [amount]);
  const amountDisplay = useMemo(() => formatInputAmount(amount), [amount]);
  const available = walletProp?.availableBalance ?? walletProp?.balance ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validation = withdrawSchema.safeParse({ amount: amountNum, note: note.trim() || undefined });
    if (!validation.success) {
      setError(validation.error.flatten().fieldErrors.amount?.[0] ?? "Số tiền không hợp lệ.");
      return;
    }
    if (amountNum > available) {
      setError("Số tiền rút không được vượt quá số dư khả dụng.");
      return;
    }
    setLoading(true);
    try {
      const res = await createWithdrawRequest({ amount: amountNum, userNote: note.trim() || undefined });
      setResult(res.data);
      void fetchWallet();
      toast.success("Yêu cầu rút tiền đã được tạo thành công!");
    } catch (err) {
      if (err instanceof ApiError) setError(err.apiMessage);
      else setError("Không thể kết nối API. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Đóng" />
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Rút tiền</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500">Số dư khả dụng</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(available)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Số tiền rút</label>
                <input
                  type="text" inputMode="numeric" placeholder="Nhập số tiền"
                  value={amountDisplay}
                  onChange={(e) => setAmount(parseAmountInput(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Ghi chú (không bắt buộc)</label>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Rút tiền chi tiêu cá nhân" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
              </div>

              {error && <ErrorAlert message={error} />}

              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold transition-colors">
                {loading ? "Đang gửi..." : "Gửi yêu cầu rút tiền"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Đã tạo yêu cầu rút tiền</p>
                  <p className="text-xs text-slate-500">Yêu cầu đang chờ xử lý bởi kế toán.</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Mã yêu cầu</span><span className="font-mono text-slate-900">{result.withdrawCode}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Số tiền</span><span className="font-semibold text-slate-900">{formatCurrency(result.amount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Trạng thái</span><span className="text-amber-700">{result.status}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Ngân hàng</span><span className="text-slate-900">{result.creditBankName}</span></div>
              </div>

              <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors">
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SpringPage<T> {
  content: T[];
}

type WalletTransactionsResponse =
  | PaginatedResponse<TransactionResponse>
  | SpringPage<TransactionResponse>
  | TransactionResponse[];

function normalizeTransactions(payload: WalletTransactionsResponse): TransactionResponse[] {
  if (Array.isArray(payload)) return payload;
  if ("content" in payload) return payload.content;
  return payload.items;
}

function getTransactionTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.DEPOSIT:
      return "Nạp tiền";
    case TransactionType.WITHDRAW:
      return "Rút tiền";
    case TransactionType.SYSTEM_TOPUP:
      return "Nạp quỹ công ty";
    case TransactionType.REQUEST_PAYMENT:
      return "Giải ngân yêu cầu";
    case TransactionType.PAYSLIP_PAYMENT:
      return "Nhận lương";
    case TransactionType.ADVANCE_RETURN:
      return "Hoàn trả tạm ứng";
    case TransactionType.REVERSAL:
      return "Hoàn tiền";
    case TransactionType.SYSTEM_ADJUSTMENT:
      return "Điều chỉnh hệ thống";
    case TransactionType.DEPT_QUOTA_ALLOCATION:
      return "Cấp quỹ phòng ban";
    case TransactionType.PROJECT_QUOTA_ALLOCATION:
      return "Cấp quỹ dự án";
    default:
      return type;
  }
}

function getTransactionStatusLabel(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.SUCCESS:
      return "Thành công";
    case TransactionStatus.PENDING:
      return "Đang chờ";
    case TransactionStatus.FAILED:
      return "Thất bại";
    default:
      return status;
  }
}

function getTransactionStatusClass(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.SUCCESS:
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case TransactionStatus.PENDING:
      return "text-amber-700 bg-amber-50 border-amber-200";
    case TransactionStatus.FAILED:
      return "text-rose-700 bg-rose-50 border-rose-200";
    default:
      return "text-slate-500 bg-slate-500/10 border-slate-500/20";
  }
}

export default function WalletPage() {
  const router = useRouter();
  const { wallet, isLoading: walletLoading, fetchWallet } = useWallet();

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const toast = useToast();

  const loadRecentTransactions = useCallback(async () => {
    setTransactionsLoading(true);

    try {
      const res = await api.get<WalletTransactionsResponse>(
        "/api/v1/wallet/transactions?page=0&size=5"
      );
      setTransactions(normalizeTransactions(res.data).slice(0, 5));
    } catch (err) {
      setTransactions([]);
      if (err instanceof ApiError) {
        toast.error(err.apiMessage);
      } else {
        toast.error("Không thể tải giao dịch gần đây.");
      }
    } finally {
      setTransactionsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchWallet();
    void loadRecentTransactions();
  }, [fetchWallet, loadRecentTransactions]);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ví của tôi</h1>
        <p className="text-slate-500 mt-1">Theo dõi số dư và giao dịch cá nhân</p>
      </div>

      {/* Hero wallet card */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(30,58,138,0.95) 0%, rgba(30,64,175,0.85) 100%), linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 100%)",
        }}
      >
        {/* SVG decorative pattern overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04]"
          viewBox="0 0 400 200"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern id="wallet-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wallet-grid)" />
          <circle cx="350" cy="-30" r="120" fill="white" opacity="0.06" />
          <circle cx="380" cy="160" r="80" fill="white" opacity="0.04" />
        </svg>

        <div className="relative p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            {/* Left: balance + actions */}
            <div className="flex-1 space-y-6">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-2">Số dư khả dụng</p>
                {walletLoading ? (
                  <div className="h-12 w-64 rounded-lg bg-white/10 animate-pulse" />
                ) : (
                  <p className="text-white text-4xl md:text-5xl font-bold tabular-nums">
                    {formatCurrency(wallet?.availableBalance ?? 0)}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-blue-300 text-xs mb-1">Tổng số dư</p>
                  <p className="text-blue-100 font-semibold tabular-nums">
                    {wallet ? formatCurrency(wallet.balance) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-blue-300 text-xs mb-1">Đang khóa</p>
                  <p className="text-amber-300 font-semibold tabular-nums">
                    {wallet ? formatCurrency(wallet.lockedBalance) : "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdraw(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Rút tiền
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeposit(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                  </svg>
                  Nạp tiền
                </button>
                <Link
                  href="/wallet/deposit/my"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm text-white/80 border border-white/10 rounded-xl text-sm hover:bg-white/15 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Lịch sử nạp
                </Link>
              </div>
            </div>

            {/* Right: wallet info panel */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 lg:min-w-[240px]">
              <p className="text-blue-200 text-xs font-medium mb-4 uppercase tracking-wider">Thông tin ví</p>
              <div className="space-y-4">
                <div>
                  <p className="text-blue-300 text-xs mb-1">Loại ví</p>
                  <p className="text-white font-semibold text-sm">
                    {wallet?.ownerType === "USER" ? "Ví cá nhân" : wallet?.ownerType ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-blue-300 text-xs mb-1">Trạng thái</p>
                  <span className="inline-flex items-center gap-1.5 text-emerald-300 text-sm font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Hoạt động
                  </span>
                </div>
                <div>
                  <p className="text-blue-300 text-xs mb-1">Tỷ lệ khả dụng</p>
                  <p className="text-white font-semibold text-sm">
                    {wallet && wallet.balance > 0
                      ? Math.round((wallet.availableBalance / wallet.balance) * 100) + "%"
                      : "100%"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Giao dịch gần đây</h2>
          <Link
            href="/wallet/transactions"
            className="text-sm text-blue-700 hover:text-blue-700 transition-colors"
          >
            Xem tất cả →
          </Link>
        </div>

        {transactionsLoading ? (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin h-7 w-7 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500">Chưa có giao dịch nào.</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => {
              const positive = transaction.amount >= 0;
              return (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() => router.push(`/wallet/transactions/${transaction.id}`)}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-200 hover:bg-blue-100/40 transition-all text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {getTransactionTypeLabel(transaction.type)}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {transaction.description ?? "Không có mô tả"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{formatDateTime(transaction.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${positive ? "text-emerald-700" : "text-rose-700"}`}>
                      {positive ? "+" : ""}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <span
                      className={`inline-flex px-2 py-0.5 mt-1 text-[11px] border rounded-full ${getTransactionStatusClass(transaction.status)}`}
                    >
                      {getTransactionStatusLabel(transaction.status)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
      {showWithdraw && <WithdrawModal wallet={wallet} onClose={() => setShowWithdraw(false)} />}
    </div>
  );
}
