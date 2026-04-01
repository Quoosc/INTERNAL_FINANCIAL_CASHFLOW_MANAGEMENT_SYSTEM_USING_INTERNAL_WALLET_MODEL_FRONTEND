"use client";

import React from "react";
import { useRouter } from "next/navigation";

// =============================================================
// Register Page - DEPRECATED
// Backend mới: Admin tạo user, không có self-registration
// Trang này redirect về /login
// =============================================================

export default function RegisterPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Redirect về login — không hỗ trợ self-registration
    router.replace("/login");
  }, [router]);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Tính năng không khả dụng</h1>
        <p className="text-gray-400 mb-6">
          Hệ thống không hỗ trợ tự đăng ký. Vui lòng liên hệ Admin để được cấp tài khoản.
        </p>
        <a
          href="/login"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-semibold hover:from-cyan-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-cyan-500/25"
        >
          ← Về trang đăng nhập
        </a>
      </div>
    </div>
  );
}
