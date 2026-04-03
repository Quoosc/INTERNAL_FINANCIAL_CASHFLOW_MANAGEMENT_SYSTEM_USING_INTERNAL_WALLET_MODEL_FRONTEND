// =============================================================
// [ACCOUNTANT] Disbursements — giải ngân Flow 1
// API: GET /api/v1/accountant/disbursements
// Hiển thị: danh sách YC PENDING_ACCOUNTANT cần kế toán giải ngân (nhập PIN)
// =============================================================

export default function AccountantDisbursementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Giải ngân</h1>
        <p className="text-gray-400 mt-1">Yêu cầu đã được Team Leader duyệt, chờ giải ngân</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 6</p>
      </div>
    </div>
  );
}
