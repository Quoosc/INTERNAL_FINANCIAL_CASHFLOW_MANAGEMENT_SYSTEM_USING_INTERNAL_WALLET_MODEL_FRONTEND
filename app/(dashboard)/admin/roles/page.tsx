// =============================================================
// Admin - Role & Permission Management Page
// =============================================================

export default function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý vai trò & quyền hạn</h1>
          <p className="text-gray-400 mt-1">Dynamic RBAC - Tạo vai trò và gán quyền</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          + Tạo vai trò
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-gray-500 text-sm text-center py-8">Kết nối API để hiển thị danh sách vai trò và ma trận quyền hạn</p>
      </div>
    </div>
  );
}
