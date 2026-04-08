"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api-client";
import type { LoginRequest } from "@/types";

// =============================================================
// Login Page — 2-panel layout
// Role selector: UI-only (không gửi lên API — backend tự xác định role từ credentials)
// API: POST /api/v1/auth/login { email, password }
// =============================================================

type DisplayRole = "EMPLOYEE" | "TEAM_LEADER" | "MANAGER" | "ACCOUNTANT" | "CFO" | "ADMIN";

interface RoleConfig {
  role: DisplayRole;
  label: string;
  hint: string;
  textColor: string;
  border: string;
  bg: string;
  dot: string;
  buttonBg: string;
  icon: React.ReactNode;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: "EMPLOYEE",
    label: "Nhân viên",
    hint: "Tài chính cá nhân & yêu cầu",
    textColor: "text-blue-600",
    border: "border-blue-500",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
    buttonBg: "bg-blue-600 hover:bg-blue-700",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    role: "TEAM_LEADER",
    label: "Team Leader",
    hint: "Duyệt chi tiêu & quản lý DA",
    textColor: "text-amber-600",
    border: "border-amber-500",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
    buttonBg: "bg-amber-500 hover:bg-amber-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    role: "MANAGER",
    label: "Manager",
    hint: "Duyệt ngân sách & phòng ban",
    textColor: "text-indigo-600",
    border: "border-indigo-500",
    bg: "bg-indigo-50",
    dot: "bg-indigo-500",
    buttonBg: "bg-indigo-600 hover:bg-indigo-700",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    role: "ACCOUNTANT",
    label: "Kế toán",
    hint: "Giải ngân & bảng lương",
    textColor: "text-teal-600",
    border: "border-teal-500",
    bg: "bg-teal-50",
    dot: "bg-teal-500",
    buttonBg: "bg-teal-600 hover:bg-teal-700",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    role: "ADMIN",
    label: "Admin",
    hint: "Quản trị hệ thống",
    textColor: "text-violet-600",
    border: "border-violet-500",
    bg: "bg-violet-50",
    dot: "bg-violet-500",
    buttonBg: "bg-violet-600 hover:bg-violet-700",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    role: "CFO",
    label: "CFO",
    hint: "Duyet cap von phong ban",
    textColor: "text-rose-600",
    border: "border-rose-500",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
    buttonBg: "bg-rose-600 hover:bg-rose-700",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// ─── Role Card ────────────────────────────────────────────────────────────────

function RoleCard({
  config,
  selected,
  onClick,
}: {
  config: RoleConfig;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center w-full",
        selected
          ? `${config.border} ${config.bg}`
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      <div className={["p-2 rounded-lg", selected ? config.bg : "bg-slate-100"].join(" ")}>
        <span className={selected ? config.textColor : "text-slate-400"}>
          {config.icon}
        </span>
      </div>
      <p className={["text-sm font-semibold leading-tight", selected ? config.textColor : "text-slate-600"].join(" ")}>
        {config.label}
      </p>
      <p className="text-[11px] text-slate-400 leading-tight">{config.hint}</p>
      {selected && (
        <span className={["w-1.5 h-1.5 rounded-full", config.dot].join(" ")} />
      )}
    </button>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [selectedRole, setSelectedRole] = useState<DisplayRole>("EMPLOYEE");
  const [form, setForm] = useState<LoginRequest>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activeConfig = ROLE_CONFIGS.find((c) => c.role === selectedRole)!;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Chỉ gửi email + password — backend tự xác định role từ JWT
      const response = await login(form);

      if (response.requiresSetup) {
        // First-login: backend cấp setupToken thay vì accessToken
        // Lưu setupToken tạm thời vào sessionStorage để trang change-password dùng
        if (response.setupToken) {
          sessionStorage.setItem("setup_token", response.setupToken);
        }
        router.push("/change-password");
      } else if (response.user) {
        setUser(response.user);
        router.push("/dashboard");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel: Branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 relative overflow-hidden items-center justify-center">

        {/* Cube pattern background */}
        <div className="absolute inset-0 opacity-10 text-white">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cube-pattern" x="0" y="0" width="60" height="105" patternUnits="userSpaceOnUse">
                <path d="M30 0 L60 15 L60 45 L30 60 L0 45 L0 15 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <path d="M30 60 L30 90 L0 75 L0 45 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <path d="M30 60 L30 90 L60 75 L60 45 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cube-pattern)" />
          </svg>
        </div>

        {/* Glow blobs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        {/* Branding card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-10 max-w-sm w-full mx-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-5">
            <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">IFMS Finance</h1>
          <p className="text-blue-200 text-sm">Precision in every transaction</p>

          <div className="mt-10 pt-8 border-t border-white/20 space-y-4 text-left">
            <BrandFeature
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              text="Quản lý dòng tiền nội bộ theo thời gian thực"
            />
            <BrandFeature
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              text="Quy trình phê duyệt nhiều cấp bảo mật"
            />
            <BrandFeature
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              text="Báo cáo tài chính & kiểm toán minh bạch"
            />
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">IFMS Finance</h2>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Chào mừng trở lại</h1>
            <p className="text-slate-500 text-sm mt-1">Đăng nhập để truy cập hệ thống.</p>
          </div>

          {/* ── Role Selector (UI only) ── */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Đăng nhập với vai trò
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_CONFIGS.map((config) => (
                <RoleCard
                  key={config.role}
                  config={config}
                  selected={selectedRole === config.role}
                  onClick={() => { setSelectedRole(config.role); setError(""); }}
                />
              ))}
            </div>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email công việc
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your.name@ifms.vn"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-11 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit — màu theo role đã chọn */}
            <button
              type="submit"
              disabled={isLoading}
              className={[
                "w-full py-2.5 px-4 rounded-lg text-white font-semibold text-sm transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                activeConfig.buttonBg,
              ].join(" ")}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                `Đăng nhập với vai trò ${activeConfig.label}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function BrandFeature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-blue-300 shrink-0">{icon}</span>
      <p className="text-blue-100/80 text-sm">{text}</p>
    </div>
  );
}
