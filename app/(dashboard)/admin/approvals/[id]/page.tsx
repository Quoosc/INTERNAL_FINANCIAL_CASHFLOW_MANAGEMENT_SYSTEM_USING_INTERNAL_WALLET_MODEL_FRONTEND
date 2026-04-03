// =============================================================
// [ADMIN] Approval Detail — Flow 3
// API: GET  /api/v1/admin/approvals/:id
//      POST /api/v1/admin/approvals/:id/approve
//      POST /api/v1/admin/approvals/:id/reject { reason }
// =============================================================

export default function AdminApprovalDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chi tiết yêu cầu ngân sách</h1>
        <p className="text-gray-400 mt-1">Xem xét và phê duyệt / từ chối QUOTA_TOPUP</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 6</p>
      </div>
    </div>
  );
}
