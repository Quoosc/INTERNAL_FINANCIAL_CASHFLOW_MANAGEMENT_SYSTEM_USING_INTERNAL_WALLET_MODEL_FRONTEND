"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// =============================================================
// Deposit Page - Client Component (form nạp tiền)
// =============================================================

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN").format(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      // TODO: Gọi API deposit khi Backend ready
      // await api.post("/api/v1/wallet/deposit", { amount: Number(amount) });
      alert("Chức năng nạp tiền sẽ được kết nối khi Backend API sẵn sàng");
      router.push("/wallet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nạp tiền thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Nạp tiền vào ví</h1>
        <p className="text-gray-400 mt-1">Chọn số tiền và phương thức nạp</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Input */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Số tiền (VND)</label>
          <input
            type="number"
            min="10000"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xl font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            placeholder="0"
          />
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {quickAmounts.map((qa) => (
              <button
                key={qa}
                type="button"
                onClick={() => setAmount(String(qa))}
                className="py-2 px-3 rounded-lg bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 text-sm text-gray-300 hover:text-blue-400 transition-all"
              >
                {formatCurrency(qa)}đ
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !amount}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
        >
          {isLoading ? "Đang xử lý..." : "Nạp tiền"}
        </button>
      </form>
    </div>
  );
}
