"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { ApiError, api } from "@/lib/api-client";
import {
  PaginatedResponse,
  TransactionResponse,
  TransactionStatus,
  TransactionType,
} from "@/types";

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

  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const loadRecentTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    setTransactionsError(null);

    try {
      const res = await api.get<WalletTransactionsResponse>(
        "/api/v1/wallet/transactions?page=0&size=5"
      );
      setTransactions(normalizeTransactions(res.data).slice(0, 5));
    } catch (err) {
      setTransactions([]);
      if (err instanceof ApiError) {
        setTransactionsError(err.apiMessage);
      } else {
        setTransactionsError("Không thể tải giao dịch gần đây.");
      }
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

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
                <Link
                  href="/wallet/withdraw"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Rút tiền
                </Link>
                <Link
                  href="/wallet/deposit"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                  </svg>
                  Nạp tiền
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

        {transactionsError && (
          <p className="text-amber-700 text-xs mt-3">{transactionsError}</p>
        )}
      </div>
    </div>
  );
}
