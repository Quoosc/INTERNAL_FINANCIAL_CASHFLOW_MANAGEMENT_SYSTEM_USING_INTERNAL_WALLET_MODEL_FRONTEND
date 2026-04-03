// =============================================================
// [TEAM_LEADER] Approval Queue — Flow 1
// API: GET /api/v1/team-leader/approvals
// Hiển thị: danh sách ADVANCE / EXPENSE / REIMBURSE của Employee cần TL duyệt
// =============================================================

export default function TLApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Duyệt yêu cầu</h1>
        <p className="text-gray-400 mt-1">Danh sách yêu cầu chi tiêu của nhân viên cần phê duyệt</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 4-5</p>
      </div>
    </div>
  );
}
