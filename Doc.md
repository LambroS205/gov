# TÀI LIỆU KỸ THUẬT VÀ PHƯƠNG ÁN TRIỂN KHAI, VẬN HÀNH, KIỂM THỬ, QUẢN TRỊ HỆ THỐNG THÔNG TIN QUẢN LÝ HÀNH CHÍNH
**Đơn vị áp dụng thực tiễn:** Ủy ban Nhân dân Phường Yên Bái  
**Tên hệ thống:** Hệ thống Một cửa điện tử và Quản trị Hành chính Số Cấp Phường (*YenBai eWard-Gov*)  
**Phiên bản tài liệu:** 1.0 - Bản thiết kế và triển khai hệ thống mới

---

## MỤC LỤC
1. [TỔNG QUAN HỆ THỐNG VÀ BỐI CẢNH THỰC TIỄN](#1-tổng-quan-hệ-thống-và-bối-cảnh-thực-tiễn)
2. [PHÂN TÍCH YÊU CẦU NGHIỆP VỤ VÀ KIẾN TRÚC](#2-phân-tích-yêu-cầu-nghiệp-vụ-và-kiến-trúc)
3. [XÂY DỰNG PHẦN MỀM VÀ CƠ SỞ DỮ LIỆU](#3-xây-dựng-phần-mềm-và-cơ-sở-dữ-liệu)
4. [KẾ HOẠCH TRIỂN KHAI HỆ THỐNG MỚI](#4-kế-hoạch-triển-khai-hệ-thống-mới)
5. [QUY TRÌNH KIỂM THỬ HỆ THỐNG (TESTING STRATEGY)](#5-quy-trình-kiểm-thử-hệ-thống-testing-strategy)
6. [QUY TRÌNH VẬN HÀNH VÀ BẢO TRÌ (OPERATIONS & MAINTENANCE)](#6-quy-trình-vận-hành-và-bảo-trì-operations--maintenance)
7. [QUẢN TRỊ HỆ THỐNG VÀ AN TOÀN THÔNG TIN](#7-quản-trị-hệ-thống-và-an-toàn-thông-tin)

---

## 1. TỔNG QUAN HỆ THỐNG VÀ BỐI CẢNH THỰC TIỄN

### 1.1. Bối cảnh thực tế tại UBND Phường Yên Bái
Phường Yên Bái là địa bàn hành chính trung tâm, có mật độ giao dịch hành chính công hàng ngày lớn (chứng thực, hộ tịch, địa chính - xây dựng, chính sách xã hội). Hiện trạng công tác quản lý tại địa phương:
- Việc số hóa tài liệu hồ sơ còn phân tán trên các bảng tính Excel và phần mềm đơn lẻ.
- Tốc độ tra cứu thông tin địa bàn, số hộ gia đình, nhân khẩu, biến động đất đai còn phụ thuộc nhiều vào văn bản giấy.
- Cần chuẩn hóa quy trình tiếp nhận, luân chuyển và xử lý hồ sơ Một cửa theo cơ chế liên thông, tích hợp chữ ký số chuyên dùng và kết nối Cơ sở dữ liệu Quốc gia về Dân cư (Đề án 06).

### 1.2. Mục tiêu xây dựng hệ thống mới
- **Mục tiêu chức năng:** Tin học hóa 100% quy trình tiếp nhận, thẩm định, phê duyệt và trả kết quả thủ tục hành chính thuộc thẩm quyền cấp xã/phường; quản lý văn bản nội bộ; quản lý thông tin dân cư và phản ánh kiến nghị của nhân dân.
- **Mục tiêu hiệu năng:** Xử lý đồng thời $\ge 200$ giao dịch nội bộ, thời gian phản hồi API $< 1.2$ giây, thời gian trễ đồng bộ trạng thái hồ sơ $< 3$ giây.
- **Mục tiêu an toàn thông tin:** Đáp ứng yêu cầu An toàn hệ thống thông tin theo Cấp độ 2 (theo Nghị định 85/2016/NĐ-CP) và tuân thủ Luật An ninh mạng, Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.

---

## 2. PHÂN TÍCH YÊU CẦU NGHIỆP VỤ VÀ KIẾN TRÚC

### 2.1. Phân tích quy trình nghiệp vụ (Quy trình Một cửa liên thông)

```
[Công dân / Tổ chức]
       │ (1. Nộp hồ sơ trực tiếp hoặc qua Cổng DVC)
       ▼
[Bộ phận Tiếp nhận & Trả kết quả (Một cửa)]
       │ (2. Tiếp nhận, kiểm tra tính hợp lệ, cấp mã vạch/Mã hồ sơ số)
       ├─────────────────────────┐ (Từ chối / Yêu cầu bổ sung)
       ▼ (Hợp lệ)                ▼
[Cán bộ Chuyên môn] ───────► [Công dân cập nhật]
       │ (3. Thẩm định điều kiện, số hóa đính kèm, lập phiếu trình)
       ▼
[Lãnh đạo UBND Phường (Chủ tịch / Phó CT)]
       │ (4. Ký số văn bản điện tử qua SIM PKI / USB Token Ban Cơ yếu)
       ▼
[Văn thư số Phường]
       │ (5. Đóng dấu số, phát hành kết quả, lưu trữ hồ sơ số)
       ▼
[Bộ phận Một cửa]
       │ (6. Thông báo SMS/Zalo OA & Trả kết quả bản giấy/bản điện tử có ký số)
       ▼
[Công dân nhận kết quả]
```

### 2.2. Phân rã chức năng hệ thống (Functional Requirements)

| Phân hệ (Module) | Chức năng chi tiết | Đối tượng sử dụng |
| :--- | :--- | :--- |
| **Phân hệ Một cửa & DVC** | - Tiếp nhận hồ sơ trực tiếp/trực tuyến<br>- Sinh mã hồ sơ chuẩn quốc gia (QR/Barcode)<br>- Tra cứu tiến độ hồ sơ qua mã định danh | Công dân, Cán bộ Một cửa |
| **Phân hệ Xử lý Chuyên môn** | - Phân công hồ sơ tự động/thủ công<br>- Xử lý nghiệp vụ: Hộ tịch, Chứng thực điện tử, Địa chính, Lao động TB&XH<br>- Thẩm định hồ sơ và dự thảo kết quả | Công chức chuyên môn Phường |
| **Phân hệ Phê duyệt & Ký số** | - Trình ký điện tử<br>- Tích hợp ký số HSM / Viettel CA / VNPT CA / Token Ban Cơ yếu Chính phủ<br>- Đóng dấu thời gian (Timestamping) | Lãnh đạo UBND Phường |
| **Phân hệ Quản lý Dân cư & Địa bàn** | - Quản lý tổ dân phố, số hộ, nhân khẩu tạm trú/thường trú<br>- Bản đồ số hạ tầng/địa chính cấp phường cơ bản | Cảnh sát khu vực, Cán bộ Tư pháp, Cán bộ Địa chính |
| **Phân hệ Phản ánh - Kiến nghị** | - Tiếp nhận tin báo hiện trường (rác thải, lấn chiếm lòng lề đường, an ninh trật tự)<br>- Điều phối xử lý và phản hồi kết quả công khai | Công dân, Lãnh đạo, Đội trật tự đô thị |
| **Phân hệ Báo cáo & Thống kê** | - Báo cáo chỉ số phục vụ hành chính, tiến độ giải quyết hồ sơ (Đúng hạn, Quá hạn)<br>- Thống kê biểu mẫu hành chính định kỳ | Văn phòng HĐND - UBND, Lãnh đạo Phường |

### 2.3. Yêu cầu phi chức năng (Non-Functional Requirements)
1. **Tính sẵn sàng (Availability):** Cam kết Uptime đạt tối thiểu $99.5\%$ trong giờ làm việc hành chính ($7h00 - 18h00$, Thứ 2 - Thứ 6).
2. **Khả năng mở rộng (Scalability):** Thiết kế kiến trúc dạng Modular Monolith hoặc Microservices đóng gói Container (Docker), sẵn sàng mở rộng ngang (Horizontal Scaling) khi số lượng giao dịch tăng.
3. **Bảo mật dữ liệu (Confidentiality & Integrity):** Toàn bộ dữ liệu truyền nhận qua mạng mã hóa bằng giao thức TLS 1.3. Dữ liệu nhạy cảm của công dân (Căn cước công dân, số điện thoại, lý lịch cá nhân) được mã hóa tại mức Database (AES-256).

### 2.4. Kiến trúc tổng thể hệ thống (System Architecture)

```
        ┌────────────────────────────────────────────────────────┐
        │                     LỚP TRÌNH DIỄN                     │
        │  - Cổng DVC Phường (Next.js / Tailwind CSS)            │
        │  - Phân hệ Cán bộ Nội bộ (React / Ant Design)          │
        │  - Ứng dụng Di động phản ánh hiện trường (Flutter)     │
        └───────────────────────────┬────────────────────────────┘
                                    │ HTTPS (TLS 1.3)
        ┌───────────────────────────▼────────────────────────────┐
        │                  API GATEWAY & SECURITY                │
        │  - Nginx Reverse Proxy / WAF ModSecurity               │
        │  - Rate Limiting, CORS, Authentication Filter          │
        └───────────────────────────┬────────────────────────────┘
                                    │ Internal Network
        ┌───────────────────────────▼────────────────────────────┐
        │                 LỚP NGHIỆP VỤ (BACKEND)                │
        │  - Auth Service (OAuth2 / OpenID Connect / Keycloak)   │
        │  - Service Tiếp nhận & Xử lý Một Cửa                   │
        │  - Service Ký số & Số hóa Văn thư                      │
        │  - Service Quản lý Địa bàn & Dân cư                    │
        │  - Message Queue: RabbitMQ (Xử lý hàng đợi văn bản)    │
        └──────────────┬──────────────────────────┬──────────────┘
                       │                          │
        ┌──────────────▼──────────┐    ┌──────────▼──────────────┐
        │      LỚP LƯU TRỮ        │    │    TÍCH HỢP BÊN NGOÀI   │
        │ - Database: PostgreSQL  │    │ - Trục LGSP Tỉnh        │
        │ - Caching: Redis        │    │ - CSDL Dân cư (VNeID)   │
        │ - Object Storage: MinIO │    │ - SMS/Zalo OA Gateway   │
        │   (Lưu trữ file scan)   │    │ - Hệ thống Ký số CKS    │
        └─────────────────────────┘    └─────────────────────────┘
```

---

## 3. XÂY DỰNG PHẦN MỀM VÀ CƠ SỞ DỮ LIỆU

### 3.1. Lựa chọn Công nghệ (Tech Stack)
- **Frontend Nội bộ:** React 18, Vite, TypeScript, Ant Design Pro (chuẩn giao diện dashboard hành chính, tối ưu tốc độ nhập liệu).
- **Backend API:** Java 17 Spring Boot 3.x (Spring Security, Spring Data JPA) / Node.js NestJS cho các tác vụ Webhook, File I/O.
- **Cơ sở dữ liệu chính:** PostgreSQL 15 (hỗ trợ JSONB linh hoạt cho các biểu mẫu hồ sơ thay đổi theo thông tư).
- **Lưu trữ tệp điện tử (Document Storage):** MinIO S3-compatible Object Storage (Lưu trữ file hồ sơ scan, kết quả PDF/A-1a có đóng dấu số).
- **Bộ nhớ đệm & Phiên làm việc:** Redis 7 (Quản trị session, Rate limiting, Token cache).

### 3.2. Thiết kế Cơ sở Dữ liệu cốt lõi (Core Schema)

```sql
-- 1. Bảng Đơn vị hành chính / Phòng ban thuộc Phường
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    dept_code VARCHAR(20) UNIQUE NOT NULL,
    dept_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Người dùng hệ thống (Cán bộ công chức)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone_number VARCHAR(15),
    department_id INT REFERENCES departments(id),
    role VARCHAR(30) NOT NULL, -- 'ADMIN', 'MOT_CUA', 'CHUYEN_VIEN', 'LANH_DAO', 'VAN_THU'
    certificate_serial VARCHAR(100), -- Serial chứng thư số để ký
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Danh mục Thủ tục hành chính (TTHC)
CREATE TABLE administrative_procedures (
    id SERIAL PRIMARY KEY,
    proc_code VARCHAR(50) UNIQUE NOT NULL, -- Mã TTHC quốc gia
    proc_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'HO_TICH', 'CHUNG_THUC', 'DIA_CHINH',...
    processing_days INT NOT NULL DEFAULT 1,
    fee_amount NUMERIC(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Bảng Hồ sơ tiếp nhận
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_code VARCHAR(50) UNIQUE NOT NULL, -- Mã hồ sơ sinh theo quy chuẩn: 000.00.00.H49-...
    procedure_id INT REFERENCES administrative_procedures(id),
    citizen_name VARCHAR(100) NOT NULL,
    citizen_id_number VARCHAR(20) NOT NULL, -- Số CCCD
    citizen_phone VARCHAR(15),
    citizen_address TEXT,
    status VARCHAR(30) NOT NULL, -- 'CHO_TIEP_NHAN', 'DANG_XU_LY', 'CHO_KY_DUYET', 'DA_KY_SO', 'HOAN_THANH', 'TRA_LAI'
    submit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    current_handler_id UUID REFERENCES users(id),
    dossier_payload JSONB -- Chứa dữ liệu linh hoạt của từng loại thủ tục
);

-- 5. Bảng Tài liệu đính kèm (File Scan, Bản ký điện tử)
CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Đường dẫn MinIO Object Key
    file_size BIGINT,
    mime_type VARCHAR(100),
    is_signed BOOLEAN DEFAULT FALSE,
    signature_data JSONB, -- Chứa metadata chữ ký điện tử: Người ký, Thời gian ký, Serial Cert
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Nhật ký vết hệ thống (Audit Trail)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    old_state JSONB,
    new_state JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. KẾ HOẠCH TRIỂN KHAI HỆ THỐNG MỚI

### 4.1. Phương án hạ tầng mạng và phần cứng
Triển khai theo mô hình máy chủ tại Phòng dữ liệu (Data Center) của Ủy ban hoặc sử dụng hạ tầng Private Cloud do Tỉnh/Sở TT&TT cấp phát cho Phường Yên Bái:

*   **Server 01 (Master/Apps):** 16 vCPU, 32GB RAM, 500GB SSD (Chạy Nginx, Spring Boot App Containers, Keycloak).
*   **Server 02 (Database & MinIO):** 16 vCPU, 64GB RAM, 2TB SSD NVMe RAID-10 (PostgreSQL Cluster, MinIO Storage, Daily Backups).
*   **Mạng LAN nội bộ:** Phân vùng mạng (VLAN):
    *   *VLAN 10 (Hành chính):* Dành riêng cho cán bộ chuyên môn và lãnh đạo truy cập ứng dụng.
    *   *VLAN 20 (Bộ phận Một cửa):* Kết nối máy in mã vạch, máy quét tài liệu, màn hình số bốc số thứ tự.
    *   *VLAN 30 (Khách/Công dân):* Wi-Fi công cộng miễn phí phục vụ công dân nộp hồ sơ, cách ly hoàn toàn với VLAN 10 và 20.

### 4.2. Lộ trình triển khai 6 bước (Gantt-like Checklist)

```
Tuần 1-2: Khảo sát hạ tầng & Cài đặt môi trường Base (OS, Network, Docker, DB)
Tuần 3-4: Triển khai Cài đặt hệ thống lõi & Import danh mục TTHC chuẩn
Tuần 5-6: Chuyển đổi dữ liệu (Migration) từ các file giấy/Excel và hệ thống cũ
Tuần 7:   Kiểm thử chấp nhận người dùng (UAT) & Diễn tập vận hành
Tuần 8:   Tập huấn đào tạo cán bộ UBND Phường Yên Bái
Tuần 9+:  Go-Live chính thức, Hỗ trợ On-site (SLA L1 trực tiếp tại Một cửa)
```

### 4.3. Kế hoạch chuyển đổi dữ liệu (Data Migration)
1. **Lập danh mục dữ liệu cần chuyển:** Dữ liệu hộ tịch trong 3 năm gần nhất, dữ liệu cấp giấy phép chứng thực, danh bạ tổ dân phố và danh sách quản lý bảo trợ xã hội.
2. **Kịch bản làm sạch (Data Cleansing):** 
   - Sử dụng script Python/Pandas rà soát trùng lặp số CCCD/CMND 9 số cũ.
   - Chuẩn hóa địa chỉ thường trú theo đúng định danh hành chính 3 cấp (Tỉnh - Huyện - Xã).
3. **Thực thi tải dữ liệu (ETL Process):** Chuyển đổi dữ liệu sang tệp trung gian JSON/CSV $\rightarrow$ Chạy Script nạp vào PostgreSQL $\rightarrow$ Xuất báo cáo đối soát 100% bản ghi.

---

## 5. QUY TRÌNH KIỂM THỬ HỆ THỐNG (TESTING STRATEGY)

### 5.1. Các cấp độ kiểm thử bắt buộc

```
┌────────────────────────────────────────────────────────┐
│ 1. Unit Testing: Phủ mã nguồn (Code Coverage >= 75%)   │
├────────────────────────────────────────────────────────┤
│ 2. Integration Testing: Kiểm tra tích hợp API & CSDL   │
├────────────────────────────────────────────────────────┤
│ 3. Performance Testing: Kiểm thử tải và áp lực (Load)  │
├────────────────────────────────────────────────────────┤
│ 4. Security Penetration Test: Đánh giá an toàn thông tin│
├────────────────────────────────────────────────────────┤
│ 5. UAT: Kiểm thử chấp nhận của người dùng tại Phường   │
└────────────────────────────────────────────────────────┘
```

### 5.2. Ma trận Kịch bản kiểm thử (Test Cases tiêu biểu)

| Test Case ID | Tên kịch bản kiểm thử | Dữ liệu đầu vào (Test Data) | Kết quả mong đợi (Expected Outcome) | Phân loại |
| :--- | :--- | :--- | :--- | :--- |
| **TC-DVC-001** | Tiếp nhận hồ sơ trực tuyến thành công | Công dân gửi hồ sơ "Cấp bản sao trích lục hộ tịch" + File CCCD hợp lệ | Hệ thống cấp số hồ sơ chuẩn, gửi tin nhắn SMS/Zalo xác nhận kèm mã QR | Functional |
| **TC-DVC-002** | Xử lý lỗi hồ sơ thiếu đính kèm | Nộp thiếu file Giấy khai sinh bản gốc | Hệ thống chặn submit, hiển thị thông báo đỏ tại trường tài liệu bắt buộc | Functional |
| **TC-SIGN-001**| Lãnh đạo ký số phê duyệt kết quả | Token Ban cơ yếu cắm tại máy Lãnh đạo, nhập đúng PIN | File PDF kết quả được ký số, dấu kiểm tra tính toàn vẹn chữ ký hiển thị "Valid Signature" | Functional |
| **TC-PERF-001**| Tải cao điểm giờ tiếp dân | 150 người dùng giả lập nộp hồ sơ cùng lúc qua Apache JMeter | 100% request thành công, Latency $< 2.0s$, CPU hệ thống $< 70\%$ | Non-Functional |
| **TC-SEC-001** | Kiểm tra lỗ hổng SQL Injection | Nhập `admin' OR '1'='1` vào ô tìm kiếm hồ sơ | Hệ thống trả về mã lỗi 400 Bad Request, không rò rỉ dữ liệu bảng | Security |
| **TC-SEC-002** | Kiểm tra quyền truy cập trái phép | Cán bộ Một cửa gọi API duyệt hồ sơ của Chủ tịch (`/api/v1/approve`) | Trả về HTTP 403 Forbidden, ghi nhật ký cảnh báo vào `audit_logs` | Security |

### 5.3. Tiêu chí Nghiệm thu Kiểm thử (Exit Criteria)
- 100% các Test Cases mức **Critical** và **High** phải Pass.
- Lỗi mức **Medium** còn tồn đọng $\le 2$ (phải có phương án khắc phục trong 7 ngày).
- Không có lỗi mức **Low** ảnh hưởng trực tiếp đến tính đúng đắn của dữ liệu tài chính (lệ phí) và tư pháp hộ tịch.
- Biên bản UAT có đầy đủ xác nhận từ: Trưởng bộ phận Một cửa, Cán bộ phụ trách CNTT và Đại diện Lãnh đạo UBND Phường.

---

## 6. QUY TRÌNH VẬN HÀNH VÀ BẢO TRÌ (OPERATIONS & MAINTENANCE)

### 6.1. Quy trình vận hành chuẩn hàng ngày (SOP)
- **Đầu ngày (07h15):** 
  - Quản trị viên kiểm tra trạng thái dịch vụ (Service Health Check) thông qua Dashboard giám sát (Grafana).
  - Kiểm tra dung lượng ổ đĩa lưu trữ tệp MinIO, bảo đảm dung lượng trống $> 20\%$.
  - Kiểm tra trạng thái kết nối Token Chữ ký số và Cổng kết nối thanh toán biên lai điện tử.
- **Trong ngày làm việc:**
  - Theo dõi hàng đợi xử lý nền (RabbitMQ/Celery) đảm bảo không có hồ sơ bị nghẽn (stuck queue).
  - Trực hỗ trợ kỹ thuật xử lý sự cố kẹt hồ sơ tại các bước luân chuyển.
- **Cuối ngày (17h30):**
  - Chạy batch script tự động chốt sổ tiếp nhận ngày.
  - Kích hoạt Job kiểm tra toàn vẹn cơ sở dữ liệu.

### 6.2. Kế hoạch Sao lưu và Phục hồi sau thảm họa (Backup & Disaster Recovery)

#### Chính sách sao lưu (RPO & RTO)
- **RPO (Recovery Point Objective):** $\le 1$ giờ (Dữ liệu mất mát tối đa không quá 1 giờ làm việc).
- **RTO (Recovery Time Objective):** $\le 2$ giờ (Thời gian đưa hệ thống trở lại hoạt động hoàn toàn sau sự cố nghiêm trọng).

#### Lịch trình sao lưu tự động

```bash
#!/bin/bash
# Script mẫu Backup Database hàng ngày tại UBND Phường Yên Bái
BACKUP_DIR="/var/backups/yenbai_egov"
DATE=$(date +'%Y%m%d_%H%M%S')
DB_NAME="yenbai_db"

# 1. Thực hiện Dump CSDL nén
pg_dump -U postgres -Fc $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.dump

# 2. Mã hóa file backup bằng GPG (Bảo vệ dữ liệu theo chuẩn)
gpg --encrypt --recipient "admin_yenbai@gov.vn" $BACKUP_DIR/${DB_NAME}_${DATE}.dump

# 3. Đồng bộ bản lưu sang Máy chủ Lưu trữ Phụ qua rsync an toàn
rsync -avz -e "ssh -p 2222" $BACKUP_DIR/${DB_NAME}_${DATE}.dump.gpg backup_user@192.168.10.50:/remote_backup/

# 4. Xóa bản lưu cục bộ cũ quá 14 ngày để tiết kiệm dung lượng
find $BACKUP_DIR -type f -mtime +14 -name "*.dump" -delete
```

### 6.3. Giám sát hệ thống (System Monitoring & Alerting)
- **Công cụ:** Prometheus thu thập chỉ số hệ thống (Metrics: CPU, RAM, Disk I/O, Network Throughput) kết hợp Grafana hiển thị trực quan.
- **Cảnh báo tự động:** Cấu hình Alertmanager tích hợp gửi tin nhắn đến kênh Telegram/Zalo bảo mật của Nhóm kỹ thuật Phường khi:
  - Tỉ lệ lỗi HTTP 5xx vượt quá $2\%$ trong vòng 5 phút.
  - Dung lượng phân vùng `/data` vượt quá $85\%$.
  - Máy chủ mất kết nối Internet quá 3 phút (ảnh hưởng liên thông dịch vụ công tỉnh).

---

## 7. QUẢN TRỊ HỆ THỐNG VÀ AN TOÀN THÔNG TIN

### 7.1. Mô hình Phân quyền theo Vai trò (Role-Based Access Control - RBAC)

```
        ┌────────────────────────────────────────────────────────┐
        │                     QUẢN TRỊ VIÊN                      │
        │ - Cấu hình hệ thống, tạo tài khoản cán bộ              │
        │ - Quản lý cấu hình danh mục TTHC, phân công nhiệm vụ   │
        │ - Xem báo cáo Audit Log (Không can thiệp sửa hồ sơ)   │
        └────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┴────────────────────────────┐
        │                                                        │
        ▼                                                        ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│     CÁN BỘ TIẾP NHẬN 1 CỬA    │        │      CÁN BỘ CHUYÊN MÔN        │
│ - Tạo hồ sơ mới, in giấy hẹn  │        │ - Nhận hồ sơ thuộc chuyên môn │
│ - Tiếp nhận hồ sơ trực tuyến  │        │ - Xử lý, soạn thảo kết quả    │
│ - Trả kết quả, thu phí/lệ phí │        │ - Đẩy hồ sơ lên lãnh đạo duyệt│
└───────────────────────────────┘        └───────────────────────────────┘
                                                         │
                                                         ▼
                                         ┌───────────────────────────────┐
                                         │       LÃNH ĐẠO UBND PHƯỜNG    │
                                         │ - Xem xét nội dung thẩm định  │
                                         │ - Ký số điện tử vào kết quả   │
                                         │ - Trả lại hồ sơ yêu cầu sửa   │
                                         └───────────────────────────────┘
```

### 7.2. Chính sách Mật khẩu và Xác thực an toàn
- **Chính sách mật khẩu:** Độ dài tối thiểu 10 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt. Yêu cầu đổi mật khẩu định kỳ 90 ngày một lần. Khóa tài khoản tạm thời 15 phút nếu nhập sai quá 5 lần liên tiếp.
- **Xác thực đa yếu tố (2FA):** Bắt buộc kích hoạt 2FA (TOTP qua Google Authenticator hoặc tin nhắn OTP) đối với các tài khoản có quyền: `ADMIN`, `LANH_DAO`, và `VAN_THU`.

### 7.3. Đảm bảo An toàn thông tin và Nhật ký kiểm toán (Audit Trail)
- **Nguyên tắc bất biến của Nhật ký (Immutable Logs):** Toàn bộ các thao tác nghiệp vụ trọng yếu (Xem dữ liệu cá nhân, Chỉnh sửa thông tin hồ sơ, Ký duyệt, Xóa file tài liệu) đều được ghi nhận vào bảng `audit_logs` với IP, MAC address, thời gian thực và không một tài khoản nào (kể cả DB Admin) được phép cấp quyền `UPDATE` hay `DELETE` trên bảng này.
- **Bảo mật dữ liệu cá nhân (Tuân thủ Nghị định 13/2023/NĐ-CP):** 
  - Toàn bộ trường số CCCD và thông tin liên lạc của công dân hiển thị trên giao diện cán bộ được che mờ một phần (Masking: ví dụ `03809500****`).
  - Chỉ cán bộ trực tiếp thụ lý hồ sơ đó mới được quyền nhấn nút "Xem đầy đủ" và thao tác này lập tức kích hoạt 1 bản ghi trong Audit Log.

---

## 8. KẾT LUẬN VÀ KIẾN NGHỊ

Hệ thống Thông tin Quản lý Hành chính Số tại UBND Phường Yên Bái sau khi xây dựng hoàn thiện theo tài liệu thiết kế này sẽ mang lại các hiệu quả thiết thực:
1. **Đối với công dân:** Rút ngắn thời gian giải quyết thủ tục từ 30% - 50%, công khai minh bạch toàn bộ quy trình, hỗ trợ tra cứu tiến độ mọi lúc mọi nơi.
2. **Đối với Cán bộ - Lãnh đạo UBND Phường:** Giảm thiểu 90% việc ghi chép sổ sách thủ công, số hóa hoàn toàn kho lưu trữ hành chính, hỗ trợ ký số di động nhanh chóng và chính xác.
3. **Đối với Công tác Quản lý Nhà nước:** Đảm bảo dữ liệu "Đúng - Đủ - Sạch - Sống", tạo nền tảng chuyển đổi số vững chắc tại cấp cơ sở, đáp ứng các tiêu chuẩn kỹ thuật số và an toàn thông tin quốc gia.