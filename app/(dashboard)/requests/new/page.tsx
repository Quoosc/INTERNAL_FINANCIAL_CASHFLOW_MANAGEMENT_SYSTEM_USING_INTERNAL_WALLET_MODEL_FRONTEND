"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RequestType } from "@/types";

// =============================================================
// New Request Page - Client Component (form tạo yêu cầu)
// =============================================================

export default function NewRequestPage() {
  const router = useRouter();
  const [type, setType] = useState<RequestType>(RequestType.ADVANCE);
  const [amount, setAmount] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const requestTypes = [
    { value: RequestType.ADVANCE, label: "Tạm ứng", desc: "Xin tiền cất vào ví" },
    { value: RequestType.EXPENSE, label: "Thanh toán chi phí", desc: "Thanh toán cho nhà cung cấp" },
    { value: RequestType.REIMBURSE, label: "Hoàn ứng", desc: "Nộp hóa đơn cấn trừ nợ" },
    { value: RequestType.QUOTA_TOPUP, label: "Xin cấp vốn", desc: "Cấp thêm hạn mức phòng ban" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      // TODO: Gọi API tạo request khi Backend ready
      alert("Chức năng tạo yêu cầu sẽ được kết nối khi Backend API sẵn sàng");
      router.push("/requests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo yêu cầu thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tạo yêu cầu mới</h1>
        <p className="text-gray-400 mt-1">Tạo yêu cầu tạm ứng, thanh toán hoặc hoàn ứng</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Loại yêu cầu</label>
          <div className="grid grid-cols-2 gap-3">
            {requestTypes.map((rt) => (
              <button key={rt.value} type="button" onClick={() => setType(rt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${type === rt.value ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}>
                <p className="font-medium text-sm">{rt.label}</p>
                <p className="text-xs mt-1 opacity-70">{rt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Project & Amount */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Dự án</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
              <option value="">Chọn dự án...</option>
              {/* TODO: Load projects từ API */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Số tiền (VND)</label>
            <input type="number" min="1000" required value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="Nhập số tiền" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Mô tả</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
              placeholder="Mô tả chi tiết yêu cầu..." />
          </div>
        </div>

        {/* File Upload Placeholder */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Đính kèm chứng từ</label>
          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
            <svg className="w-10 h-10 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-500">Kéo thả file hoặc click để upload</p>
            <p className="text-xs text-gray-600 mt-1">PDF, JPG, PNG, Excel (tối đa 10MB)</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            Hủy
          </button>
          <button type="submit" disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">
            {isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </form>
    </div>
  );
}
