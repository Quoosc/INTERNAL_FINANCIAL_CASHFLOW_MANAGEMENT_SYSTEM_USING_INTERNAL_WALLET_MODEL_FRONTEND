// =============================================================
// [ADMIN] Approval Queue — Flow 3 (DEPARTMENT_TOPUP)
// API: GET /api/v1/admin/approvals
// Hiển thị: yêu cầu nạp ngân sách phòng ban từ Manager cần Admin duyệt
// =============================================================

export default function AdminApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Duyệt ngân sách phòng ban</h1>
        <p className="text-gray-400 mt-1">Yêu cầu DEPARTMENT_TOPUP từ Manager cần phê duyệt</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 6</p>
      </div>
    </div>
  );
}
