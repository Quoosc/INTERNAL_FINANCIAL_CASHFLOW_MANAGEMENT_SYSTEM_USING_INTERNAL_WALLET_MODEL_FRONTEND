// =============================================================
// [ADMIN] User Detail
// API: GET  /api/v1/admin/users/:id
//      PUT  /api/v1/admin/users/:id
//      POST /api/v1/admin/users/:id/lock
//      POST /api/v1/admin/users/:id/unlock
//      POST /api/v1/admin/users/:id/reset-password
// =============================================================

export default function AdminUserDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chi tiết nhân sự</h1>
        <p className="text-gray-400 mt-1">Thông tin, quyền và trạng thái tài khoản</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 2</p>
      </div>
    </div>
  );
}
