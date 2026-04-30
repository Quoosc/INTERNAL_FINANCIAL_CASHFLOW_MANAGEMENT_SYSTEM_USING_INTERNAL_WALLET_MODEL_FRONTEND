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

  // Step 1 fields
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 fields
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              {step === "request" ? "Quên mật khẩu" : "Nhập mã OTP"}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {step === "request"
                ? "Nhập email và mật khẩu mới. Chúng tôi sẽ gửi mã OTP để xác nhận."
                : `Mã OTP đã được gửi đến ${email}. Nhập mã để hoàn tất đặt lại mật khẩu.`}
            </p>
          </div>

          {notice && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
              {notice}
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={(e) => void handleRequest(e)} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@company.com"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {loading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1.5">
                  Mã OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Nhập mã OTP từ email"
                  autoComplete="one-time-code"
                  maxLength={10}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 tracking-widest text-center"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {loading ? "Đang xác nhận..." : "Xác nhận đặt lại mật khẩu"}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
              >
                Quay lại
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            Nhớ mật khẩu rồi?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
