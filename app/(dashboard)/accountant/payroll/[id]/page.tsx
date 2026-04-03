// =============================================================
// [ACCOUNTANT] Payroll Period Detail
// API: GET  /api/v1/accountant/payroll/:periodId
//      POST /api/v1/accountant/payroll/:periodId/import        (Excel)
//      POST /api/v1/accountant/payroll/:periodId/auto-netting
//      POST /api/v1/accountant/payroll/:periodId/run
//      PUT  /api/v1/accountant/payroll/:periodId/entries/:payslipId
// =============================================================

export default function AccountantPayrollDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chi tiết kỳ lương</h1>
        <p className="text-gray-400 mt-1">Import, xem xét và xử lý bảng lương</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 7</p>
      </div>
    </div>
  );
}
