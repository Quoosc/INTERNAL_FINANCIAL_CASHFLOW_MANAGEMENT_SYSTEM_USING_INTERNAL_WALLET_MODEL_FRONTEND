// =============================================================
// [TEAM_LEADER] Team Members Overview
// API: GET /api/v1/team-leader/team-members
//      GET /api/v1/team-leader/team-members/:userId
// =============================================================

export default function TLTeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Nhóm của tôi</h1>
        <p className="text-gray-400 mt-1">Danh sách nhân viên trong nhóm và tình trạng tài chính</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 5</p>
      </div>
    </div>
  );
}
