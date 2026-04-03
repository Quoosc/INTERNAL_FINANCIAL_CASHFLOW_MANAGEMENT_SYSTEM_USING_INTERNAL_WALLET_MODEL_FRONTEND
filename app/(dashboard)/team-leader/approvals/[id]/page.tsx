// =============================================================
// [TEAM_LEADER] Approval Detail — Flow 1
// API: GET /api/v1/team-leader/approvals/:id
//      POST /api/v1/team-leader/approvals/:id/approve { approvedAmount }
//      POST /api/v1/team-leader/approvals/:id/reject  { reason }
// =============================================================

export default function TLApprovalDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chi tiết yêu cầu</h1>
        <p className="text-gray-400 mt-1">Xem xét và phê duyệt / từ chối yêu cầu</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 4-5</p>
      </div>
    </div>
  );
}
