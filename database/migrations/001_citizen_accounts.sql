-- ====================================================================
-- Migration: 001_citizen_accounts.sql
-- Thêm phân hệ Tài khoản Công dân (YenBai eWard-Gov)
-- ====================================================================

USE yenbai_egov;

-- 1. Bảng Tài khoản Công dân
CREATE TABLE IF NOT EXISTS citizen_accounts (
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

-- 2. Bảng Mã xác thực OTP Công dân (Quên mật khẩu / Xác minh SĐT)
CREATE TABLE IF NOT EXISTS citizen_otps (
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

-- 3. Bổ sung trường citizen_account_id vào bảng applications (nếu chưa có)
ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS citizen_account_id CHAR(36) NULL AFTER citizen_address;

-- Tạo index cho applications.citizen_account_id nếu chưa có
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
                 AND table_name = 'applications' 
                 AND index_name = 'idx_app_cacc');
SET @sqlstmt := IF(@exist > 0, 'SELECT "Index idx_app_cacc already exists"', 
                   'ALTER TABLE applications ADD INDEX idx_app_cacc (citizen_account_id)');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Bổ sung trường citizen_account_id vào bảng complaints (nếu chưa có)
ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS citizen_account_id CHAR(36) NULL AFTER citizen_cccd;

-- Tạo index cho complaints.citizen_account_id nếu chưa có
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
                 AND table_name = 'complaints' 
                 AND index_name = 'idx_cpl_cacc');
SET @sqlstmt := IF(@exist > 0, 'SELECT "Index idx_cpl_cacc already exists"', 
                   'ALTER TABLE complaints ADD INDEX idx_cpl_cacc (citizen_account_id)');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Nạp tài khoản công dân mẫu demo
-- Tài khoản: CCCD 015088006677 / SĐT 0966554433 / Mật khẩu: Congdan@123
INSERT INTO citizen_accounts (
    id, cccd_number, phone_number, password_hash, full_name, email,
    date_of_birth, gender, address, citizen_id, phone_verified_at, is_active
) VALUES (
    'ca000001-0000-0000-0000-000000000001',
    '015088006677',
    '0966554433',
    '$2y$10$kLhuKKquIXctNpVrShWyRu0TdkuQboTvr1aJb4PsA0hTejxibOvru',
    'Lê Văn Cường',
    'cuong.le@gmail.com',
    '1988-06-12',
    'NAM',
    'Số 102 phố Hồng Hà, Tổ dân phố số 2, Phường Yên Bái',
    'c0000003-0000-0000-0000-000000000003',
    NOW(),
    1
) ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    phone_verified_at = VALUES(phone_verified_at),
    is_active = 1;

-- 6. Liên kết hồ sơ & phản ánh cũ của công dân mẫu với tài khoản vừa tạo
UPDATE applications 
SET citizen_account_id = 'ca000001-0000-0000-0000-000000000001'
WHERE citizen_id_number = '015088006677' AND (citizen_account_id IS NULL OR citizen_account_id = '');

UPDATE complaints
SET citizen_account_id = 'ca000001-0000-0000-0000-000000000001'
WHERE citizen_cccd = '015088006677' AND (citizen_account_id IS NULL OR citizen_account_id = '');
