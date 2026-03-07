"use client";

// =============================================================
// Admin - System Settings Page - Client Component
// =============================================================

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cấu hình hệ thống</h1>
        <p className="text-gray-400 mt-1">Tham số hệ thống (hạn mức rút, duyệt, whitelist)</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        {[
          { label: "Hạn mức rút tiền / lần", key: "withdraw_limit" },
          { label: "Hạn mức duyệt Manager / lần", key: "manager_approve_limit" },
          { label: "Số lần nhập sai PIN tối đa", key: "max_pin_retries" },
          { label: "Thời gian khóa PIN (phút)", key: "pin_lock_duration" },
        ].map((config) => (
          <div key={config.key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <label className="text-sm text-gray-300">{config.label}</label>
            <input type="number"
              className="w-40 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="---" />
          </div>
        ))}
        <button className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all mt-4">
          Lưu cấu hình
        </button>
      </div>
    </div>
  );
}
