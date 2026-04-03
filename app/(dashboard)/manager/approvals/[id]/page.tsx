// =============================================================
// [MANAGER] Approval Detail — Flow 2
// API: GET /api/v1/manager/approvals/:id
//      POST /api/v1/manager/approvals/:id/approve
//      POST /api/v1/manager/approvals/:id/reject { reason }
// =============================================================

export default function ManagerApprovalDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chi tiết yêu cầu nạp quỹ</h1>
        <p className="text-gray-400 mt-1">Xem xét và phê duyệt / từ chối yêu cầu PROJECT_TOPUP</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 4-5</p>
      </div>
    </div>
  );
}
