"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { firstLoginSetup } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api-client";

// =============================================================
// First Login Setup Page — gộp đổi mật khẩu + tạo PIN (1 bước)
// Gọi POST /api/v1/auth/first-login/complete
// { setupToken, newPassword, confirmPassword, pin }
// setupToken lấy từ sessionStorage["setup_token"] (set bởi login page)
// =============================================================

interface SetupForm {
  newPassword: string;
  confirmPassword: string;
  pin: string;
  confirmPin: string;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [form, setForm] = useState<SetupForm>({
    newPassword: "",
    confirmPassword: "",
    pin: "",
    confirmPin: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra setupToken — nếu không có thì redirect về login
  useEffect(() => {
    const token = sessionStorage.getItem("setup_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const handlePinInput = (field: "pin" | "confirmPin", value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setForm((prev) => ({ ...prev, [field]: digits }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (!/^\d{5}$/.test(form.pin)) {
      setError("PIN phải là 5 chữ số");
      return;
    }
    if (form.pin !== form.confirmPin) {
      setError("PIN xác nhận không khớp");
      return;
    }

    const setupToken = sessionStorage.getItem("setup_token");
    if (!setupToken) {
      setError("Phiên thiết lập đã hết hạn, vui lòng đăng nhập lại");
      router.replace("/login");
      return;
    }

    setIsLoading(true);
    try {
      const response = await firstLoginSetup({
        setupToken,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
        pin: form.pin,
      });

      sessionStorage.removeItem("setup_token");

      if (response.user) {
        setUser(response.user);
      }

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Thiết lập tài khoản thất bại, vui lòng thử lại");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-violet-500 mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Thiết lập tài khoản</h1>
        <p className="text-sm text-gray-400 mt-1">Đây là lần đầu đăng nhập — đặt mật khẩu và mã PIN</p>
      </div>

      {/* Info Banner */}
      <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 text-sm">
        Vui lòng đặt mật khẩu mới (tối thiểu 8 ký tự) và mã PIN giao dịch (5 chữ số) để tiếp tục.
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mật khẩu section */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mật khẩu mới</p>
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
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
              Xác nhận mật khẩu
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
        </div>

        <div className="border-t border-white/10" />

        {/* PIN section */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mã PIN giao dịch</p>
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
            <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-300 mb-1.5">
              Xác nhận mã PIN
            </label>
            <input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              required
              value={form.confirmPin}
              onChange={(e) => handlePinInput("confirmPin", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all tracking-[0.5em] text-center text-xl"
              placeholder="•••••"
              maxLength={5}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || form.pin.length < 5 || form.confirmPin.length < 5}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-violet-600 text-white font-semibold hover:from-amber-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang thiết lập...
            </span>
          ) : (
            "Hoàn tất thiết lập"
          )}
        </button>
      </form>
    </div>
  );
}
