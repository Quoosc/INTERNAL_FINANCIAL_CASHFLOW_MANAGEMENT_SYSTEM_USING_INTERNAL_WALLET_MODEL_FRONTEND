# Sổ cái kế toán IFMS — tài liệu frontend

**Cập nhật:** 10/10/2026
**Trạng thái:** Giao diện thật đã nối các API sổ cái, ngân sách và hoàn tạm ứng. Frontend production build đạt; chưa kiểm tra end-to-end với database.

## Mục đích và bố cục

Trang /accountant/ledger có bốn khu vực độc lập:

1. **Giao dịch ví:** từng transaction hiện một lần; mở chi tiết để xem những ví bị tác động.
2. **Sổ cái kế toán:** journal theo tài khoản; có danh sách, bộ lọc, chi tiết hai phía và thông tin tạo journal.
3. **Tạm ứng còn phải quyết toán:** tổng hợp theo nhân viên, mở từng AdvanceBalance và xem chứng từ, tiền hoàn thật, khấu trừ lương, lịch sử chưa phân loại và phần còn lại.
4. **Ngân sách & tạm ứng:** xem riêng số liệu theo dự án, giai đoạn và danh mục chi.

Trang /wallet cho nhân viên xem các khoản tạm ứng còn mở của chính mình và thực hiện hoàn tiền thật về ví dự án. Đây là một thao tác có chuyển tiền, khác với trang sổ cái kế toán vốn chỉ phục vụ tra cứu.

Route /accountant/ledger/demo là trang minh họa dùng mock data. Route /accountant/ledger gọi API thật.

## Quy tắc nghiệp vụ thể hiện trên giao diện

| Nghiệp vụ | Khi ghi nhận chi phí | Chuyển tiền và số dư |
|---|---|---|
| Tạm ứng (ADVANCE) | Không ghi chi phí khi giải ngân. | Ví dự án → ví nhân viên; tăng số tạm ứng còn phải quyết toán. |
| Nhân viên tự chi (EXPENSE) | Khi Kế toán xác nhận chứng từ hợp lệ. | Nhân viên đã dùng tiền cá nhân; xác nhận chứng từ chưa chuyển tiền. |
| Thanh toán hoàn chi | Không ghi chi phí lần hai. | Sau xác nhận, ví dự án → ví nhân viên; thanh toán khoản phải hoàn. |
| Quyết toán tạm ứng (REIMBURSE) | Khi chứng từ được chấp nhận. | Không phát sinh giao dịch ví; giảm đúng khoản tạm ứng đã liên kết. |
| Nhân viên hoàn tiền (ADVANCE_RETURN) | Không ghi chi phí mới. | Tiền thật từ ví nhân viên về đúng ví dự án, làm giảm số còn phải quyết toán. |
| Khấu trừ qua lương | Không tạo chi phí mới ngoài dữ liệu payroll hiện có. | Không chuyển tiền hoàn; giảm dư tạm ứng theo FIFO. |
| Nạp quỹ công ty (SYSTEM_TOPUP) | Không phải doanh thu/chi phí của dự án. | Nguồn ngân hàng/ngoài hệ thống → quỹ công ty; có journal để đối chiếu. |
| Cấp ngân sách phòng ban/dự án | Không tự tạo chi phí. | Chuyển giữa các quỹ nội bộ; có journal theo nguồn và đích. |
| Nạp/rút ví cá nhân (DEPOSIT/WITHDRAW) | Không ghi vào sổ kế toán công ty theo quyết định đã chốt. | Chỉ xuất hiện trong sổ giao dịch ví cá nhân. |

Số dư ví nhân viên, số tạm ứng còn phải quyết toán, ngân sách đang khả dụng và chi phí đã xác nhận là các số liệu khác nhau.

## Giao dịch ví

- API: GET /api/v1/accountant/ledger/wallet-transactions.
- Danh sách gộp theo transaction, lọc theo loại, trạng thái, nguồn tham chiếu và khoảng ngày.
- Chi tiết GET /api/v1/accountant/ledger/{transactionId} hiển thị biến động từng ví và các journal được liên kết.
- Tổng vào/ra phản ánh biến động của ví COMPANY_FUND; số dư là ảnh chụp hiện tại, không bị giới hạn theo khoảng ngày.
- Khi chưa có journal, giao diện nói rõ đó có thể là giao dịch chỉ theo dõi ở sổ ví hoặc dữ liệu lịch sử thiếu hồ sơ; không mặc định giao dịch đã được hạch toán.

## Sổ cái kế toán

- Danh sách: GET /api/v1/accountant/ledger/journals.
- Bộ lọc: loại sự kiện, từ ngày/đến ngày, ID nhân viên, ID dự án, ID yêu cầu.
- Chi tiết: GET /api/v1/accountant/ledger/journals/{journalId}; hiển thị nghiệp vụ nguồn, tài khoản, hai phía, số tổng và trạng thái cân bằng.
- Journal mới hiển thị người/tác vụ tạo và thời điểm tạo. Journal cũ có thể để trống vì hệ thống không biết chính xác actor hoặc thời gian ban đầu.
- Bút toán payroll chỉ dùng các trường đang có trong payslip; deduction không tự được gọi là thuế hoặc bảo hiểm.
- LedgerEntry là biến động ví, không phải dòng tài khoản kế toán.

## Tạm ứng còn mở

- Kế toán tra cứu danh sách theo nhân viên qua GET /api/v1/accountant/ledger/advances/outstanding.
- Nhân viên tra cứu khoản của mình qua GET /api/v1/requests/my-advance-balances.
- Hoàn tiền thật qua POST /api/v1/requests/my-advance-balances/{advanceBalanceId}/return, body gồm amount và note.
- Backend xác thực nhân viên sở hữu khoản, khóa khoản tạm ứng khi cập nhật, kiểm tra số tiền còn phải quyết toán và số dư ví khi chuyển.
- Công thức hiển thị:

      Còn lại = Đã giải ngân
              − Chứng từ quyết toán tạm ứng
              − Tiền thật đã hoàn
              − Khấu trừ lương
              − Lịch sử cũ chưa phân loại

## Theo dõi ngân sách

API: GET /api/v1/accountant/ledger/budget-exposure.

Mỗi dự án/giai đoạn/danh mục trình bày riêng:

- Chi phí đã xác nhận từ các bộ đếm ngân sách hiện có.
- Tiền đang khóa cho các yêu cầu ở trạng thái được duyệt/chờ xử lý.
- Tạm ứng còn mở lấy từ AdvanceBalance.
- Số dư quỹ dự án theo dữ liệu Project; tiền đang khóa và tạm ứng còn mở hiển thị ở chỉ tiêu riêng.

Không cộng các khoản trên thành “đã chi”. Đặc biệt, tạm ứng chưa quyết toán không tự thành chi phí; khoản EXPENSE chờ thanh toán đã ghi chi phí khi xác nhận chứng từ.

## Mapping và giới hạn

- Journal cho SYSTEM_TOPUP, DEPARTMENT_ALLOCATION và PROJECT_ALLOCATION sử dụng tài khoản quản trị nội bộ IFMS. Mapping cần GVHD/người phụ trách duyệt; chưa phải bộ tài khoản pháp định.
- Giao dịch lịch sử chỉ được backfill khi có chứng từ và đối chiếu đủ căn cứ.
- Ngày ghi sổ hiện dùng ngày backend xử lý và kỳ suy ra theo tháng.
- Database hiện chặn sửa/xóa journal; giao diện chưa có đóng kỳ hoặc luồng đảo/điều chỉnh. Cần chốt ngày/kỳ ghi đảo và quyền xử lý trước khi mở chức năng sửa sai.
- Frontend build thành công ngày 10/10/2026. Chưa kiểm tra runtime với database hoặc test API/end-to-end.
