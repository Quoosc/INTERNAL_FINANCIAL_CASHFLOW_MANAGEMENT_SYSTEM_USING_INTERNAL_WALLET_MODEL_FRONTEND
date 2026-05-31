"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firstLoginSetup } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api-client";

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
    <main className="min-h-screen overflow-hidden bg-linear-to-br from-blue-800 via-blue-700 to-cyan-700 text-white">
      <div className="absolute inset-0 opacity-15">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="first-login-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M0 40H80M40 0V80" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <path d="M20 20h40v40H20z" stroke="currentColor" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#first-login-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_540px]">
        <section className="hidden items-center px-12 lg:flex">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-blue-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 11c0-1.657 1.79-3 4-3s4 1.343 4 3-1.79 3-4 3-4-1.343-4-3zm0 0v8m8-8v8M4 7h6m-6 4h6m-6 4h6" />
                </svg>
              </span>
              First login setup
            </div>
            <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-tight">
              Hoàn tất bảo mật tài khoản trước khi vào ví nội bộ.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100">
              Tạo mật khẩu mới và PIN giao dịch để xác thực các thao tác tài chính quan trọng.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 lg:bg-linear-to-br lg:from-slate-50 lg:via-white lg:to-blue-50">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white p-6 text-slate-950 shadow-2xl shadow-slate-950/30 sm:p-8">
            <div className="mb-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Secure onboarding</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Thiết lập tài khoản</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Đây là lần đầu đăng nhập. Đặt mật khẩu mới và mã PIN để tiếp tục.
              </p>
            </div>

            <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Mật khẩu cần tối thiểu 8 ký tự. PIN giao dịch gồm 5 chữ số.
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Mật khẩu mới</p>
                <PasswordField
                  id="newPassword"
                  label="Mật khẩu mới"
                  value={form.newPassword}
                  onChange={(value) => setForm((prev) => ({ ...prev, newPassword: value }))}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <PasswordField
                  id="confirmPassword"
                  label="Xác nhận mật khẩu"
                  value={form.confirmPassword}
                  onChange={(value) => setForm((prev) => ({ ...prev, confirmPassword: value }))}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="border-t border-slate-200" />

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Mã PIN giao dịch</p>
                <PinField
                  id="pin"
                  label="Mã PIN"
                  value={form.pin}
                  onChange={(value) => handlePinInput("pin", value)}
                />
                <PinField
                  id="confirmPin"
                  label="Xác nhận mã PIN"
                  value={form.confirmPin}
                  onChange={(value) => handlePinInput("confirmPin", value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || form.pin.length < 5 || form.confirmPin.length < 5}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Đang thiết lập..." : "Hoàn tất thiết lập"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="password"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
        placeholder={placeholder}
        autoComplete="new-password"
      />
    </div>
  );
}

function PinField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xl tracking-[0.5em] text-slate-950 placeholder-slate-300 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
        placeholder="•••••"
        maxLength={5}
        autoComplete="one-time-code"
      />
    </div>
  );
}
