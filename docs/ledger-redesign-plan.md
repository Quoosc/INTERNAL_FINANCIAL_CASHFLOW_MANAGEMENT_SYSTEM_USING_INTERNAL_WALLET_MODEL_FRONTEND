# IFMS — trạng thái và kế hoạch hoàn tất chức năng sổ cái

**Cập nhật:** 06/10/2026  
**Phạm vi:** Trang Kế toán ở `financial-wallet-frontend` và backend trong repo `IFMS` tại `D:/UIT/HK6 UIT/LẬP TRÌNH JAVA/IFMS`.  
**Trạng thái:** Đã triển khai nền tảng frontend/backend; chưa nghiệm thu tích hợp với database và chưa xác nhận toàn bộ luồng chạy thực tế.

## 1. Mục đích tài liệu

Tài liệu này ghi lại phần sổ cái đã được triển khai, phần còn thiếu và thứ tự công việc đề xuất để hoàn tất. Đây là kế hoạch cho các task tiếp theo, không phải xác nhận hệ thống đã sẵn sàng vận hành.

Trong tài liệu:

- **Giao dịch ví** là lần chuyển tiền thực tế giữa các ví và các dòng làm thay đổi số dư ví.
- **Bút toán kế toán (journal)** là ghi nhận tác động của một nghiệp vụ lên các tài khoản kế toán; hai phía phải cân bằng.
- **Tạm ứng (advance)** là tiền đã giao cho nhân viên và còn phải quyết toán.
- **Nhân viên tự chi (expense)** là nhân viên dùng tiền của mình, nộp chứng từ để được hoàn chi.
- **Quyết toán tạm ứng (reimburse)** là nộp chứng từ cho khoản tạm ứng đã nhận; không đồng nghĩa với một lần chuyển tiền mới.

## 2. Đã thực hiện

### 2.1 Frontend

Trang thật `/accountant/ledger` đã được chuyển sang gọi API backend, với ba khu vực riêng:

1. **Giao dịch ví:** một dòng cho mỗi giao dịch, có bộ lọc và phân trang; chi tiết cho biết các ví bị tác động và liên kết tới bút toán liên quan nếu có.
2. **Sổ cái kế toán:** danh sách bút toán và trang chi tiết riêng, gồm ngày/kỳ ghi sổ, nghiệp vụ nguồn, nhân viên/dự án liên quan, các tài khoản bị tác động, giải thích tác động và trạng thái cân bằng.
3. **Tạm ứng còn phải quyết toán:** nhóm theo nhân viên; mở rộng để xem từng khoản tạm ứng, chứng từ đã quyết toán, tiền mặt đã hoàn, phần khấu trừ lương và số còn lại.

Các màn hình xử lý yêu cầu cũng phản ánh hai bước của nhân viên tự chi: Kế toán xác nhận chứng từ, sau đó mới thanh toán hoàn chi. Trạng thái mới đã được nối vào nhãn trạng thái và các dashboard liên quan.

**Lưu ý:** route `/accountant/ledger/demo` vẫn là trang minh họa dùng dữ liệu giả. Route cần dùng để xem dữ liệu thật là `/accountant/ledger`.

### 2.2 Backend IFMS

- Thêm lưu trữ bút toán gồm phần đầu và các dòng tài khoản; dịch vụ kiểm tra tổng hai phía trước khi ghi và dùng mã sự kiện/nguồn để ngăn ghi trùng.
- Bổ sung API đọc giao dịch ví đã gộp, danh sách/chi tiết bút toán và tạm ứng còn mở theo nhân viên.
- Giữ các API sổ cái cũ để tương thích; chi tiết giao dịch cũ có thể trả về các mã bút toán liên quan.
- Bổ sung trạng thái trung gian `ACCOUNTANT_VERIFIED` cho yêu cầu nhân viên tự chi.
- Bổ sung số tiền giữ theo từng yêu cầu để giới hạn giải ngân theo chính yêu cầu đó; từ chối yêu cầu thì nhả khoản đã giữ.
- Tách tiền hoàn tạm ứng thật khỏi khoản khấu trừ lương. Tiền hoàn thật tạo giao dịch từ ví nhân viên về đúng ví dự án; khấu trừ lương chỉ bù trừ số dư tạm ứng.
- Journal đã bao phủ các nghiệp vụ tạm ứng, xác nhận và thanh toán hoàn chi, quyết toán tạm ứng, hoàn tiền tạm ứng và bảng lương.
- Migration mới là **V19** vì V17 và V18 đã tồn tại trong repo IFMS. Dữ liệu hoàn tạm ứng lịch sử chưa phân loại được chuyển sang trường lịch sử riêng để không tự đoán loại nghiệp vụ.

### 2.3 Quy tắc nghiệp vụ đã được nối vào luồng

| Nghiệp vụ | Khi nào ghi chi phí | Chuyển tiền | Tác động số dư tạm ứng |
|---|---|---|---|
| Tạm ứng (`ADVANCE`) | Không ghi chi phí lúc giải ngân | Ví dự án → ví nhân viên | Tạo khoản còn phải quyết toán |
| Nhân viên tự chi (`EXPENSE`) | Khi Kế toán xác nhận chứng từ hợp lệ | Chuyển hoàn chi ở bước thanh toán riêng | Không tác động |
| Thanh toán hoàn chi (`EXPENSE` đã xác nhận) | Không ghi chi phí lần hai | Ví dự án → ví nhân viên | Không tác động |
| Quyết toán tạm ứng (`REIMBURSE`) | Khi chứng từ được chấp nhận | Không phát sinh giao dịch ví mới | Giảm khoản tạm ứng còn mở |
| Nhân viên hoàn tiền (`ADVANCE_RETURN`) | Không ghi chi phí | Ví nhân viên → ví dự án gốc | Giảm khoản còn phải quyết toán |
| Khấu trừ tạm ứng qua lương | Ghi theo dữ liệu phiếu lương hiện có | Không giả lập chuyển tiền hoàn | Giảm khoản tạm ứng; hiện đang phân bổ FIFO |

## 3. Chưa thực hiện hoặc chưa xác nhận

### 3.1 Chưa nghiệm thu khi chạy với database thật

- Migration V19 chưa được áp dụng lên database trong môi trường chạy.
- Chưa kiểm tra migration trên bản sao dữ liệu hiện có, gồm việc chuyển dữ liệu lịch sử, tạo số tiền giữ cho các yêu cầu cũ và giữ nguyên số dư tạm ứng.
- Chưa khởi chạy backend và frontend cùng nhau để kiểm tra đăng nhập, quyền, phản hồi API, trạng thái rỗng/lỗi và dữ liệu thật trên giao diện.
- Backend đã compile thành công; frontend build và kiểm chứng tích hợp chưa chạy. Compile không xác nhận migration hoặc các luồng nghiệp vụ chạy đúng trên database.

### 3.2 Chưa có giao diện cho một số thao tác

- Chưa có giao diện nhân viên chọn khoản tạm ứng và thực hiện hoàn tiền thật. Backend đã có API hoàn tiền; trang sổ cái chỉ phục vụ tra cứu khoản còn mở.
- Chưa có trang hoặc thao tác đóng kỳ kế toán.
- Chưa có quy trình đảo bút toán/điều chỉnh sau khi ghi sổ; không được sửa trực tiếp giao dịch gốc để thay cho quy trình này.

### 3.3 Phạm vi ghi sổ chưa bao phủ mọi loại giao dịch ví

- Chưa tạo journal cho nạp tiền hệ thống, nạp/rút ví và phân bổ nội bộ. Cần chốt nghiệp vụ nào phải có journal, nghiệp vụ nào chỉ là di chuyển tiền giữa các ví nội bộ, rồi mới bổ sung mapping.
- Giao dịch lịch sử trước khi triển khai journal có thể không có bút toán liên kết. Hiện chưa có quyết định backfill journal lịch sử hay chỉ đánh dấu rõ các giao dịch cũ chưa có journal.
- Mapping tài khoản hiện là mapping nội bộ IFMS, chưa được xác nhận là hệ thống tài khoản pháp định.

### 3.4 Một số chỉ tiêu và quy tắc cần chốt

- `currentSpent` chưa trình bày riêng tiền đã giữ, tạm ứng đang mở và chi phí đã quyết toán. `reservedAmount` chỉ giữ tiền ở ví theo yêu cầu, không thay thế báo cáo cam kết/ngân sách.
- Khấu trừ lương hiện phân bổ FIFO vào các khoản tạm ứng. Cần xác nhận thứ tự này phù hợp với quy tắc IFMS.
- Ngày/kỳ ghi sổ đã có dữ liệu, nhưng chưa có quy định xử lý giao dịch sai phát hiện sau khi kỳ đã đóng.
- Journal hiện không có API sửa/xóa; tính append-only được tuân theo ở dịch vụ hiện tại nhưng chưa được database cưỡng chế bằng chính sách bất biến.

## 4. Kế hoạch thực hiện tiếp theo

### Giai đoạn A — Làm cho bản hiện tại chạy được end-to-end

| ID | Công việc | Điều kiện hoàn thành |
|---|---|---|
| A1 | Chạy V19 trước trên database thử nghiệm/bản sao; kiểm tra schema, ràng buộc duy nhất, dữ liệu chuyển đổi và số dư tạm ứng trước/sau. | Migration chạy thành công; không mất số dư hoặc lịch sử; có biên bản kết quả trước/sau. |
| A2 | Khởi chạy backend và frontend cùng cấu hình database đã migrate; đăng nhập bằng tài khoản Kế toán và nhân viên. | Trang sổ cái tải được dữ liệu API thật; phân quyền đúng; không có lỗi API/console làm hỏng luồng. |
| A3 | Đi qua các luồng ADVANCE, EXPENSE xác nhận → thanh toán, REIMBURSE, ADVANCE_RETURN và payroll trên dữ liệu thử nghiệm. | Số dư ví, số dư tạm ứng, chi phí và journal khớp quy tắc ở mục 2.3; mỗi journal cân bằng. |
| A4 | Kiểm tra bộ lọc, phân trang, liên kết từ giao dịch sang journal, trạng thái rỗng/lỗi và dữ liệu lịch sử chưa có journal. | Bộ lọc áp dụng cùng phạm vi cho danh sách/tổng hợp; giao dịch cũ không bị trình bày nhầm thành journal. |

**Phụ thuộc:** hoàn thành A1 trước A2/A3. Không chạy V19 trực tiếp trên dữ liệu quan trọng nếu chưa sao lưu và kiểm tra trên bản sao.

### Giai đoạn B — Hoàn tất các chức năng nghiệp vụ còn thiếu

| ID | Công việc | Điều kiện hoàn thành |
|---|---|---|
| B1 | Tạo giao diện nhân viên hoàn tiền tạm ứng: xem khoản còn mở, chọn khoản, nhập số tiền/ghi chú, xác nhận và xem kết quả. | Nhân viên chỉ thao tác với khoản của mình; không hoàn quá số dư còn lại; sau hoàn, ví và số phải quyết toán cập nhật nhất quán. |
| B2 | Chốt danh mục sự kiện phải ghi journal: nạp hệ thống, nạp/rút, phân bổ nội bộ và các giao dịch còn lại. | Có bảng mapping được duyệt, mô tả khi nào ghi và tài khoản nội bộ bị tác động cho từng sự kiện. |
| B3 | Triển khai journal cho các sự kiện đã được chốt ở B2. | Mỗi nghiệp vụ tạo journal một lần, cân bằng, truy về giao dịch nguồn; không tạo chi phí cho chuyển nội bộ nếu nghiệp vụ không phải chi phí. |
| B4 | Chốt cách hiển thị và xử lý giao dịch trước V19. | Hoặc có kế hoạch backfill có đối chiếu; hoặc giao diện ghi rõ “giao dịch lịch sử, chưa có bút toán”, không tự tạo số liệu suy đoán. |
| B5 | Thiết kế báo cáo riêng cho tiền đã giữ, tạm ứng đang mở, chứng từ đã quyết toán và chi phí đã xác nhận. | Tổng không cộng trùng; ADVANCE không thành chi phí trước khi quyết toán; một khoản REIMBURSE chỉ ghi chi phí một lần. |

### Giai đoạn C — Bổ sung kiểm soát kế toán và sửa sai

| ID | Công việc | Điều kiện hoàn thành |
|---|---|---|
| C1 | GVHD/người phụ trách nghiệp vụ duyệt tên và mapping tài khoản nội bộ, cách hiển thị “Ghi nhận/Đối ứng”, ngày và kỳ ghi sổ. | Có mapping được duyệt cho từng sự kiện đang hỗ trợ; tài liệu và giao diện dùng cùng thuật ngữ. |
| C2 | Thiết kế quy trình đảo/điều chỉnh journal, chống đảo trùng và quy định ngày ghi nhận khi kỳ đã khóa. | Không sửa/xóa dữ liệu gốc; journal điều chỉnh liên kết journal gốc; có quy tắc kỳ kế toán và quyền thao tác. |
| C3 | Chốt chính sách bất biến và phân quyền sửa sai. | Có kiểm soát ở tầng lưu trữ/API; mọi thao tác điều chỉnh có người thực hiện, thời điểm, lý do và tham chiếu. |
| C4 | Xác nhận FIFO cho khấu trừ lương hoặc thay bằng quy tắc được IFMS duyệt. | Mỗi khoản khấu trừ truy được tới phiếu lương và từng khoản tạm ứng; không tạo biến động ví giả. |

**Phụ thuộc:** C1 cần hoàn tất trước khi coi mapping là chuẩn; C2/C3 cần thiết kế nghiệp vụ trước khi triển khai chức năng sửa sai.

## 5. Thứ tự ưu tiên đề xuất

1. **Ưu tiên 0:** A1–A4 — chứng minh phần đã triển khai hoạt động với database và dữ liệu thật.
2. **Ưu tiên 1:** B1 — hoàn tất giao diện hoàn tiền tạm ứng; B2–B4 — chốt phạm vi và lịch sử journal.
3. **Ưu tiên 2:** B5 và C1–C4 — hoàn chỉnh báo cáo ngân sách, mapping và kiểm soát kế toán.

Không nên tuyên bố hoàn tất sổ cái trước khi giai đoạn A đạt điều kiện nghiệm thu. Các công việc B2, B4, C1 và C2 có quyết định nghiệp vụ cần chốt trước khi code.

## 6. Tiêu chí nghiệm thu toàn bộ

- Trang `/accountant/ledger` đọc dữ liệu thật; trang demo được nhận diện riêng là dữ liệu minh họa.
- Một giao dịch ví chỉ hiển thị một lần ở danh sách giao dịch; biến động từng ví không bị gọi là bút toán kế toán.
- Mỗi nghiệp vụ thuộc phạm vi journal có đúng một bút toán nguồn, hai phía cân bằng và liên kết ngược được tới yêu cầu/giao dịch/nhân viên/dự án phù hợp.
- Tạm ứng còn phải quyết toán được tính theo từng nhân viên và từng khoản, trừ riêng chứng từ hợp lệ, tiền mặt hoàn và khấu trừ lương.
- Thanh toán hoàn chi không ghi chi phí lần thứ hai; quyết toán tạm ứng không tạo giao dịch ví mới; khấu trừ lương không giả lập hoàn tiền mặt.
- Migration V19 chạy thành công trên database mục tiêu sau khi đã được kiểm tra dữ liệu; các luồng chính được kiểm chứng trên cấu hình chạy thực tế.
- Các giới hạn chưa triển khai (nếu còn) được hiển thị rõ và không làm người dùng hiểu giao dịch ví là journal hoặc hiểu giao dịch lịch sử chưa có journal là đã được hạch toán.

## 7. Trạng thái kiểm chứng tại thời điểm cập nhật

- Backend IFMS: `mvnw.cmd -q -DskipTests compile` đã thành công.
- `git diff --check`: đã chạy và không phát hiện lỗi khoảng trắng; các cảnh báo còn lại chỉ liên quan chuyển đổi LF/CRLF của Windows.
- Chưa chạy frontend build, bộ kiểm thử, kiểm thử API end-to-end hoặc migration V19 trên database.
- Cập nhật tài liệu này chỉ lập kế hoạch cho phần còn lại; chưa thực hiện thêm thay đổi code.
