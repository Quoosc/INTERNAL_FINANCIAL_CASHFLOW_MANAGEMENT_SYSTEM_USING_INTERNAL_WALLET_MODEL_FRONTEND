// =============================================================
// [ACCOUNTANT] Disbursement Detail — xác minh & giải ngân
// API: GET  /api/v1/accountant/disbursements/:id
//      POST /api/v1/accountant/disbursements/:id/disburse { pin }
//      POST /api/v1/accountant/disbursements/:id/reject  { reason }
// Flow: xem chứng từ → compliance checklist → nhập PIN → giải ngân
// =============================================================

export default function AccountantDisbursementDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chi tiết giải ngân</h1>
        <p className="text-gray-400 mt-1">Xác minh chứng từ và thực hiện giải ngân</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 6</p>
      </div>
    </div>
  );
}
