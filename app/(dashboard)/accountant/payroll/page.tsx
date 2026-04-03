// =============================================================
// [ACCOUNTANT] Payroll Management
// API: GET  /api/v1/accountant/payroll
//      POST /api/v1/accountant/payroll  (tạo kỳ lương)
// Khác với /payroll của Employee (chỉ xem payslips):
//   Accountant quản lý toàn bộ kỳ lương: import Excel, auto-netting, run
// =============================================================

export default function AccountantPayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Quản lý bảng lương</h1>
        <p className="text-gray-400 mt-1">Tạo kỳ lương, import dữ liệu và xử lý chi lương</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 7</p>
      </div>
    </div>
  );
}
