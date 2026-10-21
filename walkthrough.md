# Báo cáo nghiệm thu & Hướng dẫn: Tính năng Tài khoản Công dân

Hệ thống Cổng Dịch vụ công & Phản ánh Hiện trường điện tử **UBND Phường Yên Bái** đã được nâng cấp toàn diện với phân hệ **Tài khoản Công dân**, giúp người dân chủ động đăng ký, đăng nhập bằng số CCCD hoặc Số điện thoại để theo dõi hồ sơ thủ tục hành chính (TTHC), gửi và tra cứu phản ánh hiện trường, nhận thông báo tiến độ và đánh giá sự hài lòng.

---

## 1. Tổng quan Kiến trúc & Giải pháp kỹ thuật

### 1.1. Cơ sở dữ liệu (MariaDB)
- **Bảng `citizen_accounts`**: Lưu trữ hồ sơ tài khoản công dân (Họ tên, CCCD 12 số định danh duy nhất, SĐT, Email, Mật khẩu băm `PASSWORD_BCRYPT`, địa chỉ, trạng thái hoạt động, khóa tạm thời khi nhập sai mật khẩu 5 lần liên tiếp).
- **Bảng `citizen_otps`**: Quản lý mã OTP 6 số phục vụ xác thực số điện thoại và khôi phục mật khẩu (TTL 5 phút, giới hạn tần suất 60 giây/lần gửi, tối đa 5 lần thử sai).
- **Liên kết dữ liệu tự động**: Cột `citizen_account_id` kèm chỉ mục tối ưu trên bảng `applications` và `complaints`. Hồ sơ được tự động liên kết khi CCCD hoặc SĐT trùng khớp.

### 1.2. Phân tách xác thực & An toàn thông tin
- **Token JWT độc lập**: Token cán bộ (`gov_token`) và Token công dân (`citizen_token`) được phân lập nghiêm ngặt qua trường `typ: 'citizen'`. Công dân không thể dùng token để gọi API nội bộ cán bộ và ngược lại.
- **Bảo mật tra cứu công khai (Anti-scraping)**: Tra cứu công khai tại `/tra-cuu` chỉ cho phép nhập chính xác **Mã hồ sơ** (`dossier_code`) hoặc **Mã phản ánh** (`complaint_code`). Nghiêm cấm tra cứu hồ sơ bằng số CCCD hoặc SĐT khi chưa đăng nhập nhằm chống thu thập trái phép thông tin công dân theo quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP).

---

## 2. Các phân hệ chức năng đã hoàn thành

| Phân hệ | Đường dẫn | Chức năng chính |
| :--- | :--- | :--- |
| **Đăng nhập Công dân** | `/cong-dan/dang-nhap` | Đăng nhập bằng CCCD (12 số) hoặc SĐT + Mật khẩu. Hỗ trợ nút đăng nhập nhanh tài khoản demo. |
| **Đăng ký Công dân** | `/cong-dan/dang-ky` | Đăng ký trực tuyến tức thì, kiểm tra trùng lặp CCCD/SĐT, tự động kích hoạt tài khoản. |
| **Quên mật khẩu** | `/cong-dan/quen-mat-khau` | Khôi phục mật khẩu 3 bước qua mã OTP gửi về số điện thoại/hệ thống SMS. |
| **Cổng cá nhân (Home)** | `/cong-dan` | Bảng điều khiển cá nhân: 5 thẻ thống kê (Tổng hồ sơ, Đang xử lý, Chờ ký số, Hoàn thành, Phản ánh), danh sách hồ sơ gần đây, hành động nhanh. |
| **Hồ sơ của tôi** | `/cong-dan/ho-so` | Danh sách hồ sơ TTHC của công dân, bộ lọc trạng thái, tìm kiếm, xem giấy tiếp nhận & hẹn trả kết quả. |
| **Chi tiết hồ sơ** | `/cong-dan/ho-so/:id` | Sơ đồ tiến độ quy trình (Steps), nhật ký luân chuyển (Timeline), tệp đính kèm, xem Giấy hẹn trả dạng văn bản hành chính chuẩn, gửi đánh giá hài lòng. |
| **Phản ánh của tôi** | `/cong-dan/phan-anh` | Quản lý các ý kiến/phản ánh hiện trường đô thị đã gửi, xem ảnh hiện trường, phản hồi chính thức và ảnh sau xử lý của UBND Phường. |
| **Thông báo** | `/cong-dan/thong-bao` | Hộp thư thông báo SMS/Hệ thống về tiến độ hồ sơ, mã OTP xác thực, liên kết mở trực tiếp hồ sơ liên quan. |
| **Hồ sơ cá nhân** | `/cong-dan/tai-khoan` | Cập nhật thông tin liên lạc, đổi mật khẩu bảo vệ tài khoản, xác thực số điện thoại qua OTP. |
| **Nộp DVC & Gửi phản ánh** | `/tra-cuu` | Tự động điền thông tin công dân (Tên, CCCD, SĐT, Địa chỉ), khóa trường CCCD để bảo đảm chính chủ, thêm nút chuyển nhanh sang Cổng cá nhân sau khi nộp thành công. |
| **Quản lý TK Công dân** | `/admin/citizen-accounts` | Dành cho Cán bộ Một cửa & Quản trị viên: Tra cứu, xem chi tiết (Drawer), khóa/mở khóa tài khoản công dân vi phạm. |

---

## 3. Bằng chứng kiểm thử & Hình ảnh thực tế

### 3.1. Giao diện Đăng nhập Công dân
![Giao diện Đăng nhập Công dân](file:///C:/Users/LambroS/.gemini/antigravity-ide/brain/89f13261-bbca-4d5e-b3cf-1ea3b0bcbc48/citizen_login_page_1792565938936.png)
*Trang đăng nhập tài khoản công dân với quốc hiệu, hỗ trợ đăng nhập bằng CCCD hoặc Số điện thoại cùng nút tự động điền tài khoản thử nghiệm.*

### 3.2. Cổng thông tin Cá nhân Công dân (Dashboard)
![Cổng thông tin Cá nhân Công dân](file:///C:/Users/LambroS/.gemini/antigravity-ide/brain/89f13261-bbca-4d5e-b3cf-1ea3b0bcbc48/citizen_dashboard_1792565977089.png)
*Bảng điều khiển cá nhân hiển thị lời chào trân trọng, 5 thẻ thống kê trực quan và danh sách hồ sơ TTHC đang thực hiện.*

### 3.3. Xem Chi tiết Tiến độ & Giấy tiếp nhận hẹn trả kết quả
![Chi tiết Hồ sơ TTHC](file:///C:/Users/LambroS/.gemini/antigravity-ide/brain/89f13261-bbca-4d5e-b3cf-1ea3b0bcbc48/application_detail_1792566025497.png)
*Công dân theo dõi từng bước thẩm định, xem Giấy tiếp nhận hồ sơ và hẹn trả kết quả chuẩn thể thức hành chính Nhà nước.*

### 3.4. Tích hợp trên Cổng Nộp DVC & Tra cứu Công khai
![Tích hợp Cổng Tra cứu Công khai](file:///C:/Users/LambroS/.gemini/antigravity-ide/brain/89f13261-bbca-4d5e-b3cf-1ea3b0bcbc48/tra_cuu_citizen_topbar_1792566094358.png)
*Thanh điều hướng nhận diện phiên đăng nhập của công dân, tự động điền biểu mẫu nộp hồ sơ trực tuyến.*

### 3.5. Phân hệ Quản trị Tài khoản Công dân dành cho Cán bộ
![Quản trị Tài khoản Công dân](file:///C:/Users/LambroS/.gemini/antigravity-ide/brain/89f13261-bbca-4d5e-b3cf-1ea3b0bcbc48/staff_citizen_accounts_page_1792566771415.png)
*Cán bộ theo dõi danh sách công dân đăng ký, kiểm tra số lượng hồ sơ liên kết và khóa/mở khóa tài khoản khi cần thiết.*

---

## 4. Video ghi hình tương tác thực tế

- **Quy trình Công dân tương tác trên Cổng DVC**:
  ![Video tương tác Cổng Công dân](file:///C:/Users/LambroS/.gemini/antigravity-ide/brain/89f13261-bbca-4d5e-b3cf-1ea3b0bcbc48/citizen_portal_demo_1792565924657.webp)

- **Quy trình Cán bộ quản lý Tài khoản Công dân**:
  ![Video tương tác Quản trị Tài khoản](file:///C:/Users/LambroS/.gemini/antigravity-ide/brain/89f13261-bbca-4d5e-b3cf-1ea3b0bcbc48/staff_account_mgmt_1792566726289.webp)

---

## 5. Hướng dẫn thử nghiệm nhanh

Quý đơn vị có thể truy cập và trải nghiệm ngay trên trình duyệt:

1. **Cổng Dịch vụ công dành cho Công dân**:
   - Truy cập: `http://localhost/gov/cong-dan/dang-nhap`
   - Số CCCD: `015088006677` *(hoặc SĐT `0966554433`)*
   - Mật khẩu: `Congdan@123`
   - *(Có sẵn nút bấm "Điền tài khoản thử nghiệm" để đăng nhập chỉ bằng 1 cú nhấp chuột)*

2. **Cổng Quản trị Hệ thống dành cho Cán bộ**:
   - Truy cập: `http://localhost/gov/login`
   - Tài khoản: `admin` / Mật khẩu: `Admin@123`
   - Điều hướng: Menu bên trái -> **Quản trị hệ thống** -> **Tài khoản công dân** (`/admin/citizen-accounts`).
