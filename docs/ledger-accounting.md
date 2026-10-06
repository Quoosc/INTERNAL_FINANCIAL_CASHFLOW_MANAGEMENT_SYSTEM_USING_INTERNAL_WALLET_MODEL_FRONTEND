# Sổ cái kế toán IFMS — tài liệu frontend

**Cập nhật:** 05/10/2026  
**Trạng thái:** Đã nối giao diện thật với API backend. Chưa chạy build hoặc kiểm thử sau thay đổi.

## Mục đích và bố cục

Trang /accountant/ledger có ba khu vực tra cứu:

1. **Giao dịch ví:** các lần chuyển tiền thực tế, mỗi giao dịch hiển thị một dòng; mở chi tiết để xem biến động từng ví.
2. **Sổ cái kế toán:** chứng từ ghi sổ theo tài khoản, ngày/kỳ ghi nhận, nghiệp vụ nguồn và các dòng ghi sổ cân bằng.
3. **Tạm ứng còn phải quyết toán:** biểu tượng có số lượng nhân viên cạnh tab sổ cái; mở danh sách tổng hợp theo nhân viên, rồi mở từng khoản tạm ứng và lịch sử xử lý.

Đây là trang đọc/tra cứu. Nút trong sổ cái không tạo giao dịch, không sửa/xóa bút toán và không khởi tạo hoàn tiền.

## Quy tắc nghiệp vụ được hiển thị

| Nghiệp vụ | Thời điểm ghi chi phí | Chuyển ví |
|---|---|---|
| Giải ngân tạm ứng (ADVANCE) | Chưa ghi chi phí; tăng khoản nhân viên còn phải quyết toán. | Ví dự án → ví nhân viên. |
| Quyết toán tạm ứng (REIMBURSE) | Khi Kế toán xác nhận chứng từ hợp lệ; giảm đúng khoản tạm ứng đã chọn. | Không chuyển ví ở bước quyết toán. |
| Nhân viên tự chi, đề nghị hoàn (EXPENSE) | Khi Kế toán xác nhận chứng từ; ghi chi phí và khoản phải hoàn cho nhân viên. | Sau đó, bước thanh toán chuyển ví dự án → ví nhân viên và tất toán khoản phải hoàn; không ghi chi phí lần hai. |
| Nhân viên hoàn tiền tạm ứng (ADVANCE_RETURN) | Không ghi chi phí mới; giảm dư tạm ứng. | Ví nhân viên → đúng ví dự án ban đầu. |
| Khấu trừ tạm ứng qua lương | Giảm dư tạm ứng và phần lương phải trả; không phải tiền mặt hoàn về. | Không tạo giao dịch hoàn tiền giữa ví. |
| Phân bổ nội bộ | Không tự tạo chi phí. | Chuyển tiền giữa các ví nội bộ. |

Số dư ví nhân viên và số tạm ứng còn phải quyết toán là hai chỉ tiêu khác nhau.

## Màn hình và dữ liệu

### Giao dịch ví

- API: GET /api/v1/accountant/ledger/wallet-transactions.
- Một dòng đại diện cho một transaction; các biến động của những ví liên quan được nhóm bên trong dòng đó.
- Bộ lọc: loại giao dịch, trạng thái, loại tham chiếu và khoảng ngày; có phân trang.
- GET /api/v1/accountant/ledger/{transactionId} tiếp tục phục vụ trang chi tiết, gồm biến động ví và ID journal liên quan nếu tìm được.
- Tổng vào/ra và số dư hiện tại phản ánh góc nhìn ví COMPANY_FUND. Số dư là ảnh chụp hiện tại, không bị giới hạn theo bộ lọc ngày; đây không phải số dư sao kê ngân hàng.
- FLOAT_MAIN là số kiểm soát nội bộ, không được trình bày như tài khoản ngân hàng.

### Sổ cái kế toán

- API danh sách: GET /api/v1/accountant/ledger/journals, lọc theo sự kiện và ngày.
- Chi tiết tại /accountant/ledger/journals/{journalId} hiển thị tổng hai phía, trạng thái cân bằng, tài khoản/khoản mục tăng giảm và tham chiếu nghiệp vụ.
- Journal có thể không có giao dịch ví, như xác nhận chứng từ EXPENSE, REIMBURSE hoặc khấu trừ lương.
- Journal payroll lấy lương cơ bản, thưởng, phụ cấp, deduction, advanceDeduct và finalNet từ payslip hiện có; khoản deduction được giữ là khoản khấu trừ chưa phân loại, không tự gọi là thuế/bảo hiểm.
- Dòng LedgerEntry vẫn là biến động số dư ví, không phải dòng tài khoản kế toán.

### Tạm ứng theo nhân viên

- API: GET /api/v1/accountant/ledger/advances/outstanding.
- Một dòng cho mỗi nhân viên còn dư; mở rộng để xem từng AdvanceBalance, dự án, giai đoạn, danh mục, số đã giải ngân, chứng từ đã duyệt, tiền hoàn thật, khấu trừ lương, phần lịch sử cũ chưa phân loại và số còn lại.
- Hoạt động có journal sẽ mở được chi tiết bút toán tương ứng.

Công thức hiện dùng:

    Còn lại = Đã giải ngân
            − Chứng từ tạm ứng đã xác nhận
            − Tiền thật đã hoàn
            − Khấu trừ lương
            − Lịch sử cũ chưa phân loại

Lịch sử cũ được đưa vào cột riêng để migration không tự gán nhầm đó là tiền mặt hay khấu trừ lương.

## API xử lý liên quan đến trang Kế toán

- POST /api/v1/accountant/disbursements/{id}/disburse: giải ngân ADVANCE; xác nhận chứng từ EXPENSE hoặc quyết toán REIMBURSE tùy loại yêu cầu.
- POST /api/v1/accountant/disbursements/{id}/pay: thanh toán một EXPENSE đã xác nhận.
- Các endpoint đọc journal và tạm ứng chỉ tra cứu; thao tác hoàn tiền tạm ứng hiện được cung cấp ở API nhân viên POST /api/v1/requests/my-advance-balances/{advanceBalanceId}/return. Trang sổ cái chưa có nút khởi tạo hoàn tiền.

## Phạm vi và giới hạn hiện tại

- Journal chỉ bao phủ các nghiệp vụ ADVANCE, EXPENSE, REIMBURSE, hoàn tiền tạm ứng và settlement payroll. Nạp/rút, nạp quỹ và phân bổ ví vẫn có ở tab giao dịch ví nhưng chưa tạo journal trong mô hình mới.
- Mã tài khoản trong journal là mapping nội bộ cho phạm vi IFMS, chưa phải bộ tài khoản pháp định hoặc sổ cái tổng hợp đầy đủ.
- Ngày ghi nhận lấy từ thời điểm backend xử lý; kỳ được suy ra theo tháng. Chưa có đóng kỳ, chọn ngày hạch toán, hoặc cơ chế đảo bút toán/sửa sai.
- Chỉ tiêu ngân sách hiện vẫn dựa trên currentSpent sẵn có; ADVANCE không còn tăng chi phí khi giải ngân, còn chi phí EXPENSE/REIMBURSE tăng khi chứng từ hợp lệ được xác nhận. Chưa tách đầy đủ commitment, tiền đã cấp và chi phí theo báo cáo ngân sách.
- Tổng journal đang hiển thị cho trang hiện tại; không được hiểu là tổng lũy kế mọi trang nếu đang phân trang.

Frontend gọi API qua api-client. Trang demo cũ vẫn là minh họa dữ liệu giả, không phải nguồn dữ liệu của trang thật.

