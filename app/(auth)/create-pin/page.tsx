"use client";

import Link from "next/link";

// Legacy route retained for backward compatibility.
// First-login setup is now handled at /change-password in a single step.
export default function CreatePinPage() {
  return (
    <div className="max-w-md mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-4">
      <h1 className="text-2xl font-bold text-white">Route da ngung su dung</h1>
      <p className="text-slate-300 text-sm">
        Luong first-login moi da gom doi mat khau va tao PIN trong 1 buoc.
      </p>
      <Link
        href="/change-password"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
      >
        Den trang thiet lap tai khoan
      </Link>
    </div>
  );
}
