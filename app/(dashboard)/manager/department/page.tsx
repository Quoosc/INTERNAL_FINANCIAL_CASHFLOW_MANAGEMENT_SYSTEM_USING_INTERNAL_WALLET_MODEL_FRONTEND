// =============================================================
// [MANAGER] Department Members
// API: GET /api/v1/manager/department/members
//      GET /api/v1/manager/department/members/:id
//      GET /api/v1/manager/department/team-leaders
// =============================================================

export default function ManagerDepartmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Phòng ban</h1>
        <p className="text-gray-400 mt-1">Thành viên phòng ban và tổng quan tài chính</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 5</p>
      </div>
    </div>
  );
}
