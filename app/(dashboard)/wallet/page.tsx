"use client";

import { useWallet } from "@/contexts/wallet-context";
import { useEffect } from "react";
import Link from "next/link";

// =============================================================
// Wallet Overview Page
// =============================================================

export default function WalletPage() {
  const { wallet, isLoading, fetchWallet } = useWallet();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ví của tôi</h1>
          <p className="text-gray-400 mt-1">Quản lý số dư và giao dịch</p>
        </div>
        <div className="flex gap-3">
          <Link href="/wallet/deposit" className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            Nạp tiền
          </Link>
          <Link href="/wallet/withdraw" className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10">
            Rút tiền
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
      ) : (
        <>
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20 rounded-2xl p-6">
              <p className="text-sm text-gray-400 mb-2">Số dư khả dụng</p>
              <p className="text-3xl font-bold text-white">{wallet ? formatCurrency(wallet.balance - wallet.pendingBalance) : "---"}</p>
              <p className="text-xs text-gray-500 mt-2">= Tổng số dư − Tiền treo</p>
            </div>
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20 rounded-2xl p-6">
              <p className="text-sm text-gray-400 mb-2">Tiền treo (Pending)</p>
              <p className="text-3xl font-bold text-amber-400">{wallet ? formatCurrency(wallet.pendingBalance) : "---"}</p>
              <p className="text-xs text-gray-500 mt-2">Đang chờ xử lý</p>
            </div>
            <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 border border-red-500/20 rounded-2xl p-6">
              <p className="text-sm text-gray-400 mb-2">Dư nợ tạm ứng</p>
              <p className="text-3xl font-bold text-red-400">{wallet ? formatCurrency(wallet.debtBalance) : "---"}</p>
              <p className="text-xs text-gray-500 mt-2">Sẽ tự động trừ khi nhận lương</p>
            </div>
          </div>

          {/* Transaction History Link */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Giao dịch gần đây</h2>
              <Link href="/wallet/transactions" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Xem tất cả →
              </Link>
            </div>
            <p className="text-gray-500 text-sm text-center py-8">Kết nối API để hiển thị giao dịch</p>
          </div>
        </>
      )}
    </div>
  );
}
