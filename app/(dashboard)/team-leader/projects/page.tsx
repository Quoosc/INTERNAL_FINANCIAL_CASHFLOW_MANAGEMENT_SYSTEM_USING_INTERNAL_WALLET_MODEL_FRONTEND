// =============================================================
// [TEAM_LEADER] Projects Management
// API: GET /api/v1/team-leader/projects
// Hiển thị: danh sách dự án TL phụ trách — có thể quản lý phases, categories, members
// =============================================================

export default function TLProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dự án của tôi</h1>
        <p className="text-gray-400 mt-1">Quản lý dự án, phase và ngân sách</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 4</p>
      </div>
    </div>
  );
}
