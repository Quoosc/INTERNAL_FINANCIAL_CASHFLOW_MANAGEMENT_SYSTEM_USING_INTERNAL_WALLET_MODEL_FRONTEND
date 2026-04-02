"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api, ApiError } from "@/lib/api-client";
import type { CreatePinRequest } from "@/types";

// =============================================================
// Create PIN Page — isFirstLogin flow (bước 2/2)
// Gọi POST /api/v1/users/me/pin { pin: string (5 chữ số) }
// Sau khi thành công: setUser isFirstLogin=false → /dashboard
// =============================================================

export default function CreatePinPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState<CreatePinRequest & { confirm: string }>({
    pin: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{5}$/.test(form.pin)) {
      setError("PIN phải là 5 chữ số");
      return;
    }
    if (form.pin !== form.confirm) {
      setError("PIN xác nhận không khớp");
      return;
    }

    setIsLoading(true);
    try {
      await api.post<{ message: string }>("/api/v1/users/me/pin", { pin: form.pin });

      // Cập nhật isFirstLogin = false trong AuthContext
      if (user) {
        setUser({ ...user, isFirstLogin: false });
      }

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Tạo PIN thất bại, vui lòng thử lại");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinInput = (
    field: "pin" | "confirm",
    value: string
  ) => {
    // Chỉ cho phép nhập số, tối đa 5 ký tự
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setForm((prev) => ({ ...prev, [field]: digits }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-400 mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Tạo mã PIN</h1>
        <p className="text-sm text-gray-400 mt-1">Bước 2/2 — Thiết lập PIN giao dịch (5 chữ số)</p>
      </div>

      {/* Info Banner */}
      <div className="mb-5 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm">
        PIN dùng để xác thực khi rút tiền và thực hiện giao dịch quan trọng.
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-gray-300 mb-1.5">
            Mã PIN (5 chữ số)
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            required
            value={form.pin}
            onChange={(e) => handlePinInput("pin", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all tracking-[0.5em] text-center text-xl"
            placeholder="•••••"
            maxLength={5}
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-1.5">
            Xác nhận mã PIN
          </label>
          <input
            id="confirm"
            type="password"
            inputMode="numeric"
            required
            value={form.confirm}
            onChange={(e) => handlePinInput("confirm", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all tracking-[0.5em] text-center text-xl"
            placeholder="•••••"
            maxLength={5}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || form.pin.length < 5 || form.confirm.length < 5}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold hover:from-violet-500 hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-500/25"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tạo PIN...
            </span>
          ) : (
            "Hoàn tất"
          )}
        </button>
      </form>
    </div>
  );
}
