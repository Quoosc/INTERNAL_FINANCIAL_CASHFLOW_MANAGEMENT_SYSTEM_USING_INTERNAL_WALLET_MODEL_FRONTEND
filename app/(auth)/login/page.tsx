// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  LOGIN PAGE — hiện đang ở CHẾ ĐỘ MOCK (preview UI, không gọi backend)   ║
// ║                                                                          ║
// ║  Cách khôi phục flow đăng nhập THẬT khi backend sẵn sàng:               ║
// ║    1. Xoá toàn bộ block có marker  [MOCK:START] ... [MOCK:END]          ║
// ║    2. Bỏ comment toàn bộ block  [ORIGINAL:START] ... [ORIGINAL:END]     ║
// ║       (Trong VS Code: chọn block → Ctrl+/ để toggle line comment)       ║
// ║    3. Xoá dòng `export { };` ở cuối (chỉ tồn tại để file có default     ║
// ║       export khi cả hai block đều bị tắt trong quá trình chuyển đổi)    ║
// ║    4. Kiểm tra: npm run lint                                             ║
// ║                                                                          ║
// ║  Xem chi tiết: docs/MOCK_AUTH_ROLLBACK.md                               ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ─── [MOCK:START] ─────────────────────────────────────────────────────────

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { AuthUser } from "@/types";

// =============================================================
// Login Page — MOCK MODE (không gọi backend)
// Chỉ hiển thị quick-login theo vai trò để duyệt giao diện.
// Khi bấm button: set mock token + user_info + mock_auth flag, sau đó push /dashboard.
// Khi cần nối lại backend thật: xoá file này và dùng git để khôi phục bản login cũ.
// =============================================================

type DisplayRole =
  | "EMPLOYEE"
  | "TEAM_LEADER"
  | "MANAGER"
  | "ACCOUNTANT"
  | "CFO"
  | "ADMIN";

interface RoleConfig {
  role: DisplayRole;
  title: string;
  subtitle: string;
  accent: string; // left bar color
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: "ADMIN",
    title: "ADMIN",
    subtitle: "Quản trị hệ thống",
    accent: "bg-rose-500",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    role: "MANAGER",
    title: "MANAGER",
    subtitle: "Duyệt ngân sách phòng ban",
    accent: "bg-amber-500",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    role: "TEAM_LEADER",
    title: "TEAM LEADER",
    subtitle: "Duyệt chi tiêu & dự án",
    accent: "bg-yellow-500",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    role: "ACCOUNTANT",
    title: "ACCOUNTANT",
    subtitle: "Giải ngân & bảng lương",
    accent: "bg-teal-500",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    role: "CFO",
    title: "CFO",
    subtitle: "Duyệt cấp vốn công ty",
    accent: "bg-indigo-500",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    role: "EMPLOYEE",
    title: "EMPLOYEE",
    subtitle: "Yêu cầu & phiếu lương",
    accent: "bg-blue-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

// Fake JWT payload: valid-looking 3-part token. Not signed — never sent to real backend.
const MOCK_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9." +
  btoa(JSON.stringify({ sub: "mock", exp: 9999999999 })).replace(/=/g, "") +
  ".mock-signature";

const MOCK_USERS: Record<DisplayRole, AuthUser> = {
  EMPLOYEE: {
    id: 101,
    fullName: "Nguyễn Văn Nhân Viên",
    email: "employee@ifms.vn",
    role: "EMPLOYEE",
    departmentId: 1,
    departmentName: "Phòng Marketing",
    avatar: null,
    isFirstLogin: false,
    status: "ACTIVE",
  },
  TEAM_LEADER: {
    id: 102,
    fullName: "Trần Thị Trưởng Nhóm",
    email: "leader@ifms.vn",
    role: "TEAM_LEADER",
    departmentId: 1,
    departmentName: "Phòng Marketing",
    avatar: null,
    isFirstLogin: false,
    status: "ACTIVE",
  },
  MANAGER: {
    id: 103,
    fullName: "Lê Minh Quản Lý",
    email: "manager@ifms.vn",
    role: "MANAGER",
    departmentId: 1,
    departmentName: "Phòng Marketing",
    avatar: null,
    isFirstLogin: false,
    status: "ACTIVE",
  },
  ACCOUNTANT: {
    id: 104,
    fullName: "Phạm Thu Kế Toán",
    email: "accountant@ifms.vn",
    role: "ACCOUNTANT",
    departmentId: 2,
    departmentName: "Phòng Kế toán",
    avatar: null,
    isFirstLogin: false,
    status: "ACTIVE",
  },
  CFO: {
    id: 105,
    fullName: "Đỗ Hoàng CFO",
    email: "cfo@ifms.vn",
    role: "CFO",
    departmentId: null,
    departmentName: null,
    avatar: null,
    isFirstLogin: false,
    status: "ACTIVE",
  },
  ADMIN: {
    id: 106,
    fullName: "Admin Hệ Thống",
    email: "admin@ifms.vn",
    role: "ADMIN",
    departmentId: null,
    departmentName: null,
    avatar: null,
    isFirstLogin: false,
    status: "ACTIVE",
  },
};

function persistMockAuth() {
  localStorage.setItem("access_token", MOCK_TOKEN);
  localStorage.setItem("refresh_token", MOCK_TOKEN);
  localStorage.setItem("mock_auth", "true");
  document.cookie = `access_token=${MOCK_TOKEN}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

function RoleQuickButton({
  config,
  onClick,
}: {
  config: RoleConfig;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 text-left w-full overflow-hidden"
    >
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`}
        aria-hidden
      />
      <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0 ml-1`}>
        <span className={config.iconColor}>{config.icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900 tracking-tight truncate">
          {config.title}
        </p>
        <p className="text-xs text-slate-500 truncate">{config.subtitle}</p>
      </div>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const handleQuickLogin = (role: DisplayRole) => {
    const user = MOCK_USERS[role];
    persistMockAuth();
    setUser(user);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 relative overflow-hidden items-center justify-center">
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

        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-10 max-w-sm w-full mx-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-5">
            <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">IFMS Finance</h1>
          <p className="text-blue-200 text-sm">Precision in every transaction</p>
          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-blue-100/70 text-xs leading-relaxed">
              Chế độ xem trước giao diện — chọn một vai trò để khám phá hệ thống mà không cần backend.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Quick Login ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">IFMS Finance</h2>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Xem trước giao diện</h1>
            <p className="text-slate-500 text-sm mt-1">
              Backend chưa sẵn sàng. Chọn vai trò để duyệt UI tương ứng.
            </p>
          </div>

          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Chế độ Mock:</strong> mọi API đều sẽ fail graceful, dữ liệu sẽ không tải được.
              Chỉ dùng để kiểm tra layout, sidebar, và điều hướng theo role.
            </p>
          </div>

          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đăng nhập nhanh theo vai trò
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {ROLE_CONFIGS.map((config) => (
              <RoleQuickButton
                key={config.role}
                config={config}
                onClick={() => handleQuickLogin(config.role)}
              />
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Form đăng nhập thật đã tạm vô hiệu hoá. Khôi phục qua git khi backend sẵn sàng.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── [MOCK:END] ───────────────────────────────────────────────────────────


// ─── [ORIGINAL:START] ─ Bỏ comment toàn bộ block này để khôi phục flow thật ─

// "use client";
// 
// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import { login } from "@/lib/auth";
// import { useAuth } from "@/contexts/auth-context";
// import { ApiError } from "@/lib/api-client";
// import type { LoginRequest } from "@/types";
// 
// // =============================================================
// // Login Page — 2-panel layout
// // Role selector: UI-only (không gửi lên API — backend tự xác định role từ credentials)
// // API: POST /api/v1/auth/login { email, password }
// // =============================================================
// 
// type DisplayRole = "EMPLOYEE" | "TEAM_LEADER" | "MANAGER" | "ACCOUNTANT" | "CFO" | "ADMIN";
// 
// interface RoleConfig {
//   role: DisplayRole;
//   label: string;
//   hint: string;
//   textColor: string;
//   border: string;
//   bg: string;
//   dot: string;
//   buttonBg: string;
//   icon: React.ReactNode;
// }
// 
// const ROLE_CONFIGS: RoleConfig[] = [
//   {
//     role: "EMPLOYEE",
//     label: "Nhân viên",
//     hint: "Tài chính cá nhân & yêu cầu",
//     textColor: "text-blue-600",
//     border: "border-blue-500",
//     bg: "bg-blue-50",
//     dot: "bg-blue-500",
//     buttonBg: "bg-blue-600 hover:bg-blue-700",
//     icon: (
//       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//           d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//       </svg>
//     ),
//   },
//   {
//     role: "TEAM_LEADER",
//     label: "Team Leader",
//     hint: "Duyệt chi tiêu & quản lý DA",
//     textColor: "text-amber-600",
//     border: "border-amber-500",
//     bg: "bg-amber-50",
//     dot: "bg-amber-500",
//     buttonBg: "bg-amber-500 hover:bg-amber-600",
//     icon: (
//       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//           d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
//       </svg>
//     ),
//   },
//   {
//     role: "MANAGER",
//     label: "Manager",
//     hint: "Duyệt ngân sách & phòng ban",
//     textColor: "text-indigo-600",
//     border: "border-indigo-500",
//     bg: "bg-indigo-50",
//     dot: "bg-indigo-500",
//     buttonBg: "bg-indigo-600 hover:bg-indigo-700",
//     icon: (
//       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//           d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//       </svg>
//     ),
//   },
//   {
//     role: "ACCOUNTANT",
//     label: "Kế toán",
//     hint: "Giải ngân & bảng lương",
//     textColor: "text-teal-600",
//     border: "border-teal-500",
//     bg: "bg-teal-50",
//     dot: "bg-teal-500",
//     buttonBg: "bg-teal-600 hover:bg-teal-700",
//     icon: (
//       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//           d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
//       </svg>
//     ),
//   },
//   {
//     role: "ADMIN",
//     label: "Admin",
//     hint: "Quản trị hệ thống",
//     textColor: "text-violet-600",
//     border: "border-violet-500",
//     bg: "bg-violet-50",
//     dot: "bg-violet-500",
//     buttonBg: "bg-violet-600 hover:bg-violet-700",
//     icon: (
//       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//           d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//           d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//       </svg>
//     ),
//   },
//   {
//     role: "CFO",
//     label: "CFO",
//     hint: "Duyet cap von phong ban",
//     textColor: "text-rose-600",
//     border: "border-rose-500",
//     bg: "bg-rose-50",
//     dot: "bg-rose-500",
//     buttonBg: "bg-rose-600 hover:bg-rose-700",
//     icon: (
//       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//           d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//       </svg>
//     ),
//   },
// ];
// 
// // ─── Role Card ────────────────────────────────────────────────────────────────
// 
// function RoleCard({
//   config,
//   selected,
//   onClick,
// }: {
//   config: RoleConfig;
//   selected: boolean;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={[
//         "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center w-full",
//         selected
//           ? `${config.border} ${config.bg}`
//           : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
//       ].join(" ")}
//     >
//       <div className={["p-2 rounded-lg", selected ? config.bg : "bg-slate-100"].join(" ")}>
//         <span className={selected ? config.textColor : "text-slate-400"}>
//           {config.icon}
//         </span>
//       </div>
//       <p className={["text-sm font-semibold leading-tight", selected ? config.textColor : "text-slate-600"].join(" ")}>
//         {config.label}
//       </p>
//       <p className="text-[11px] text-slate-400 leading-tight">{config.hint}</p>
//       {selected && (
//         <span className={["w-1.5 h-1.5 rounded-full", config.dot].join(" ")} />
//       )}
//     </button>
//   );
// }
// 
// // ─── Login Page ───────────────────────────────────────────────────────────────
// 
// export default function LoginPage() {
//   const router = useRouter();
//   const { setUser } = useAuth();
// 
//   const [selectedRole, setSelectedRole] = useState<DisplayRole>("EMPLOYEE");
//   const [form, setForm] = useState<LoginRequest>({ email: "", password: "" });
//   const [showPassword, setShowPassword] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
// 
//   const activeConfig = ROLE_CONFIGS.find((c) => c.role === selectedRole)!;
// 
//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setError("");
//     setIsLoading(true);
// 
//     try {
//       // Chỉ gửi email + password — backend tự xác định role từ JWT
//       const response = await login(form);
// 
//       if (response.requiresSetup) {
//         // First-login: backend cấp setupToken thay vì accessToken
//         // Lưu setupToken tạm thời vào sessionStorage để trang change-password dùng
//         if (response.setupToken) {
//           sessionStorage.setItem("setup_token", response.setupToken);
//         }
//         router.push("/change-password");
//       } else if (response.user) {
//         setUser(response.user);
//         router.push("/dashboard");
//       }
//     } catch (err) {
//       if (err instanceof ApiError) {
//         setError(err.apiMessage);
//       } else {
//         setError("Đăng nhập thất bại. Vui lòng thử lại.");
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };
// 
//   return (
//     <div className="min-h-screen flex">
// 
//       {/* ── Left Panel: Branding ─────────────────────────────────────────── */}
//       <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 relative overflow-hidden items-center justify-center">
// 
//         {/* Cube pattern background */}
//         <div className="absolute inset-0 opacity-10 text-white">
//           <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
//             <defs>
//               <pattern id="cube-pattern" x="0" y="0" width="60" height="105" patternUnits="userSpaceOnUse">
//                 <path d="M30 0 L60 15 L60 45 L30 60 L0 45 L0 15 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
//                 <path d="M30 60 L30 90 L0 75 L0 45 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
//                 <path d="M30 60 L30 90 L60 75 L60 45 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
//               </pattern>
//             </defs>
//             <rect width="100%" height="100%" fill="url(#cube-pattern)" />
//           </svg>
//         </div>
// 
//         {/* Glow blobs */}
//         <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
//         <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
// 
//         {/* Branding card */}
//         <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-10 max-w-sm w-full mx-8 shadow-2xl text-center">
//           <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-5">
//             <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                 d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h1 className="text-3xl font-bold text-white mb-2">IFMS Finance</h1>
//           <p className="text-blue-200 text-sm">Precision in every transaction</p>
// 
//           <div className="mt-10 pt-8 border-t border-white/20 space-y-4 text-left">
//             <BrandFeature
//               icon={
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                     d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               }
//               text="Quản lý dòng tiền nội bộ theo thời gian thực"
//             />
//             <BrandFeature
//               icon={
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                     d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                 </svg>
//               }
//               text="Quy trình phê duyệt nhiều cấp bảo mật"
//             />
//             <BrandFeature
//               icon={
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                     d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                 </svg>
//               }
//               text="Báo cáo tài chính & kiểm toán minh bạch"
//             />
//           </div>
//         </div>
//       </div>
// 
//       {/* ── Right Panel: Form ─────────────────────────────────────────────── */}
//       <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
//         <div className="w-full max-w-md">
// 
//           {/* Mobile logo */}
//           <div className="lg:hidden mb-8 text-center">
//             <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow mb-3">
//               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                   d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//             <h2 className="text-xl font-bold text-slate-900">IFMS Finance</h2>
//           </div>
// 
//           {/* Heading */}
//           <div className="mb-6">
//             <h1 className="text-3xl font-bold text-slate-900">Chào mừng trở lại</h1>
//             <p className="text-slate-500 text-sm mt-1">Đăng nhập để truy cập hệ thống.</p>
//           </div>
// 
//           {/* ── Role Selector (UI only) ── */}
//           <div className="mb-6">
//             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
//               Đăng nhập với vai trò
//             </p>
//             <div className="grid grid-cols-2 gap-2">
//               {ROLE_CONFIGS.map((config) => (
//                 <RoleCard
//                   key={config.role}
//                   config={config}
//                   selected={selectedRole === config.role}
//                   onClick={() => { setSelectedRole(config.role); setError(""); }}
//                 />
//               ))}
//             </div>
//           </div>
// 
//           {/* ── Form ── */}
//           <form onSubmit={handleSubmit} className="space-y-4">
// 
//             {/* Email */}
//             <div className="space-y-1.5">
//               <label htmlFor="email" className="block text-sm font-medium text-slate-700">
//                 Email công việc
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                       d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                   </svg>
//                 </span>
//                 <input
//                   id="email"
//                   type="email"
//                   required
//                   autoComplete="email"
//                   value={form.email}
//                   onChange={(e) => setForm({ ...form, email: e.target.value })}
//                   placeholder="your.name@ifms.vn"
//                   className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
//                 />
//               </div>
//             </div>
// 
//             {/* Password */}
//             <div className="space-y-1.5">
//               <label htmlFor="password" className="block text-sm font-medium text-slate-700">
//                 Mật khẩu
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                       d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                   </svg>
//                 </span>
//                 <input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   required
//                   autoComplete="current-password"
//                   value={form.password}
//                   onChange={(e) => setForm({ ...form, password: e.target.value })}
//                   placeholder="Nhập mật khẩu"
//                   className="w-full pl-10 pr-11 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((v) => !v)}
//                   tabIndex={-1}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
//                 >
//                   {showPassword ? (
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                         d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                     </svg>
//                   ) : (
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                         d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                     </svg>
//                   )}
//                 </button>
//               </div>
//             </div>
// 
//             {/* Error */}
//             {error && (
//               <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-sm text-rose-700">
//                 {error}
//               </div>
//             )}
// 
//             {/* Remember me + Forgot password */}
//             <div className="flex items-center justify-between">
//               <label className="flex items-center gap-2 cursor-pointer select-none">
//                 <input
//                   type="checkbox"
//                   checked={rememberMe}
//                   onChange={(e) => setRememberMe(e.target.checked)}
//                   className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                 />
//                 <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
//               </label>
//               <a
//                 href="/forgot-password"
//                 className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
//               >
//                 Quên mật khẩu?
//               </a>
//             </div>
// 
//             {/* Submit — màu theo role đã chọn */}
//             <button
//               type="submit"
//               disabled={isLoading}
//               className={[
//                 "w-full py-2.5 px-4 rounded-lg text-white font-semibold text-sm transition-colors duration-200",
//                 "focus:outline-none focus:ring-2 focus:ring-offset-2",
//                 "disabled:opacity-50 disabled:cursor-not-allowed",
//                 activeConfig.buttonBg,
//               ].join(" ")}
//             >
//               {isLoading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                   </svg>
//                   Đang đăng nhập...
//                 </span>
//               ) : (
//                 `Đăng nhập với vai trò ${activeConfig.label}`
//               )}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
// 
// // ─── Helper ───────────────────────────────────────────────────────────────────
// 
// function BrandFeature({ icon, text }: { icon: React.ReactNode; text: string }) {
//   return (
//     <div className="flex items-start gap-3">
//       <span className="mt-0.5 text-blue-300 shrink-0">{icon}</span>
//       <p className="text-blue-100/80 text-sm">{text}</p>
//     </div>
//   );
// }

// ─── [ORIGINAL:END] ──────────────────────────────────────────────────────
