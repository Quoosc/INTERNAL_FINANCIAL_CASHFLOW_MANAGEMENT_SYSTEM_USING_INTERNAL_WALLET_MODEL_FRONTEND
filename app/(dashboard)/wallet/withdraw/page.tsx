"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// =============================================================
// Withdraw Page - Client Component (form rút tiền)
// =============================================================

export default function WithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      // TODO: Gọi API withdraw khi Backend ready
      // await api.post("/api/v1/wallet/withdraw", { amount: Number(amount), pin, bankAccount });
      alert("Chức năng rút tiền sẽ được kết nối khi Backend API sẵn sàng");
      router.push("/wallet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rút tiền thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rút tiền về ngân hàng</h1>
        <p className="text-gray-400 mt-1">Nhập thông tin để rút tiền từ ví</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Số tiền rút (VND)</label>
            <input type="number" min="10000" required value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              placeholder="Nhập số tiền" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Số tài khoản ngân hàng</label>
            <input type="text" required value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              placeholder="VD: 1234567890" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Mã PIN giao dịch</label>
            <input type="password" maxLength={6} required value={pin} onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all tracking-[0.5em]"
              placeholder="••••••" />
          </div>
        </div>

        <button type="submit" disabled={isLoading || !amount || !pin}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25">
          {isLoading ? "Đang xử lý..." : "Rút tiền"}
        </button>
      </form>
    </div>
  );
}
