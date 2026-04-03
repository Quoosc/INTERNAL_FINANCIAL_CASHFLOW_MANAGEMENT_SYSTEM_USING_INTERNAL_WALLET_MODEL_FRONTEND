// =============================================================
// [TEAM_LEADER] Project Detail
// API: GET /api/v1/team-leader/projects/:id
//      POST /api/v1/team-leader/projects/:id/phases
//      POST /api/v1/team-leader/projects/:id/members
//      PUT  /api/v1/team-leader/projects/:id/categories
// =============================================================

export default function TLProjectDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chi tiết dự án</h1>
        <p className="text-gray-400 mt-1">Quản lý phases, category budget và thành viên</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 4</p>
      </div>
    </div>
  );
}
