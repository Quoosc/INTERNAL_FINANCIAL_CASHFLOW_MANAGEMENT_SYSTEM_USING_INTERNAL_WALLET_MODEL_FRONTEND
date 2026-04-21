"use client";

import Link from "next/link";

// Legacy route retained for backward compatibility.
// First-login setup is now handled at /change-password in a single step.
export default function CreatePinPage() {
  return (
    <div className="max-w-md mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-4">
      <h1 className="text-2xl font-bold text-white">Route đã ngừng sử dụng</h1>
      <p className="text-slate-300 text-sm">
        Luồng đăng nhập lần đầu mới đã gộp đổi mật khẩu và tạo PIN trong 1 bước.
      </p>
      <Link
        href="/change-password"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
      >
        Đến trang thiết lập tài khoản
      </Link>
    </div>
  );
}
