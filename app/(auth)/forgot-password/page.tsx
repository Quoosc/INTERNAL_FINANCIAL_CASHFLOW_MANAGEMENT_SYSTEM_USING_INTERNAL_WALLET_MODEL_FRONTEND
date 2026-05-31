"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { forgotPassword, verifyPasswordReset } from "@/lib/auth";

type Step = "request" | "verify";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim(), newPassword, confirmPassword });
      setNotice("Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.");
      setStep("verify");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP.");
      return;
    }

    setLoading(true);
    try {
      await verifyPasswordReset({ email: email.trim(), otp: otp.trim() });
      router.push("/login?reset=success");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("request");
    setOtp("");
    setError(null);
    setNotice(null);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-linear-to-br from-blue-800 via-blue-700 to-cyan-700 text-white">
      <div className="absolute inset-0 opacity-15">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="auth-forgot-pattern" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M0 36H72M36 0V72" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <circle cx="36" cy="36" r="14" stroke="currentColor" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-forgot-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_520px]">
        <section className="hidden items-center px-12 lg:flex">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-blue-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              IFMS Finance
            </div>
            <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-tight">
              Khôi phục quyền truy cập nhanh và bảo mật.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100">
              Đặt mật khẩu mới, xác thực OTP qua email và quay lại không gian làm việc tài chính nội bộ.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 lg:bg-linear-to-br lg:from-slate-50 lg:via-white lg:to-blue-50">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white p-6 text-slate-950 shadow-2xl shadow-slate-950/30 sm:p-8">
            <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại đăng nhập
            </Link>

            <div className="mb-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                {step === "request" ? "Password reset" : "OTP verification"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {step === "request" ? "Quên mật khẩu" : "Nhập mã OTP"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {step === "request"
                  ? "Nhập email và mật khẩu mới. Hệ thống sẽ gửi mã OTP để xác nhận."
                  : `Mã OTP đã được gửi đến ${email}. Nhập mã để hoàn tất đặt lại mật khẩu.`}
              </p>
            </div>

            {notice && <Message tone="success" text={notice} />}
            {error && <Message tone="error" text={error} />}

            {step === "request" ? (
              <form onSubmit={(e) => void handleRequest(e)} className="space-y-4">
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="email@company.com"
                  autoComplete="email"
                />
                <Field
                  label="Mật khẩu mới"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                />
                <Field
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
                <Field
                  label="Mã OTP"
                  type="text"
                  value={otp}
                  onChange={setOtp}
                  placeholder="Nhập mã OTP từ email"
                  autoComplete="one-time-code"
                  maxLength={10}
                  center
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Đang xác nhận..." : "Xác nhận đặt lại mật khẩu"}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Quay lại
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Message({ tone, text }: { tone: "success" | "error"; text: string }) {
  const className = tone === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${className}`}>
      {text}
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  maxLength,
  center,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  maxLength?: number;
  center?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 ${center ? "text-center tracking-[0.4em]" : ""}`}
      />
    </div>
  );
}
