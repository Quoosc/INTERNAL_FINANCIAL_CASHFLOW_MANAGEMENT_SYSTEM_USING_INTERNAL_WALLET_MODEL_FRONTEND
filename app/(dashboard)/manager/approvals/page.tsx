// =============================================================
// [MANAGER] Approval Queue — Flow 2 (PROJECT_TOPUP)
// API: GET /api/v1/manager/approvals
// Hiển thị: yêu cầu nạp quỹ dự án từ Team Leader cần Manager duyệt
// =============================================================

export default function ManagerApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Duyệt nạp quỹ dự án</h1>
        <p className="text-gray-400 mt-1">Yêu cầu PROJECT_TOPUP từ Team Leader cần phê duyệt</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 4-5</p>
      </div>
    </div>
  );
}
