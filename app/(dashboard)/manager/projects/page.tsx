// =============================================================
// [MANAGER] Projects Management
// API: GET  /api/v1/manager/projects
//      POST /api/v1/manager/projects  (tạo dự án mới)
//      PUT  /api/v1/manager/projects/:id
// =============================================================

export default function ManagerProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Quản lý dự án</h1>
        <p className="text-gray-400 mt-1">Tạo và quản lý dự án trong phòng ban</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 4</p>
      </div>
    </div>
  );
}
