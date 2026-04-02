"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { changePasswordFirstLogin } from "@/lib/auth";
import type { FirstLoginChangePasswordRequest } from "@/types";

// =============================================================
// Change Password Page — isFirstLogin flow (bước 1/2)
// Gọi POST /api/v1/auth/change-password { newPassword }
// Không cần mật khẩu cũ (isFirstLogin = true)
// =============================================================

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState<FirstLoginChangePasswordRequest & { confirm: string }>({
    newPassword: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);
    try {
      await changePasswordFirstLogin({ newPassword: form.newPassword });
      router.push("/create-pin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đổi mật khẩu thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Đổi mật khẩu</h1>
        <p className="text-sm text-gray-400 mt-1">Bước 1/2 — Thiết lập mật khẩu mới của bạn</p>
      </div>

      {/* Info Banner */}
      <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
        Đây là lần đầu đăng nhập. Vui lòng đổi mật khẩu trước khi tiếp tục.
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
            Mật khẩu mới
          </label>
          <input
            id="newPassword"
            type="password"
            required
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            placeholder="Tối thiểu 8 ký tự"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-1.5">
            Xác nhận mật khẩu
          </label>
          <input
            id="confirm"
            type="password"
            required
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white font-semibold hover:from-amber-500 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-amber-500/25"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang xử lý...
            </span>
          ) : (
            "Tiếp tục"
          )}
        </button>
      </form>
    </div>
  );
}
