"use client";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.97L13.75 4a2 2 0 00-3.5 0L3.25 16.03A2 2 0 005.07 19z" />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Hệ thống đang bảo trì</h1>
          <p className="text-slate-400 leading-relaxed">
            IFMS đang trong quá trình bảo trì và nâng cấp. <br />
            Chúng tôi sẽ sớm trở lại. Xin lỗi vì sự bất tiện này.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Thử lại
        </button>

        <p className="text-xs text-slate-600">
          Nếu sự cố kéo dài, hãy liên hệ quản trị viên hệ thống.
        </p>
      </div>
    </div>
  );
}
