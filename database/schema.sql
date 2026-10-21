-- ====================================================================
-- HỆ THỐNG MỘT CỬA ĐIỆN TỬ VÀ QUẢN TRỊ HÀNH CHÍNH SỐ CẤP PHƯỜNG
-- Đơn vị: UBND Phường Yên Bái (YenBai eWard-Gov)
-- CSDL: MariaDB 10.4 / MySQL 8.0
-- ====================================================================

CREATE DATABASE IF NOT EXISTS yenbai_egov
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE yenbai_egov;

-- Tắt kiểm tra khóa ngoại tạm thời khi khởi tạo
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Bảng Đơn vị hành chính / Phòng ban thuộc Phường
DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dept_code VARCHAR(20) NOT NULL UNIQUE,
    dept_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Người dùng hệ thống (Cán bộ công chức)
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone_number VARCHAR(15),
    department_id INT UNSIGNED NULL,
    role ENUM('ADMIN', 'MOT_CUA', 'CHUYEN_VIEN', 'LANH_DAO', 'VAN_THU') NOT NULL,
    certificate_serial VARCHAR(100) NULL,
    totp_secret VARCHAR(64) NULL,
    is_active TINYINT(1) DEFAULT 1,
    failed_login_count TINYINT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Danh mục Thủ tục hành chính (TTHC)
DROP TABLE IF EXISTS administrative_procedures;
CREATE TABLE administrative_procedures (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    proc_code VARCHAR(50) NOT NULL UNIQUE,
    proc_name VARCHAR(255) NOT NULL,
    field_type ENUM('HO_TICH', 'CHUNG_THUC', 'DIA_CHINH', 'LAO_DONG_TBXH', 'TU_PHAP', 'KHAC') NOT NULL,
    processing_days INT NOT NULL DEFAULT 1,
    fee_amount DECIMAL(12,2) DEFAULT 0.00,
    required_documents LONGTEXT NULL, -- JSON format lưu danh sách hồ sơ cần nộp
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Hồ sơ tiếp nhận (Dossiers / Applications)
DROP TABLE IF EXISTS applications;
CREATE TABLE applications (
    id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    dossier_code VARCHAR(50) NOT NULL UNIQUE, -- Mã hồ sơ sinh theo chuẩn: e.g. 000.00.00.H49-261007-0001
    procedure_id INT UNSIGNED NOT NULL,
    citizen_name VARCHAR(100) NOT NULL,
    citizen_id_number VARCHAR(20) NOT NULL, -- Số CCCD
    citizen_phone VARCHAR(15),
    citizen_address TEXT,
    citizen_account_id CHAR(36) NULL,
    status ENUM('CHO_TIEP_NHAN', 'DANG_XU_LY', 'CHO_KY_DUYET', 'DA_KY_SO', 'HOAN_THANH', 'TRA_LAI', 'TU_CHOI') NOT NULL DEFAULT 'CHO_TIEP_NHAN',
    submit_channel ENUM('TRUC_TIEP', 'TRUC_TUYEN') DEFAULT 'TRUC_TIEP',
    submit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    appointment_date DATETIME NOT NULL,
    completed_date DATETIME NULL,
    current_handler_id CHAR(36) NULL,
    received_by_id CHAR(36) NULL,
    dossier_payload LONGTEXT NULL, -- JSON lưu biểu mẫu động theo từng loại thủ tục
    notes TEXT NULL,
    rejection_reason TEXT NULL,
    is_overdue TINYINT(1) DEFAULT 0,
    payment_status ENUM('CHUA_THANH_TOAN', 'DA_THANH_TOAN', 'MIEN_PHI') NOT NULL DEFAULT 'CHUA_THANH_TOAN',
    payment_method ENUM('TIEN_MAT', 'CHUYEN_KHOAN_QR') NULL,
    receipt_number VARCHAR(50) NULL,
    paid_at TIMESTAMP NULL,
    satisfaction_score TINYINT NULL,
    satisfaction_comment TEXT NULL,
    satisfaction_date TIMESTAMP NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_procedure FOREIGN KEY (procedure_id) REFERENCES administrative_procedures(id),
    CONSTRAINT fk_app_handler FOREIGN KEY (current_handler_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_app_receiver FOREIGN KEY (received_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_citizen_id (citizen_id_number),
    INDEX idx_app_cacc (citizen_account_id),
    INDEX idx_submit_date (submit_date),
    INDEX idx_appointment (appointment_date),
    INDEX idx_handler (current_handler_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng Lịch sử luân chuyển hồ sơ (Workflow tracking)
DROP TABLE IF EXISTS application_workflow;
CREATE TABLE application_workflow (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id CHAR(36) NOT NULL,
    from_user_id CHAR(36) NULL,
    to_user_id CHAR(36) NULL,
    from_status VARCHAR(30) NOT NULL,
    to_status VARCHAR(30) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'TIEP_NHAN', 'PHAN_CONG', 'THAM_DINH', 'TRINH_KY', 'KY_SO', 'TRA_LAI', 'HOAN_THANH', 'TU_CHOI'
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wf_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_wf_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_wf_to_user FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_wf_app (application_id),
    INDEX idx_wf_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng Tài liệu đính kèm (Scan, PDF, Chứng thực)
DROP TABLE IF EXISTS application_documents;
CREATE TABLE application_documents (
    id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    application_id CHAR(36) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type VARCHAR(100),
    doc_type ENUM('HO_SO_GOC', 'KET_QUA', 'BIEN_BAN', 'GIAY_TO_KEM_THEO') DEFAULT 'HO_SO_GOC',
    is_signed TINYINT(1) DEFAULT 0,
    signature_data LONGTEXT NULL, -- JSON lưu metadata chữ ký số
    uploaded_by CHAR(36) NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_doc_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_doc_app (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng Tổ dân phố / Địa bàn quản lý
DROP TABLE IF EXISTS residential_areas;
CREATE TABLE residential_areas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    area_code VARCHAR(20) NOT NULL UNIQUE,
    area_name VARCHAR(100) NOT NULL,
    area_type ENUM('TO_DAN_PHO', 'KHU_PHO', 'THON') DEFAULT 'TO_DAN_PHO',
    manager_name VARCHAR(100) NULL,
    manager_phone VARCHAR(15) NULL,
    total_households INT DEFAULT 0,
    total_residents INT DEFAULT 0,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng Quản lý Dân cư & Nhân khẩu
DROP TABLE IF EXISTS citizens;
CREATE TABLE citizens (
    id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    cccd_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NULL,
    gender ENUM('NAM', 'NU', 'KHAC') DEFAULT 'NAM',
    phone_number VARCHAR(15) NULL,
    email VARCHAR(100) NULL,
    permanent_address TEXT NULL,
    current_address TEXT NULL,
    residential_area_id INT UNSIGNED NULL,
    household_number VARCHAR(20) NULL,
    residence_type ENUM('THUONG_TRU', 'TAM_TRU', 'TAM_VANG') DEFAULT 'THUONG_TRU',
    occupation VARCHAR(100) NULL,
    ethnicity VARCHAR(50) DEFAULT 'Kinh',
    religion VARCHAR(50) DEFAULT 'Không',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_citizen_area FOREIGN KEY (residential_area_id) REFERENCES residential_areas(id) ON DELETE SET NULL,
    INDEX idx_citizen_cccd (cccd_number),
    INDEX idx_citizen_name (full_name),
    INDEX idx_citizen_area (residential_area_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng Phản ánh - Kiến nghị của người dân
DROP TABLE IF EXISTS complaints;
CREATE TABLE complaints (
    id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    complaint_code VARCHAR(50) NOT NULL UNIQUE,
    citizen_name VARCHAR(100) NOT NULL,
    citizen_phone VARCHAR(15) NULL,
    citizen_cccd VARCHAR(20) NULL,
    citizen_account_id CHAR(36) NULL,
    category ENUM('RAC_THAI', 'LAN_CHIEM', 'AN_NINH', 'DIEN_NUOC', 'GIAO_THONG', 'MOI_TRUONG', 'KHAC') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location TEXT NULL,
    photo_paths LONGTEXT NULL, -- JSON lưu danh sách URL ảnh
    resolved_photo_paths LONGTEXT NULL, -- JSON lưu danh sách URL ảnh kết quả xử lý thực tế
    status ENUM('MOI', 'DANG_XU_LY', 'DA_XU_LY', 'DONG') DEFAULT 'MOI',
    priority ENUM('THAP', 'TRUNG_BINH', 'CAO', 'KHAN_CAP') DEFAULT 'TRUNG_BINH',
    assigned_to CHAR(36) NULL,
    response TEXT NULL,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_complaint_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaint_status (status),
    INDEX idx_complaint_category (category),
    INDEX idx_cpl_cacc (citizen_account_id),
    INDEX idx_complaint_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng Thông báo (SMS / Zalo / Email / Hệ thống)
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recipient_phone VARCHAR(15) NOT NULL,
    recipient_name VARCHAR(100) NULL,
    channel ENUM('SMS', 'ZALO', 'EMAIL', 'SYSTEM') DEFAULT 'SYSTEM',
    subject VARCHAR(255) NULL,
    message TEXT NOT NULL,
    related_type VARCHAR(50) NULL, -- 'APPLICATION', 'COMPLAINT'
    related_id CHAR(36) NULL,
    is_sent TINYINT(1) DEFAULT 1,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notify_sent (is_sent),
    INDEX idx_notify_related (related_type, related_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng Nhật ký kiểm toán (Audit Log) - BẤT BIẾN
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NULL,
    user_name VARCHAR(100) NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    old_state LONGTEXT NULL,
    new_state LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_resource (resource_type, resource_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Bảng Refresh Token xác thực JWT
DROP TABLE IF EXISTS refresh_tokens;
CREATE TABLE refresh_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_token_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Bảng Tài khoản Công dân
DROP TABLE IF EXISTS citizen_accounts;
CREATE TABLE citizen_accounts (
    id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    cccd_number VARCHAR(12) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NULL,
    date_of_birth DATE NULL,
    gender ENUM('NAM', 'NU', 'KHAC') DEFAULT 'NAM',
    address TEXT NULL,
    citizen_id CHAR(36) NULL,
    phone_verified_at TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1,
    failed_login_count TINYINT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cacc_citizen FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE SET NULL,
    INDEX idx_cacc_cccd (cccd_number),
    INDEX idx_cacc_phone (phone_number),
    INDEX idx_cacc_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Bảng Mã xác thực OTP Công dân
DROP TABLE IF EXISTS citizen_otps;
CREATE TABLE citizen_otps (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    purpose ENUM('RESET_PASSWORD', 'VERIFY_PHONE') NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    attempts TINYINT DEFAULT 0,
    expires_at DATETIME NOT NULL,
    consumed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otp_phone (phone_number, purpose),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

