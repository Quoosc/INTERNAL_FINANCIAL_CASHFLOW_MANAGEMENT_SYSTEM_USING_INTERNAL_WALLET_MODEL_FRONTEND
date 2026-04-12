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
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case TransactionStatus.PENDING:
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case TransactionStatus.FAILED:
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/20";
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ví của tôi</h1>
          <p className="text-slate-400 mt-1">Theo dõi số dư và giao dịch cá nhân</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/wallet/deposit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m6-6H6" />
            </svg>
            Nạp tiền
          </Link>
          <Link
            href="/wallet/withdraw"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold border border-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Rút tiền
          </Link>
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-6">
        <p className="text-slate-400 text-sm">Số dư khả dụng</p>
        {walletLoading ? (
          <div className="mt-2 h-10 w-56 rounded bg-slate-700 animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(wallet?.availableBalance ?? 0)}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
          <div className="bg-slate-900/50 rounded-xl border border-white/10 p-4">
            <p className="text-xs text-slate-500">Tổng số dư</p>
            <p className="text-lg font-semibold text-white mt-1">
              {wallet ? formatCurrency(wallet.balance) : "---"}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-white/10 p-4">
            <p className="text-xs text-slate-500">Tiền đang khóa</p>
            <p className="text-lg font-semibold text-amber-400 mt-1">
              {wallet ? formatCurrency(wallet.lockedBalance) : "---"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Giao dịch gần đây</h2>
          <Link
            href="/wallet/transactions"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
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
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-white/5 hover:border-white/20 hover:bg-slate-700/40 transition-all text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {getTransactionTypeLabel(transaction.type)}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {transaction.description ?? "Không có mô tả"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{formatDateTime(transaction.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
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
          <p className="text-amber-400 text-xs mt-3">{transactionsError}</p>
        )}
      </div>
    </div>
  );
}
